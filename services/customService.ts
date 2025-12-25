
import { ChatMessage } from '../types';

export const sendMessageToCustomProvider = async (
  message: string,
  history: ChatMessage[],
  baseUrl: string,
  apiKey: string,
  modelId: string
): Promise<string> => {
  if (!baseUrl || !modelId) {
    throw new Error("Custom Provider Base URL and Model ID are required.");
  }

  // Normalize URL: Remove trailing slash if present
  const normalizedUrl = baseUrl.replace(/\/$/, "");
  // Ensure it ends with /chat/completions if the user just provided the domain base
  // However, some users might provide the full path. Let's assume user provides base like "https://api.x.ai/v1"
  const endpoint = `${normalizedUrl}/chat/completions`;

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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Custom API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response content received.";
  } catch (error) {
    console.error("Custom Provider Call Failed:", error);
    throw error;
  }
};
