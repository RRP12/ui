"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useGetFiles } from './Context'
export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'user', content: "" }
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)
  const router = useRouter()

  const { files, setFiles } = useGetFiles()
  const sendMessage = () => {
    // fetch('http://localhost:3001/test', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ message: input }),
    // })
    // .then(response => response.json())
    // .then(data => {
    //   setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    //   setInput('')
    //   return data
    // }).then(data => {
    //   sessionStorage.setItem("files", JSON.stringify(data));
    //   setFiles(data);
    //   router.push("/builder" , {query: {question: input}});
    // })
    // .catch(error => {
    //   console.error('Error:', error)
    // })
    router.push(`/builder?question=${encodeURIComponent(input)}`);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])



  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      <div className="flex items-center p-4 bg-blue-500 text-white">
        <h2 className="text-lg font-semibold">Lovable Chat</h2>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-auto bg-gray-50">

        <div ref={endRef} />
      </div>
      <div className="flex p-3 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-full text-black"
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}
