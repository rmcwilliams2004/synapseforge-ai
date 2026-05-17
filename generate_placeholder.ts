import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) {
  console.error("No API key found in process.env");
  console.log(Object.keys(process.env));
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  console.log("Generating image...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A subtle, dark, high-tech wireframe blueprint background, industrial design, glowing cyan accents, minimalist, abstract, perfect for a loading placeholder.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      const dir = path.resolve('./public');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'placeholder.png'), Buffer.from(base64EncodeString, 'base64'));
      console.log("Image saved to public/placeholder.png");
      break;
    }
  }
}

main().catch(console.error);
