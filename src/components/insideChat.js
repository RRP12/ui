
'use client';


import { createMistral } from '@ai-sdk/mistral';
import { experimental_useObject, useChat, useCompletion } from '@ai-sdk/react';
import { convertToModelMessages, DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useState } from 'react';
import { Actions, Action } from '@/components/ai-elements/actions';
import { CopyIcon, GlobeIcon, MicIcon, RefreshCcwIcon, ThumbsUpIcon } from 'lucide-react';
import { Loader } from '@/components/ai-elements/loader';
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
import { Response } from '@/components/ai-elements/response';
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
    PromptInput,
    PromptInputButton,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Conversation, ConversationContent, ConversationScrollButton } from './ai-elements/conversation';
import useRenderTracker from '@/hooks/useRenderTracker';
const mistral = createMistral({

    apiKey: 'cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ',

});

export default function InsideChat({ mountedFiles }) {




    const [currentFiles, setCurrentFiles] = useState(null);

    // Update local state when mountedFiles prop changes
    useEffect(() => {
        if (mountedFiles) {
            setCurrentFiles(mountedFiles);
            console.log('Mounted files updated:', mountedFiles);
        }
    }, [mountedFiles]);

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    });


    console.log("messages", messages);


    useEffect(() => {
        console.log("rendering agin");


    })


    const [input, setInput] = useState('');
    const [text, setText] = useState('');


    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!text.trim()) return;

        sendMessage(
            { text: text },
            {
                body: {
                    question: text,
                    currentFiles: currentFiles,
                },
            }
        );
        setInput('');
        setText('');
    }, [text, currentFiles, sendMessage]);


    // const handleSubmit = (e) => {
    //     console.log("calledme");
    //     fetch('http://localhost:3001/api/chat', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             text: text,
    //             currentFiles: currentFiles,
    //         }),
    //     })
    //         .then((response) => response.json())
    //         .then((data) => {
    //             console.log("datagot", data.toUIMessageStreamResponse());
    //         })
    //         .catch((error) => {
    //             console.error('Error:', error);
    //         });
    // };











    return (
        <div className="w-full mx-auto p-6 relative size-full rounded-lg border h-[600px]">
            <div className="flex flex-col h-full">
                <Conversation>
                    <ConversationContent>

                        {messages.map((message) => (
                            <Message from={message.role} key={message.id}>
                                <MessageContent>
                                    {message.parts.map((part, i) => {
                                        switch (part.type) {
                                            case 'text':
                                                return (
                                                    <Response key={`${message.id}-${i}`}>
                                                        {part.text}
                                                    </Response>
                                                );
                                            default:
                                                return null;
                                        }
                                    })}
                                </MessageContent>
                                {status === 'submitted' && <Loader />}
                            </Message>
                        ))}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                <PromptInput onSubmit={handleSubmit} className="mt-4">
                    <PromptInputTextarea
                        onChange={(e) => setText(e.target.value)}
                        value={text}
                    />
                    <PromptInputToolbar>
                        <PromptInputTools>
                            <PromptInputButton>
                                <MicIcon size={16} />
                            </PromptInputButton>
                            <PromptInputButton>
                                <GlobeIcon size={16} />
                                <span>Search</span>
                            </PromptInputButton>

                        </PromptInputTools>
                        <PromptInputSubmit disabled={!text} status={status} />
                    </PromptInputToolbar>
                </PromptInput>
            </div>
        </div>

    );




}






