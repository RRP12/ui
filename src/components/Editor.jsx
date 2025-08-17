// "use client"

// // import * as langgraph from "@langchain/langgraph"
// import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
// import { WebContainer } from "@webcontainer/api"
// import { Terminal } from "@xterm/xterm"
// import "@xterm/xterm/css/xterm.css"

// import { Resizable } from "re-resizable"
// import { useGetFiles } from "./Context"
// import Folder from "./folder.jsx"
// import CodeMarkDown from "./code"
// import { executeActions, parseBoltXml } from "@/utils/parse"
// import { useSearchParams } from "next/navigation"
// import { FitAddon } from "@xterm/addon-fit"

// import { getSystemPrompt } from "@/constants/systemPrompt"

// import FileExplorer from "./FileExplorer"

// let initialPrompt = `When developing MCP servers with TypeScript, ensure the architecture is robust, maintainable, and follows best practices. The implementation should be production-ready with proper error handling, type safety, and clean separation of concerns.

// Key requirements:
// 1. Use TypeScript's strong typing throughout the codebase
// 2. Implement proper error handling and logging
// 3. Follow the MCP (Model-Controller-Presenter) pattern strictly
// 4. Include input validation and sanitization
// 5. Add comprehensive API documentation
// 6. Implement proper testing (unit, integration)
// 7. Include environment configuration management
// 8. Add proper logging and monitoring
// 9. Ensure security best practices are followed
// 10. Include proper API versioning

// For any UI components (if needed), use a minimal, lightweight approach that doesn't compromise functionality. Focus on clean, maintainable code over unnecessary abstractions.

// The implementation should be scalable and include proper documentation for future maintainability. Include clear interfaces for models, well-defined controller methods, and presenters that handle the response formatting.

// For any required dependencies, prefer well-maintained, production-ready packages with good community support and clear documentation.`

// export default function Editor() {
//   const termRef = useRef(null)
//   const [terminal, setTerminal] = useState(null)

//   const iframeRef = useRef(null)
//   const wcRef = useRef(null)
//   let [steps, setSteps] = useState()
//   const searchParams = useSearchParams()
//   const [selectedFile, setSelectedFile] = useState(null)

//   const handleSelectFile = (file) => {
//     // file.content will be whatever you passed in your `files` prop
//     setSelectedFile(file)
//   }

//   console.log("selectedFile", selectedFile)

//   const question = searchParams.get("question")
//   console.log("question", question)

//   // const load = async () => {
//   //   try {
//   //     const simpleTemplate = `${getSystemPrompt()}\n\n${initialPrompt}\n\n${basePrompt}\n\n${question}`;

//   //     // const prompt = await promptTemplate.invoke({ question: question });

//   //     const chain = promptTemplate.pipe(llm);
//   //     const completion = await chain.invoke({ msgs: [new HumanMessage(question)] });
//   //     console.log("completion", completion);
//   //   } catch (error) {
//   //     console.error("Error in load function:", error);
//   //   }
//   // }

//   // In Editor.jsx
//   const load = async () => {
//     try {
//       // const messages = [
//       //   {
//       //     role: "system",
//       //     content: getSystemPrompt()
//       //   },
//       //   {
//       //     role: "user",
//       //     content: `${initialPrompt}\n\n${basePrompt}`
//       //   },

//       //   {
//       //     role: "user",
//       //     content: `Question: ${question}`
//       //   }
//       // ];
//       const messages = [
//         {
//           role: "system",
//           content: `${getSystemPrompt()}
// ${normalPrompt}
//     `,
//         },
//         {
//           role: "user",
//           content: `Question: ${question} `,
//         },
//       ]
//       const response = await fetch(
//         "https://api.mistral.ai/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ`,
//           },
//           body: JSON.stringify({
//             model: "codestral-latest",
//             messages: messages,
//             temperature: 0.7,
//             max_tokens: 8000,
//             top_p: 0.9,
//             stream: false,
//           }),
//         }
//       )

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.error?.message || "Failed to fetch")
//       }

//       const data = await response.json()
//       const completion = data.choices[0]?.message?.content
//       console.log("Completion:", completion)
//       return completion
//     } catch (error) {
//       console.error("Error in load function:", error)
//       throw error
//     }
//   }

