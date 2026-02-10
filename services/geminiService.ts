
import { GoogleGenAI, Part, Type, FunctionDeclaration, Modality, GenerateContentResponse } from '@google/genai';
import { Faction, AnalysisResult, CadData, FactionId, SetupSuggestions, CadComparisonResult, FabricationPlan, GCodeSummary, SimulationType, ManufacturingProcessType, BillOfMaterialsItem, ProcurementInfo, PreliminaryCostEstimate, PromptValidationResult, NextStepSuggestion, GeneratedDrawing, ManufacturingProcess, PatentApplication } from '../types';

/**
 * Interface for product details extracted from images, PDFs, or videos.
 */
export interface ExtractedProjectDetails {
    name: string;
    description: string;
    tags: string[];
    initialPrompt: string;
}

// Comprehensive JSON schema for the primary product analysis report.
const fullAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        product_name: { type: Type.STRING, description: "Concise, descriptive name for the product." },
        executive_summary: { type: Type.STRING, description: "High-level summary tailored to the engineering lens." },
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
                properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                required: ["name", "description"]
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
        independent_claims: { type: Type.ARRAY, items: { type: Type.STRING } },
        dependent_claims: { type: Type.ARRAY, items: { type: Type.STRING } },
        novelty_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        inventive_step_rationale: { type: Type.STRING }
    },
    required: ["title", "abstract", "background", "summary", "independent_claims", "dependent_claims", "novelty_points", "inventive_step_rationale"]
};

/**
 * Standard API error parser.
 */
export const parseApiError = (error: any): string => {
    console.error("Gemini API Error details:", error);
    if (typeof error === 'string') {
        try {
            const parsed = JSON.parse(error);
            if (parsed?.error?.message) return parsed.error.message;
        } catch (e) {
            return error;
        }
    }
    if (error?.message) {
        if (error.message.includes("API keys are not supported") || error.message.includes("Unauthenticated")) {
            return "Auth Error: This action requires an API Key with specific permissions. Please use the 'Select API Key' button in the header to provide a valid key.";
        }
        return error.message;
    }
    return "An unexpected error occurred during the SynapseForge AI request.";
};

/**
 * Helper to parse JSON from text that might be wrapped in markdown code blocks.
 */
const parseMarkdownJson = (text: string) => {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Manual JSON parse failed for text:", cleanText);
        throw new Error("Failed to parse AI output as JSON.");
    }
};

/**
 * Core analysis function for reverse engineering projects.
 */
export const generateAnalysis = async (
    projectName: string, 
    prompt: string, 
    faction: Faction, 
    files: Part[] | null,
    technicalContext?: string
): Promise<AnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    // Prepare retrieval context
    const retrievalBlock = technicalContext ? `
### PROJECT KNOWLEDGE BASE (AUGMENTED RETRIEVAL)
Use the following technical reference data to ground your analysis. If information is found in these sources, prioritize it.
${technicalContext}
` : '';

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            {
                role: 'user',
                parts: [
                    ...(files || []),
                    { text: `Analyze the following product concept or design from the perspective of the "${faction.name}" faction. 
                      Focus: ${faction.focus}. 
                      Philosophy: ${faction.philosophy}.
                      Biases: 
                      - Materials: ${faction.bias.materials}
                      - Manufacturing: ${faction.bias.manufacturing}
                      - Innovation: ${faction.bias.innovativeProposal}

                      Project Name: ${projectName}
                      Prompt: ${prompt}
                      
                      ${retrievalBlock}

                      Output must strictly follow the provided JSON schema.` }
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

    return JSON.parse(response.text!);
};

/**
 * Generates a patent draft application based on analysis results.
 */
export const generatePatentDraft = async (result: AnalysisResult): Promise<PatentApplication> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a patent attorney and mechanical engineer. Based on the provided technical analysis for "${result.product_name}", draft a formal patent application. Focus on non-obvious technical improvements, unique component interactions, and specific material/system optimizations identified in the report.
        
        Analysis Context:
        Summary: ${result.executive_summary}
        BOM: ${JSON.stringify(result.billOfMaterials)}
        Systems: ${JSON.stringify(result.suggested_systems)}
        Architecture: ${result.designDocument.system_architecture}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: patentSchema,
            maxOutputTokens: 8000,
            thinkingConfig: { thinkingBudget: 3000 }
        }
    });
    return JSON.parse(response.text!);
};

/**
 * Generates a video from a text prompt and optional starting image.
 */
