"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Message } from "@/components/form-flow-app"
import type { AssistantTone } from "@/components/form-flow-app"

interface ChatBoxProps {
  messages: Message[]
  onSendMessage: (text: string) => void
  isProcessing?: boolean
  isDone?: boolean
  assistantTone?: AssistantTone
}

export function ChatBox({
  messages,
  onSendMessage,
  isProcessing = false,
  isDone = false,
  assistantTone = "friendly",
}: ChatBoxProps) {
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, isProcessing, isTyping])

  // Simulate typing animation for the latest assistant message
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setIsTyping(true)
      const typingTimeout = setTimeout(() => {
        setIsTyping(false)
      }, 1000) // Simulate typing for 1 second

      return () => clearTimeout(typingTimeout)
    }
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isProcessing && !isDone) {
      onSendMessage(inputValue.trim())
      setInputValue("")
    }
  }

  const isInputDisabled = isProcessing || isDone || isTyping

  // Get avatar based on tone
  const getAvatar = () => {
    switch (assistantTone) {
      case "formal":
        return "bg-blue-500"
      case "expert":
        return "bg-purple-500"
      case "friendly":
      default:
        return "bg-green-500"
    }
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !isProcessing && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Welcome to FormFlow AI!</p>
              <p className="text-sm">I'll help you fill out your form step by step.</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          // Don't show the last assistant message if we're simulating typing
          if (isTyping && index === messages.length - 1 && message.role === "assistant") {
            return null
          }

          return (
            <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
              {message.role === "assistant" && (
                <div className={`h-8 w-8 rounded-full ${getAvatar()} mr-2 flex-shrink-0`} />
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "assistant" ? "bg-gray-900 text-white" : "bg-purple-600 text-white"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && <div className="h-8 w-8 rounded-full bg-purple-500 ml-2 flex-shrink-0" />}
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className={`h-8 w-8 rounded-full ${getAvatar()} mr-2`} />
            <div className="bg-gray-900 text-white rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {isProcessing && !isTyping && (
          <div className="flex justify-start">
            <div className={`h-8 w-8 rounded-full ${getAvatar()} mr-2`} />
            <div className="bg-gray-900 text-white rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-black">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isDone
                ? "Form completed! 🎉"
                : isProcessing || isTyping
                  ? "Please wait..."
                  : "Please start typing here..."
            }
            className="min-h-[50px] max-h-[120px] resize-none bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500"
            disabled={isInputDisabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-700 flex-shrink-0"
            disabled={!inputValue.trim() || isInputDisabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="text-xs text-gray-500 mt-2 text-center">
          {isDone
            ? "Form filling completed successfully!"
            : "FormFlow AI may make mistakes. Please use with discretion."}
        </div>
      </div>
    </div>
  )
}
