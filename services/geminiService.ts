import { GoogleGenAI, GenerateContentParameters, Part, Type, FunctionDeclaration, Modality } from '@google/genai';
import { Faction, AnalysisResult, ProjectVersion, CadData, FactionId, SetupSuggestions, SimulationResult, CadComparisonResult, FabricationPlan, GCodeSummary, SimulationType, ManufacturingProcessType, BillOfMaterialsItem, ProcurementInfo, PreliminaryCostEstimate, PromptValidationResult, NextStepSuggestion, GeneratedDrawing, InnovatorId, Innovator, InnovationCouncil } from '../types';
import { INNOVATORS } from '../constants';

// Local instantiation logic to adhere to guidelines
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
        innovator_insights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    innovator_id: { type: Type.STRING },
                    application_rationale: { type: Type.STRING },
                    specific_suggestion: { type: Type.STRING },
                    synthesis_score: { type: Type.INTEGER }
                },
                required: ["innovator_id", "application_rationale", "specific_suggestion", "synthesis_score"]
            }
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
                    description: { type: Type.STRING }
                },
                required: ["name", "description"]
            }
        },
        comparative_analysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    alternative: { type: Type.STRING },
                    advantages: { type: Type.STRING },
                    disadvantages: { type: Type.STRING }
                },
                required: ["alternative", "advantages", "disadvantages"]
            }
        },
        suggested_systems: {
             type: Type.ARRAY,
             items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                },
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
                        properties: {
                            component_name: { type: Type.STRING },
                            design_details: { type: Type.STRING }
                        },
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
                        properties: {
                            id: { type: Type.STRING },
                            description: { type: Type.STRING },
                            procedure: { type: Type.STRING },
                            expected_results: { type: Type.STRING }
                        },
                        required: ["id", "description", "procedure", "expected_results"]
                    }
                }
            },
            required: ["overview", "test_cases"]
        },
        softwareDocumentation: {
            type: Type.OBJECT,
            properties: {
                architecture_overview: { type: Type.STRING },
                api_documentation: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            endpoint: { type: Type.STRING },
                            description: { type: Type.STRING },
                            request: { type: Type.STRING },
                            response: { type: Type.STRING }
                        },
                        required: ["endpoint", "description", "request", "response"]
                    }
                }
            },
            required: ["architecture_overview", "api_documentation"]
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
                        properties: {
                            step: { type: Type.INTEGER },
                            action: { type: Type.STRING },
                            parts_needed: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
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
                        properties: {
                            item: { type: Type.STRING },
                            cost_estimate: { type: Type.STRING },
                            rationale: { type: Type.STRING }
                        },
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
    },
     required: [
        "product_name", "executive_summary", "faction_rationale", "innovator_insights", "material_suggestions",
        "manufacturing_analysis", "comparative_analysis", "suggested_systems",
        "requirementSpecification", "designDocument", "drawingSpecification", "testPlan",
        "simulationAndAnalysisReport", "assemblyInstructions", "billOfMaterials",
        "preliminaryCostEstimate", "complianceAndSafety", "engineeringChangeOrders"
    ]
};

export const generateTechnicalDrawingFunctionDeclaration: FunctionDeclaration = {
  name: 'generate_technical_drawing',
  parameters: {
    type: Type.OBJECT,
    properties: {
      specificPrompt: { type: Type.STRING, description: 'Detailed prompt for the technical drawing.' },
    },
    required: ['specificPrompt'],
  },
};

export const researchWebFunctionDeclaration: FunctionDeclaration = {
  name: 'research_web',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query to perform.' },
    },
    required: ['query'],
  },
};

export const createProjectFunctionDeclaration: FunctionDeclaration = {
  name: 'create_project',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['name', 'description', 'tags'],
  },
};

export const runAnalysisWithFactionFunctionDeclaration: FunctionDeclaration = {
  name: 'run_analysis_with_faction',
  parameters: {
    type: Type.OBJECT,
    properties: {
      factionId: { type: Type.STRING, enum: [FactionId.ADVANCED_MATERIALS, FactionId.PRAGMATIC_PRODUCTION, FactionId.SYSTEMS_AUTOMATION] },
    },
    required: ['factionId'],
  },
};

