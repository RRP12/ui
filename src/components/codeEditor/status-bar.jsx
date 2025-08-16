"use client"

import { TerminalIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StatusBar({
  language = "plaintext",
  path = "",
  dirty = false,
  onToggleTerminal,
}) {
  return (
    <div className="flex items-center gap-3 border-t bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300">
      <div className="flex items-center gap-2">
        <span className={cn("rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] dark:bg-neutral-800")}>
          {language}
        </span>
        <span className="truncate">{path}</span>
        {dirty && <span className="text-amber-600">{"• unsaved"}</span>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onToggleTerminal}
        >
          <TerminalIcon className="h-3.5 w-3.5" />
          Toggle Terminal
        </Button>
      </div>
    </div>
  )
}
