import { vol } from "memfs";
import path from "path";
import yaml from "js-yaml";

import { createStreamableValue } from "ai";
import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";

import { createMistral } from "@ai-sdk/mistral";
// Initialize in-memory file system
// Example files for testing; in production, you'd populate this with your project files
vol.fromJSON(
    {
        "/project/index.js": 'console.log("Hello, world!");\n// Sample file',
        "/project/utils.js":
            'function util() { return "Utility"; }\n// Utility file',
    },
    "/"
);

const mistral = createMistral({
    // custom settings
    apiKey: process.env.MISTRAL_API_KEY || "cAdRTLCViAHCn0ddFFEe50ULu04MbUvZ",
});
// Helper functions
async function callLlm(prompt) {
    const response = await mistral("mistral-small-latest").generateText({
        prompt,
        maxOutputTokens: 1000,
    });
    return response.text;
}

function extractYamlFromResponse(response) {
    const match = response.match(/```yaml\n([\s\S]*?)\n```/);
    return match ? match[1] : response;
}

function formatHistorySummary(history) {
    return history
        .map((item) => {
            return `Tool: ${item.tool}\nReason: ${item.reason
                }\nParams: ${JSON.stringify(item.params)}\nResult: ${JSON.stringify(
                    item.result || {}
                )}\n`;
        })
        .join("\n---\n");
}

async function readFile(targetFile) {
    try {
        const content = vol.readFileSync(targetFile, "utf-8");
        const lines = content.split("\n");
        const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join("\n");
        return [numbered, true];
    } catch (e) {
        return [`Error reading file: ${e.message}`, false];
    }
}

async function deleteFile(targetFile) {
    try {
        vol.unlinkSync(targetFile);
        return [`Successfully deleted ${targetFile}`, true];
    } catch (e) {
        return [`Error deleting file: ${e.message}`, false];
    }
}

async function listDir(directory) {
    try {
        const files = vol.readdirSync(directory);
        return [files.join("\n"), true];
    } catch (e) {
        return [`Error listing directory: ${e.message}`, false];
    }
}

async function grepSearch(pattern, directory) {
    async function searchDir(dir) {
        const results = [];
        const entries = vol.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...searchDir(fullPath));
            } else {
                const content = vol.readFileSync(fullPath, "utf-8");
                content.split("\n").forEach((line, i) => {
                    if (line.includes(pattern)) {
                        results.push(`${fullPath}:${i + 1}: ${line}`);
                    }
                });
            }
        }
        return results;
    }
    try {
        const results = searchDir(directory);
        return [results.join("\n"), true];
    } catch (e) {
        return [`Error searching: ${e.message}`, false];
    }
}

async function removeLines(targetFile, startLine, endLine) {
    try {
        const content = vol.readFileSync(targetFile, "utf-8");
        const lines = content.split("\n");
        lines.splice(startLine - 1, endLine - startLine + 1);
        vol.writeFileSync(targetFile, lines.join("\n"));
        return [`Removed lines ${startLine}-${endLine}`, true];
    } catch (e) {
        return [`Error removing: ${e.message}`, false];
    }
}

async function insertLines(targetFile, content, atLine) {
    try {
        const fileContent = vol.readFileSync(targetFile, "utf-8");
        const lines = fileContent.split("\n");
        const insertLines = content.split("\n");
        lines.splice(atLine - 1, 0, ...insertLines);
        vol.writeFileSync(targetFile, lines.join("\n"));
        return [`Inserted at line ${atLine}`, true];
    } catch (e) {
        return [`Error inserting: ${e.message}`, false];
    }
}

async function replaceFile(targetFile, startLine, endLine, replacement) {
    const [removeMsg, removeSuccess] = await removeLines(
        targetFile,
        startLine,
        endLine
    );
    if (!removeSuccess) return [removeMsg, false];
    const [insertMsg, insertSuccess] = await insertLines(
        targetFile,
        replacement,
        startLine
    );
    if (!insertSuccess) return [insertMsg, false];
    return [
        `Replaced lines ${startLine}-${endLine}: ${removeMsg}; ${insertMsg}`,
        true,
    ];
}

