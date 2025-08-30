"use client"

import React, { useEffect, useMemo, useRef } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { EditorView } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { javascript } from "@codemirror/lang-javascript"
import { html } from "@codemirror/lang-html"
import { markdown } from "@codemirror/lang-markdown"
import { json } from "@codemirror/lang-json"
import { css } from "@codemirror/lang-css"
import { oneDark } from "@codemirror/theme-one-dark"
import { formatSource } from "@/lib/pure-utils"



export default function CodeEditor({
  language = "typescript",
  value = "",
  onChange,
  onReady,
}) {
  const ref = useRef(null)

  const [isDark, setIsDark] = useState(false);

  // Handle dark mode detection on client side only
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Initial check
    setIsDark(document.documentElement.classList.contains("dark"));

    // Set up observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });

    return () => observer.disconnect();
  }, []);

  const extensions = useMemo(() => {
    switch ((language || "").toLowerCase()) {
      case "typescript":
      case "tsx":
      case "ts":
      case "javascript":
      case "jsx":
      case "js":
        return [javascript({ jsx: true, typescript: true })]
      case "html":
      case "htm":
        return [html()]
      case "markdown":
      case "md":
        return [markdown()]
      case "json":
        return [json()]
      case "css":
        return [css()]
      default:
        return []
    }
  }, [language])

  useEffect(() => {
    const view = ref.current?.view
    if (!view) return
    const api = {
      getSelectionText: () => {
        const sel = view.state.selection.main
        return view.state.sliceDoc(sel.from, sel.to)
      },
      format: () => {
        const current = view.state.doc.toString()
        const formatted = formatSource(current)
        if (formatted !== current) {
          view.dispatch({
            changes: { from: 0, to: current.length, insert: formatted },
          })
          onChange?.(formatted)
        }
      },
    }
    onReady?.(api)
  }, [onReady, onChange])

  // Handle theme changes
  useEffect(() => {
    const view = ref.current?.view;
    if (!view) return;

    view.dispatch({
      effects: EditorView.reconfigure.of([
        isDark ? oneDark : [],
        ...extensions,
        EditorView.lineWrapping,
      ]),
    });
  }, [isDark, extensions]);

  return (
    <CodeMirror
      ref={ref}
      value={value}
      height="100%"
      theme={isDark ? oneDark : undefined}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        syntaxHighlighting: true,
      }}
      extensions={[EditorView.lineWrapping, ...extensions]}
      onChange={onChange}
      // Performance-friendly editor options
      autoFocus={false}
    />
  )
}
