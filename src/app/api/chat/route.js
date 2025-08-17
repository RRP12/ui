import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { SYSTEM_PROMPT } from '@/constants/systemPrompt';

import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

const mistral = createMistral({
    apiKey: 'cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ',
});
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
    const { messages } = await req.json();

    const result = streamText({
        model: mistral('codestral-latest'),
        system: 'You are a helpful assistant.',
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}