// Node classes
class Node {
    prep(shared) {
        return null;
    }
    async exec(inputs) { }
    post(shared, prepRes, execRes) {
        return null;
    }
}

class BatchNode extends Node { }

// MainDecisionAgent
class MainDecisionAgent extends Node {
    prep(shared) {
        const userQuery = shared.userQuery || "";
        const history = shared.history || [];
        return [userQuery, history];
    }

    async exec([userQuery, history]) {
        const historyStr = formatHistorySummary(history);
        const prompt = `You are a coding assistant that helps modify and navigate code. Given the following request, 
decide which tool to use from the available options.

User request: ${userQuery}

Here are the actions you performed:
${historyStr}

Available tools:
1. read_file: Read content from a file
   - Parameters: target_file (path)

2. edit_file: Make changes to a file
   - Parameters: target_file (path), instructions (string), code_edit (string pattern with markers)

3. delete_file: Delete a file
   - Parameters: target_file (path)

4. grep_search: Search for pattern in directory
   - Parameters: pattern (string), directory (optional, default current)

5. list_dir: List files in directory
   - Parameters: directory (optional, default current)

6. finish: Complete the task and format response
   - Parameters: none

Respond with a YAML object containing:
tool: one of: read_file, edit_file, delete_file, grep_search, list_dir, finish
reason: |
  detailed explanation of why you chose this tool and what you intend to do
params:
  # parameters specific to the chosen tool
`;
        const response = await callLlm(prompt);
        const yamlContent = extractYamlFromResponse(response);
        const decision = yaml.load(yamlContent);
        if (!decision.tool || !decision.reason) {
            throw new Error("Invalid decision format");
        }
        return decision;
    }

    post(shared, prepRes, execRes) {
        shared.history = shared.history || [];
        shared.history.push({
            tool: execRes.tool,
            reason: execRes.reason,
            params: execRes.params || {},
            timestamp: new Date().toISOString(),
        });
        return execRes.tool;
    }
}

// ReadFileAction
class ReadFileAction extends Node {
    prep(shared) {
        const history = shared.history;
        const last = history[history.length - 1];
        let targetFile = last.params.target_file;
        targetFile = path.join(shared.workingDir, targetFile);
        return targetFile;
    }

    async exec(targetFile) {
        return readFile(targetFile);
    }

    post(shared, prepRes, execRes) {
        const [content, success] = execRes;
        const history = shared.history;
        const last = history[history.length - 1];
        last.result = { success, content };
        return "decision";
    }
}

// GrepSearchAction
class GrepSearchAction extends Node {
    prep(shared) {
        const history = shared.history;
        const last = history[history.length - 1];
        const pattern = last.params.pattern;
        let directory = last.params.directory || shared.workingDir;
        directory = path.join(shared.workingDir, directory);
        return { pattern, directory };
    }

    async exec({ pattern, directory }) {
        return grepSearch(pattern, directory);
    }

    post(shared, prepRes, execRes) {
        const [content, success] = execRes;
        const history = shared.history;
        const last = history[history.length - 1];
        last.result = { success, content };
        return "decision";
    }
}

// ListDirAction
class ListDirAction extends Node {
    prep(shared) {
        const history = shared.history;
        const last = history[history.length - 1];
        let directory = last.params.directory || shared.workingDir;
        directory = path.join(shared.workingDir, directory);
        return directory;
    }

    async exec(directory) {
        return listDir(directory);
    }

    post(shared, prepRes, execRes) {
        const [content, success] = execRes;
        const history = shared.history;
        const last = history[history.length - 1];
        last.result = { success, content };
        return "decision";
    }
}

