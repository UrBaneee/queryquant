
import { ChatMessage } from '../types';

export const sendMessageToDeepSeek = async (
  message: string,
  history: ChatMessage[],
  apiKey: string,
  modelId: string = "deepseek-chat"
): Promise<string> => {
  if (!apiKey) {
    throw new Error("DeepSeek API Key is missing. Please add it in Settings.");
  }

  const messages = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.text
  }));

  messages.push({ role: 'user', content: message });
  messages.unshift({
    role: 'system',
    content: "You are a helpful assistant."
  });

  try {
    // DeepSeek is OpenAI Compatible
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `DeepSeek Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response content received.";
  } catch (error) {
    console.error("DeepSeek Call Failed:", error);
    throw error;
  }
};
