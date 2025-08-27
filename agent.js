import { StateGraph, END } from "@langchain/langgraph"
import { z } from "zod"
import fs from "node:fs/promises"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage } from "@langchain/core/messages"
import { writeFileSync } from "node:fs"

// Load environment variables
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize Mistral client
const mistralModel = new ChatMistralAI({
  apiKey: "cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ",
  model: "mistral-large-latest",
  temperature: 0.1,
  maxTokens: 1024,
})

// ---------- Shared schema ----------------------------------------------------
const HistoryEntrySchema = z.object({
  tool: z.string(),
  reason: z.string(),
  params: z.record(z.any()),
  result: z.any().optional(),
  timestamp: z.string(),
})
const EditOpSchema = z.object({
  start_line: z.number(),
  end_line: z.number(),
  replacement: z.string(),
})
const SharedStateSchema = z.object({
  user_query: z.string(),
  working_dir: z.string(),
  history: z.array(HistoryEntrySchema).default([]),
  edit_operations: z.array(EditOpSchema).default([]),
  response: z.string().optional(),
  params: z.record(z.any()).optional(),
  next_action: z
    .enum([
      "decide_next",
      "read_file",
      "grep_search",
      "list_dir",
      "delete_file",
      "run_code",
      "edit_file",
      "format_response",
      "done",
      "find_file",
    ])
    .default("decide_next"),
})

// ---------- Helpers ---------------------------------------------------------
const nowIso = () => new Date().toISOString()
const lastHistory = (s) => (s.history ?? [])[s.history?.length - 1] ?? null
const ensureAbs = (workingDir, pathLike) => {
  if (!pathLike) return ""
  if (path.isAbsolute(pathLike)) return pathLike
  return path.join(workingDir, pathLike)
}

// Truncate large text outputs for LLM context
const truncateForLLM = (text, maxLength = 2000) => {
  if (!text) return text
  if (text.length <= maxLength) return text
  return (
    text.slice(0, maxLength) +
    `... [truncated ${text.length - maxLength} characters]`
  )
}

