
import { GoogleGenAI, Part, Type, FunctionDeclaration, Modality, GenerateContentResponse } from '@google/genai';
import { Faction, AnalysisResult, CadData, FactionId, SetupSuggestions, CadComparisonResult, FabricationPlan, GCodeSummary, SimulationType, ManufacturingProcessType, BillOfMaterialsItem, ProcurementInfo, PreliminaryCostEstimate, PromptValidationResult, NextStepSuggestion, GeneratedDrawing, ManufacturingProcess, PatentApplication, IngestedDocument, EngineeringBranch, User, ProtectionTypePref, LegalJurisdiction, FoundryCadResult } from '../types';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * RAG UTILITY: Semantic Search Simulation.
 */
const getTopKRelevantDocs = async (query: string, knowledgeBase: IngestedDocument[], k: number = 3): Promise<string> => {
    if (!knowledgeBase || knowledgeBase.length === 0) return "";
    
    const queryTokens = new Set(query.toLowerCase().split(/\W+/).filter(t => t.length > 3));
    
    const docsWithScores = knowledgeBase.map(doc => {
        const docText = (doc.name + " " + doc.content + " " + doc.summary).toLowerCase();
        let overlap = 0;
        queryTokens.forEach(token => {
            if (docText.includes(token)) overlap++;
        });
        return { doc, score: overlap };
    });

    const topDocs = docsWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .filter(d => d.score > 0)
        .map(d => d.doc);

    if (topDocs.length === 0) return "";

    return topDocs
        .map(doc => `[TECHNICAL REFERENCE: ${doc.name} (Branch: ${doc.branch})]\n${doc.content}`)
        .join("\n\n---\n\n");
};

const getBranchSafetyInstructions = (branch?: EngineeringBranch) => {
    switch (branch) {
        case EngineeringBranch.NUCLEAR:
            return `
### NUCLEAR SAFETY PROTOCOLS (AGENTIC INTERLOCK)
1. ALARA COMPLIANCE: Audit all material suggestions against radiation shielding effectiveness and activation potential.
2. CRITICALITY SAFETY: Verify geometry-based neutron moderation constraints for all structural components.
3. SEISMIC INTEGRITY: Ensure compliance with ASME BPVC Section III for pressure boundary components.
4. NEUTRON EMBRITTLEMENT: Flag any materials susceptible to long-term radiation damage.
`;
        case EngineeringBranch.AEROSPACE:
            return `
### AEROSPACE AIRWORTHINESS PROTOCOLS (AGENTIC INTERLOCK)
1. REDUNDANCY CHECK: Scan for single-point failure modes. Flag critical systems lacking triple-modular redundancy.
2. MIL-HDBK-5 VALIDATION: Cross-reference material fatigue life under cyclic loading (-55°C to 200°C).
3. AERO-ALLOY DFM: Apply specific manufacturing rules for Titanium and Inconel 718 to minimize work-hardening.
4. POWER-TO-WEIGHT: Audit all redesigns for net weight reduction and structural optimization.
`;
        default:
            return "";
    }
};

export interface ExtractedProjectDetails {
    name: string;
    description: string;
    tags: string[];
    initialPrompt: string;
}

const fullAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        product_name: { type: Type.STRING },
        executive_summary: { type: Type.STRING },
        faction_rationale: {
            type: Type.OBJECT,
            properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
            },
            required: ["pros", "cons", "summary"]
        },
        material_suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    properties: {
                        type: Type.OBJECT,
                        properties: {
                            density: { type: Type.STRING },
                            tensile_strength: { type: Type.STRING },
                            melting_point: { type: Type.STRING },
                            conductivity: { type: Type.STRING }
                        },
                        required: ["density", "tensile_strength", "melting_point", "conductivity"]
                    }
                },
                required: ["name", "rationale", "properties"]
            }
        },
        manufacturing_analysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { 
                    name: { type: Type.STRING }, 
                    description: { type: Type.STRING },
                    fmea: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                failure_mode: { type: Type.STRING },
                                potential_effects: { type: Type.STRING },
                                severity: { type: Type.INTEGER, description: 'Severity score 1-10' },
                                potential_causes: { type: Type.STRING },
                                occurrence: { type: Type.INTEGER, description: 'Occurrence probability 1-10' },
                                current_controls: { type: Type.STRING },
                                detection: { type: Type.INTEGER, description: 'Ease of detection 1-10' },
                                rpn: { type: Type.INTEGER, description: 'Risk Priority Number (Sev * Occ * Det)' },
                                recommended_action: { type: Type.STRING }
                            },
                            required: ["failure_mode", "potential_effects", "severity", "potential_causes", "occurrence", "current_controls", "detection", "rpn", "recommended_action"]
                        }
                    }
                },
                required: ["name", "description", "fmea"]
            }
        },
        comparative_analysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { alternative: { type: Type.STRING }, advantages: { type: Type.STRING }, disadvantages: { type: Type.STRING } },
                required: ["alternative", "advantages", "disadvantages"]
            }
        },
        suggested_systems: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, rationale: { type: Type.STRING } },
                required: ["name", "description", "rationale"]
            }
        },
        requirementSpecification: {
            type: Type.OBJECT,
            properties: {
                introduction: { type: Type.STRING },
                functional_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                non_functional_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                performance_criteria: { type: Type.ARRAY, items: { type: Type.STRING } },
                constraints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["introduction", "functional_requirements", "non_functional_requirements", "performance_criteria", "constraints"]
        },
        designDocument: {
            type: Type.OBJECT,
            properties: {
                system_architecture: { type: Type.STRING },
                component_designs: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { component_name: { type: Type.STRING }, design_details: { type: Type.STRING } },
                        required: ["component_name", "design_details"]
                    }
                },
                design_rationale: { type: Type.STRING }
            },
            required: ["system_architecture", "component_designs", "design_rationale"]
        },
        drawingSpecification: {
            type: Type.OBJECT,
            properties: {
                standard: { type: Type.STRING },
                required_views: { type: Type.ARRAY, items: { type: Type.STRING } },
                key_dimensions_tolerances: { type: Type.ARRAY, items: { type: Type.STRING } },
                general_notes: { type: Type.STRING }
            },
            required: ["standard", "required_views", "key_dimensions_tolerances", "general_notes"]
        },
        testPlan: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING },
                test_cases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { id: { type: Type.STRING }, description: { type: Type.STRING }, procedure: { type: Type.STRING }, expected_results: { type: Type.STRING } },
                        required: ["id", "description", "procedure", "expected_results"]
                    }
                }
            },
            required: ["overview", "test_cases"]
        },
        simulationAndAnalysisReport: {
            type: Type.OBJECT,
            properties: {
                simulation_type: { type: Type.STRING },
                methodology: { type: Type.STRING },
                results_summary: { type: Type.STRING },
                key_findings: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["simulation_type", "methodology", "results_summary", "key_findings"]
        },
        assemblyInstructions: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING },
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { step: { type: Type.INTEGER }, action: { type: Type.STRING }, parts_needed: { type: Type.ARRAY, items: { type: Type.STRING } } },
                        required: ["step", "action", "parts_needed"]
                    }
                }
            },
            required: ["overview", "steps"]
        },
        billOfMaterials: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    part_number: { type: Type.INTEGER },
                    name: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    material: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["part_number", "name", "quantity", "material", "description"]
            }
        },
        preliminaryCostEstimate: {
            type: Type.OBJECT,
            properties: {
                total_estimate_range: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                breakdown: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { item: { type: Type.STRING }, cost_estimate: { type: Type.STRING }, rationale: { type: Type.STRING } },
                        required: ["item", "cost_estimate", "rationale"]
                    }
                }
            },
            required: ["total_estimate_range", "confidence", "assumptions", "breakdown"]
        },
        complianceAndSafety: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING },
                applicable_standards: { type: Type.ARRAY, items: { type: Type.STRING } },
                safety_risks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            risk: { type: Type.STRING },
                            likelihood: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                            impact: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                            mitigation: { type: Type.STRING }
                        },
                        required: ["risk", "likelihood", "impact", "mitigation"]
                    }
                }
            },
            required: ["overview", "applicable_standards", "safety_risks"]
        },
        engineeringChangeOrders: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    eco_id: { type: Type.STRING },
                    change_title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    reason_for_change: { type: Type.STRING },
                    impact_analysis: { type: Type.STRING }
                },
                required: ["eco_id", "change_title", "description", "reason_for_change", "impact_analysis"]
            }
        },
        safety_audit: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    protocol: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Pass', 'Warn', 'Fail'] },
                    message: { type: Type.STRING }
                },
                required: ["protocol", "status", "message"]
            }
        }
    },
    required: [
        "product_name", "executive_summary", "faction_rationale", "material_suggestions", 
        "manufacturing_analysis", "comparative_analysis", "suggested_systems", 
        "requirementSpecification", "designDocument", "drawingSpecification", 
        "testPlan", "simulationAndAnalysisReport", "assemblyInstructions", 
        "billOfMaterials", "preliminaryCostEstimate", "complianceAndSafety", 
        "engineeringChangeOrders"
    ]
};

const extractionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        initialPrompt: { type: Type.STRING }
    },
    required: ["name", "description", "tags", "initialPrompt"]
};

const patentSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        abstract: { type: Type.STRING },
        background: { type: Type.STRING },
        summary: { type: Type.STRING },
        independent_claims: { 
            type: Type.ARRAY, 
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'Formal patent claim: Preamble (category), Transition (comprising), Body (limitations/wherein clauses).' },
                    rationale: { type: Type.STRING, description: 'Scientific/Technical rationale for non-obviousness/synergy.' }
                },
                required: ["text", "rationale"]
            }
        },
        dependent_claims: { type: Type.ARRAY, items: { type: Type.STRING } },
        novelty_points: { 
            type: Type.ARRAY, 
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'Specific technical differentiator from prior art.' },
                    rationale: { type: Type.STRING, description: 'Brief technical rationale explaining why this is novel.' }
                },
                required: ["text", "rationale"]
            },
            description: "3-5 specific technical aspects that differentiate this invention from existing prior art."
        },
        inventive_step_rationale: { type: Type.STRING, description: 'High-level synthesis of non-obviousness.' },
        owner_of_record: { type: Type.STRING, description: 'Determined from user metadata provided in prompt.' },
        protection_type: { type: Type.STRING, enum: ['PATENT', 'COPYRIGHT', 'TRADEMARK'] },
        legal_hash: { type: Type.STRING, description: 'Simulated blockchain/encrypted ledger fingerprint.' }
    },
    required: ["title", "abstract", "background", "summary", "independent_claims", "dependent_claims", "novelty_points", "inventive_step_rationale", "owner_of_record", "protection_type", "legal_hash"]
};

const foundryCadSchema = {
  type: Type.OBJECT,
  properties: {
    plugin: { type: Type.STRING },
    action: { type: Type.STRING },
    metadata: {
      type: Type.OBJECT,
      properties: {
        project_id: { type: Type.STRING },
        material: { type: Type.STRING },
        geometric_hash_required: { type: Type.BOOLEAN }
      },
      required: ["project_id", "material", "geometric_hash_required"]
    },
    scad_params: {
      type: Type.OBJECT,
      properties: {
        base_dimensions: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 3, maxItems: 3 },
        parameters: { type: Type.OBJECT, description: "Key-value pairs for parametric CAD controls" },
        raw_scad: { type: Type.STRING, description: "Deterministic OpenSCAD code" }
      },
      required: ["base_dimensions", "parameters", "raw_scad"]
    },
    suggested_fix: { type: Type.STRING, nullable: true }
  },
  required: ["plugin", "action", "metadata", "scad_params"]
};

export const parseApiError = (error: any): string => {
    if (typeof error === 'string') {
        try {
            const parsed = JSON.parse(error);
            if (parsed?.error?.message) return parsed.error.message;
        } catch (e) {
            return error;
        }
    }
    return error?.message || "An unexpected error occurred.";
};

const parseMarkdownJson = (text: string) => {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Failed to parse AI output as JSON.");
    }
};

