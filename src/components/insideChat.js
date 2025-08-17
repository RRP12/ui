
'use client';


import { createMistral } from '@ai-sdk/mistral';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Response } from '@/components/ai-elements/response';
const mistral = createMistral({

    apiKey: 'cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ',

});

export default function Page() {
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    });
    const [input, setInput] = useState('');


    console.log("messages", messages);
    return (
        <>
            {status}
            {messages.map(message => (
                <div key={message.id}>
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, index) =>
                        part.type === 'text' ? <Response key={index}>{part.text}</Response> : null,
                    )}
                </div>
            ))}

            {(status === 'submitted' || status === 'streaming') && (
                <div>
                    {status === 'submitted' && <>...loading</>}
                    <button type="button" onClick={() => stop()}>
                        Stop
                    </button>
                </div>
            )}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (input.trim()) {
                        sendMessage({ text: input });
                        setInput('');
                    }
                }}
            >
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={status !== 'ready'}
                    placeholder="Say something..."
                />
                <button type="submit" disabled={status !== 'ready'}>
                    Submit
                </button>
            </form>
        </>
    );
}