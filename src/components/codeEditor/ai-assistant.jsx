"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Copy, Send, Sparkles } from 'lucide-react'
import { cn } from "@/lib/utils"



export function AIAside({
  onInsertToEditor,
  onAsk,
  onExplainSelection,
  onFixSelection,
}) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    {
      id: "hello",
      role: "assistant",
      content:
        "Hi! I’m your AI pair programmer. Ask me to explain, refactor, generate tests, or fix errors. Connect a provider to enable live responses.",
    },
  ])
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!input.trim()) return
    const user       = { id: `u-${Date.now()}`, role: "user", content: input }
    setMessages((prev) => [...prev, user])
    setLoading(true)
    try {
      // Stubbed assistant reply
      await new Promise((r) => setTimeout(r, 500))
      const assistant = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "This is a placeholder reply. Wire up the AI SDK useChat hook and a /api/chat route to enable streaming responses.",
      }
      setMessages((prev) => [...prev, assistant])
      onAsk?.(input)
    } finally {
      setLoading(false)
      setInput("")
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 p-3">
        <Bot className="h-4 w-4" />
        <div className="text-sm font-medium">AI Assistant</div>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={onInsertToEditor}
            title="Insert suggestion into editor"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Insert
          </Button>
        </div>
      </div>
      <div className="px-3 pb-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExplainSelection}>
            Explain selection
          </Button>
          <Button variant="outline" size="sm" onClick={onFixSelection}>
            Fix selection
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-3 py-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-md px-3 py-2 text-sm",
                m.role === "assistant"
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : "ml-auto bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="w-28 animate-pulse rounded-md bg-neutral-100 p-3 text-sm text-neutral-500 dark:bg-neutral-800">
              {"Thinking..."}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t p-3">
        <Input
          placeholder="Ask the AI…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <Button onClick={submit} disabled={loading || !input.trim()}>
          <Send className="mr-1.5 h-4 w-4" />
          Send
        </Button>
      </div>
      <div className="px-3 pb-3 text-xs text-neutral-500">
        {"Tip: Connect the AI SDK's useChat hook and a provider to enable streaming responses."}
      </div>
    </div>
  )
}
