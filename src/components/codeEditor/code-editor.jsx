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

  const isDark = useMemo(() => {
    if (typeof document === "undefined") return false
    return document.documentElement.classList.contains("dark")
  }, [])

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

  // Keep theme in sync with DOM class changes (light/dark)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const d = document.documentElement.classList.contains("dark")
      // Reconfigure theme by resetting state facet
      const view = ref.current?.view
      if (!view) return
      view.dispatch({
        effects: EditorView.reconfigure.of([
          d ? oneDark : [],
          ...extensions,
          EditorView.lineWrapping,
        ]),
      })
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [extensions])

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
