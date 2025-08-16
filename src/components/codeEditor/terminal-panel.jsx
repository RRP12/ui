"use client"

import { useRef, useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"


export function TerminalPanel({
  entries,
  onCommand,
}) {
  const endRef = useRef(null)
  const [cmd, setCmd] = useState("")

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries])

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {entries.map((e) => (
            <div key={e.id} className={cn("text-xs", entryColors[e.type])}>
              {e.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t p-2">
        <Input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Type a command (try: help)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onCommand?.(cmd)
              setCmd("")
            }
          }}
          className="h-8"
        />
      </div>
    </div>
  )
}

const entryColors = {
  log: "text-neutral-800 dark:text-neutral-100",
  info: "text-amber-700 dark:text-amber-400",
  success: "text-emerald-700 dark:text-emerald-400",
  error: "text-red-700 dark:text-red-400",
}
