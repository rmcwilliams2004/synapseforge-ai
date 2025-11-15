import { GoogleGenAI, GenerateContentParameters, Part, Type, FunctionDeclaration, Modality } from '@google/genai';
// FIX: Add missing type imports to support new functions.
import { Faction, AnalysisResult, ProjectVersion, CadData, FactionId, SetupSuggestions, SimulationResult, CadComparisonResult, FabricationPlan, GCodeSummary, SimulationType, ManufacturingProcessType, BillOfMaterialsItem, ProcurementInfo, PreliminaryCostEstimate, PromptValidationResult, NextStepSuggestion, GeneratedDrawing } from '../types';

// According to guidelines, API key must be from process.env.API_KEY
// A new instance is created for each call for some services like Veo.
let ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// FIX: This schema was incomplete. It has been replaced with the full schema required for the AnalysisResult type.
const fullAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        product_name: { type: Type.STRING, description: "A concise, descriptive name for the product being analyzed." },
        executive_summary: { type: Type.STRING, description: "A high-level summary of the product's design, construction, and key findings from the analysis, tailored to the chosen engineering philosophy." },
        faction_rationale: {
            type: Type.OBJECT,
            properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of aspects of the design that align with the faction's philosophy." },
                cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of aspects of the design that conflict with the faction's philosophy." },
                summary: { type: Type.STRING, description: "A concluding summary of the faction's overall assessment of the design." }
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
                    name: { type: Type.STRING, description: "A highly specific name for the suggested system, e.g., 'Brushless DC Motor with Planetary Gearbox'."},
                    description: { type: Type.STRING },
                    rationale: { type: Type.STRING, description: "A detailed explanation of why this system is a good fit, its benefits, and how it aligns with the faction philosophy." }
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
        "product_name", "executive_summary", "faction_rationale", "material_suggestions",
        "manufacturing_analysis", "comparative_analysis", "suggested_systems",
        "requirementSpecification", "designDocument", "drawingSpecification", "testPlan",
        "simulationAndAnalysisReport", "assemblyInstructions", "billOfMaterials",
        "preliminaryCostEstimate", "complianceAndSafety", "engineeringChangeOrders"
    ]
};

export const parseApiError = (e: any): string => {
  // Extract the primary message string from various possible error formats.
  let message = 'An unknown error occurred.';
  if (e instanceof Error) {
    message = e.message;
  } else if (typeof e === 'string') {
    message = e;
  } else if (e && typeof e.message === 'string') {
    message = e.message;
  } else if (typeof e === 'object' && e !== null) {
    // If `e` is the JSON object itself, stringify it to be parsed.
    try {
        message = JSON.stringify(e);
    } catch { /* Ignore stringify errors */ }
  }

  // Attempt to parse the message as a Google API Error JSON.
  try {
    const errorJson = JSON.parse(message);
    const apiError = errorJson.error || errorJson; // Handle both wrapped and unwrapped error objects.
    
    if (apiError && typeof apiError.message === 'string') {
        // Check for specific statuses like quota exhaustion.
        if (apiError.status === 'RESOURCE_EXHAUSTED') {
            return "API Quota Exceeded: The application has reached its daily usage limit. Please check your API key's billing details. For more information, visit ai.google.dev/gemini-api/docs/rate-limits.";
        }
        // For other API errors, return the specific message.
        return apiError.message.split('\n')[0];
    }
  } catch (jsonParseError) {
    // It's not a JSON string, so we'll treat it as plain text.
  }
  
  // As a fallback, check the raw message for keywords.
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
    return "API Quota Exceeded: The application has reached its daily usage limit. Please check your API key's billing details. For more information, visit ai.google.dev/gemini-api/docs/rate-limits.";
  }
  
  // If it's a simple string error that wasn't parsed, return it.
  if (message !== 'An unknown error occurred.') {
    return message;
  }

  // If we still don't have a good message, log the original error and return the generic message.
  console.error("Unknown error type:", e);
  return 'An unknown error occurred.';
};