//   const init = async () => {
//     try {
//       const result = await load()
//       setSteps(parseBoltXml(result))
//     } catch (error) {
//       console.error("Error in init function:", error)
//     }
//   }

//   useEffect(() => {
//     init()
//   }, [])

//   async function startShell(terminal) {
//     const shellProcess = await wcRef.current.spawn("jsh")
//     shellProcess.output.pipeTo(
//       new WritableStream({
//         write(data) {
//           terminal.write(data)
//         },
//       })
//     )

//     const input = shellProcess.input.getWriter()
//     terminal.onData((data) => {
//       input.write(data)
//     })

//     return shellProcess
//   }

//   function buildFileTreeFromSteps(steps) {
//     const root = {}

//     steps?.forEach((file) => {
//       const parts = file?.filePath?.split("/") // break into directories
//       let current = root

//       parts?.forEach((part, index) => {
//         const isFile = index === parts.length - 1

//         if (isFile) {
//           current[part] = {
//             file: { contents: file.content ?? "" },
//           }
//         } else {
//           if (!current[part]) {
//             current[part] = { directory: {} }
//           }
//           current = current[part].directory
//         }
//       })
//     })

//     return root
//   }

//   let webcontainerInstance = null // global singleton

//   async function getWebContainer() {
//     console.log("callled once")
//     if (!webcontainerInstance) {
//       webcontainerInstance = await WebContainer.boot()
//     }
//     return webcontainerInstance
//   }

//   // async function initWebContainer(files) {
//   //   console.log("initWebContainer")

//   //   const terminal = new Terminal({
//   //     convertEol: true,
//   //   })
//   //   terminal.open(termRef.current)
//   //   wcRef.current = await getWebContainer() // only boots once

//   //   console.log("booted")
//   //   startShell(terminal)

//   //   await wcRef.current.mount(files)
//   //   console.log("mounted files", files)

//   //   const installProcess = await wcRef.current.spawn('npm', ['install'], {

//   //     cwd: '/',
//   //     env: { NODE_ENV: 'development' }


//   //   });
//   //   installProcess.output.pipeTo(new WritableStream({
//   //     write(data) {
//   //       terminal.write(data); // send to xterm
//   //       console.log("npm install data", data);
//   //     }
//   //   }))
//   //   const installExitCode = await installProcess.exit;
//   //   console.log("npm install exited with code", installExitCode);
//   //   if (installExitCode !== 0) {
//   //     terminal.write(`\r\nError: npm install failed with exit code ${installExitCode}\r\n`);
//   //     return;
//   //   }

//   //   const tsNodeVersionProcess = await wcRef.current.spawn('npx', ['ts-node', '--version']);
//   //   tsNodeVersionProcess.output.pipeTo(new WritableStream({
//   //     write(data) {
//   //       terminal.write(data);
//   //       console.log("ts-node version data", data);
//   //     }
//   //   }));
//   //   await tsNodeVersionProcess.exit;
//   //   console.log("ts-node version check complete");



//   //   const startProcess = await wcRef.current.spawn('npm', ['run', 'start'], {
//   //     cwd: '/',
//   //     env: {
//   //       NODE_ENV: 'development',
//   //       TS_NODE_COMPILER_OPTIONS: JSON.stringify({
//   //         module: 'commonjs',
//   //         moduleResolution: 'node'
//   //       })
//   //     }
//   //   });
//   //   startProcess.output.pipeTo(new WritableStream({
//   //     write(data) {
//   //       terminal.write(data); // send to xterm
//   //       console.log("npm start data", data);
//   //     }
//   //   }))

//   //   wcRef.current.on('server-ready', (_port, url) => {
//   //     console.log("Server ready on url", _port, url)
//   //     if (iframeRef.current) iframeRef.current.src = url;
//   //   });
//   // }

//   async function initWebContainer(files) {
//     console.log("initWebContainer");

//     const terminal = new Terminal({
//       convertEol: true,
//     });
//     terminal.open(termRef.current);
//     wcRef.current = await getWebContainer(); // Boot WebContainer

//     console.log("booted");
//     await startShell(terminal);

//     await wcRef.current.mount(files);
//     console.log("mounted files", files);

