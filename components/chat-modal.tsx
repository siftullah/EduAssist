"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageSquare, PlusCircle, Trash2, Edit2, Paperclip, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import ChatArea from "./chat-area"

interface Conversation {
  id: string
  name: string
  messages: Message[]
}

interface Message {
  id: string
  content: string
  sender: "human" | "chatbot" | "bot"
  timestamp: Date
  attachment?: string
  type?: string
}

interface ChatModalProps {
  onClose: () => void
}

export default function ChatModal({ onClose }: ChatModalProps) {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string>("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Load user's conversations
  useEffect(() => {
    if (user?.id) {
      loadConversations()
    }
  }, [user?.id])

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
    }
  }, [activeConversationId])

  const loadConversations = async () => {
    try {
      const response = await fetch(`http://localhost:8000/conversations/${user?.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json()
      
      if (data.conversations) {
        const formattedConversations = data.conversations.map((conv: { id: number; name: string }) => ({
          id: conv.id.toString(),
          name: conv.name,
          messages: [] // Messages will be loaded when conversation is selected
        }))
        setConversations(formattedConversations)
        
        // Set active conversation if none is selected
        if (!activeConversationId && formattedConversations.length > 0) {
          setActiveConversationId(formattedConversations[0].id)
        }
      }
      setLoading(false)
    } catch (error) {
      console.error("Failed to load conversations:", error)
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/conversations/${conversationId}/messages`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json()
      
      if (data.messages) {
        setConversations(prev => prev.map(conversation => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              messages: data.messages.map((msg: { id: number; content: string; sender: "human" | "chatbot" | "bot"; type?: string; timestamp: string }) => ({
                id: msg.id.toString(),
                content: msg.content,
                sender: msg.sender,
                type: msg.type,
                timestamp: new Date(msg.timestamp)
              }))
            }
          }
          return conversation
        }))
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const createConversation = async () => {
    try {
      const response = await fetch("http://localhost:8000/conversations", {
        method: "POST",
        credentials: 'include',
        headers: { 
          "Content-Type": "application/json",
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: user?.id,
          name: `New Chat ${conversations.length + 1}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json()
      if (data.id) {
        const newConversation: Conversation = {
          id: data.id.toString(),
          name: data.name,
          messages: []
        }
        setConversations(prev => [...prev, newConversation])
        setActiveConversationId(newConversation.id)
      }
    } catch (error) {
      console.error("Failed to create conversation:", error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/conversations/${conversationId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      setConversations(prev => {
        const updatedConversations = prev.filter(conversation => conversation.id !== conversationId)
        if (updatedConversations.length === 0) {
          // No conversations left
        } else if (activeConversationId === conversationId) {
          setActiveConversationId(updatedConversations[0].id)
        }
        return updatedConversations
      })
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const renameConversation = async (conversationId: string, newName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/conversations/${conversationId}`, {
        method: "PUT",
        credentials: 'include',
        headers: { 
          "Content-Type": "application/json",
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name: newName })
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      setConversations(prev => prev.map(conversation => 
        conversation.id === conversationId ? { ...conversation, name: newName } : conversation
      ))
    } catch (error) {
      console.error("Failed to rename conversation:", error)
    }
  }

  const sendMessage = async (attachment?: File) => {
    if (!message.trim()) {
      return
    }
    if (!activeConversationId || !user?.id) return

    setSendingMessage(true)
    setFileError(null)

    // Add message to UI immediately
    const tempMessageId = Date.now().toString()
    const newMessage: Message = {
      id: tempMessageId,
      content: message,
      sender: "human",
      timestamp: new Date(),
      attachment: attachment?.name
    }

    setConversations(prev => prev.map(conversation => {
      if (conversation.id === activeConversationId) {
        return {
          ...conversation,
          messages: [...conversation.messages, newMessage]
        }
      }
      return conversation
    }))

    const currentMessage = message;
    setMessage("")
    setSelectedFile(null)

    try {
      let response;
      
      if (attachment) {
        // Create form data for file upload
        const formData = new FormData();

        // Add the file and other data
        formData.append('attachment', attachment);
        formData.append('user_id', user.id);
        formData.append('user_role', user?.publicMetadata?.role as string);
        formData.append('query', currentMessage);
        formData.append('conversation_id', activeConversationId);

        // Send request to chat-with-pdf endpoint
        response = await fetch("http://localhost:8000/chat-with-pdf", {
          method: "POST",
          credentials: 'include',
          body: formData
        });
      } else {
        // Regular chat request
        response = await fetch("http://localhost:8000/chat", {
          method: "POST",
          credentials: 'include',
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            user_role: user?.publicMetadata["role"],
            query: currentMessage,
            current_url: window.location.pathname,
            conversation_id: parseInt(activeConversationId)
          })
        });
      }

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json()
      
      // Add bot response to UI
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response.response || data.response,
        sender: "chatbot",
        type: data.type,
        timestamp: new Date()
      }

      setConversations(prev => prev.map(conversation => {
        if (conversation.id === activeConversationId) {
          return {
            ...conversation,
            messages: [...conversation.messages, botResponse]
          }
        }
        return conversation
      }))
    } catch (error) {
      console.error("Failed to send message:", error)
      
      // Add error message to UI
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't process your request. Please try again later.",
        sender: "chatbot",
        timestamp: new Date()
      }
      
      setConversations(prev => prev.map(conversation => {
        if (conversation.id === activeConversationId) {
          return {
            ...conversation,
            messages: [...conversation.messages, errorMessage]
          }
        }
        return conversation
      }))
    } finally {
      setSendingMessage(false)
    }
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-6xl h-[95vh] p-0 md:h-[95vh]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b">
            <div className="flex h-[60px] items-center px-3">
              <h1 className="text-xl font-semibold flex items-center gap-2 text-slate-700">
                <Bot className="h-6 w-6" style={{ marginTop: "-4px" }} /> 
              AI Chatbot
              </h1>
            </div>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div 
              className={cn(
                "w-72 border-r bg-gray-50 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out",
              )}
            >
              <div className="p-3 border-b flex-shrink-0">
                <Button 
                  onClick={createConversation} 
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-3">
                    {conversations.map((conversation) => (
                      <Button
                        key={conversation.id}
                        variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start group relative",
                          activeConversationId === conversation.id && "bg-gray-200 hover:bg-gray-300"
                        )}
                        onClick={() => setActiveConversationId(conversation.id)}
                      >
                        <div className="flex w-full items-center">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate text-sm">{conversation.name}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-2 invisible group-hover:visible">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Show a prompt to rename the conversation
                                const newName = window.prompt("Rename conversation", conversation.name)
                                if (newName && newName.trim() !== "" && newName !== conversation.name) {
                                  renameConversation(conversation.id, newName)
                                }
                              }}
                              className="h-6 w-6"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(conversation.id)
                              }}
                              className="h-6 w-6"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {activeConversation ? (
                <>
                  <ChatArea 
                    messages={activeConversation.messages} 
                    isTyping={sendingMessage}
                  />
                  
                  <div className="p-4 border-t">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-end space-x-2">
                        <div className="flex-1 relative">
                          <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="min-h-[50px] pr-10"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage(selectedFile || undefined)
                              }
                            }}
                          />
                          <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== 'application/pdf') {
                                  setFileError('Only PDF files are allowed');
                                  return;
                                }
                                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                                  setFileError('File size must be less than 10MB');
                                  return;
                                }
                                setSelectedFile(file);
                                setFileError(null);
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Paperclip className={cn(
                              "h-4 w-4",
                              selectedFile ? "text-blue-600" : "text-gray-500"
                            )} />
                          </Button>
                        </div>
                        <Button
                          type="submit"
                          size="icon"
                          onClick={() => sendMessage(selectedFile || undefined)}
                          disabled={!message.trim() || sendingMessage}
                          className={cn(
                            sendingMessage && "opacity-50 cursor-not-allowed"
                          )}
                          style={{
                            marginBottom: "5px"
                          }} 
                        >
                          <Send className="h-10 w-10" />
                        </Button>
                      </div>
                      {fileError && (
                        <p className="text-red-500 text-xs mt-1">{fileError}</p>
                      )}
                      {selectedFile && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            Attached: {selectedFile.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                            className="h-4 w-4 p-0"
                          >
                            <span className="sr-only">Remove file</span>
                            ×
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-center text-gray-500 mt-2">
                        AI may produce inaccurate information. Your conversations may be used to improve the model.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <div className="max-w-sm text-center">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Welcome to AI Chatbot</h3>
                    <p className="text-gray-500 mb-4">
                      Start a new conversation to get assistance with your questions.
                    </p>
                    <Button onClick={createConversation}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