// FIX: Add missing function `generateAnalysis`.
export const generateAnalysis = async (projectName: string, prompt: string, faction: Faction, fileParts: Part[] | null): Promise<AnalysisResult> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `You are an expert reverse-engineering AI. Your task is to analyze a product concept based on a user's prompt and any provided files (images, PDFs). Your analysis must be framed through the lens of a specific engineering philosophy or "faction".

    **Project Name:** ${projectName}
    **Selected Faction:** ${faction.name}
    **Faction Philosophy:** ${faction.philosophy}
    **Faction Bias:**
    - Materials: ${faction.bias.materials}
    - Manufacturing: ${faction.bias.manufacturing}
    - Innovation: ${faction.bias.innovativeProposal}

    Produce a comprehensive report as a JSON object that strictly adheres to the provided schema. The report should be thorough, detailed, and reflect the chosen faction's priorities.`;
    
    const parts: Part[] = [{ text: prompt }];
    if (fileParts && fileParts.length > 0) {
        parts.push(...fileParts);
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: fullAnalysisSchema,
        },
    });

    return JSON.parse(response.text);
};


// --- SUGGESTION EXPLORATION ---
const suggestionExplorationSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { 
            type: Type.STRING, 
            description: "A brief, insightful explanation of the suggested concept in the context of the product. Explain the benefits and trade-offs." 
        },
        imagePrompt: { 
            type: Type.STRING, 
            description: "A creative, detailed prompt for a photorealistic image generator (like Imagen) to visualize this specific concept. The prompt should describe a product shot or a diagram that clearly illustrates the idea." 
        },
    },
    required: ["explanation", "imagePrompt"],
};

export const exploreSuggestion = async (suggestionText: string, productContext: string): Promise<{ explanation: string; imageUrl: string }> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const prompt = `
Context: I am analyzing a product with the following details: ${productContext}.

Suggestion to explore: "${suggestionText}"

Task:
1. Provide a brief, insightful explanation of this suggestion.
2. Create a detailed, creative prompt for a photorealistic image generator to visualize this concept.

Return the result as a JSON object matching the provided schema.
`;

    const result = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: suggestionExplorationSchema,
        },
    });
    
    const jsonText = result.text;
    const responseData = JSON.parse(jsonText);

    // FIX: Removed @ts-ignore as generateInspirationalImage will be available.
    const imageUrl = await generateInspirationalImage(responseData.imagePrompt, '16:9');

    return {
        explanation: responseData.explanation,
        imageUrl,
    };
};

// --- PROMPT VALIDATION ---
const promptValidationSchema = {
    type: Type.OBJECT,
    properties: {
        isClear: { type: Type.BOOLEAN, description: "Is the prompt clear, specific, and sufficient for a detailed reverse-engineering analysis?" },
        suggestion: { type: Type.STRING, description: "If the prompt is not clear, provide one single, specific, and actionable suggestion for improvement. If it is clear, this should be null." },
    },
    required: ["isClear", "suggestion"],
};