export const generateVideo = async (prompt: string, imageFile?: File, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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

/**
 * Generates a technical drawing image using Gemini Image model.
 */
export const generateTechnicalDrawingImage = async (analysisResult: AnalysisResult, specificPrompt: string, fileUrls?: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Generate a standard engineering technical drawing (blueprints style) based on the following analysis:
      Product: ${analysisResult.product_name}
      Summary: ${analysisResult.executive_summary}
      Requested View: ${specificPrompt}
      Style: Clean, professional, black and white technical drawing with dimensions and annotations.`;

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
    throw new Error("No image was generated.");
};

/**
 * Converts a reference image into a technical drawing.
 */
export const generateDrawingFromImage = async (imagePart: Part, specificPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Convert the provided image into a professional engineering technical drawing. 
      Instructions: ${specificPrompt}. 
      Style: Blueprints, white background, black lines, technical annotations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    for (const part of response.candidates![0].content!.parts!) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image was generated.");
};

/**
 * Identifies a product from an image and returns grounding links via Search.
 */
export const identifyImageFromWeb = async (imagePart: Part): Promise<{ summary: string, sources: any[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: "Identify this product or component and find technical information about it on the web." }] },
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    return {
        summary: response.text || "",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

/**
 * Extracts project metadata from an image.
 */
export const extractProjectDetailsFromImage = async (imagePart: Part): Promise<ExtractedProjectDetails> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: "Extract product details for a new engineering project based on this image." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });
    return JSON.parse(response.text!);
};

/**
 * Extracts project metadata from a PDF.
 */
export const extractProjectDetailsFromPdf = async (pdfPart: Part): Promise<ExtractedProjectDetails> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [pdfPart, { text: "Analyze this technical document and extract project details for a reverse engineering study." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });
    return JSON.parse(response.text!);
};

/**
 * Extracts project metadata from a video file.
 */
export const extractProjectDetailsFromVideo = async (videoPart: Part): Promise<ExtractedProjectDetails> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro for high quality reasoning on video parts
        contents: { parts: [videoPart, { text: "Summarize this video and extract details for a new engineering project." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });
    return JSON.parse(response.text!);
};

/**
 * Extracts project metadata from a video URL using Search grounding.
 */
export const extractProjectDetailsFromVideoUrl = async (url: string): Promise<ExtractedProjectDetails> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    // Note: googleSearch tool cannot be combined with responseSchema/responseMimeType on certain models/configs.
    // We remove them and perform manual parsing if the output looks like markdown/json.
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the content of this video URL: ${url} and extract project details. Output the data as a JSON block with properties: name (string), description (string), tags (array of strings), initialPrompt (string).`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    const text = response.text || "";
    return parseMarkdownJson(text);
};

/**
 * Logic to get setup suggestions for a project prompt.
 */
export const getSetupSuggestions = async (prompt: string): Promise<SetupSuggestions> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given this project description, recommend an engineering philosophy and suggest technical tags. Description: ${prompt}`,
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

/**
 * Generates a concise summary for the report.
 */
export const generateSummary = async (result: AnalysisResult): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a very concise summary of this analysis result: ${JSON.stringify(result)}`,
    });
    return response.text || "";
};

/**
 * Generates simulated CAD data.
 */
export const generateCadData = async (drawings: GeneratedDrawing[], result: AnalysisResult): Promise<CadData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate simulated 3D CAD data structure for "${result.product_name}" based on: ${result.executive_summary} and BOM: ${JSON.stringify(result.billOfMaterials)}`,
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

/**
 * Compares two sets of CAD data.
 */
export const compareCadData = async (base: CadData, updated: CadData): Promise<CadComparisonResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Compare these two CAD data structures:
          Base: ${JSON.stringify(base)}
          Updated: ${JSON.stringify(updated)}`,
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

/**
 * TTS generation using the TTS-specific Gemini model.
 */
export const generateSpeech = async (text: string, voice: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated.");
    return base64Audio;
};

/**
 * Generates a textual simulation result.
 */
