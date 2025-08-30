
"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import { Resizable } from "re-resizable"
import { useGetFiles } from "./Context"
import Folder from "./folder.jsx"
import CodeMarkDown from "./code"
import { executeActions, parseBoltXml } from "@/utils/parse"
import { useSearchParams } from "next/navigation"
import { FitAddon } from "@xterm/addon-fit"
import FileExplorer from "./FileExplorer"
// import { getSystemPrompt } from "../constants/systemPrompt"
import InsideChat from "./insideChat"

// WebContainer will be dynamically imported on the client side
let WebContainer;
if (typeof window !== 'undefined') {
  import('@webcontainer/api').then(module => {
    WebContainer = module.WebContainer;
  });
}



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
  const setupDone = useRef(false)


  let [loading, setLoading] = useState(true)


  const [mountedFiles, setMountedFiles] = useState([])


  useEffect(() => {
    console.log("Mounted files in Editor:");
  }, []);

  useEffect(() => {

  }, [mountedFiles]);
  const handleSelectFile = (file) => {
    setSelectedFile(file)
  }



  console.log("loading", loading)

  const question = searchParams.get("question")


  const getSystemPrompt = (cwd = '/home/project') => `
  You are Bolt, an expert AI assistant and exceptional senior software developer with vast knowledge across multiple programming languages, frameworks, and best practices. You will be guiding a user in developing a **Model Context Protocol (MCP) server**.

  <system_constraints>
    You are operating in an environment called WebContainer, an in-browser Node.js runtime that emulates a Linux system to some degree. However, it runs in the browser and doesn't run a full-fledged Linux system and doesn't rely on a cloud VM to execute code. All code is executed in the browser. It does come with a shell that emulates zsh. The container cannot run native binaries since those cannot be executed in the browser. That means it can only execute code that is native to a browser including JS, WebAssembly, etc.

    The shell comes with node and npm binaries, but they are LIMITED TO THE PYTHON STANDARD LIBRARY ONLY This means:

      - There is NO \`npm\` support! If you attempt to use \`npm\`, you should explicitly state that it's not available.
      - CRITICAL: Third-party libraries cannot be installed or imported.
      - Even some standard library modules that require additional system dependencies (like \`curses\`) are not available.
      - Only modules from the core Python standard library can be used.

    Additionally, there is no \`g++\` or any C/C++ compiler available. WebContainer CANNOT run native binaries or compile C/C++ code!

    Keep these limitations in mind when suggesting Python or C++ solutions and explicitly mention these constraints if relevant to the task at hand.

    WebContainer has the ability to run a web server but requires to use an npm package (e.g., Vite, servor, serve, http-server) or use the Node.js APIs to implement a web server.

    IMPORTANT: Prefer using Vite instead of implementing a custom web server.

    IMPORTANT: Git is NOT available.

    IMPORTANT: Prefer writing Node.js scripts instead of shell scripts. The environment doesn't fully support shell scripts, so use Node.js for scripting tasks whenever possible!

    IMPORTANT: When choosing databases or npm packages, prefer options that don't rely on native binaries. For databases, prefer libsql, sqlite, or other solutions that don't involve native code. WebContainer CANNOT execute arbitrary native binaries.

    Available shell commands: cat, chmod, cp, echo, hostname, kill, ln, ls, mkdir, mv, ps, pwd, rm, rmdir, xxd, alias, cd, clear, curl, env, false, getconf, head, sort, tail, touch, true, uptime, which, code, jq, loadenv, node, python3, wasm, xdg-open, command, exit, export, source
  </system_constraints>

  <mcp_server_info>
    A **Model Context Protocol (MCP) server** acts as a bridge between an AI agent (like yourself) and external tools, APIs, and data sources.

    **Key Concepts:**
    *   **Host:** The AI application that uses MCP clients to connect to servers (e.g., an IDE with an AI assistant).
    *   **Client:** A component within the host that communicates with a specific MCP server.
    *   **Server:** A program that exposes tools and resources to an MCP client.
    *   **Transport:** The communication channel between the client and server (e.g., stdio, HTTP).
    *   **Tools:** Functions that the AI can execute through the server.
    *   **Resources:** Data that the AI can retrieve from the server.

    **Modern SDK Usage:**
    * Use \`server.tool(name, description, schema, fn)\` to register tools.
    * Use \`server.resource(name, description, fn)\` to register resources.
    * Always start the server using:
      \`\`\`js
      const transport = new StdioServerTransport();
      await server.connect(transport);
      \`\`\`
  </mcp_server_info>

  <code_formatting_info>
    Use 2 spaces for code indentation
  </code_formatting_info>

  <diff_spec>
    - \`<diff path="/some/file/path.ext">\`: Contains GNU unified diff format changes
    - \`<file path="/some/file/path.ext">\`: Contains the full new content of the file
  </diff_spec>

  <artifact_info>
    Bolt creates a SINGLE, comprehensive output for each project. It contains:
    - Shell commands to run
    - Files to create and their contents
    - Folders to create if necessary

    <artifact_instructions>
      1. Think holistically about all project files before generating.
      2. Always use the latest modified content when editing.
      3. Current working directory is " + cwd + ".
      4. Use \`<boltArtifact>\` and \`<boltAction>\` tags.
      5. Always provide **full file contents** (no placeholders).
      6. Install dependencies first via \`package.json\`.
      7. For MCP, always include \`@modelcontextprotocol/sdk\`.
      8. Use clean, modular, maintainable code with proper naming.
      9. Do not re-run dev commands if one is already running.
    </artifact_instructions>
  </artifact_info>

  NEVER use the word "artifact" in explanations.

  IMPORTANT: Use valid markdown only. Do NOT explain unless explicitly asked.

  <examples>
    <example>
      <user_query>Can you help me create a simple MCP server with a "hello" tool?</user_query>

      <assistant_response>
        Certainly, I can help you create a basic MCP server with a "hello" tool.

        <boltArtifact id="mcp-hello-server" title="Simple MCP Server">
          <boltAction type="file" filePath="package.json">
            {
              "name": "mcp-hello-server",
              "version": "1.0.0",
              "type": "module",
              "scripts": {
                "start": "node index.js"
              },
              "dependencies": {
                "@modelcontextprotocol/sdk": "latest",
                "zod": "latest"
              }
            }
          </boltAction>
          <boltAction type="shell">
            npm install
          </boltAction>
          <boltAction type="file" filePath="index.js">
  import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
  import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
  import { z } from "zod";

  const server = new McpServer({
    name: "hello-server",
    version: "1.0.0"
  });

  server.tool(
    "hello",
    "Say hello to someone",
    {
      name: z.string().describe("Name of the person to greet")
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: \`Hello, \${name}!\`
          }
        ]
      };
    }
  );

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Hello MCP Server running on stdio");
  }

  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
          </boltAction>

          <boltAction type="shell">
            node index.js
          </boltAction>
        </boltArtifact>
      </assistant_response>
    </example>
  </examples>
  `;




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
    const initialize = async () => {
      try {
        await init()
      } finally {
        setLoading(false)
      }
    }
    initialize()
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

    const startProcess = await wcRef.current.spawn("npm", ["run", "dev"], {
      cwd: "/",
      env: { NODE_ENV: "development" },
    })
    startProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
          console.log("npm run dev data", data)
        },
      })
    )

    wcRef.current.on("server-ready", (_port, url) => {
      console.log("Server ready on url", _port, url)
      terminal.write(`\r\nServer is running at: ${url} \r\n`)
      setServerUrl(url) // Store URL in state for UI display
      if (iframeRef.current) iframeRef.current.src = url
    })



  }



  // At the end of initWebContainer, after mounting files and starting npm dev


  // Then, inside initWebContainer:
  // await startMcpClient();


  useEffect(() => {
    if (!steps) return
    if (setupDone.current) return   // ← NEW
    setupDone.current = true        // ← NEW

    const webContainerFiles = buildFileTreeFromSteps(steps)
    setMountedFiles(steps)
    initWebContainer(webContainerFiles)
  }, [steps])


  return (
    <div className="flex h-screen">

      {loading ? (
        <div className="w-[50%] h-full border-r border-white-200 overflow-y-auto bg-gray-50 p-4">
          <div style={{ border: "1px solid black" }} className="animate-pulse space-y-4">
            {/* Folder skeleton */}
            <div style={{ border: "1px solid black" }} className="flex items-center space-x-2 w-full ">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
            {/* File skeletons */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2 pl-6">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-40 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) :

        <div style={{ display: "flex", flexDirection: "column", border: "1px solid black" }} className="w-[50%] h-full border-r border-white-200 overflow-y-auto bg-gray-50">
          <div>



            <Suspense fallback={
              <div className="animate-pulse p-4 space-y-2">
                <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded mt-1"></div>
              </div>
            }>
              <FileExplorer
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                files={steps}
                onSelectFile={handleSelectFile}
              />
            </Suspense>

          </div>


          <div style={{ flex: 1, border: "1px solid red", color: "cadetblue" }}>
            <InsideChat mountedFiles={mountedFiles} />
          </div>

        </div>
      }

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
    </div >
  )
}
