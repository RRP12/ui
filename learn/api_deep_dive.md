
# Vercel AI SDK: Deep Dive into `useChat` and `streamText`

This document provides an in-depth explanation and structured visualization of two core components of the Vercel AI SDK, based directly on the TypeScript definition files (`.d.ts`) found in your `node_modules`.

---

## 1. Frontend: The `useChat` Hook (`@ai-sdk/react/dist/index.d.ts`)

The `useChat` hook is the primary tool for building conversational AI interfaces in React applications. It abstracts away much of the complexity of state management, API communication, and streaming responses.

### Purpose

Simplifies the process of streaming chat messages, managing the chat state (messages, input), and updating the UI as new messages are received from an AI model.

### Import

```typescript
import { useChat } from 'ai/react'; // Maps to @ai-sdk/react
```

### Parameters (`UseChatOptions<UI_MESSAGE>`)

The `useChat` hook accepts an optional object to configure its behavior. Key parameters, as defined in `UseChatOptions`:

-   **`chat`** (`Chat<UI_MESSAGE>`, optional)
    -   An existing `Chat` instance to use. If not provided, a new one is created.
-   **`experimental_throttle`** (`number`, optional)
    -   Custom throttle wait in milliseconds for the chat messages and data updates. Default is `undefined` (no throttling).
-   **`resume`** (`boolean`, optional)
    -   Whether to resume an ongoing chat generation stream.

### Return Values (`UseChatHelpers<UI_MESSAGE>`)

The `useChat` hook returns an object containing various state variables and functions to manage the chat interface. Key return values, as defined in `UseChatHelpers`:

-   **`id`** (`string`)
    -   The ID of the chat.
-   **`setMessages`** (`(messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[])) => void`)
    -   Update the `messages` state locally.
-   **`error`** (`Error | undefined`)
    -   The error object of the API request.
-   **`sendMessage`** (`(message: UI_MESSAGE) => Promise<void>`)
    -   Sends a new message to the API endpoint.
-   **`regenerate`** (`() => Promise<void>`)
    -   Regenerates the AI response.
-   **`stop`** (`() => void`)
    -   Aborts the current API request but keeps the generated tokens.
-   **`resumeStream`** (`() => void`)
    -   Resumes an ongoing chat generation stream.
-   **`addToolResult`** (`(toolResult: ToolResult) => void`)
    -   Adds a tool result.
-   **`status`** (`'initial' | 'loading' | 'streaming' | 'awaiting_tool_call' | 'awaiting_tool_result' | 'done' | 'error'`)
    -   The current status of the chat.
-   **`messages`** (`Array<UI_MESSAGE>`)
    -   The current array of chat messages.
-   **`clearError`** (`() => void`)
    -   Clears the error state.
-   **`completion`** (`string`)
    -   The current completion result (also part of `UseCompletionHelpers`).
-   **`complete`** (`(prompt: string, options?: CompletionRequestOptions) => Promise<string | null | undefined>`)
    -   Sends a new prompt and updates the completion state (also part of `UseCompletionHelpers`).
-   **`setCompletion`** (`(completion: string) => void`)
    -   Updates the `completion` state locally (also part of `UseCompletionHelpers`).
-   **`input`** (`string`)
    -   The current value of the input.
-   **`setInput`** (`React.Dispatch<React.SetStateAction<string>>`)
    -   `setState`-powered method to update the input value.
-   **`handleInputChange`** (`(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void`)
    -   An input/textarea-ready `onChange` handler.
-   **`handleSubmit`** (`(event?: { preventDefault?: () => void; }) => void`)
    -   Form submission handler.
-   **`isLoading`** (`boolean`)
    -   Whether the API request is in progress.

### Data Flow Visualization (Frontend)

```mermaid
graph TD
    A[User Types Input] --> B{handleInputChange}
    B --> C[Input State Updated]
    C --> D[User Submits Form] --&gt; E{handleSubmit}
    E --&gt; F[sendMessage (internal)]
    F --&gt; G[POST Request to API Endpoint (e.g., /api/chat)]
    G --&gt; H[Backend API (streamText)]
    H --&gt; I[Streaming Response Chunks]
    I --&gt; J[messages State Updated Incrementally]
    J --&gt; K[UI Renders New Messages]
```

---

## 2. Backend: The `streamText` Function (`ai/dist/index.d.ts`)

The `streamText` function is a powerful utility for interacting with AI models and generating streaming text responses. It's part of the core `ai` package and is model-agnostic.

### Purpose

Facilitates sending messages to an AI model and receiving its response as a stream, which can then be easily converted into a web-compatible streaming response.

### Import

```typescript
import { streamText } from 'ai';
// Also import your specific model provider, e.g.,
import { Mistral } from '@ai-sdk/mistral';
```

### Parameters (Options Object for `streamText<TOOLS, OUTPUT, PARTIAL_OUTPUT>`)

The `streamText` function takes an object with configuration options, as defined in its declaration:

-   **`model`** (`LanguageModel`, required)
    -   The language model to use (e.g., `mistral('mistral-large-latest')`).
-   **`messages`** (`Array<ModelMessage>`, required)
    -   A list of messages representing the conversation history.
-   **`system`** (`string`, optional)
    -   A system message that will be part of the prompt.
-   **`prompt`** (`string | Array<ModelMessage>`, optional)
    -   A simple text prompt or a list of messages. Use either `prompt` or `messages`, not both.
-   **`tools`** (`TOOLS`, optional)
    -   Tools that the model can call.
-   **`toolChoice`** (`ToolChoice<TOOLS>`, optional, default: `'auto'`)
    -   The tool choice strategy.
-   **`maxOutputTokens`** (`number`, optional)
    -   Maximum number of tokens to generate.