export const generateSimulationResult = async (type: SimulationType, componentName: string, productContext: string): Promise<{ summary: string, keyFindings: string[], imagePrompt: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Run a simulated ${type} analysis on "${componentName}" within context: ${productContext}.`,
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
    return JSON.parse(response.text!);
};

/**
 * Generates a fabrication plan.
 */
export const generateFabricationPlan = async (processType: ManufacturingProcessType, material: string, productContext: string): Promise<FabricationPlan> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a fabrication plan for ${processType} using ${material} for: ${productContext}.`,
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

/**
 * Summarizes G-Code for visualization.
 */
export const summarizeGCode = async (gcode: string): Promise<GCodeSummary> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this G-Code: ${gcode}`,
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

/**
 * Detailed explanation for a design suggestion.
 */
export const exploreSuggestion = async (suggestionText: string, productContext: string): Promise<{ explanation: string, imageUrl: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain design suggestion: "${suggestionText}" in context: ${productContext}. Provide image prompt.`,
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

/**
 * Sourcing logic using Search grounding.
 */
export const sourceBomItem = async (item: BillOfMaterialsItem): Promise<ProcurementInfo[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    // RULE: googleSearch cannot be used with responseSchema/responseMimeType.
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Source procurement info for: ${JSON.stringify(item)}. Output a JSON array of objects with keys: supplier (string), url (string), estimatedCost (string), leadTime (string).`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    return parseMarkdownJson(response.text || "[]");
};

/**
 * Evaluates prompt clarity.
 */
export const validatePrompt = async (prompt: string): Promise<PromptValidationResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Validate engineering analysis prompt clarity: "${prompt}".`,
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

/**
 * Dynamic cost recalculation.
 */
export const recalculateCost = async (bom: BillOfMaterialsItem[], mfgContext: ManufacturingProcess[], matContext: string): Promise<PreliminaryCostEstimate> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Recalculate cost for BOM: ${JSON.stringify(bom)}. Mfg context: ${JSON.stringify(mfgContext)}. Materials: ${matContext}`,
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

/**
 * Suggestions for project next steps.
 */
export const getNextStepSuggestions = async (context: string): Promise<NextStepSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest 3 logical next steps for context: ${context}. Use available action IDs.`,
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

/**
 * Generates inspirational concept prompts based on analysis.
 */
export const generateFactionInspirationalPrompts = async (result: AnalysisResult): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 3 inspirational visual concept prompts based on: ${result.executive_summary}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text!);
};

/**
 * Summarizes PDF content.
 */
export const summarizePdfForContext = async (pdfPart: Part): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [pdfPart, { text: "Summarize this PDF for engineering context." }] },
    });
    return response.text || "";
};

/**
 * Generic web search grounded in Gemini Flash.
 */
export const performWebSearch = async (query: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    return {
        summary: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
};

/**
 * Inspirational image generation using Gemini Flash Image model.
 */
export const generateInspirationalImage = async (prompt: string, aspectRatio: string = '16:9'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: { aspectRatio: aspectRatio as any }
        }
    });
    for (const part of response.candidates![0].content!.parts!) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to generate image.");
};

// --- DeVinci & Voice Commander System Instruction Builders ---

export const buildDeVinciCreationSystemInstruction = (factions: Faction[]): string => {
    return `You are **DeVinci**, a world-class AI Innovation Partner. Guide the user from an idea to an engineering project. Call 'create_project' when ready. Factions: ${factions.map(f => f.name).join(', ')}.`;
};

export const buildDeVinciSystemInstruction = (context: string, factions: Faction[]): string => {
    return `You are DeVinci, an engineering partner. Context: ${context}. Available factions: ${JSON.stringify(factions)}.`;
};

// --- Function Declarations for Tool Calling ---

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

export const generateTechnicalDrawingFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_technical_drawing',
    parameters: {
        type: Type.OBJECT,
        properties: {
            specificPrompt: { type: Type.STRING, description: "Technical description of drawing view." }
        },
        required: ["specificPrompt"]
    }
};

export const researchWebFunctionDeclaration: FunctionDeclaration = {
    name: 'research_web',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING }
        },
        required: ["query"]
    }
};

export const runAnalysisWithFactionFunctionDeclaration: FunctionDeclaration = {
    name: 'run_analysis_with_faction',
    parameters: {
        type: Type.OBJECT,
        properties: {
            factionId: { type: Type.STRING, enum: Object.values(FactionId) }
        },
        required: ["factionId"]
    }
};

export const generateInspirationalImageFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_inspirational_image',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: { type: Type.STRING }
        },
        required: ["prompt"]
    }
};

export const downloadDrawingsFunctionDeclaration: FunctionDeclaration = {
    name: 'download_drawings',
    parameters: {
        type: Type.OBJECT,
        properties: {},
    }
};

export const generateVideoFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_video',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: { type: Type.STRING },
            useUploadedImage: { type: Type.BOOLEAN }
        },
        required: ["prompt"]
    }
};

export const showSectionFunctionDeclaration: FunctionDeclaration = {
    name: 'show_section',
    parameters: {
        type: Type.OBJECT,
        properties: {
            sectionId: { type: Type.STRING, enum: ['executive_summary', 'faction_rationale', 'ai_suggestions', 'visual_documentation', 'cad_export', 'bom', 'live_costing', 'advanced_simulation', 'rotordynamics_studio', 'fabrication_planner', 'test_plan', 'compliance_safety', 'change_orders', 'patent_application'] }
        },
        required: ["sectionId"]
    }
};