//     // Run npm install
//     const installProcess = await wcRef.current.spawn("npm", ["install"], {
//       cwd: "/",
//       env: { NODE_ENV: "development" },
//     });
//     installProcess.output.pipeTo(
//       new WritableStream({
//         write(data) {
//           terminal.write(data);
//           console.log("npm install data", data);
//         },
//       })
//     );
//     const installExitCode = await installProcess.exit;
//     console.log("npm install exited with code", installExitCode);
//     if (installExitCode !== 0) {
//       terminal.write(`\r\nError: npm install failed with exit code ${installExitCode}\r\n`);
//       return;
//     }

//     // Run npm start (which now includes tsc && node dist/index.js)
//     const startProcess = await wcRef.current.spawn("npm", ["run", "start"], {
//       cwd: "/",
//       env: {
//         NODE_ENV: "development",
//       },
//     });
//     startProcess.output.pipeTo(
//       new WritableStream({
//         write(data) {
//           terminal.write(data);
//           console.log("npm start data", data);
//         },
//       })
//     );

//     wcRef.current.on("server-ready", (_port, url) => {
//       console.log("Server ready on url", _port, url);
//       if (iframeRef.current) iframeRef.current.src = url;
//     });
//   }

//   useEffect(() => {
//     if (!steps) return // don't run until steps is ready
//     console.log("wcRef.current", wcRef.current)

//     const webContainerFiles = buildFileTreeFromSteps(steps)
//     // console.log("webContainerFiles", webContainerFiles)

//     initWebContainer(webContainerFiles)
//   }, [steps])

//   // console.log("steps", steps)
//   // useEffect(() => {
//   //   const baseDir = 'bolt.xml'
//   //   console.log("steps action", executeActions(steps || [], baseDir))
//   // }, [steps])
//   // useEffect(() => {
//   //   fetch('http://localhost:3001/test', {
//   //     method: 'POST',
//   //     headers: {
//   //       'Content-Type': 'application/json',
//   //     },
//   //     body: JSON.stringify({ message: question }),
//   //   })
//   //     .then(response => response.json())
//   //     .then(data => {
//   //       setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
//   //       setInput('')
//   //       return data
//   //     }).then(data => {
//   //       sessionStorage.setItem("files", JSON.stringify(data));

//   //       console.log("candidates", data.candidates)
//   //       // setSteps(parseBoltXml(data.candidates[0].parts[0].text));
//   //       // router.push("/builder", { query: { question: input } });
//   //     })
//   //     .catch(error => {
//   //       console.error('Error:', error)
//   //     })
//   // }, [input])

//   return (
//     // <div style={{ display: "flex", height: "100vh" }}>
//     //   <div style={{ overflow: "auto" }}>
//     //     <FileExplorer
//     //       selectedFile={selectedFile}
//     //       setSelectedFile={setSelectedFile}
//     //       files={steps}
//     //       onSelectFile={handleSelectFile}
//     //     />
//     //   </div>
//     //   <div style={{ display: "flex" }}>

//     //     <iframe
//     //       ref={iframeRef}
//     //       src="/loading.html"
//     //       style={{ width: "100%", height: "70%", border: "none" }}
//     //       title="Preview"
//     //     />

//     //     <div style={{ height: "40%" }}>
//     //       {selectedFile?.type === "file" ? (
//     //         <CodeMarkDown
//     //           value={selectedFile.content}
//     //           language={selectedFile.filePath?.split('.').pop()}
//     //           readOnly={false} // or true if you don’t want editing
//     //           onChange={(newValue) => {
//     //             setSelectedFile((prev) => ({
//     //               ...prev,
//     //               content: newValue
//     //             }));
//     //           }}
//     //         />
//     //       ) : (
//     //         <div style={{ padding: "10px", color: "#888" }}>Select a file to view its contents</div>
//     //       )}
//     //     </div>

//     //     <div
//     //       ref={termRef}
//     //       style={{
//     //         width: "100%",
//     //         height: "30%",
//     //         backgroundColor: "#1e1e1e",
//     //         padding: "8px"
//     //       }}
//     //     />

//     //   </div>

//     // </div>