// DeleteFileAction
class DeleteFileAction extends Node {
    prep(shared) {
        const history = shared.history;
        const last = history[history.length - 1];
        let targetFile = last.params.target_file;
        targetFile = path.join(shared.workingDir, targetFile);
        return targetFile;
    }

    async exec(targetFile) {
        return deleteFile(targetFile);
    }

    post(shared, prepRes, execRes) {
        const [content, success] = execRes;
        const history = shared.history;
        const last = history[history.length - 1];
        last.result = { success, content };
        return "decision";
    }
}

// EditFileNode
class EditFileNode extends Node {
    prep(shared) {
        const history = shared.history;
        const last = history[history.length - 1];
        let targetFile = last.params.target_file;
        targetFile = path.join(shared.workingDir, targetFile);
        return targetFile;
    }

    async exec(targetFile) {
        return readFile(targetFile);
    }

    post(shared, prepRes, execRes) {
        const [content, success] = execRes;
        const history = shared.history;
        const last = history[history.length - 1];
        if (success) {
            last.file_content = content;
        }
        last.result = {
            success,
            message: success ? "File read for edit" : content,
        };
        return success ? "analyze" : "decision";
    }
}

// AnalyzeAndPlanNode
class AnalyzeAndPlanNode extends Node {
    prep(shared) {
        const history = shared.history;
        const last = history[history.length - 1];
        const fileContent = last.file_content;
        const instructions = last.params.instructions;
        const codeEdit = last.params.code_edit;
        return { fileContent, instructions, codeEdit };
    }

    async exec(params) {
        const { fileContent, instructions, codeEdit } = params;
        const prompt = `
As a code editing assistant, I need to convert the following code edit instruction 
and code edit pattern into specific edit operations (start_line, end_line, replacement).

FILE CONTENT:
${fileContent}

EDIT INSTRUCTIONS: 
${instructions}

CODE EDIT PATTERN (markers like "// ... existing code ..." indicate unchanged code):
${codeEdit}

Analyze the file content and the edit pattern to determine exactly where changes should be made. 
Return a YAML object with your reasoning and an array of edit operations:

reasoning: |
  Explain your thinking process about how you're interpreting the edit pattern.

operations:
  - start_line: 10
    end_line: 15
    replacement: |
      # New code here
`;
        const response = await callLlm(prompt);
        const yamlContent = extractYamlFromResponse(response);
        const result = yaml.load(yamlContent);
        shared.edit_reasoning = result.reasoning || "";
        return result.operations || [];
    }

    post(shared, prepRes, execRes) {
        shared.edit_operations = execRes;
        return "apply";
    }
}

// ApplyChangesNode
class ApplyChangesNode extends BatchNode {
    prep(shared) {
        let operations = shared.edit_operations || [];
        operations = operations.sort((a, b) => b.start_line - a.start_line);
        const history = shared.history;
        const last = history[history.length - 1];
        let targetFile = last.params.target_file;
        targetFile = path.join(shared.workingDir, targetFile);
        operations.forEach((op) => {
            op.target_file = targetFile;
        });
        return operations;
    }

    async exec(op) {
        return replaceFile(
            op.target_file,
            op.start_line,
            op.end_line,
            op.replacement
        );
    }

    post(shared, prepRes, execResList) {
        const allSuccessful = execResList.every(([_, success]) => success);
        const history = shared.history;
        const last = history[history.length - 1];
        last.result = {
            success: allSuccessful,
            operations: execResList.length,
            details: execResList.map(([msg, success]) => ({ success, message: msg })),
            reasoning: shared.edit_reasoning || "",
        };
        return "decision";
    }
}

// FormatResponseNode
class FormatResponseNode extends Node {
    prep(shared) {
        return shared.history || [];
    }

    async exec(history) {
        return `Task completed. Summary:\n${formatHistorySummary(history)}`;
    }

    post(shared, prepRes, execRes) {
        shared.response = execRes;
        return null;
    }
}

// Flow
class Flow {
    constructor(start) {
        this.start = start;
        this.connections = new Map();
    }

