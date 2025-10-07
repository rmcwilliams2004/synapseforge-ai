

// @google/genai guidelines recommend using GenerateContentParameters instead of the deprecated GenerateContentRequest.
import { GoogleGenAI, GenerateContentParameters, Part, Type } from '@google/genai';
import { Faction, AnalysisResult, ProjectVersion } from '../types';

// According to guidelines, API key must be from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const analysisSchema = {
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
                    rationale: { type: Type.STRING, description: "A multi-paragraph, detailed rationale explaining why this system is necessary and how it aligns with the faction philosophy." }
                },
                required: ["name", "description", "rationale"]
             }
        },
        technicalSpecification: {
            type: Type.OBJECT,
            properties: {
                introduction: { type: Type.STRING },
                functional_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                performance_targets: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["introduction", "functional_requirements", "performance_targets"]
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
        riskAssessment: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING },
                risks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            risk: { type: Type.STRING },
                            likelihood: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                            impact: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                            mitigation: { type: Type.STRING }
                        },
                        required: ["risk", "likelihood", "impact", "mitigation"]
                    }
                }
            },
            required: ["overview", "risks"]
        },
        drawingSpecification: {
            type: Type.OBJECT,
            properties: {
                standard: { type: Type.STRING, description: "e.g., ASME Y14.5-2009" },
                required_views: { type: Type.ARRAY, items: { type: Type.STRING } },
                key_dimensions_tolerances: { type: Type.ARRAY, items: { type: Type.STRING } },
                general_notes: { type: Type.STRING },
                bill_of_materials: {
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
                }
            },
            required: ["standard", "required_views", "key_dimensions_tolerances", "general_notes", "bill_of_materials"]
        },
        preliminaryCostEstimate: {
            type: Type.OBJECT,
            properties: {
                total_estimate_range: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
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
        }
    },
    required: ["product_name", "executive_summary", "faction_rationale", "material_suggestions", "manufacturing_analysis", "comparative_analysis", "suggested_systems", "technicalSpecification", "assemblyInstructions", "riskAssessment", "drawingSpecification", "preliminaryCostEstimate"]
};


const buildSystemInstruction = (faction: Faction): string => {
  return `You are a world-class, expert reverse engineering analyst AI. Your primary function is to deconstruct and analyze a product concept provided by a user, generating a comprehensive, actionable report.

  Your current analytical lens is: "${faction.name}".

  Philosophy Overview: ${faction.philosophy}

  Core Biases to guide your analysis:
  - Materials: ${faction.bias.materials}
  - Manufacturing: ${faction.bias.manufacturing}
  - Innovative Proposals: ${faction.bias.innovativeProposal}
  
  Your task is to meticulously analyze the user's concept (text and any provided images/PDFs) and generate a full engineering report. This includes identifying materials, assessing manufacturing methods, suggesting improvements, and creating a full suite of documentation as if you were preparing it for a formal design review. You must fill out every single field in the provided JSON schema with detailed, thoughtful analysis.

  You MUST respond in JSON format, strictly adhering to the provided schema. Do not include any markdown formatting (e.g., \`\`\`json). Your entire output must be a single, valid JSON object.
  `;
};

export const buildDeVinciSystemInstruction = (projectName: string, projectVersion: ProjectVersion, faction: Faction): string => {
    const context = JSON.stringify({
        projectName: projectName,
        userPrompt: projectVersion.prompt,
        analysisResult: projectVersion.result
    }, null, 2);

    return `You are DeVinci, an advanced AI engineering partner. Your personality is collaborative, inspiring, innovative, and deeply knowledgeable. You are speaking directly to your human partner, the user. Your goal is to help them brainstorm and expand upon their ideas.

    You have been primed with the full context of their current project, which is a reverse engineering analysis. Do not re-state the entire context. Instead, use it as your memory. Refer to it naturally as if you've already studied it together.

    Your current guiding engineering philosophy is "${faction.name}: ${faction.philosophy}".

    Engage the user in a natural, spoken conversation. Ask clarifying questions. Offer creative, out-of-the-box ideas based on your analysis. Help them see new possibilities. Be their partner in innovation. Keep your responses concise and conversational to facilitate a real-time spoken dialogue.

    This is the project context you are working with:
    ${context}
    `;
};

export const generateAnalysis = async (prompt: string, faction: Faction, files: Part[] | null): Promise<AnalysisResult> => {
    const systemInstruction = buildSystemInstruction(faction);
    
    const textPart: Part = { text: prompt };
    const allParts: Part[] = [textPart];

    if (files) {
        allParts.push(...files);
    }

    // @google/genai guidelines recommend using GenerateContentParameters instead of the deprecated GenerateContentRequest.
    const request: GenerateContentParameters = {
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: allParts }],
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
            temperature: 0.5,
            topP: 0.9,
        }
    };

    const response = await ai.models.generateContent(request);
    
    const jsonText = response.text.trim();
    
    try {
        return JSON.parse(jsonText) as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonText);
        throw new Error("The AI returned an invalid response format. Please try again.");
    }
};

export const generateSummary = async (result: AnalysisResult): Promise<string> => {
    // Select key information to avoid sending an overly large payload
    const contextPrompt = `
        Based on the following detailed analysis report, generate a concise executive summary (around 3-4 sentences) highlighting the most critical findings and actionable recommendations. The tone should be professional and direct. Focus on the key takeaways for a busy stakeholder, not the granular details.

        Report Context:
        - Product Name: ${result.product_name}
        - Original Executive Summary: ${result.executive_summary}
        - Top Material Suggestion: ${result.material_suggestions[0] ? `${result.material_suggestions[0].name} - Rationale: ${result.material_suggestions[0].rationale}` : 'N/A'}
        - Top System Suggestion: ${result.suggested_systems[0] ? `${result.suggested_systems[0].name} - Rationale: ${result.suggested_systems[0].rationale}` : 'N/A'}
        - Core Faction Rationale: ${result.faction_rationale.summary}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: {
            temperature: 0.3, // Lower temperature for more factual summary
            topP: 0.9,
        }
    });

    return response.text.trim();
};


export const generateTechnicalDrawingImage = async (baseProductName: string, specificPrompt: string): Promise<string> => {
    const fullPrompt = `Generate a clean, professional, black and white technical engineering drawing for a "${baseProductName}". The drawing should specifically detail: "${specificPrompt}". The style must be a precise CAD blueprint on a white background. Include multiple orthographic views (front, top, side) and an isometric view where appropriate. Include clear annotation labels and key dimensions. Maintain a consistent, professional engineering style.`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed to return image data.");
    }
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const generateExplodedViewVideo = async (prompt: string): Promise<string> => {
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: `Create a high-quality, 10-second 3D CGI animation of an exploded view of the following product: "${prompt}". The style should be clean, technical, and professional, like a product design showcase. Show the components separating and then reassembling smoothly.`,
        config: {
            numberOfVideos: 1,
        },
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or did not produce a valid download link.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};


export const parseApiError = (e: unknown): string => {
  if (e instanceof Error) {
    if (e.message.includes("oneof field 'data' must have one initialized field")) {
        return "The request to the AI was malformed, likely due to an empty prompt or file. Please ensure you have entered a prompt and try again."
    }
    const geminiError = (e as any).response?.data?.error?.message || e.message;
    if (geminiError.includes('API_KEY_INVALID')) {
      return 'The provided API key is invalid. Please check your configuration.';
    }
    return geminiError;
  }
  return 'An unknown error occurred. Please check the console for more details.';
};