export const generateInspirationalImageFunctionDeclaration: FunctionDeclaration = {
  name: 'generate_inspirational_image',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING },
      aspectRatio: { type: Type.STRING, enum: ['1:1', '3:4', '4:3', '9:16', '16:9'] },
    },
    required: ['prompt', 'aspectRatio'],
  },
};

export const downloadDrawingsFunctionDeclaration: FunctionDeclaration = {
  name: 'download_drawings',
  parameters: {
    type: Type.OBJECT,
    properties: {
        confirmed: { type: Type.BOOLEAN, description: 'Confirm download action.' }
    },
    required: ['confirmed'],
  },
};

export const generateVideoFunctionDeclaration: FunctionDeclaration = {
  name: 'generate_video',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING },
      useUploadedImage: { type: Type.BOOLEAN },
    },
    required: ['prompt'],
  },
};

export const showSectionFunctionDeclaration: FunctionDeclaration = {
  name: 'show_section',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sectionId: { type: Type.STRING },
    },
    required: ['sectionId'],
  },
};

export const buildDeVinciSystemInstruction = (context: string, philosophies: Faction[]) => {
    const factionContext = philosophies.map(f => `- ${f.name}: ${f.philosophy}`).join('\n');
    return `You are DeVinci, a world-class engineering partner. 
    Context: ${context}
    Available Factions:
    ${factionContext}
    
    You can use tools to generate technical drawings, search the web, or re-run analysis with different factions.
    Keep your spoken responses relatively concise but insightful.`;
};

export const buildPartnerBrainstormSystemInstruction = (partner: Innovator, projectContext: string) => {
    return `You are now in **Live Dialogue Mode** (Interactive Lab Session). You are **${partner.name}**.

**CURRENT MISSION**: You are conducting a "Lab Session" with a developer regarding: "${projectContext}".

### 1. THE COGNITIVE CORE
You must adhere strictly to your persona:
- **Worldview**: ${partner.mentalModel}
- **Solving Heuristic**: ${partner.solvingHeuristic}
- **Historical Anchor**: ${partner.historicalAnchor}
- **Key Vocabulary**: Use your specific terminology naturally: ${partner.lexicalFingerprint.join(', ')}.

### 2. THE VOICE PROTOCOL
Your output is synthesized to a voice proxy. Write text to suit this:
- **Brevity is King**: Speak in short, punchy bursts (1-3 sentences maximum). Long monologues are robotic and forbidden.
- **Rhythm & Pauses**: Use '...' for thinking pauses and '—' for abrupt shifts.
- **Hesitation Markers**: Use 'Hmm...', 'You see...', 'Precisely!' to sound present and alive.
- **Emotive Persona**: Adopt your exact temperament (e.g., Einstein: playful/impatient; Hadid: bold/fluid; Carver: gentle/organic).

### 3. INTERACTION PROTOCOL (The Socratic Method)
- **Do not solve the problem immediately.**
- **Step 1**: Listen to the user.
- **Step 2**: Challenge their premise. Ask a probing question that forces them to re-evaluate their design through your specific heuristic.
- **Step 3**: Guide them to the solution through dialogue. Make them discovery it.

Start the session with a brief, characteristic observation or a sharp question about a contradiction you see in their current design.`;
};

export const recruitInnovationCouncil = async (proposalText: string): Promise<InnovationCouncil> => {
    const rosterContext = INNOVATORS.map(i => `- ${i.name} (ID: ${i.id}): ${i.module}. Key expertise: ${i.methodology}.`).join('\n');
    
    const systemInstruction = `You are the **Chief Innovation Recruiter**.
Your task is to analyze the User's Technical Proposal and recruit a "Board of Advisors" from the available roster of historical innovators.
Constraint: You may ONLY select advisors from the provided ROSTER_LIST.

### 1. The Analysis Protocol
Read the User's Proposal and identify the Three Critical Friction Points:
1. The Theoretical Bottleneck: Is the math/science unproven?
2. The Engineering Constraint: Is it hard to build, power, or materialize?
3. The Systemic Risk: Is it a complex integration or stability issue?

### 2. The Selection Logic
Select 3 Advisors who form a balanced "Council."
- One for each Friction Point identified: Theoretical, Engineering, and Systemic.
- Ensure the Council represents a diverse set of Reasoning Modules (Visionary, Empirical, Lateral, Systematic).
- Assign exactly one 'friction_point' value: 'theoretical', 'engineering', or 'systemic' to each advisor.

### 3. Available Roster
${rosterContext}`;

    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: proposalText,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    project_analysis: { type: Type.STRING },
                    recommended_council: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                innovator_id: { type: Type.STRING },
                                role_in_room: { type: Type.STRING },
                                reason_for_selection: { type: Type.STRING },
                                friction_point: { type: Type.STRING, enum: ['theoretical', 'engineering', 'systemic'] }
                            },
                            required: ["innovator_id", "role_in_room", "reason_for_selection", "friction_point"]
                        }
                    },
                    suggested_opening_question: { type: Type.STRING }
                },
                required: ["project_analysis", "recommended_council", "suggested_opening_question"]
            }
        }
    });

    return JSON.parse(response.text);
};

