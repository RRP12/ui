// app/editor/page.jsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import Editor from '../../components/Editor'

// Dynamically import the Editor component with SSR disabled
// const Editor = dynamic(
//   () => import('@/components/Editor'),
//   { ssr: false }
// )

export default function EditorPage() {




  return (
    <div className="h-screen w-full">
      <Editor />
    </div>
  )
}