//     <div className="flex h-screen">
//       {/* Left: File Explorer */}
//       <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
//         <FileExplorer
//           selectedFile={selectedFile}
//           setSelectedFile={setSelectedFile}
//           files={steps}
//           onSelectFile={handleSelectFile}
//         />
//       </div>

//       {/* Right: Preview, Editor, Terminal */}
//       <div className="flex flex-col flex-1">
//         {/* Preview */}
//         {/* <div className="flex-1 bg-white border-b border-gray-200">
//           <iframe
//             ref={iframeRef}
//             src="/loading.html"
//             className="w-full h-full"
//             title="Preview"
//           />
//         </div> */}

//         {/* Code Editor */}
//         <div className="flex-1 border-b border-gray-200 bg-white">
//           {selectedFile?.type === "file" ? (

//             <>
//               {console.log("selectedFile before CodeMarkDown:", selectedFile)}
//               <CodeMarkDown
//                 value={selectedFile.content}
//                 language={(() => {
//                   const filePath = selectedFile?.path; // Changed from selectedFile?.filePath
//                   if (!filePath) return 'plaintext'; // Default if no filePath


//                   console.log("filePath", filePath)
//                   const extension = filePath.split('.').pop();
//                   switch (extension) {
//                     case 'ts':
//                     case 'tsx':
//                       return 'typescript';
//                     case 'js':
//                     case 'jsx':
//                       return 'javascript';
//                     case 'json':
//                       return 'json';
//                     case 'css':
//                       return 'css';
//                     case 'html':
//                       return 'html';
//                     case 'xml':
//                       return 'xml';
//                     case 'md':
//                       return 'markdown';
//                     case 'py':
//                       return 'python';
//                     default:
//                       return 'plaintext';
//                   }
//                 })()}
//                 readOnly={false}
//                 onChange={(newValue) => {
//                   setSelectedFile((prev) => ({
//                     ...prev,
//                     content: newValue,
//                   }))
//                 }}
//                 filePath={selectedFile.path}
//               />
//             </>

//           ) : (
//             <div className="p-4 text-gray-500">
//               Select a file to view its contents
//             </div>
//           )}
//         </div>

//         {/* Terminal */}
//         <div
//           ref={termRef}
//           className="flex-1 bg-[#1e1e1e] text-white font-mono p-2 overflow-y-auto"
//         />
//       </div>
//     </div>
//   )
// }


// var normalPrompt = `# Model Context Protocol (MCP) Server Implementation

// ## Objective
// Develop a production - ready MCP server using JavaScript to provide [SERVICE_NAME] functionality.The server must be scalable, maintainable, and follow best practices for code quality, error handling, and documentation, adhering to the MCP(Model - Controller - Presenter) pattern.

// ## Core Requirements

// ### 1. Server Setup
//   - Use @modelcontextprotocol/sdk for MCP server implementation.
//     - Implement in JavaScript(ES Modules) for compatibility with Node.js.
// - Support environment - based configuration using.env files(via dotenv).
// - Ensure clear separation of concerns with well - defined models, controllers, and presenters.

// ### 2. Tools
//   - Implement at least one tool: [Tool Name]
//     - Description: [One - line description of the tool's purpose]
//       - Input Parameters: Define using Zod schema for validation.
//   - Output Format: JSON object with content array(e.g., { content: [{ type: 'text', text: string }] }).
// - Example Tool:
// - Name: greet
//   - Description: Returns a greeting message for a given name.
//   - Input: { name: string }
// - Output: { content: [{ type: 'text', text: string }] }

// ### 3. API Integration
//   - Base URL: [API_URL](use "N/A" for local - only servers).
// - Authentication: Use[Method](e.g., API key, OAuth, or none).
// - Error Handling: Implement try-catch blocks with custom error types and meaningful messages.
// - Request Validation: Use Zod for input validation.
// - Logging: Use winston or pino for request, response, and error logging.

// ### 4. Code Quality
//   - Input Validation: Validate all inputs using Zod.
// - Error Handling: Handle errors with try-catch blocks and custom error classes.
// - Logging: Log server startup, requests, responses, and errors.
// - Documentation: Provide JSDoc comments for all functions and a README.md with setup and usage instructions.
// - Security: Sanitize inputs and secure API keys.
// - API Versioning: Implement versioning for API endpoints.