export const generateAnalysis = async (
    projectName: string, 
    prompt: string, 
    faction: Faction, 
    files: Part[] | null,
    knowledgeBase: IngestedDocument[] = []
): Promise<AnalysisResult> => {
    const ai = getAiClient();
    
    const branchContext = knowledgeBase.length > 0 ? knowledgeBase[0].branch : EngineeringBranch.GENERAL;

    const technicalContext = await getTopKRelevantDocs(prompt, knowledgeBase, 4);
    
    const retrievalBlock = technicalContext ? `
### PROJECT KNOWLEDGE BASE (RAG ENABLED)
The following technical snippets were retrieved from our internal library as highly relevant to this specific design task:
${technicalContext}
` : '';

    const safetyInstructions = getBranchSafetyInstructions(branchContext);

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            {
                role: 'user',
                parts: [
                    ...(files || []),
                    { text: `Analyze the engineering design "${projectName}" through the prism of the "${faction.name}" philosophy. 
                      Philosophical Bias: ${faction.philosophy}.
                      
                      Project Branch: ${branchContext}
                      ${safetyInstructions}

                      ${retrievalBlock}

                      Detailed User Requirements: ${prompt}
                      
                      The analysis must be technically rigorous and strictly conform to the provided JSON schema. Ensure the 'safety_audit' array is populated based on the branch safety protocols provided.` }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: fullAnalysisSchema,
            maxOutputTokens: 10000,
            thinkingConfig: { thinkingBudget: 4000 }
        }
    });

    const result = JSON.parse(response.text!);
    result.branch = branchContext;
    return result;
};

export const generatePatentDraft = async (
    result: AnalysisResult, 
    user: User, 
    protectionType: ProtectionTypePref, 
    jurisdiction: LegalJurisdiction, 
    designHash: string, 
    knowledgeBase: IngestedDocument[] = []
): Promise<PatentApplication> => {
    const ai = getAiClient();
    const branchContext = result.branch || EngineeringBranch.GENERAL;
    const attributionOwner = user.use_company_attribution ? (user.company_name || user.name) : (user.legal_identity || user.name);

    const patentContext = await getTopKRelevantDocs(`Novelty and claims for ${result.product_name}`, knowledgeBase, 6);
    
    const retrievalBlock = patentContext ? `
### PRIOR ART & STANDARDS REFERENCE (PhD LEVEL RAG)
Use these documents to verify novelty and ensure standard compliance:
${patentContext}
` : '';

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a Specialist Patent Attorney and a PhD Research Lead in ${branchContext} Engineering.
          
          Generate a formal IP specification for:
          Product: ${result.product_name}
          Executive Summary: ${result.executive_summary}
          Design Fingerprint: ${designHash}
          Target Jurisdiction: ${jurisdiction}
          
          Owner of Record: ${attributionOwner}
          Protection Type: ${protectionType}
          
          ${retrievalBlock}
          
          ### JURISDICTIONAL CONSTRAINTS
          - If ${jurisdiction} is USPTO: Focus on utility, non-obviousness, and enablement per 35 U.S.C. 101/102/103.
          - If ${jurisdiction} is EPO: Focus on 'Technical Character' and the problem-solution approach.
          - If ${jurisdiction} is WIPO: Ensure PCT-compliant formalisms.

          Draft strictly based on the provided JSON schema. Identify 3-5 specific technical aspects that differentiate this invention from existing prior art and provide brief, high-level rationales for each.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: patentSchema,
            maxOutputTokens: 10000,
            thinkingConfig: { thinkingBudget: 4000 }
        }
    });
    const parsed = JSON.parse(response.text!);
    parsed.jurisdiction = jurisdiction;
    return parsed;
};

