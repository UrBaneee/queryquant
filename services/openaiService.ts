
import { ChatMessage } from '../types';

export const sendMessageToOpenAI = async (
  message: string,
  history: ChatMessage[],
  apiKey: string,
  modelId: string = 'gpt-4o'
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenAI API Key is missing. Please add it in Settings.");
  }

  // Convert internal ChatMessage format to OpenAI format
  // Gemini 'model' -> OpenAI 'assistant'
  const messages = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.text
  }));

  // Add the new user message
  messages.push({ role: 'user', content: message });

  // Add a system instruction
  messages.unshift({
    role: 'system',
    content: "You are a helpful assistant integrated into QueryQuant."
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId, 
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `OpenAI Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response content received.";
  } catch (error) {
    console.error("OpenAI Call Failed:", error);
    throw error;
  }
};