// ### 5. Technical Requirements
//   - Node.js Version: >= 18.x
//     - Dependencies:
// - @modelcontextprotocol / sdk: Latest version
//   - zod: For input validation
//     - dotenv: For environment variables
//       - winston: For logging
//         - Environment Variables:
// - PORT: Server port(default: 8080)
//   - NODE_ENV: Environment(e.g., development, production)
//     - JavaScript Configuration:
// - Use ES Modules(type: "module" in package.json).

// ### 6. Deliverables
//   - Complete JavaScript source code.
// - API documentation(JSDoc).
// - Example usage code.
// - README.md with setup instructions and environment variable details.
// - Bolt XML output format for file generation.

// ## Example Implementation
// Below is a minimal MCP server with a "greet" tool from the official MCP JavaScript SDK documentation, formatted as Bolt XML for file generation:

// \`\`\`xml
// <boltArtifact id="mcp-greet-server" title="Simple MCP Server">
//   <boltAction type="file" filePath="package.json">
// {
//   "name": "mcp-greet-server",
//   "version": "1.0.0",
//   "type": "module",
//   "scripts": {
//     "start": "node src/index.js"
//   },
//   "dependencies": {
//     "@modelcontextprotocol/sdk": "latest",
//     "zod": "^3.22.4",
//     "winston": "^3.10.0",
//     "dotenv": "^16.3.1"
//   }
// }
//   </boltAction>
//   <boltAction type="file" filePath="src/index.js">
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// import { z } from 'zod';
// import { createLogger, format, transports } from 'winston';
// import dotenv from 'dotenv';

// /** Custom error for MCP server issues */
// class McpError extends Error {
//   constructor(message) {
//     super(message);
//     this.name = 'McpError';
//   }
// }

// /** Logger configuration */
// const logger = createLogger({
//   level: 'info',
//   format: format.combine(format.timestamp(), format.json()),
//   transports: [new transports.Console()]
// });

// /** Input schema for greet tool */
// const GreetInputSchema = z.object({
//   name: z.string().min(1, 'Name is required').transform((val) => val.trim())
// });

// /**
//  * Initialize and start the MCP server
//  * @throws {McpError} If server fails to start
//  */
// async function startServer() {
//   dotenv.config();

//   const server = new McpServer({
//     name: 'greet-server',
//     version: '1.0.0'
//   });

//   server.registerTool(
//     'greet',
//     {
//       title: 'Greeting Tool',
//       description: 'Generate a greeting',
//       inputSchema: {
//         name: z.string().min(1, 'Name is required').transform((val) => val.trim())
//       }
//     },
//     async ({ name }) => {
//       logger.info('Processing greet tool request', { name });
//       try {
//         return {
//           content: [{ type: 'text', text: \`Hello, \${name}!\` }]
//         };
//       } catch (error) {
//         logger.error('Error in greet tool', { error });
//         throw new McpError('Failed to process greeting');
//       }
//     }
//   );

//   try {
//     const transport = new StdioServerTransport();
//     await server.connect(transport);
//     const port = process.env.PORT || 8080;
//     logger.info('Server started', { port });
//   } catch (error) {
//     logger.error('Server startup failed', { error });
//     throw new McpError('Failed to start server');
//   }
// }

// startServer().catch((error) => {
//   logger.error('Server initialization failed', { error });
//   process.exit(1);
// });
//   </boltAction>
//   <boltAction type="file" filePath="README.md">
// # MCP Greet Server

// A simple MCP server with a "greet" tool that returns a greeting message.

// ## Setup
// 1. Install Node.js (>= 18.x).
// 2. Run \`npm install\` to install dependencies.
// 3. Create a \`.env\` file with:
//    \`\`\`
//    PORT=8080
//    NODE_ENV=development
//    \`\`\`
// 4. Start the server with \`npm start\`.

// ## Usage
// Interact with the server using an MCP client or tool call:
// \`\`\`bash
// curl -X POST http://localhost:8080 -d '{"tool": "greet", "input": {"name": "Alice"}}'
// \`\`\`
// Expected response:
// \`\`\`json
// {"content": [{"type": "text", "text": "Hello, Alice!"}]}
// \`\`\`
//   </boltAction>
//   <boltAction type="shell">
// npm install
//   </boltAction>
//   <boltAction type="shell">
// npm start
//   </boltAction>
// </boltArtifact>
// \`\`\`

