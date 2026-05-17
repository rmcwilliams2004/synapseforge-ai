import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

export const usePlaceholderImage = () => {
    const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null);

    useEffect(() => {
        const cached = localStorage.getItem('forge_placeholder_image');
        if (cached) {
            setPlaceholderUrl(cached);
            return;
        }

        const generatePlaceholder = async () => {
            try {
                // The API key is injected by the platform at runtime
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            { text: 'A subtle, dark, high-tech wireframe blueprint background, industrial design, glowing cyan accents, minimalist, abstract, perfect for a loading placeholder.' }
                        ]
                    },
                    config: {
                        imageConfig: { aspectRatio: "16:9" }
                    }
                });

                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        const base64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        localStorage.setItem('forge_placeholder_image', base64);
                        setPlaceholderUrl(base64);
                        break;
                    }
                }
            } catch (e) {
                console.error("Failed to generate placeholder", e);
            }
        };

        generatePlaceholder();
    }, []);

    return placeholderUrl;
};
