"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, FileIcon, Folder, MoreVertical, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



export function FileTree({
  data,
  onTreeChange,
  onOpenFile,
  activeFileId,
}) {
  return (
    <div className="p-2">
      {data.map((node) => (
        <MemoFileNodeItem
          key={node.id}
          node={node}
          depth={0}
          onChange={onTreeChange}
          onOpenFile={onOpenFile}
          activeFileId={activeFileId}
          root={data}
        />
      ))}
    </div>
  )
}



function FileNodeItem({ node, depth, onChange, onOpenFile, activeFileId, root }) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(node.name)

  const paddingLeft = 8 + depth * 12

  const commitRename = useCallback(() => {
    if (!name.trim()) {
      setName(node.name)
      setRenaming(false)
      return
    }
    const next = updateNode(root, node.id, { name })
    onChange(next)
    setRenaming(false)
  }, [name, node.name, node.id, onChange, root])

  const onAddFile = useCallback(() => {
    const child = {
      id: `${node.id}-${Date.now()}`,
      name: "new-file.ts",
      type: "file",
      language: "typescript",
      content: "// New file",
    }
    const next = addChild(root, node.id, child)
    onChange(next)
  }, [node.id, onChange, root])

  const isActive = activeFileId === node.id

  return (
    <div>
      <div
        className={cn(
          "group flex select-none items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70",
          node.type === "file" && isActive && "bg-neutral-100 dark:bg-neutral-800/70"
        )}
        style={{ paddingLeft }}
      >
        {node.type === "folder" ? (
          <button
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse folder" : "Expand folder"}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {node.type === "folder" ? (
          <Folder className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        ) : (
          <FileIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        )}

        {renaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename()
              if (e.key === "Escape") {
                setName(node.name)
                setRenaming(false)
              }
            }}
            className="h-7 w-[160px]"
          />
        ) : (
          <button
            onDoubleClick={() => {
              if (node.type === "file") onOpenFile(node)
              if (node.type === "folder") setOpen((o) => !o)
            }}
            onClick={() => node.type === "file" && onOpenFile(node)}
            className="flex min-w-0 flex-1 truncate text-left"
          >
            <span className="truncate">{node.name}</span>
          </button>
        )}

        <div className="ml-auto hidden items-center gap-1 group-hover:flex">
          {node.type === "folder" && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAddFile}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChange(deleteNode(root, node.id))}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {node.type === "folder" && open && node.children?.length ? (
        <div className="mt-1">
          {node.children.map((child) => (
            <MemoFileNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onChange={onChange}
              onOpenFile={onOpenFile}
              activeFileId={activeFileId}
              root={root}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const MemoFileNodeItem = React.memo(FileNodeItem, (prev, next) => {
  // Avoid re-render if nothing relevant to this node changed
  return (
    prev.node === next.node &&
    prev.depth === next.depth &&
    prev.activeFileId === next.activeFileId &&
    prev.root === next.root
  )
})

// Pure update helpers (local to component to keep file cohesive)
function updateNode(tree, id, patch) {
  return tree.map((n) => {
    if (n.id === id) return { ...n, ...patch }
    if (n.type === "folder" && n.children) {
      return { ...n, children: updateNode(n.children, id, patch) }
    }
    return n
  })
}
function deleteNode(tree, id) {
  return tree
    .filter((n) => n.id !== id)
    .map((n) =>
      n.type === "folder" && n.children
        ? { ...n, children: deleteNode(n.children, id) }
        : n
    )
}
function addChild(tree, id, child) {
  return tree.map((n) => {
    if (n.id === id && n.type === "folder") {
      const children = n.children ? [...n.children, child] : [child]
      return { ...n, children }
    }
    if (n.type === "folder" && n.children) {
      return { ...n, children: addChild(n.children, id, child) }
    }
    return n
  })
}