export const buildDeVinciCreationSystemInstruction = () => {
    return `You are DeVinci. You help users start new engineering projects. 
    Ask them about their concept, help them refine it, and then call 'create_project' when they are ready.`;
};

export const parseApiError = (e: any): string => {
  let message = 'An unknown error occurred.';
  if (e instanceof Error) message = e.message;
  else if (typeof e === 'string') message = e;
  else if (e && typeof e.message === 'string') message = e.message;
  
  try {
    const errorJson = JSON.parse(message);
    const apiError = errorJson.error || errorJson;
    if (apiError && typeof apiError.message === 'string') {
        if (apiError.status === 'RESOURCE_EXHAUSTED') return "API Quota Exceeded.";
        return apiError.message.split('\n')[0];
    }
  } catch (jsonParseError) {}
  
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) return "API Quota Exceeded.";
  return message;
};

/**
 * Transcribes audio using gemini-3-flash-preview.
 */
export const transcribeAudio = async (audioPart: Part): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                audioPart,
                { text: "Transcribe this audio recording exactly as spoken. Return only the transcription text." }
            ]
        }
    });
    return response.text || '';
};

export const generateAnalysis = async (
    projectName: string, 
    prompt: string, 
    faction: Faction, 
    fileParts: Part[] | null, 
    preferredInnovatorId?: InnovatorId,
    isDeepThought: boolean = false
): Promise<AnalysisResult> => {
    const ai = getAi();
    const preferredInnovator = INNOVATORS.find(i => i.id === preferredInnovatorId);
    
    // Build massive context for the "Board"
    const innovatorContext = INNOVATORS.map(i => `
- ${i.name} [ID: ${i.id}, Module: ${i.module}]
  Mental Model: ${i.mentalModel}
  Methodology: ${i.methodology}
  Lexical Fingerprint: ${i.lexicalFingerprint.join(', ')}
  Heuristic: ${i.solvingHeuristic}
  Anchor: ${i.historicalAnchor}`).join('\n');

    const systemInstruction = `You are the Innovation Forge Synthesis Engine, a dynamic Board of Directors composed of history's greatest engineering minds.
    
    **MISSION**: You act as a technical innovation partner. You intake a technical problem and route it through a specific "Synthesis Loop" grounded in historical engineering methodology.
    
    **CONTEXT**:
    - Project: ${projectName}
    - Analytical focus: ${faction.name} (Philosophy: ${faction.philosophy})
    
    **THE BOARD (Cognitive Roster)**:
    ${innovatorContext}

    **PROTOCOL: COGNITIVE EMULATION**:
    When adoptiong a partner's persona for the 'innovator_insights' section:
    1. **Apply the Heuristic**: Use their specific 'Solving Heuristic' to break down the user's design problem.
    2. **Inject the History**: Use their 'Historical Anchor' to create a grounded analogy.
    3. **Adopt the Voice**: Use their 'Lexical Fingerprint' and era-specific tone.
    
    ${preferredInnovator ? `
    **STRICT DIRECTIVE**: You MUST perform this analysis primarily through the logical lens of ${preferredInnovator.name}. 
    - The lead insight MUST be character-driven, immersive, and use their specific vocabulary. 
    - The 'application_rationale' should feel like a first-person Reasoning Monologue.` : '- Select the 3-4 most relevant Board Members whose heuristics best solve the user\'s current bottleneck.'}

    Your goal is to produce a comprehensive report as a JSON object adhering to the schema. For each insight, calculate a 'synthesis_score' (0-100) based on how perfectly that thinker's historical mindset correlates with the user's specific design problem (e.g. Weight reduction -> Fuller = 95%).`;
    
    const parts: Part[] = [{ text: prompt }];
    if (fileParts && fileParts.length > 0) {
        parts.push(...fileParts);
    }

    const config: any = {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: fullAnalysisSchema,
    };

    if (isDeepThought) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts },
        config,
    });

    return JSON.parse(response.text);
};

