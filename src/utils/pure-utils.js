export function buildPathForFile(tree, targetId, prefix = "") {
    for (const node of tree) {
      const currentPath = prefix ? `${prefix}/${node.name}` : node.name
      if (node.id === targetId) return currentPath
      if (node.type === "folder" && node.children?.length) {
        const childPath = buildPathForFile(node.children, targetId, currentPath)
        if (childPath) return childPath
      }
    }
    return null
  }
  
  export function updateFileContent(tree, targetId, content) {
    return tree.map((node) => {
      if (node.id === targetId && node.type === "file") {
        return { ...node, content }
      }
      if (node.type === "folder" && node.children) {
        return { ...node, children: updateFileContent(node.children, targetId, content) }
      }
      return node
    })
  }
  
  export function getExt(name) {
    const i = name.lastIndexOf(".")
    return i >= 0 ? name.slice(i + 1).toLowerCase() : ""
  }
  
  export function findFirstHtml(
    tree,
    prefix = ""
  ) {
    for (const node of tree) {
      const currentPath = prefix ? `${prefix}/${node.name}` : node.name
      if (node.type === "file" && node.name.toLowerCase().endsWith(".html")) {
        return { path: currentPath, content: node.content || "" }
      }
      if (node.type === "folder" && node.children?.length) {
        const child = findFirstHtml(node.children, currentPath)
        if (child) return child
      }
    }
    return null
  }
  
  export function makeScaffoldHtml(filename, content) {
    const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const body = `<pre>${escaped}</pre>`
    return `<!doctype html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Scaffold • ${filename}</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; padding: 16px; font-size: 13px; line-height: 1.55; }
  </style>
  </head>
  <body>
  ${body}
  </body>
  </html>`
  }
  
  // Minimal, pure "formatter" to keep things light-weight
  export function formatSource(input) {
    // 1) Normalize line endings to \n
    // 2) Trim trailing spaces per line
    // 3) Ensure single newline at EOF
    const lines = input.replace(/\r\n?/g, "\n").split("\n")
    const trimmed = lines.map((l) => l.replace(/[ \t]+$/g, ""))
    let out = trimmed.join("\n")
    if (!out.endsWith("\n")) out += "\n"
    return out
  }
  
  // Shared types so utils are typed but not importing React at runtime