export const generateFoundryCad = async (
    projectName: string,
    prompt: string,
    material: string,
    projectId: string
): Promise<FoundryCadResult> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `You are the Sovereign Foundry Architect. Translate requirements into a CADAM JSON payload.
        
        Project: ${projectName}
        Material: ${material}
        User Intent: ${prompt}
        
        Rules:
        - Output strictly JSON for the 'foundry-core' plugin.
        - Plugin action must be 'AUTO_GENERATE'.
        - 'raw_scad' must be valid deterministic OpenSCAD code.
        - Ensure base dimensions are derived from physical requirements.
        - Calibrate parameters like 'wall_thickness' and 'lattice_density' for ${material}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: foundryCadSchema,
            maxOutputTokens: 5000,
            thinkingConfig: { thinkingBudget: 2000 }
        }
    });
    return JSON.parse(response.text!);
};

export const generateVideo = async (prompt: string, imageFile?: File, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
    const ai = getAiClient();
    
    let imagePart;
    if (imageFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
        });
        imagePart = { imageBytes: base64, mimeType: imageFile.type };
    }

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: imagePart,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const generateTechnicalDrawingImage = async (analysisResult: AnalysisResult, specificPrompt: string, fileUrls?: string[]): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Generate a technical drawing for: ${analysisResult.product_name}. View: ${specificPrompt}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: { aspectRatio: "16:9" }
        }
    });

    for (const part of response.candidates![0].content!.parts!) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};

export const generateDrawingFromImage = async (imagePart: Part, specificPrompt: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Convert image to technical drawing: ${specificPrompt}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    for (const part of response.candidates![0].content!.parts!) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};

export const identifyImageFromWeb = async (imagePart: Part): Promise<{ summary: string, sources: any[] }> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview', // Image task + search requires pro-image-preview
        contents: { parts: [imagePart, { text: "Identify this product and search the web." }] },
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    return {
        summary: response.text || "",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

export const extractProjectDetailsFromImage = async (imagePart: Part): Promise<ExtractedProjectDetails> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: "Extract project details from image." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });
    return JSON.parse(response.text!);
};

export const extractProjectDetailsFromPdf = async (pdfPart: Part): Promise<ExtractedProjectDetails> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [pdfPart, { text: "Extract project details from PDF." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });
    return JSON.parse(response.text!);
};

export const extractProjectDetailsFromVideo = async (videoPart: Part): Promise<ExtractedProjectDetails> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [videoPart, { text: "Extract project details from video." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });
    return JSON.parse(response.text!);
};

export const extractProjectDetailsFromVideoUrl = async (url: string): Promise<ExtractedProjectDetails> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze video content at ${url} and output JSON with keys: name, description, tags, initialPrompt.`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    return parseMarkdownJson(response.text || "{}");
};