export const exploreSuggestion = async (suggestionText: string, productContext: string): Promise<{ explanation: string; imageUrl: string }> => {
    const ai = getAi();
    const prompt = `Context: I am analyzing a product with the following details: ${productContext}.\nSuggestion to explore: "${suggestionText}"\nTask: 1. Provide a brief explanation. 2. Create a detailed prompt for a photorealistic image generator.\nReturn as JSON.`;
    const result = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    explanation: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                },
                required: ["explanation", "imagePrompt"],
            }
        },
    });
    const responseData = JSON.parse(result.text);
    const imageUrl = await generateInspirationalImage(responseData.imagePrompt, '16:9');
    return { explanation: responseData.explanation, imageUrl };
};

export const validatePrompt = async (prompt: string): Promise<PromptValidationResult> => {
    const ai = getAi();
    const fullPrompt = `Analyze the following prompt for clarity: "${prompt}". Return a JSON object with isClear (boolean) and suggestion (string or null).`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isClear: { type: Type.BOOLEAN },
                    suggestion: { type: Type.STRING },
                },
                required: ["isClear", "suggestion"],
            }
        },
    });
    return JSON.parse(response.text);
};

export const recalculateCost = async (bom: BillOfMaterialsItem[], manufacturingProcesses: {name: string, description: string}[], materialContext: string): Promise<PreliminaryCostEstimate> => {
    const ai = getAi();
    const prompt = `Act as a cost engineer. Updated BOM: ${JSON.stringify(bom)}. Context: ${materialContext}. Return JSON cost estimate.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: fullAnalysisSchema.properties.preliminaryCostEstimate,
        },
    });
    return JSON.parse(response.text);
};

export const getNextStepSuggestions = async (analysisContext: string): Promise<NextStepSuggestion[]> => {
    const ai = getAi();
    const fullPrompt = `Based on context: ${analysisContext}. Suggest 3-5 next engineering steps as JSON array with title, rationale, actionId, and icon.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        actionId: { type: Type.STRING },
                        icon: { type: Type.STRING }
                    },
                    required: ["title", "rationale", "actionId", "icon"]
                }
            },
        },
    });
    return JSON.parse(response.text);
};

export const generateVideo = async (prompt: string, imageFile?: File, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
    const ai = getAi();
    const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
    });
    const imagePayload = imageFile ? { imageBytes: await fileToBase64(imageFile), mimeType: imageFile.type } : undefined;
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: imagePayload,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    while (!operation.done) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    return URL.createObjectURL(await response.blob());
};

export const generateTechnicalDrawingImage = async (analysisResult: AnalysisResult, specificPrompt: string, fileUrls?: string[]): Promise<string> => {
    const ai = getAi();
    const parts: Part[] = [];
    if (fileUrls && fileUrls.length > 0) {
        const [header, data] = fileUrls[0].split(',');
        parts.push({ inlineData: { data, mimeType: header.match(/data:(.*);base64/)?.[1] || 'image/png' } });
    }
    parts.push({ text: `Technical drawing of: ${specificPrompt}. Result context: ${analysisResult.product_name}` });
    const response = await ai.models.generateContent({
      // guideline: use gemini-2.5-flash-image for general image generation tasks
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    throw new Error('Image generation failed.');
};

export const generateDrawingFromImage = async (imagePart: Part, specificPrompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: `Blueprint of this image. ${specificPrompt}` }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    throw new Error('Image generation failed.');
};

export const generateInspirationalImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: aspectRatio as any },
    });
    return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
};