    connect(from, branch, to) {
        if (!this.connections.has(from)) {
            this.connections.set(from, new Map());
        }
        this.connections.get(from).set(branch, to);
    }

    async *run(shared) {
        let current = this.start;
        while (current) {
            const prepRes = current.prep(shared);
            yield {
                event: "on_node_start",
                data: { node: current.constructor.name, input: prepRes },
            };
            const execRes = await current.exec(prepRes);
            const nextBranch = current.post(shared, prepRes, execRes);
            yield {
                event: "on_node_end",
                data: { node: current.constructor.name, output: execRes },
            };
            if (!nextBranch) {
                current = null;
                continue;
            }
            const nextMap = this.connections.get(current);
            if (!nextMap || !nextMap.has(nextBranch)) {
                current = null;
                continue;
            }
            current = nextMap.get(nextBranch);
        }
        yield { event: "on_flow_end", data: { response: shared.response } };
    }
}

// Coding Agent Flow
const mainDecision = new MainDecisionAgent();
const readFileAction = new ReadFileAction();
const grepSearchAction = new GrepSearchAction();
const listDirAction = new ListDirAction();
const deleteFileAction = new DeleteFileAction();
const editFileNode = new EditFileNode();
const analyzePlanNode = new AnalyzeAndPlanNode();
const applyChangesNode = new ApplyChangesNode();
const formatResponseNode = new FormatResponseNode();

const codingAgentFlow = new Flow(mainDecision);

codingAgentFlow.connect(mainDecision, "read_file", readFileAction);
codingAgentFlow.connect(mainDecision, "grep_search", grepSearchAction);
codingAgentFlow.connect(mainDecision, "list_dir", listDirAction);
codingAgentFlow.connect(mainDecision, "delete_file", deleteFileAction);
codingAgentFlow.connect(mainDecision, "edit_file", editFileNode);
codingAgentFlow.connect(mainDecision, "finish", formatResponseNode);

codingAgentFlow.connect(readFileAction, "decision", mainDecision);
codingAgentFlow.connect(grepSearchAction, "decision", mainDecision);
codingAgentFlow.connect(listDirAction, "decision", mainDecision);
codingAgentFlow.connect(deleteFileAction, "decision", mainDecision);

codingAgentFlow.connect(editFileNode, "analyze", analyzePlanNode);
codingAgentFlow.connect(analyzePlanNode, "apply", applyChangesNode);
codingAgentFlow.connect(applyChangesNode, "decision", mainDecision);

// API Route
export const runtime = "edge";

export async function POST(req) {
    const { query, workingDir } = await req.json();

    const shared = {
        userQuery: query,
        workingDir: workingDir || "/project", // Default to in-memory root
        history: [],
        response: null,
        edit_operations: [],
        edit_reasoning: "",
    };

    const stream = createStreamableValue("");

    (async () => {
        try {
            for await (const event of codingAgentFlow.run(shared)) {
                stream.append(`\n${JSON.stringify(event, null, 2)}`);
            }
            stream.done(shared.response || "Task completed.");
        } catch (e) {
            stream.error(e.message);
        }
    })();

    return new Response(stream.value);
}

// Client Component
export default function AgentPage() {
    const { completion, input, handleInputChange, handleSubmit, isLoading } =
        useCompletion({
            api: "/api/agent",
            body: { workingDir: "/project" },
        });

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h1>Coding Agent</h1>
            <form
                onSubmit={handleSubmit}
                style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
            >
                <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Enter your query, e.g., List all JavaScript files"
                    style={{ flex: 1, padding: "10px", fontSize: "16px" }}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: "10px 20px",
                        fontSize: "16px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                >
                    Run Agent
                </button>
            </form>
            <pre
                style={{
                    background: "#f4f4f4",
                    padding: "20px",
                    borderRadius: "5px",
                    overflowX: "auto",
                }}
            >
                {completion || "No output yet. Enter a query and run the agent."}
            </pre>
        </div>
    );
}
