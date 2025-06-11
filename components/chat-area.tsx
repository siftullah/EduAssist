"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import TypingIndicator from "./typing-indicator"
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  content: string
  sender: "human" | "chatbot" | "bot"
  timestamp: Date
  attachment?: string
}

interface ChatAreaProps {
  messages: Message[]
  isTyping?: boolean
}

export default function ChatArea({ messages, isTyping }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">No messages yet</p>
        </div>
      </div>
    )
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp)
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3 px-4",
              message.sender === "human" ? "justify-end" : "justify-start"
            )}
          >
            {message.sender !== "human" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
            )}
            
            <div
              className={cn(
                "rounded-lg py-3 px-4 max-w-[85%] shadow-sm",
                message.sender === "human"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              )}
            >
              <div className="whitespace-pre-wrap text-sm prose dark:prose-invert">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.attachment && (
                <div className="mt-2 text-xs">
                  <span className={message.sender === "human" ? "text-blue-100" : "text-gray-500"}>
                    Attachment: {message.attachment}
                  </span>
                </div>
              )}
              <div className="text-[10px] mt-1 text-right opacity-70">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
            
            {message.sender === "human" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="px-4">
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} className="h-px" />
      </div>
    </ScrollArea>
  )
}