export const validatePrompt = async (prompt: string): Promise<PromptValidationResult> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `You are an AI assistant that validates user prompts for a reverse-engineering AI. Your task is to determine if a prompt is clear and specific enough to generate a high-quality analysis. A good prompt mentions the product type and its key features or purpose. A vague prompt is something like "my invention" or "a new device".`;
    const fullPrompt = `Analyze the following prompt for clarity: "${prompt}". Return a JSON object matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: promptValidationSchema,
        },
    });
    return JSON.parse(response.text);
};


// --- LIVE COSTING ---
const costEstimateSchema = fullAnalysisSchema.properties.preliminaryCostEstimate;

export const recalculateCost = async (bom: BillOfMaterialsItem[], manufacturingProcesses: {name: string, description: string}[], materialContext: string): Promise<PreliminaryCostEstimate> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
    Act as a cost engineer. Given the following Bill of Materials and manufacturing context, provide an updated preliminary cost estimate.
    Focus on how changes might impact the total cost.

    Context:
    - Key Materials in use: ${materialContext}
    - Key Manufacturing Processes: ${manufacturingProcesses.map(p => p.name).join(', ')}

    Updated Bill of Materials:
    ${JSON.stringify(bom, null, 2)}

    Return a JSON object with the updated cost estimate, strictly adhering to the provided schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: costEstimateSchema,
        },
    });
    return JSON.parse(response.text);
};

// --- NEXT STEP ASSISTANT ---
const nextStepSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A short, actionable title for the suggested next step (e.g., 'Run a Stress Simulation')." },
        rationale: { type: Type.STRING, description: "A brief, one-sentence explanation of why this is a good next step." },
        actionId: { 
            type: Type.STRING, 
            description: "A machine-readable ID corresponding to a UI section or action.",
            enum: ['executive_summary', 'ai_suggestions', 'visual_documentation', 'fabrication_planner', 'advanced_simulation', 'live_costing', 'launch_devinci']
        },
        icon: {
            type: Type.STRING,
            description: "An icon name that best represents the action.",
            enum: ['beaker', 'cube', 'bolt', 'ruler', 'chart', 'dollar', 'conversation', 'play']
        }
    },
    required: ["title", "rationale", "actionId", "icon"]
};

const nextStepSuggestionsSchema = {
    type: Type.ARRAY,
    items: nextStepSuggestionSchema,
    maxItems: 5
};

export const getNextStepSuggestions = async (analysisContext: string): Promise<NextStepSuggestion[]> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `You are an expert AI engineering project manager. Your task is to analyze a summary of an engineering report and suggest 3-5 logical next steps for the user.
    - Base your suggestions on the provided context.
    - Each suggestion must map to one of the provided 'actionId' values.
    - Provide a concise, user-friendly title and rationale.
    - Choose an appropriate icon from the list.
    - Do not suggest actions that seem to have already been taken (e.g., don't suggest generating a drawing if the context mentions existing drawings).
    - Prioritize high-impact engineering activities.
    `;
    const fullPrompt = `Here is the context of the current analysis report:\n\n${analysisContext}\n\nSuggest the next steps as a JSON array matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: nextStepSuggestionsSchema,
        },
    });
    return JSON.parse(response.text);
};


// FIX: Add all missing functions and types below.
// --- HELPER FUNCTIONS ---
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const dataUrlToGenerativePart = (dataUrl: string): Part => {
    const [header, data] = dataUrl.split(',');
    if (!header || !data) {
        throw new Error("Invalid data URL format");
    }
    const mimeTypeMatch = header.match(/data:(.*);base64/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        throw new Error("Could not extract MIME type from data URL");
    }
    const mimeType = mimeTypeMatch[1];

    return {
        inlineData: {
            data,
            mimeType
        }
    };
};

// --- VIDEO GENERATION ---
export const generateVideo = async (prompt: string, imageFile?: File, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const imagePayload = imageFile ? {
        imageBytes: await fileToBase64(imageFile),
        mimeType: imageFile.type,
    } : undefined;

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: imagePayload,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation succeeded, but no download link was provided.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

// --- IMAGE GENERATION ---
export const generateTechnicalDrawingImage = async (analysisResult: AnalysisResult, specificPrompt: string, fileUrls?: string[]): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `You are a specialized AI model that generates technical drawings and blueprints based on product analysis data. The output must be a clean, professional-looking 2D blueprint-style image on a white background with blue lines.`;

    const context = `
    Product: ${analysisResult.product_name}
    Summary: ${analysisResult.executive_summary}
    Key Components: ${analysisResult.designDocument.component_designs.map(c => c.component_name).join(', ')}
    `;
    
    const parts: Part[] = [];
    let fullPrompt: string;

    if (fileUrls && fileUrls.length > 0) {
        // This is an image-to-image (edit/contextual) task. The prompt needs to be explicit.
        const [header, data] = fileUrls[0].split(',');
        const mimeTypeMatch = header.match(/data:(.*);base64/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
        
        // Per API guidelines, image part comes first for multi-modal input with images.
        parts.push({ inlineData: { data, mimeType } });
        
        // The prompt should explicitly reference the image.
        fullPrompt = `Using the provided image as a reference, generate a technical drawing for the following request: "${specificPrompt}". Use the other provided text context to inform the drawing. Context: ${context}`;
        parts.push({ text: fullPrompt });
    } else {
        // This is a text-to-image task.
        fullPrompt = `Generate a technical drawing for the following request: "${specificPrompt}". Use the provided context to inform the drawing. Context: ${context}`;
        parts.push({ text: fullPrompt });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE],
            systemInstruction,
        }
    });
    
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error('Image generation failed to return an image.');
};

