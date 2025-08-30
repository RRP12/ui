'use client'

import dynamic from 'next/dynamic';

// Dynamically import the Editor component with SSR disabled
const Editor = dynamic(
  () => import('../../components/Editor'),
  { ssr: false }
);

export default function EditorPage() {
  return (
    <div className="h-screen w-full">
      <Editor />
    </div>
  )
}