// ## Instructions for the Model
// - Replace placeholders (e.g., [SERVICE_NAME], [Tool Name], [API_URL]) with values based on the user's question.
// - Tailor the implementation to the specified tool or service while following the structure above.
// - Provide complete, executable JavaScript code with error handling, logging, and documentation in Bolt XML format.
// - Exclude any testing-related components (e.g., Jest, test files, testing instructions).
// - Include a brief explanation of the code structure and decisions.
// - Keep the response concise but comprehensive.
// - If the user query is vague, make reasonable assumptions and document them.
// `;



"use client"

import React, { useEffect, useRef, useState } from "react"
import { WebContainer } from "@webcontainer/api"
import { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import { Resizable } from "re-resizable"
import { useGetFiles } from "./Context"
import Folder from "./folder.jsx"
import CodeMarkDown from "./code"
import { executeActions, parseBoltXml } from "@/utils/parse"
import { useSearchParams } from "next/navigation"
import { FitAddon } from "@xterm/addon-fit"
// import { getSystemPrompt } from "@/utils/getSystemPrompt"
import FileExplorer from "./FileExplorer"
import { getSystemPrompt } from "../constants/systemPrompt"
import InsideChat from "./insideChat"

let initialPrompt = `When developing MCP servers with JavaScript, ensure the architecture is robust, maintainable, and follows best practices.The implementation should be production - ready with proper error handling and clean separation of concerns.

Key requirements:
1. Use JavaScript with ES Modules
2. Implement proper error handling and logging
3. Follow the MCP(Model - Controller - Presenter) pattern strictly
4. Include input validation and sanitization
5. Add comprehensive API documentation
6. Include environment configuration management
7. Add proper logging and monitoring
8. Ensure security best practices are followed
9. Include proper API versioning

For any UI components(if needed), use a minimal, lightweight approach that doesn't compromise functionality. Focus on clean, maintainable code over unnecessary abstractions.

The implementation should be scalable and include proper documentation for future maintainability.Include clear interfaces for models, well - defined controller methods, and presenters that handle the response formatting.

For any required dependencies, prefer well - maintained, production - ready packages with good community support and clear documentation.`

export default function Editor() {
  const termRef = useRef(null)
  const [terminal, setTerminal] = useState(null)
  const iframeRef = useRef(null)
  const wcRef = useRef(null)
  let [steps, setSteps] = useState()
  const searchParams = useSearchParams()
  const [selectedFile, setSelectedFile] = useState(null)
  const [serverUrl, setServerUrl] = useState(null) // New state for server URL

  const handleSelectFile = (file) => {
    setSelectedFile(file)
  }

  console.log("selectedFile", selectedFile)

  const question = searchParams.get("question")
  console.log("question", question)

  const load = async () => {
    try {
      const messages = [
        {
          role: "system",
          content: `${getSystemPrompt()} \n\n${initialPrompt} \n\n${question} `,
        },
        {
          role: "user",
          content: `Question: ${question} `,
        },
      ]
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ`,
          },
          body: JSON.stringify({
            model: "codestral-latest",
            messages: messages,
            temperature: 0.7,
            max_tokens: 8000,
            top_p: 0.9,
            stream: false,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to fetch")
      }

      const data = await response.json()
      const completion = data.choices[0]?.message?.content
      console.log("Completion:", completion)
      return completion
    } catch (error) {
      console.error("Error in load function:", error)
      throw error
    }
  }

  const init = async () => {
    try {
      const result = await load()
      setSteps(parseBoltXml(result))
    } catch (error) {
      console.error("Error in init function:", error)
    }
  }

  useEffect(() => {
    init()
  }, [])

  async function startShell(terminal) {
    const shellProcess = await wcRef.current.spawn("jsh")
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
        },
      })
    )

    const input = shellProcess.input.getWriter()
    terminal.onData((data) => {
      input.write(data)
    })

    return shellProcess
  }

  function buildFileTreeFromSteps(steps) {
    const root = {}

    steps?.forEach((file) => {
      const parts = file?.filePath?.split("/") // break into directories
      let current = root

      parts?.forEach((part, index) => {
        const isFile = index === parts.length - 1

        if (isFile) {
          current[part] = {
            file: { contents: file.content ?? "" },
          }
        } else {
          if (!current[part]) {
            current[part] = { directory: {} }
          }
          current = current[part].directory
        }
      })
    })

    return root
  }

  let webcontainerInstance = null // global singleton

  async function getWebContainer() {
    console.log("called once")
    if (!webcontainerInstance) {
      webcontainerInstance = await WebContainer.boot()
    }
    return webcontainerInstance
  }

  async function initWebContainer(files) {
    console.log("initWebContainer")

    const terminal = new Terminal({
      convertEol: true,
    })
    terminal.open(termRef.current)
    wcRef.current = await getWebContainer()

    console.log("booted")
    await startShell(terminal)

    await wcRef.current.mount(files)
    console.log("mounted files", files)

    const installProcess = await wcRef.current.spawn("npm", ["install"], {
      cwd: "/",
      env: { NODE_ENV: "development" },
    })
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
          console.log("npm install data", data)
        },
      })
    )
    const installExitCode = await installProcess.exit
    console.log("npm install exited with code", installExitCode)
    if (installExitCode !== 0) {
      terminal.write(`\r\nError: npm install failed with exit code ${installExitCode} \r\n`)
      return
    }

    const startProcess = await wcRef.current.spawn("npm", ["run", "start"], {
      cwd: "/",
      env: { NODE_ENV: "development" },
    })
    startProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
          console.log("npm start data", data)
        },
      })
    )

    wcRef.current.on("server-ready", (_port, url) => {
      console.log("Server ready on url", _port, url)
      terminal.write(`\r\nServer is running at: ${url} \r\n`) // Display URL in terminal
      setServerUrl(url) // Store URL in state for UI display
      if (iframeRef.current) iframeRef.current.src = url
    })
  }

  useEffect(() => {
    if (!steps) return
    console.log("wcRef.current", wcRef.current)

    const webContainerFiles = buildFileTreeFromSteps(steps)
    initWebContainer(webContainerFiles)
  }, [steps])

  return (
    <div className="flex h-screen">
      {/* Left: File Explorer */}
      <div style={{ display: "flex", flexDirection: "column" }} className="w-[50%] h-full border-r border-white-200 overflow-y-auto bg-gray-50">
        <div>
          <FileExplorer
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            files={steps}
            onSelectFile={handleSelectFile}
          />
        </div>


        <div style={{ flex: 1, border: "1px solid red", color: "cadetblue" }}>
          <InsideChat />
        </div>

      </div>

      {/* Right: Preview, Editor, Terminal */}
      <div className="flex flex-col flex-1">
        {/* Server URL Display */}
        {serverUrl && (
          <div className="p-2 bg-blue-100 text-blue-800">
            Server URL: <a href={serverUrl} target="_blank" className="underline">{serverUrl}</a>
            <br />

          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 border-b border-gray-200 bg-white">
          {selectedFile?.type === "file" ? (
            <>
              {console.log("selectedFile before CodeMarkDown:", selectedFile)}
              <CodeMarkDown
                value={selectedFile.content}
                language={(() => {
                  const filePath = selectedFile?.path
                  if (!filePath) return 'plaintext'
                  console.log("filePath", filePath)
                  const extension = filePath.split('.').pop()
                  switch (extension) {
                    case 'js':
                      return 'javascript'
                    case 'json':
                      return 'json'
                    case 'css':
                      return 'css'
                    case 'html':
                      return 'html'
                    case 'xml':
                      return 'xml'
                    case 'md':
                      return 'markdown'
                    case 'py':
                      return 'python'
                    default:
                      return 'plaintext'
                  }
                })()}
                readOnly={false}
                onChange={(newValue) => {
                  setSelectedFile((prev) => ({
                    ...prev,
                    content: newValue,
                  }))
                }}
                filePath={selectedFile.path}
              />
            </>
          ) : (
            <div className="p-4 text-gray-500">
              Select a file to view its contents
            </div>
          )}
        </div>

        {/* Terminal */}
        <div
          ref={termRef}
          className="flex-1 bg-[#1e1e1e] text-white font-mono p-2 overflow-y-auto"
        />
      </div>
    </div>
  )
}