// ---------- Optimized tools implementation --------------------------------------
export const tools = {
  readFileFull: (absPath) => fs.readFile(absPath, "utf8"),

  replaceRange: async ({ target_file, start_line, end_line, new_content }) => {
    try {
      const content = await fs.readFile(target_file, "utf8")
      console.log(`Content of ${target_file}:`, content) // Added log
      const lines = content.split("\n")
      lines.splice(
        start_line - 1,
        end_line - start_line + 1,
        ...new_content.split("\n")
      )
      await fs.writeFile(target_file, lines.join("\n"))
      return { success: true }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(
          `Attempting to create new file: ${target_file} with content: ${new_content}`
        )
        try {
          await fs.writeFile(target_file, new_content)
          return { success: true }
        } catch (writeError) {
          console.error(`Failed to write new file ${target_file}:`, writeError)
          return { success: false, error: writeError.message }
        }
      } else {
        console.error("Error in replaceRange:", error)
        return { success: false, error: error.message }
      }
    }
  },

  deleteFile: (absPath) => fs.unlink(absPath).then(() => ({ success: true })),

  listDirectoryTree: async (absPath) => {
    try {
      const entries = await fs.readdir(absPath, { withFileTypes: true })
      const tree = entries.map((dirent) => {
        const type = dirent.isDirectory() ? "📁" : "📄"
        return `${type} ${dirent.name}`
      })
      return {
        success: true,
        tree: tree.join("\n"),
        itemCount: entries.length,
      }
    } catch (error) {
      return {
        success: false,
        tree: `Error: ${error.message}`,
      }
    }
  },

  findFileByName: async ({ pattern, working_dir }) => {
    return new Promise((resolve) => {
      const results = []
      const args = [
        working_dir,
        "-type",
        "f",
        "-iname",
        `*${pattern}*`,
        "-not",
        "-path",
        "*/node_modules/*",
        "-not",
        "-path",
        "*/.git/*",
      ]

      const child = spawn("find", args, {
        cwd: working_dir,
        stdio: ["ignore", "pipe", "pipe"],
      })

      child.stdout.on("data", (data) => {
        const files = data.toString().split("\n").filter(Boolean)
        files.forEach((file) => {
          results.push({
            file: path.resolve(working_dir, file),
            filename: path.basename(file),
          })
        })
      })

      child.stderr.on("data", (data) => {
        resolve({ success: false, error: data.toString() })
      })

      child.on("close", (code) => {
        resolve({
          success: code === 0 || results.length > 0,
          matches: results.slice(0, 20),
          totalMatches: results.length,
        })
      })
    })
  },

  grepSearch: async ({ query, working_dir }) => {
    const results = []
    try {
      const entries = await fs.readdir(working_dir, { withFileTypes: true })
      for (const entry of entries) {
        const ext = path.extname(entry.name)
        if (
          entry.isFile() &&
          [".js", ".ts", ".json", ".html", ".md"].includes(ext)
        ) {
          const filePath = path.join(working_dir, entry.name)
          const content = await fs.readFile(filePath, "utf-8")
          if (content.includes(query)) {
            results.push({
              file: filePath,
              filename: entry.name,
            })
          }
        }
      }
      return {
        success: true,
        matches: results.slice(0, 20),
        totalMatches: results.length,
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  runCommand: (cmd, args, cwd) => {
    return new Promise((resolve) => {
      const child = spawn(cmd, args, { cwd, shell: false })
      let stdout = ""
      let stderr = ""

      child.stdout.on("data", (chunk) => (stdout += chunk))
      child.stderr.on("data", (chunk) => (stderr += chunk))

      child.on("close", (code) => {
        resolve({
          exitCode: code,
          stdout: truncateForLLM(stdout),
          stderr: truncateForLLM(stderr),
        })
      })

      child.on("error", (error) => {
        resolve({ exitCode: -1, stdout: "", stderr: error.message })
      })
    })
  },

  callLLM: async (prompt) => {
    try {
      let responseFormat = "text"
      let systemMessage = ""

      if (prompt.includes("Main Decision Agent")) {
        responseFormat = "json"
        systemMessage = `You are an expert coding assistant. Given the current task and previous results, choose the next optimal action.
Respond ONLY with valid JSON in this format:
{\"tool\": \"tool_name\", \"reason\": \"concise justification\", \"params\": {...}}`
      } else if (prompt.includes("Edit File Agent")) {
        responseFormat = "json"
        systemMessage = `You are a code editing specialist. Analyze the requested changes and generate precise edit operations.
Respond ONLY with a JSON array in this format:
[{\"start_line\": N, \"end_line\": M, \"replacement\": \"code\"}]`
      } else if (prompt.includes("Response Formatter")) {
        systemMessage =
          "You are summarizing task results for the user. Respond with clear, concise plain text."
      }

      const truncatedPrompt = truncateForLLM(prompt, 15000)
      const messages = []
      if (systemMessage) messages.push(new HumanMessage(systemMessage))
      messages.push(new HumanMessage(truncatedPrompt))

      const response = await mistralModel.invoke(messages)
      const content = response.content.toString().trim()

      if (responseFormat === "json") {
        let jsonString = content
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          jsonString = jsonMatch[1]
        }

        // Remove any markdown formatting that might be present in the JSON string
        jsonString = jsonString.replace(/\*\*/g, "") // Remove double asterisks

        try {
          JSON.parse(jsonString) // Validate JSON
          return jsonString
        } catch (error) {
          console.error("JSON parsing error:", error, "Raw content:", content)
          return JSON.stringify({
            tool: "finish",
            reason: "Error parsing LLM response as JSON.",
            params: { error: error.message, rawResponse: content },
          })
        }
      }

      return content
    } catch (error) {
      console.error("Mistral API error:", error)
      if (prompt.includes("Main Decision Agent")) {
        return JSON.stringify({
          tool: "finish",
          reason: "API error",
          params: {},
        })
      }
      if (prompt.includes("Edit File Agent")) {
        return JSON.stringify([])
      }
      return "An error occurred while processing your request."
    }
  },
}

// ---------- Agent definition ------------------------------------------------
export function buildCodingAgent(query, working_dir, currentFiles) {
  console.log("query", query)
  console.log("working_dir", working_dir)
  console.log("currentFiles", currentFiles)
  console.log("agnet called")
  const g = new StateGraph(SharedStateSchema)

  // decide_next
  g.addNode("decide_next", async (state) => {
    const lastRes = lastHistory(state)?.result ?? null
    const lastTool = lastHistory(state)?.tool ?? null

    if ((state.history?.length || 0) > 15) {
      return {
        ...state,
        history: [
          ...state.history,
          {
            tool: "finish",
            reason: "Emergency termination - too many steps",
            params: {},
            timestamp: nowIso(),
          },
        ],
        next_action: "format_response",
      }
    }

    const userQuery = (state.user_query || "").toLowerCase()
    // const lastRes = lastHistory(state)?.result ?? null;

    // Terminate if edit_file changes were applied
    if (lastRes?.apply_results && lastHistory(state)?.tool === "edit_file") {
      return {
        ...state,
        history: [
          ...state.history,
          {
            tool: "finish",
            reason: "File edit completed successfully",
            params: {},
            result: { success: true },
            timestamp: nowIso(),
          },
        ],
        next_action: "format_response",
      }
    }

    // Terminate if read_file succeeded and query is a read request
    if (
      lastRes?.success &&
      lastHistory(state)?.tool === "read_file" &&
      userQuery.includes("read")
    ) {
      return {
        ...state,
        history: [
          ...state.history,
          {
            tool: "finish",
            reason: "File read successfully, task complete",
            params: {},
            timestamp: nowIso(),
          },
        ],
        next_action: "format_response",
      }
    }

    let minimalLastRes = lastRes
    if (lastRes) {
      minimalLastRes = {
        success: lastRes.success,
        resultType: lastRes.matches
          ? "search-results"
          : lastRes.tree
            ? "directory-listing"
            : lastRes.content
              ? "file-content"
              : "other",
        items: lastRes.matches?.length || lastRes.itemCount || 0,
        contentLength: lastRes.fullLength || 0,
      }
    }

    const decisionPrompt = `
You are the Main Decision Agent.
Given:
-current_files: ${JSON.stringify(currentFiles)}
- user_query: ${JSON.stringify(userQuery)}
- last_result: ${minimalLastRes ? JSON.stringify(minimalLastRes) : "none"}

Choose the most efficient next action from:
- read_file: {target_file: "path", explanation: "..."} - Use to read file content
- find_file: {pattern: "name pattern", explanation: "..."} - Use to search for files by name
- grep_search: {query: "text", explanation: "..."} - Use to search file content
- list_dir: {relative_workspace_path: "path", explanation: "..."} - Use to list directory contents
- delete_file: {target_file: "path from previous search result", explanation: "..."} - Use to delete a file
- edit_file: {target_file: "path", instructions: "edit instructions", code_edit: "code to insert/replace", explanation: "..."} - Use to edit a file
- finish: {explanation: "..."} - Use when task is complete (e.g., file read for 'read' query, edit applied, or files found for 'find_file')

Return STRICT JSON: {"tool": "...", "reason": "...", "params": {...}}
If the user wants to delete a file and a file has been found in the last step, choose 'delete_file' and set 'target_file' to the path of the file found.
If the task is a read request and the file was read successfully (success: true, resultType: 'file-content'), choose 'finish'.
If the task is a file search and files were found, choose 'finish'.
If the task involves adding or modifying file content (e.g., 'add', 'edit', 'comment'), choose 'edit_file' with appropriate instructions.
`.trim()

    console.log("Decision Prompt:", decisionPrompt)
    let toolPick
    try {
      const rawResponse = await t.callLLM(decisionPrompt)
      console.log("LLM Response:", rawResponse)
      toolPick = JSON.parse(rawResponse)

      console.log("toolPick", toolPick)
    } catch (error) {
      console.error("LLM Parse Error:", error)
      toolPick = {
        tool: "finish",
        reason: "fallback due to JSON parse error",
        params: {},
      }
    }

    const entry = {
      tool: toolPick.tool,
      reason: toolPick.reason ?? "",
      params: toolPick.params ?? {},
      timestamp: nowIso(),
    }

    const actionMap = {
      read_file: "read_file",
      grep_search: "grep_search",
      list_dir: "list_dir",
      delete_file: "delete_file",
      run_code: "run_code",
      edit_file: "edit_file",
      find_file: "find_file",
      finish: "format_response",
    }

    return {
      ...state,
      history: [...(state.history ?? []), entry],
      next_action: actionMap[toolPick.tool] ?? "format_response",
    }
  })

  // read_file
  g.addNode("read_file", async (state) => {
    const entry = lastHistory(state)
    const absPath = ensureAbs(state.working_dir, entry.params.target_file)

    try {
      const content = await t.readFileFull(absPath)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return {
            ...h,
            result: {
              success: true,
              content: truncateForLLM(content, 2000),
              fullLength: content.length,
            },
          }
        }
        return h
      })
      return {
        ...state,
        history: updatedHistory,
      }
    } catch (error) {
      const updatedHistory = [...state.history]
      updatedHistory[updatedHistory.length - 1].result = {
        success: false,
        error: error.message,
      }
      return {
        ...state,
        history: updatedHistory,
      }
    }
  })

  // find_file
  g.addNode("find_file", async (state) => {
    const entry = lastHistory(state)
    const params = {
      pattern: entry.params.pattern || "",
      working_dir: state.working_dir,
    }

    try {
      const result = await t.findFileByName(params)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    } catch (error) {
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result: { success: false, error: error.message } }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    }
  })

  // grep_search
  g.addNode("grep_search", async (state) => {
    const entry = lastHistory(state)
    const params = {
      query: entry.params.query || "",
      working_dir: state.working_dir,
    }

    try {
      const result = await t.grepSearch(params)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    } catch (error) {
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result: { success: false, error: error.message } }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    }
  })

  // list_dir
  g.addNode("list_dir", async (state) => {
    const entry = lastHistory(state)
    const relPath = entry.params.relative_workspace_path || "."
    const absPath = ensureAbs(state.working_dir, relPath)

    try {
      const result = await t.listDirectoryTree(absPath)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    } catch (error) {
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result: { success: false, error: error.message } }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    }
  })

  // delete_file
  g.addNode("delete_file", async (state) => {
    const entry = lastHistory(state)
    const absPath = ensureAbs(state.working_dir, entry.params.target_file)

    try {
      const result = await t.deleteFile(absPath)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    } catch (error) {
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result: { success: false, error: error.message } }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    }
  })

  // run_code
  g.addNode("run_code", async (state) => {
    const entry = lastHistory(state)
    const { cmd, args = [] } = entry.params || {}

    try {
      const result = await t.runCommand(cmd, args, state.working_dir)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    } catch (error) {
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return {
            ...h,
            result: { exitCode: -1, stdout: "", stderr: error.message },
          }
        }
        return h
      })
      return { ...state, history: updatedHistory }
    }
  })

  g.addNode("edit_file", async (state) => {
    const entry = lastHistory(state)
    const { target_file, instructions, code_edit } = entry.params
    const absPath = ensureAbs(state.working_dir, target_file)

    try {
      // Check if file exists
      try {
        await fs.access(absPath, fs.constants.F_OK) // Check if file exists
      } catch (error) {
        if (error.code === "ENOENT") {
          // File does not exist, so create it using replaceRange
          const result = await t.replaceRange({
            target_file: absPath,
            start_line: 1, // For new file, start_line and end_line don't matter much for replaceRange's ENOENT logic
            end_line: 0,
            new_content: code_edit || "", // Use code_edit for initial content
          })
          const updatedHistory = state.history.map((h, i) => {
            if (i === state.history.length - 1) {
              return { ...h, result }
            }
            return h
          })
          return {
            ...state,
            history: updatedHistory,
          }
        } else {
          throw error // Re-throw other errors
        }
      }

      const originalContent = await t.readFileFull(absPath)
      const planPrompt = `
You are the Edit File Agent.
Context:
- target_file: ${JSON.stringify(target_file)}
- instructions: ${JSON.stringify(instructions)}
- code_edit:
${truncateForLLM(code_edit, 1000)}
Current File Content:
${truncateForLLM(originalContent, 3000)}
Return STRICT JSON array of edits:
[
  {"start_line": <int 1-indexed>, "end_line": <int 1-indexed>, "replacement": "<string with newlines escaped as \n>"}
]`.trim()

      const raw = await t.callLLM(planPrompt)
      const edits = JSON.parse(raw)

      const ops = [...edits].sort((a, b) => b.start_line - a.start_line)
      const results = []

      for (const op of ops) {
        try {
          await t.replaceRange({
            target_file: absPath,
            start_line: op.start_line,
            end_line: op.end_line,
            new_content: op.replacement,
          })
          results.push({ success: true })
        } catch (error) {
          results.push({ success: false, error: error.message })
        }
      }
      const success = results.every((r) => r.success)
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result: { success: success, apply_results: results } }
        }
        return h
      })
      return {
        ...state,
        history: updatedHistory,
      }
    } catch (error) {
      const updatedHistory = state.history.map((h, i) => {
        if (i === state.history.length - 1) {
          return { ...h, result: { success: false, error: error.message } }
        }
        return h
      })
      return {
        ...state,
        history: updatedHistory,
      }
    }
  })

  // format_response
  g.addNode("format_response", async (state) => {
    const minimalHistory = state.history.map((entry) => {
      const minimalEntry = {
        tool: entry.tool,
        reason: entry.reason,
      }

      if (entry.result) {
        if (entry.tool === "read_file") {
          minimalEntry.result = {
            success: entry.result.success,
            contentLength: entry.result.fullLength || 0,
            content: entry.result.content || "",
          }
        } else if (entry.tool === "list_dir") {
          minimalEntry.result = {
            success: entry.result.success,
            itemCount: entry.result.itemCount || 0,
          }
        } else if (entry.tool === "grep_search" || entry.tool === "find_file") {
          minimalEntry.result = {
            success: entry.result.success,
            matchCount: entry.result.totalMatches || 0,
            matches: entry.result.matches?.map((m) => m.file) || [],
          }
        } else if (entry.tool === "edit_file") {
          minimalEntry.result = {
            success: entry.result.success,
            apply_results: entry.result.apply_results,
          }
        } else {
          minimalEntry.result = { success: entry.result.success }
        }
      }

      return minimalEntry
    })

    const prompt = `
You are the Response Formatter. Summarize the action history for the user, clearly and concisely.
For read_file actions, include the file content (truncated if necessary).
For file searches (find_file or grep_search), list the matched file paths.
For edit_file actions, confirm the edit was applied successfully.
Minimized history:
${JSON.stringify(minimalHistory, null, 2)}
Return plain text summarizing the results, e.g., \"Added comment to index.js\" or \"Read file index.js:\n[content]\".
`.trim()

    try {
      const text = await t.callLLM(prompt)
      return {
        ...state,
        response: typeof text === "string" ? text : "Done",
      }
    } catch {
      const editEntry = state.history.find(
        (h) => h.tool === "edit_file" && h.result?.apply_results
      )
      if (editEntry && editEntry.result.apply_results.every((r) => r.success)) {
        return {
          ...state,
          response: `Successfully added comment to ${editEntry.params.target_file}`,
        }
      }
      const readFileEntry = state.history.find(
        (h) => h.tool === "read_file" && h.result?.success
      )
      if (readFileEntry) {
        return {
          ...state,
          response: `Read file ${readFileEntry.params.target_file}:\n${truncateForLLM(readFileEntry.result.content, 4000)}`,
        }
      }
      const findFileEntry = state.history.find(
        (h) => h.tool === "find_file" && h.result?.matches
      )
      if (findFileEntry) {
        const paths = findFileEntry.result.matches.map((m) => m.file).join("\n")
        return {
          ...state,
          response: `Found ${findFileEntry.result.totalMatches} files:\n${paths}`,
        }
      }
      return {
        ...state,
        response: "Task completed",
      }
    }
  })

  // ---------- Graph wiring --------------------------------------------------
  g.addEdge("edit_file", "decide_next")
  g.addEdge("format_response", END)

  g.addConditionalEdges("decide_next", (s) => s.next_action, {
    read_file: "read_file",
    grep_search: "grep_search",
    list_dir: "list_dir",
    delete_file: "delete_file",
    run_code: "run_code",
    edit_file: "edit_file",
    format_response: "format_response",
    find_file: "find_file",
    done: END,
  })

  ;[
    "read_file",
    "grep_search",
    "list_dir",
    "delete_file",
    "run_code",
    "find_file",
  ].forEach((n) => g.addEdge(n, "decide_next"))

  g.setEntryPoint("decide_next")
  return g.compile()
}