export const generateDrawingFromImage = async (imagePart: Part, specificPrompt: string): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `You are a specialized AI model that generates technical drawings and blueprints based on an input image and a prompt. The output must be a clean, professional-looking 2D blueprint-style image on a white background with blue lines, representing the object in the source image.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imagePart,
                { text: `Based on this image, generate a technical drawing. Instructions: "${specificPrompt}"` }
            ]
        },
        config: {
            systemInstruction,
            responseModalities: [Modality.IMAGE],
        },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error('Image generation failed to return an image.');
};

export const generateInspirationalImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as any,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// --- SUMMARY GENERATION ---
export const generateSummary = async (result: AnalysisResult): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Based on the following detailed analysis report, generate a concise, executive-level summary of 2-3 paragraphs. Focus on the most critical findings, key suggestions, and overall assessment.

    Report:
    ${JSON.stringify(result, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

// --- BOM SOURCING ---
const procurementInfoSchema = {
    type: Type.OBJECT,
    properties: {
        supplier: { type: Type.STRING, description: "The name of the supplier or vendor (e.g., McMaster-Carr, Digi-Key)." },
        url: { type: Type.STRING, description: "A direct URL to the product page or a relevant search result on the supplier's website." },
        estimatedCost: { type: Type.STRING, description: "The estimated cost per unit or for the specified quantity. Include currency." },
        leadTime: { type: Type.STRING, description: "The estimated lead time for delivery (e.g., 'In Stock', '1-2 weeks')." },
    },
    required: ["supplier", "url", "estimatedCost", "leadTime"],
};

const sourcingSchema = {
    type: Type.ARRAY,
    items: procurementInfoSchema,
    description: "A list of potential suppliers for the component."
};

export const sourceBomItem = async (item: BillOfMaterialsItem): Promise<ProcurementInfo[]> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
        Act as a procurement specialist. I need to source the following component from a Bill of Materials.
        Search the web to find 2-3 potential suppliers. For each supplier, provide their name, a URL to the product, the estimated cost, and the lead time.

        Component Details:
        - Name: ${item.name}
        - Description: ${item.description}
        - Material: ${item.material}
        - Quantity: ${item.quantity}

        Provide the output as a JSON array that strictly adheres to the provided schema. If you cannot find information, provide your best estimate or state that it is not available.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: sourcingSchema,
        },
    });
    
    return JSON.parse(response.text);
};


// --- CAD & FABRICATION ---
const cadSchema = {
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
                        required: ['x', 'y', 'z']
                    },
                    position: {
                        type: Type.OBJECT,
                        properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } },
                        required: ['x', 'y', 'z']
                    },
                },
                required: ['name', 'shape', 'dimensions', 'position']
            }
        }
    },
    required: ['assemblyName', 'units', 'components']
};

export const generateCadData = async (drawings: GeneratedDrawing[], result: AnalysisResult): Promise<CadData> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    if (drawings.filter(d => d.url).length === 0) {
        throw new Error("Cannot generate CAD data without at least one technical drawing.");
    }
    
    const drawingParts = drawings
        .filter(d => d.url) // Only include drawings that have successfully generated
        .map(d => dataUrlToGenerativePart(d.url!));

    const prompt = `Based on the following technical drawings (which may include orthographic views, isometrics, etc.) and the overall product context, generate a simplified 3D CAD structure. Interpret the 2D views to construct a 3D assembly. Represent the main components as basic geometric shapes (cube, cylinder, sphere). Estimate their relative positions and dimensions to form a plausible assembly that accurately reflects the drawings.

    Product Context:
    - Product Name: ${result.product_name}
    - Executive Summary: ${result.executive_summary}
    - Key Components from BOM: ${result.billOfMaterials.map(b => b.name).join(', ')}

    Return a JSON object matching the provided schema.
    `;
    
    const contents: any = {
        parts: [{ text: prompt }, ...drawingParts]
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: cadSchema,
        },
    });
    return JSON.parse(response.text);
};

const fabricationPlanSchema = {
    type: Type.OBJECT,
    properties: {
        dfmChecks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { component: { type: Type.STRING }, issue: { type: Type.STRING }, recommendation: { type: Type.STRING } },
                required: ['component', 'issue', 'recommendation']
            }
        },
        tolerancingNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        processSpecificOutput: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                data: { type: Type.STRING, description: "For CNC, generate G-code. For 3D printing, provide slicer settings. For Sheet Metal, provide bend allowances." }
            },
            required: ['title', 'data']
        }
    },
    required: ['dfmChecks', 'tolerancingNotes', 'processSpecificOutput']
};

// FIX: Renamed the 'process' parameter to 'fabricationProcess' to avoid shadowing the global 'process' object,
// which caused an error when trying to access 'process.env.API_KEY'.
export const generateFabricationPlan = async (fabricationProcess: ManufacturingProcessType, material: string, productContext: string): Promise<FabricationPlan> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
    Generate a fabrication plan for a product with the following context:
    ${productContext}

    The plan should be for the "${fabricationProcess}" process using "${material}".
    Include DFM checks, tolerancing notes, and process-specific output.
    Return a JSON object matching the schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: fabricationPlanSchema,
        },
    });
    return JSON.parse(response.text);
};

const gcodeSummarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A high-level summary of what the G-code will do." },
        keyOperations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the main operations like facing, pocketing, drilling, etc." }
    },
    required: ['summary', 'keyOperations']
};

export const summarizeGCode = async (gcode: string): Promise<GCodeSummary> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
    Analyze the following G-code and provide a summary and a list of key operations.
    G-Code:
    \`\`\`
    ${gcode}
    \`\`\`
    Return a JSON object matching the schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: gcodeSummarySchema,
        },
    });
    return JSON.parse(response.text);
};

// --- SETUP & SIMULATION ---
const setupSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        recommendedFactionId: { type: Type.STRING, enum: Object.values(FactionId) },
        suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['recommendedFactionId', 'suggestedTags']
};

export const getSetupSuggestions = async (prompt: string): Promise<SetupSuggestions> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `You are an AI assistant that helps engineers set up their analysis. Based on the user's project description, you will suggest the most appropriate "Engineering Philosophy" (faction) to use as an analytical lens and also provide a list of relevant technical tags for the project.`;
    const fullPrompt = `Analyze the following product concept and provide suggestions for setup.
    
    Concept: "${prompt}"

    Return a JSON object that matches the provided schema.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: setupSuggestionsSchema,
        },
    });
    return JSON.parse(response.text);
};

const simulationResultSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A concise summary of the simulated results." },
        keyFindings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of the most important findings from the simulation." },
        imagePrompt: { type: Type.STRING, description: "A detailed, creative prompt for an image generator to create a visualization of this simulation (e.g., a stress map, a fluid flow diagram, a thermal heat map)." }
    },
    required: ["summary", "keyFindings", "imagePrompt"]
};

export const generateSimulationResult = async (type: SimulationType, componentName: string, productContext: string): Promise<{ summary: string; keyFindings: string[]; imagePrompt: string; }> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
    Simulate a ${type} analysis on the "${componentName}" component within the context of the following product:
    ${productContext}

    Provide a summary, key findings, and a prompt to visualize the result. Return a JSON object matching the schema.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: simulationResultSchema,
        },
    });
    return JSON.parse(response.text);
};

// --- TTS ---
export const generateSpeech = async (text: string, voice: string): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
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
    if (!base64Audio) {
        throw new Error('Audio generation failed to return audio data.');
    }
    return base64Audio;
};

// --- DEVINCI & FUNCTION CALLING ---
export type ExtractedProjectDetails = {
    name: string;
    description: string;
    tags: string[];
    initialPrompt: string;
};

const extractedDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        initialPrompt: { type: Type.STRING }
    },
    required: ['name', 'description', 'tags', 'initialPrompt']
};

export const extractProjectDetailsFromImage = async (imagePart: Part): Promise<ExtractedProjectDetails> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: "Analyze this product image. Infer a project name, a brief description, relevant tags, and create an initial prompt for a reverse-engineering analysis. Return a JSON object matching the schema." }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: extractedDetailsSchema,
        }
    });
    return JSON.parse(response.text);
};

export const extractProjectDetailsFromPdf = async (pdfPart: Part): Promise<ExtractedProjectDetails> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [pdfPart, { text: "Analyze this PDF document. Summarize its content to infer a project name, a detailed description, relevant tags, and create an initial prompt for a reverse-engineering analysis based on the document's content. Return a JSON object matching the schema." }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: extractedDetailsSchema,
        }
    });
    return JSON.parse(response.text);
};

export const summarizePdfForContext = async (pdfPart: Part): Promise<string> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [pdfPart, { text: "Provide a concise but comprehensive summary of this document for an engineering discussion." }] }
    });
    return response.text;
};

export const performWebSearch = async (query: string): Promise<{ success: boolean; result?: string; message?: string }> => {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks.map((chunk: any) => `- ${chunk.web.title}: ${chunk.web.uri}`).join('\n');
        const result = `${response.text}\n\nSources:\n${sources}`;
        return { success: true, result };
    } catch (e) {
        return { success: false, message: parseApiError(e) };
    }
};

export const identifyImageFromWeb = async (imagePart: Part): Promise<{ summary: string; sources: any[] }> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: "Identify the object in this image and provide a brief summary. Search the web to find relevant information and sources." }] },
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const summary = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { summary, sources };
};

const cadComparisonSchema = {
    type: Type.OBJECT,
    properties: {
        additions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of component names that were added in the new version." },
        deletions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of component names that were removed in the new version." },
        modifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    changes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of changes made to this component (e.g., 'Position changed', 'Dimensions increased')." }
                },
                required: ['name', 'changes']
            }
        }
    },
    required: ['additions', 'deletions', 'modifications']
};

export const compareCadData = async (baseCad: CadData, newCad: CadData): Promise<CadComparisonResult> => {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
    Compare these two simulated CAD data structures. Identify components that were added, deleted, or modified between the 'base' and 'new' versions.
    Base version: ${JSON.stringify(baseCad)}
    New version: ${JSON.stringify(newCad)}
    Return a JSON object of the differences, matching the schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: cadComparisonSchema,
        },
    });
    return JSON.parse(response.text);
};


// --- FUNCTION DECLARATIONS ---
export const generateVideoFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_video',
    description: 'Generates a short video. Can be based on a text prompt, a previously uploaded image, or both.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: "A detailed text prompt describing the video content. This is required even if using an image."
            },
            useUploadedImage: {
                type: Type.BOOLEAN,
                description: "Set to true if the user mentions using an uploaded image, a reference image, or 'this image' as a basis for the video."
            }
        },
        required: ['prompt']
    }
};

export const downloadDrawingsFunctionDeclaration: FunctionDeclaration = {
    name: 'download_drawings',
    description: 'Packages all generated technical drawings and concept images from the current analysis into a single .zip file and downloads it for the user.',
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
};

export const showSectionFunctionDeclaration: FunctionDeclaration = {
    name: 'show_section',
    description: "Navigates the user to a specific section of the analysis report page by scrolling to it.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            sectionId: {
                type: Type.STRING,
                description: 'The unique ID of the section to scroll to.',
                enum: [
                    'executive_summary', 'faction_rationale', 'ai_suggestions', 'visual_documentation',
                    'cad_export', 'bom', 'live_costing', 'advanced_simulation', 'rotordynamics_studio',
                    'fabrication_planner', 'test_plan', 'compliance_safety', 'change_orders',
                ]
            }
        },
        required: ['sectionId']
    }
};

export const generateTechnicalDrawingFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_technical_drawing',
    description: 'Generates a 2D technical drawing/blueprint of a specific component or assembly from the current analysis context.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            specificPrompt: {
                type: Type.STRING,
                description: "A detailed prompt describing the desired drawing, e.g., 'An exploded isometric view of the gearbox assembly' or 'A cross-section of the motor housing showing the internal components'."
            }
        },
        required: ['specificPrompt']
    }
};

export const researchWebFunctionDeclaration: FunctionDeclaration = {
    name: 'research_web',
    description: 'Performs a Google web search to find information about a specific topic, material, component, or standard.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: 'The search query, e.g., "datasheet for NEMA 17 stepper motor" or "ASTM A36 steel properties".'
            }
        },
        required: ['query']
    }
};

export const runAnalysisWithFactionFunctionDeclaration: FunctionDeclaration = {
    name: 'run_analysis_with_faction',
    description: 'Runs a full new analysis in the background using a different engineering philosophy (faction) to provide an alternative perspective.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            factionId: {
                type: Type.STRING,
                description: 'The ID of the faction to use for the new analysis.',
                enum: Object.values(FactionId),
            }
        },
        required: ['factionId']
    }
};

export const generateInspirationalImageFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_inspirational_image',
    description: 'Generates a photorealistic inspirational image or concept art based on a detailed description.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: "A very detailed prompt for the image generator, describing the scene, style, lighting, and subject. E.g., 'A photorealistic product shot of a futuristic, translucent cordless drill on a dark, metallic surface, with internal components glowing softly.'"
            }
        },
        required: ['prompt']
    }
};

export const createProjectFunctionDeclaration: FunctionDeclaration = {
    name: 'create_project',
    description: 'Creates a new project with a name, description, tags, and a selected engineering philosophy (faction).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'The name of the new project.' },
            description: { type: Type.STRING, description: 'A brief description of the project.' },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of relevant tags.' },
            factionId: { type: Type.STRING, description: 'The ID of the faction to use.', enum: Object.values(FactionId) }
        },
        required: ['name', 'description', 'factionId']
    }
};

export const buildDeVinciCreationSystemInstruction = (factions: Faction[]): string => {
    return `You are DeVinci, a conversational AI that helps users start new engineering projects. Your goal is to gather the necessary information from the user (project name, description, tags, and engineering philosophy) and then call the 'create_project' function. Be friendly, conversational, and guide the user through the process.
    
    Available Factions:
    ${factions.map(f => `- ${f.name} (ID: ${f.id}): ${f.philosophy}`).join('\n')}
    `;
};

export const buildDeVinciSystemInstruction = (context: string, factions: Faction[]): string => {
    return `You are DeVinci, an expert AI engineering partner. You are in a real-time voice conversation with a user to brainstorm and analyze a product. You have been provided with the full context of their current project. Use this context as your internal knowledge base to have a natural, informed conversation. You can also use available tools to perform actions like generating drawings or researching the web.

    Available Factions for background analysis:
    ${factions.map(f => `- ${f.name} (ID: ${f.id})`).join('\n')}
    
    Current Project Context:
    ---
    ${context}
    ---
    `;
};