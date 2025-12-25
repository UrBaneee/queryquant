
import { ChatMessage, Attachment } from '../types';

export const sendMessageToAnthropic = async (
  message: string,
  history: ChatMessage[],
  apiKey: string,
  attachments: Attachment[] = [],
  modelId: string = "claude-3-7-sonnet-20250219"
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Anthropic API Key is missing. Please add it in Settings.");
  }

  // Convert internal history to Anthropic format
  // Roles: 'user' | 'assistant'
  const messages: any[] = history.map(msg => {
    // Simplified handling for history text
    return {
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text 
    };
  });

  // Construct Current Message content (Text + Images)
  const currentContent: any[] = [];
  
  if (attachments.length > 0) {
    attachments.forEach(att => {
      currentContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: att.mimeType,
          data: att.data,
        }
      });
    });
  }
  
  currentContent.push({ type: "text", text: message });
  messages.push({ role: 'user', content: currentContent });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerously-allow-browser': 'true' // Required for client-side calls
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Anthropic Error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "No response content received.";
  } catch (error) {
    console.error("Anthropic Call Failed:", error);
    throw error;
  }
};