export const getSetupSuggestions = async (prompt: string): Promise<SetupSuggestions> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest engineering philosophy and tags for: ${prompt}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendedFactionId: { type: Type.STRING, enum: Object.values(FactionId) },
                    suggested_tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["recommendedFactionId", "suggested_tags"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const generateSummary = async (result: AnalysisResult): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize: ${JSON.stringify(result)}`,
    });
    return response.text || "";
};

export const generateCadData = async (drawings: GeneratedDrawing[], result: AnalysisResult): Promise<CadData> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate 3D CAD data for "${result.product_name}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    assemblyName: { type: Type.STRING },
                    units: { type: Type.STRING, enum: ['mm', 'inches'] },
                    components: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                shape: { type: Type.STRING, enum: ['cube', 'cylinder', 'sphere', 'complex'] },
                                dimensions: {
                                    type: Type.OBJECT,
                                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } },
                                    required: ["x", "y", "z"]
                                },
                                position: {
                                    type: Type.OBJECT,
                                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } },
                                    required: ["x", "y", "z"]
                                }
                            },
                            required: ["name", "shape", "dimensions", "position"]
                        }
                    }
                },
                required: ["assemblyName", "units", "components"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const compareCadData = async (base: CadData, updated: CadData): Promise<CadComparisonResult> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Compare CAD data: ${JSON.stringify(base)} vs ${JSON.stringify(updated)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    additions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    deletions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    modifications: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                changes: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["name", "changes"]
                        }
                    }
                },
                required: ["additions", "deletions", "modifications"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const generateSpeech = async (text: string, voice: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated.");
    return base64Audio;
};

export const generateSimulationResult = async (type: SimulationType, componentName: string, productContext: string): Promise<{ summary: string, keyFindings: string[], imagePrompt: string }> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Run simulated ${type} on "${componentName}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                },
                required: ["summary", "keyFindings", "imagePrompt"]
            }
        }
    });
    // Fixed: Removed undefined 'height' wrapper; JSON.parse expects the response text string directly.
    return JSON.parse(response.text!);
};

export const generateFabricationPlan = async (processType: ManufacturingProcessType, material: string, productContext: string): Promise<FabricationPlan> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate fabrication plan for ${processType} using ${material}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    dfmChecks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { component: { type: Type.STRING }, issue: { type: Type.STRING }, recommendation: { type: Type.STRING } },
                            required: ["component", "issue", "recommendation"]
                        }
                    },
                    tolerancingNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    processSpecificOutput: {
                        type: Type.OBJECT,
                        properties: { title: { type: Type.STRING }, data: { type: Type.STRING } },
                        required: ["title", "data"]
                    }
                },
                required: ["dfmChecks", "tolerancingNotes", "processSpecificOutput"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const summarizeGCode = async (gcode: string): Promise<GCodeSummary> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize G-Code: ${gcode}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    keyOperations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["summary", "keyOperations"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const exploreSuggestion = async (suggestionText: string, productContext: string): Promise<{ explanation: string, imageUrl: string }> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain: "${suggestionText}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    explanation: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING }
                },
                required: ["explanation", "imagePrompt"]
            }
        }
    });
    const { explanation, imagePrompt } = JSON.parse(response.text!);
    const imageUrl = await generateInspirationalImage(imagePrompt, '16:9');
    return { explanation, imageUrl };
};

export const sourceBomItemWithValidation = async (item: BillOfMaterialsItem): Promise<ProcurementInfo[]> => {
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Perform a procurement search for the following industrial part: "${item.name}" (Description: ${item.description}). Focus on verified suppliers and check for Q1 2024 pricing or newer.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const rawText = response.text || "[]";
    const potentialJson = rawText.includes("[") ? rawText.substring(rawText.indexOf("[")) : "[]";
    let results: ProcurementInfo[] = [];
    try {
        results = JSON.parse(potentialJson);
    } catch(e) {
        const formatter = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Format the following raw search data for "${item.name}" into a JSON array matching procurement schema: ${rawText}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            supplier: { type: Type.STRING },
                            url: { type: Type.STRING },
                            estimatedCost: { type: Type.STRING },
                            leadTime: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        results = JSON.parse(formatter.text!);
    }
    
    const validationResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Critically review these procurement options for part "${item.name}": ${JSON.stringify(results)}. 
                  1. Flag suppliers that lack industrial credibility.
                  2. Assess if pricing is realistic for current market conditions.
                  3. Assign a verification boolean and a confidence score (0.0 to 1.0).
                  Output the verified procurement data in JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        supplier: { type: Type.STRING },
                        url: { type: Type.STRING },
                        estimatedCost: { type: Type.STRING },
                        leadTime: { type: Type.STRING },
                        verified: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER }
                    }
                }
            }
        }
    });
    
    return JSON.parse(validationResponse.text!);
};

export const validatePrompt = async (prompt: string): Promise<PromptValidationResult> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Validate: "${prompt}".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isClear: { type: Type.BOOLEAN },
                    suggestion: { type: Type.STRING, nullable: true }
                },
                required: ["isClear"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const recalculateCost = async (bom: BillOfMaterialsItem[], mfgContext: ManufacturingProcess[], matContext: string): Promise<PreliminaryCostEstimate> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Recalculate cost for BOM: ${JSON.stringify(bom)}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    total_estimate_range: { type: Type.STRING },
                    confidence: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                    assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    breakdown: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { item: { type: Type.STRING }, cost_estimate: { type: Type.STRING }, rationale: { type: Type.STRING } },
                            required: ["item", "cost_estimate", "rationale"]
                        }
                    }
                },
                required: ["total_estimate_range", "confidence", "assumptions", "breakdown"]
            }
        }
    });
    return JSON.parse(response.text!);
};

export const getNextStepSuggestions = async (context: string): Promise<NextStepSuggestion[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest 3 next steps for: ${context}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        actionId: { type: Type.STRING },
                        icon: { type: Type.STRING, enum: ['beaker', 'cube', 'bolt', 'ruler', 'chart', 'dollar', 'conversation', 'play'] }
                    },
                    required: ["title", "rationale", "actionId", "icon"]
                }
            }
        }
    });
    return JSON.parse(response.text!);
};

export const performWebSearch = async (query: string): Promise<any> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
    });
    return {
        summary: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
};

export const generateInspirationalImage = async (prompt: string, aspectRatio: string = '16:9'): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });
    for (const part of response.candidates![0].content!.parts!) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to generate image.");
};

export const generateFactionInspirationalPrompts = async (result: AnalysisResult): Promise<string[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the engineering analysis for "${result.product_name}", generate 3 distinct, creative prompts for generating photorealistic product concept art. 
        Focus on the unique features described in the executive summary: ${result.executive_summary}.
        
        Output strictly as a JSON array of strings.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    
    try {
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Failed to parse faction concepts JSON:", e);
        return [];
    }
};

export const createProjectFunctionDeclaration: FunctionDeclaration = {
    name: 'create_project',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            factionId: { type: Type.STRING, enum: Object.values(FactionId) }
        },
        required: ["name", "description", "factionId"]
    }
};

export const triggerFullAnalysisFunctionDeclaration: FunctionDeclaration = {
    name: 'trigger_full_analysis',
    description: 'Executes the core SynapseForge engineering analysis on current session context. Call this only when project name, description, and lens are clarified.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            useFactionId: { type: Type.STRING, enum: Object.values(FactionId), description: 'The engineering lens to apply.' },
            descriptionOverride: { type: Type.STRING, description: 'Optional updated product concept description.' }
        }
    }
};

export const analyzeFileFunctionDeclaration: FunctionDeclaration = {
    name: 'analyze_file',
    description: 'Triggers a specific intake workflow for an uploaded file (Image, PDF, or Video).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            fileName: { type: Type.STRING, description: 'The name of the file to analyze from the uploaded set.' },
            workflow: { 
                type: Type.STRING, 
                enum: ['IMAGE_SYNTHESIS', 'TECHNICAL_INTAKE', 'VISUAL_INTAKE', 'SYSTEM_MAPPING', 'RECURSIVE_LOGIC'],
                description: 'The specific synthesis protocol to trigger.'
            }
        },
        required: ["fileName", "workflow"]
    }
};

export const generateTechnicalDrawingFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_technical_drawing',
    parameters: {
        type: Type.OBJECT,
        properties: { specificPrompt: { type: Type.STRING } },
        required: ["specificPrompt"]
    }
};

export const researchWebFunctionDeclaration: FunctionDeclaration = {
    name: 'research_web',
    parameters: {
        type: Type.OBJECT,
        properties: { query: { type: Type.STRING } },
        required: ["query"]
    }
};

export const runAnalysisWithFactionFunctionDeclaration: FunctionDeclaration = {
    name: 'run_analysis_with_faction',
    parameters: {
        type: Type.OBJECT,
        properties: { factionId: { type: Type.STRING, enum: Object.values(FactionId) } },
        required: ["factionId"]
    }
};

export const generateInspirationalImageFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_inspirational_image',
    parameters: {
        type: Type.OBJECT,
        properties: { prompt: { type: Type.STRING } },
        required: ["prompt"]
    }
};

export const downloadDrawingsFunctionDeclaration: FunctionDeclaration = {
    name: 'download_drawings',
    parameters: { type: Type.OBJECT, properties: {} }
};

export const generateVideoFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_video',
    parameters: {
        type: Type.OBJECT,
        properties: { prompt: { type: Type.STRING }, useUploadedImage: { type: Type.BOOLEAN } },
        required: ["prompt"]
    }
};

export const showSectionFunctionDeclaration: FunctionDeclaration = {
    name: 'show_section',
    parameters: {
        type: Type.OBJECT,
        properties: { sectionId: { type: Type.STRING, enum: ['executive_summary', 'faction_rationale', 'ai_suggestions', 'visual_documentation', 'cad_export', 'bom', 'live_costing', 'advanced_simulation', 'rotordynamics_studio', 'fabrication_planner', 'test_plan', 'compliance_safety', 'change_orders', 'patent_application'] } },
        required: ["sectionId"]
    }
};

export const switchAppViewFunctionDeclaration: FunctionDeclaration = {
    name: 'switch_app_view',
    parameters: {
        type: Type.OBJECT,
        properties: { view: { type: Type.STRING, enum: ['app', 'admin', 'suite', 'account', 'pricing'] } },
        required: ["view"]
    }
};

export const toggleDocumentationFunctionDeclaration: FunctionDeclaration = {
    name: 'toggle_documentation',
    parameters: {
        type: Type.OBJECT,
        properties: { doc_type: { type: Type.STRING, enum: ['manual', 'technical'] }, open: { type: Type.BOOLEAN } },
        required: ["doc_type", "open"]
    }
};

export const engageAnalysisFunctionDeclaration: FunctionDeclaration = {
    name: 'engage_analysis',
    parameters: { type: Type.OBJECT, properties: {} }
};
