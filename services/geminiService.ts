
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Attachment } from '../types';

// We instantiate inside the function now to support dynamic keys from settings
// while maintaining fallback to process.env.API_KEY

export const sendMessageToGemini = async (
  messageText: string, 
  historyMessages: ChatMessage[],
  attachments: Attachment[] = [],
  userApiKey?: string
): Promise<string> => {
  try {
    const keyToUse = userApiKey || process.env.API_KEY;
    
    if (!keyToUse) {
        throw new Error("Gemini API Key is missing. Please add it in Settings or configure env vars.");
    }

    const ai = new GoogleGenAI({ apiKey: keyToUse });

    // 1. Convert internal ChatMessage history to Gemini's history format
    const history = historyMessages.map(m => {
      const parts: any[] = [{ text: m.text }];
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }
      return {
        role: m.role,
        parts: parts
      };
    });

    // 2. Prepare the NEW message parts
    const currentParts: any[] = [{ text: messageText }];
    if (attachments.length > 0) {
      attachments.forEach(att => {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    const fullContents = [...history, { role: 'user', parts: currentParts }];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: fullContents,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "I couldn't generate a text response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- TTS Logic ---

function decodeBase64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const generateSpeechFromText = async (text: string, userApiKey?: string): Promise<ArrayBuffer> => {
  try {
    const keyToUse = userApiKey || process.env.API_KEY;
    if (!keyToUse) {
         throw new Error("Gemini API Key missing for TTS.");
    }
    const ai = new GoogleGenAI({ apiKey: keyToUse });

    // Use the specialized TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ['AUDIO'], // Use string 'AUDIO' to avoid import issues if Modality enum is tricky
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is usually a warm, natural voice
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini TTS");
    }

    return decodeBase64ToArrayBuffer(base64Audio);
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
