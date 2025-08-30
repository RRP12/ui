"use client"

import { useState } from "react"

export default function FileExplorer({ files = [],
  selectedFile,
  setSelectedFile,
  onSelectFile,
  className = "" }) {
  const [expandedDirs, setExpandedDirs] = useState(new Set())

  const handleClick = (file) => {
    setSelectedFile(file.filePath)
    if (onSelectFile) onSelectFile(file)
  }


  const toggleDir = (dirPath, e) => {
    e.stopPropagation()
    setExpandedDirs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dirPath)) {
        newSet.delete(dirPath)
      } else {
        newSet.add(dirPath)
      }
      return newSet
    })
  }

  const getFileIcon = (filename) => {
    if (!filename) return '📄'

    const ext = filename.split('.').pop().toLowerCase()
    switch (ext) {
      case 'js': return '📄'
      case 'jsx': return '📄'
      case 'ts': return '📄'
      case 'tsx': return '📄'
      case 'json': return '📋'
      case 'md': return '📝'
      case 'css': return '🎨'
      case 'html': return '🌐'
      case 'sh': return '💻'
      case 'txt': return '📄'
      default:
        if (filename.includes('.')) return '📄'
        return '📁'
    }
  }

  const buildFileTree = (files) => {
    const tree = {}

    files.forEach(file => {
      if (!file.filePath) return

      const parts = file.filePath.split('/')
      let currentLevel = tree

      parts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            type: index === parts.length - 1 ? 'file' : 'directory',
            path: parts.slice(0, index + 1).join('/'),
            children: {},
            ...(index === parts.length - 1 ? {
              content: file.content,
              type: file.type || 'file'
            } : {})
          }
        }
        currentLevel = currentLevel[part].children
      })
    })

    return tree
  }

  const renderTree = (node, level = 0) => {
    const isExpanded = expandedDirs.has(node.path)
    const isDir = node.type === 'directory'
    const isSelected = selectedFile === node.path

    return (
      <div key={node.path} className="select-none">
        <div
          className={`
            flex items-center py-1.5 px-3 rounded-md transition-colors
            ${isSelected
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
            }
            ${isDir ? 'cursor-pointer' : 'cursor-default'}
          `}
          style={{
            marginLeft: `${level * 12}px`,
            paddingLeft: isDir ? '0.25rem' : '1.5rem'
          }}
          onClick={() => isDir ? toggleDir(node.path, { stopPropagation: () => { } }) : handleClick(node)}
        >
          {isDir ? (
            <span
              className="w-5 h-5 flex items-center justify-center mr-1.5"
              onClick={(e) => {
                e.stopPropagation()
                toggleDir(node.path, e)
              }}
            >
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            <span className="w-5 h-5 flex items-center justify-center mr-1.5">
              {getFileIcon(node.name)}
            </span>
          )}
          <span className="truncate text-sm">{node.name}</span>
        </div>
        {isDir && isExpanded && node.children && (
          <div className="w-full ml-1 border-l border-gray-200 pl-1">
            {Object.values(node.children).map(child =>
              renderTree(child, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  const fileTree = buildFileTree(files.filter(f => f.type === 'file'))
  const shellCommands = files.filter(f => f.type === 'shell')

  return (
    <div
      className={`w-96 bg-white rounded-lg border border-gray-200 flex flex-col h-full ${className}`}
      style={{ minHeight: 0 }} // allows flex children to shrink properly
    >


      {/* Scrollable content */}
      <div className=" w-full flex-1 overflow-y-auto p-2 space-y-0.5">
        {Object.values(fileTree).length > 0 ? (
          Object.values(fileTree).map(node => renderTree(node))
        ) : (
          <div className="text-gray-500 text-sm p-3 text-center">
            No files to display
          </div>
        )}

        {shellCommands.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
              Terminal Commands
            </div>
            <div className="space-y-2">
              {shellCommands.map((cmd, i) => (
                <div
                  key={i}
                  className="bg-gray-50 p-2.5 rounded-md border border-gray-200 text-sm font-mono text-gray-700 break-words"
                >
                  <span className="text-gray-400 select-none">$ </span>
                  {cmd.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

}