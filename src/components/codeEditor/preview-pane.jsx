"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, RefreshCcw } from 'lucide-react'

export function PreviewPane({
  htmlContent,
  title = "Preview",
  note,
}) {
  const iframeRef = useRef(null)
  const [version, setVersion] = useState(0)

  const blobUrl = useMemo(() => {
    if (!htmlContent) return null
    const blob = new Blob([htmlContent], { type: "text/html" })
    return URL.createObjectURL(blob)
  }, [htmlContent, version])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVersion((v) => v + 1)}
            title="Reload preview"
          >
            <RefreshCcw className="mr-1.5 h-4 w-4" />
            Reload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            disabled={!blobUrl}
            title="Open preview in a new tab"
          >
            <a href={blobUrl || "#"} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              New tab
            </a>
          </Button>
        </div>
      </div>
      <Separator />
      <div className="min-h-0 flex-1">
        {htmlContent ? (
          <iframe
            key={version}
            ref={iframeRef}
            title="Preview"
            className="h-full w-full"
            sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
            srcDoc={htmlContent}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-500">
            <div>
              <div className="mb-1 font-medium">No preview available</div>
              <div className="text-neutral-500">{note || "Select an HTML entry or connect WebContainers for framework previews."}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
