
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
    const { messages, currentFiles, question } = await req.json();

    const result = streamText({
        model: mistral('codestral-latest'),
        system: SYSTEM_PROMPT,
        // messages: convertToModelMessages(messages),

        prompt: ` you are a helpful coding agnet assistant with access to ${JSON.stringify(currentFiles)} 
        
        question : ${question}
        `,


    });

    console.log("currentFiles", currentFiles)

    return result.toUIMessageStreamResponse();
}