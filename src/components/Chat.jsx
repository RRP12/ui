
"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGetFiles } from "./Context"
import { Send } from "lucide-react"

export default function Chat() {
  const [messages, setMessages] = useState([{ role: "user", content: "" }])
  const [input, setInput] = useState("")
  const endRef = useRef(null)
  const router = useRouter()

  const { files, setFiles } = useGetFiles()

  const sendMessage = () => {
    if (!input.trim()) return
    router.push(`/builder?question=${encodeURIComponent(input)}`)
    setMessages([...messages, { role: "user", content: input }])
    setInput("")
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="flex flex-col max-h-[90vh] w-full max-w-md bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center p-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white">
          <h2 className="text-lg font-bold tracking-wide">✨ Enter your Chat</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3 overflow-auto bg-white/60 backdrop-blur">
          {messages.map((msg, i) => (
            <div key={msg}>

              {msg.content}

            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type something cute..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-pink-300 focus:outline-none text-gray-700"
          />
          <button
            onClick={sendMessage}
            className="p-3 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white shadow hover:opacity-90 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
