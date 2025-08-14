import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY env variable missing');
}

export const genai = new GoogleGenAI({ apiKey });
export { Modality } from '@google/genai';