-   **`temperature`** (`number`, optional)
    -   Controls the randomness of the output.
-   **`topP`** (`number`, optional)
    -   Nucleus sampling.
-   **`maxRetries`** (`number`, optional, default: `2`)
    -   Maximum number of retries for the API call.
-   **`abortSignal`** (`AbortSignal`, optional)
    -   An optional abort signal to cancel the call.
-   **`headers`** (`Record<string, string>`, optional)
    -   Additional HTTP headers to be sent with the request.
-   **`onChunk`** (`StreamTextOnChunkCallback<TOOLS>`, optional)
    -   Callback that is called for each chunk of the stream.
-   **`onError`** (`StreamTextOnErrorCallback`, optional)
    -   Callback that is invoked when an error occurs during streaming.
-   **`onFinish`** (`StreamTextOnFinishCallback<TOOLS>`, optional)
    -   Callback that is called when the LLM response and all request tool executions are finished.
-   **`onAbort`** (`StreamTextOnAbortCallback<TOOLS>`, optional)
    -   Callback that is called when the stream is aborted.
-   **`onStepFinish`** (`StreamTextOnStepFinishCallback<TOOLS>`, optional)
    -   Callback that is called when each step (LLM call) is finished.

### Return Value (`StreamTextResult<TOOLS, PARTIAL_OUTPUT>`)

`streamText` returns a `Promise` that resolves to a `StreamTextResult` object. Key properties and methods, as defined in `StreamTextResult`:

-   **`content`** (`Promise<Array<ContentPart<TOOLS>>>`)
    -   The full content generated (consumes the stream).
-   **`text`** (`Promise<string>`)
    -   The full generated text (consumes the stream).
-   **`toolCalls`** (`Promise<TypedToolCall<TOOLS>[]>`)
    -   The tool calls made during generation (consumes the stream).
-   **`usage`** (`Promise<LanguageModelUsage>`)
    -   Token usage of the last step (consumes the stream).
-   **`totalUsage`** (`Promise<LanguageModelUsage>`)
    -   Total token usage across all steps (consumes the stream).
-   **`textStream`** (`AsyncIterableStream<string>`)
    -   A stream that returns only the generated text deltas.
-   **`fullStream`** (`AsyncIterableStream<TextStreamPart<TOOLS>>`)
    -   A stream with all events (text deltas, tool calls, errors).
-   **`toAIStreamResponse()`** (`() => Response`)
    -   Converts the result to a `Response` object suitable for web frameworks.
-   **`toUIMessageStream()`** (`(options?: UIMessageStreamOptions<UI_MESSAGE>) => AsyncIterableStream<InferUIMessageChunk<UI_MESSAGE>>`)
    -   Converts the result to a UI message stream.
-   **`pipeUIMessageStreamToResponse()`** (`(response: ServerResponse, options?: UIMessageStreamResponseInit & UIMessageStreamOptions<UI_MESSAGE>) => void`)
    -   Writes UI message stream output to a Node.js response-like object.

### Data Flow Visualization (Backend)

```mermaid
graph TD
    A[POST Request from Frontend] --> B{Route Handler}
    B --> C[Extract Messages]
    C --> D{streamText(model, messages)}
    D --> E[AI Model API Call (e.g., Mistral)]
    E --> F[Streaming Response from AI]
    F --> G{StreamTextResult.toAIStreamResponse()}
    G --> H[StreamingTextResponse to Frontend]
```

---

## 3. Mistral Model Provider (`@ai-sdk/mistral/dist/index.d.ts`)

The `@ai-sdk/mistral` package provides the necessary integration to use Mistral AI models with the Vercel AI SDK.

### Import

```typescript
import { Mistral, createMistral } from '@ai-sdk/mistral';
```

### `createMistral(options?: MistralProviderSettings)`

Creates a Mistral AI provider instance.

-   **`options`** (`MistralProviderSettings`, optional)
    -   **`baseURL`** (`string`, optional)
        -   Use a different URL prefix for API calls (default: `https://api.mistral.ai/v1`).
    -   **`apiKey`** (`string`, optional)
        -   API key (defaults to `MISTRAL_API_KEY` environment variable).
    -   **`headers`** (`Record<string, string>`, optional)
        -   Custom headers to include in requests.
    -   **`fetch`** (`FetchFunction`, optional)
        -   Custom fetch implementation.
    -   **`generateId`** (`() => string`, optional)
        -   Custom ID generator.

### `mistral` (Default Instance)

`declare const mistral: MistralProvider;`

A default Mistral provider instance is exported, allowing direct use without calling `createMistral` if default settings are sufficient.

### Model IDs (`MistralChatModelId`, `MistralEmbeddingModelId`)

Examples of chat model IDs:
-   `'mistral-large-latest'`
-   `'mistral-medium-latest'`
-   `'mistral-small-latest'`
-   `'open-mistral-7b'`
-   `'open-mixtral-8x7b'`

Example embedding model ID:
-   `'mistral-embed'`

---

## 4. Message Structure (Common)

Both `useChat` and `streamText` (and other core AI SDK functions) operate on a common `Message` object structure. This consistency ensures seamless data flow between frontend and backend.

```typescript
interface Message {
  id: string; // Unique identifier for the message
  role: 'user' | 'assistant' | 'system' | 'tool'; // Role of the sender
  content: string; // The text content of the message
  // Optional properties for advanced use cases:
  // data?: Record<string, any>; // Arbitrary data associated with the message
  // ui?: string; // Custom UI for the message (e.g., for tool outputs)
}
```

This structured approach, directly reflected in the library's type definitions, allows the Vercel AI SDK to provide a robust and flexible framework for building AI-powered chat applications.