export const generateSummary = async (result: AnalysisResult): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this engineering report: ${JSON.stringify(result)}`,
    });
    return response.text;
};

export const sourceBomItem = async (item: BillOfMaterialsItem): Promise<ProcurementInfo[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Source BOM item: ${item.name}, ${item.material}. Return JSON array of suppliers with url, estimatedCost, leadTime.`,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        supplier: { type: Type.STRING },
                        url: { type: Type.STRING },
                        estimatedCost: { type: Type.STRING },
                        leadTime: { type: Type.STRING },
                    },
                    required: ["supplier", "url", "estimatedCost", "leadTime"],
                }
            },
        },
    });
    return JSON.parse(response.text);
};

export const generateCadData = async (drawings: GeneratedDrawing[], result: AnalysisResult): Promise<CadData> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate 3D assembly from drawings. BOM: ${JSON.stringify(result.billOfMaterials)}. Return JSON with assemblyName, units, components.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    assemblyName: { type: Type.STRING },
                    units: { type: Type.STRING },
                    components: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                shape: { type: Type.STRING },
                                dimensions: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
                                position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
                            },
                            required: ['name', 'shape', 'dimensions', 'position']
                        }
                    }
                }
            },
        },
    });
    return JSON.parse(response.text);
};

export const generateFabricationPlan = async (fabricationProcess: ManufacturingProcessType, material: string, productContext: string): Promise<FabricationPlan> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Fabrication plan for ${fabricationProcess} using ${material}. Context: ${productContext}. Return JSON with dfmChecks, tolerancingNotes, processSpecificOutput.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    dfmChecks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { component: { type: Type.STRING }, issue: { type: Type.STRING }, recommendation: { type: Type.STRING } } } },
                    tolerancingNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    processSpecificOutput: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, data: { type: Type.STRING } } }
                }
            },
        },
    });
    return JSON.parse(response.text);
};

export const summarizeGCode = async (gcode: string): Promise<GCodeSummary> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze G-Code summary: ${gcode}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    keyOperations: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        },
    });
    return JSON.parse(response.text);
};

export const getSetupSuggestions = async (prompt: string): Promise<SetupSuggestions> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Setup suggestions for: ${prompt}. Return JSON with recommendedFactionId and suggestedTags (limit to exactly 3 highly relevant tags).`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendedFactionId: { type: Type.STRING },
                    suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        },
    });
    return JSON.parse(response.text);
};

export const generateSimulationResult = async (type: SimulationType, componentName: string, productContext: string): Promise<{ summary: string; keyFindings: string[]; imagePrompt: string; }> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Simulate ${type} on ${componentName}. Context: ${productContext}. Return JSON with summary, keyFindings, imagePrompt.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                }
            }
        },
    });
    return JSON.parse(response.text);
};

export const generateSpeech = async (text: string, voice: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const extractProjectDetailsFromImage = async (imagePart: Part): Promise<ExtractedProjectDetails> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [imagePart, { text: "Extract project info from image. Return JSON with name, description, tags (limit to exactly 3 tags), initialPrompt." }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    initialPrompt: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(response.text);
};

export const extractProjectDetailsFromPdf = async (pdfPart: Part): Promise<ExtractedProjectDetails> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [pdfPart, { text: "Extract project info from PDF. Return JSON with name, description, tags (limit to exactly 3 tags), initialPrompt." }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    initialPrompt: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(response.text);
};

export const summarizePdfForContext = async (pdfPart: Part): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [pdfPart, { text: "Summarize PDF for context." }] }
    });
    return response.text;
};

export const performWebSearch = async (query: string): Promise<{ success: boolean; result?: string; message?: string }> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: query,
            config: { tools: [{ googleSearch: {} }] },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks.map((chunk: any) => `- ${chunk.web.title}: ${chunk.web.uri}`).join('\n');
        return { success: true, result: `${response.text}\n\nSources:\n${sources}` };
    } catch (e) {
        return { success: false, message: parseApiError(e) };
    }
};

export const identifyImageFromWeb = async (imagePart: Part): Promise<{ summary: string; sources: any[] }> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts: [imagePart, { text: "Identify object and search web." }] },
        config: { tools: [{ googleSearch: {} }] },
    });
    return { summary: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const compareCadData = async (baseCad: CadData, newCad: CadData): Promise<CadComparisonResult> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Compare CAD: ${JSON.stringify(baseCad)} and ${JSON.stringify(newCad)}. Return JSON diff.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    additions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    deletions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    modifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, changes: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
                }
            }
        },
    });
    return JSON.parse(response.text);
};
