
import { GoogleGenAI, Type } from '@google/genai';
import { IngestedDocument, LogEntry } from '../types';
import { parseApiError } from './geminiService';

export const ingestDocument = async (
  file: File, 
  addLog: (level: LogEntry['level'], message: string) => void
): Promise<IngestedDocument> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  addLog('INFO', `Ingesting "${file.name}" into Project Knowledge Base...`);

  // 1. Prepare the file for Gemini
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  const part = {
    inlineData: {
      data: base64,
      mimeType: file.type,
    },
  };

  try {
    // 2. Use Gemini 3 Flash for efficient extraction (Step A requirement)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          part,
          { text: "Act as a technical librarian and OCR engineer. Extract ALL technical specifications, component lists, material properties, key dimensions, and engineering features from this document. Output it as a highly structured, searchable technical summary that will be used to answer engineering questions about this product. If it's a schematic, describe the connections and hierarchy." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: { type: Type.STRING, description: "Detailed technical dump of all data points found." },
            summary: { type: Type.STRING, description: "Concise 2-3 sentence overview of the document's content." },
          },
          required: ["extractedText", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text!);
    
    addLog('INFO', `Knowledge Retrieval Layer: Successfully indexed "${file.name}".`);

    return {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.type,
      content: result.extractedText,
      summary: result.summary,
      timestamp: new Date().toISOString()
    };

  } catch (e) {
    const errorMessage = parseApiError(e);
    addLog('ERROR', `Ingestion failed for "${file.name}": ${errorMessage}`);
    throw new Error(errorMessage);
  }
};
