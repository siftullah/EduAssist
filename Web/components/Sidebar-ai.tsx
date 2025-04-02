"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreVertical, Edit2, Trash2, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SidebarProps {
  threads: Array<{ id: string; name: string }>
  activeThreadId: string
  onSelectThread: (id: string) => void
  onCreateThread: () => void
  onDeleteThread: (id: string) => void
  onRenameThread: (id: string, newName: string) => void
}

export default function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onRenameThread,
}: SidebarProps) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingThreadName, setEditingThreadName] = useState("")

  const startEditing = (threadId: string, currentName: string) => {
    setEditingThreadId(threadId)
    setEditingThreadName(currentName)
  }

  const saveEdit = () => {
    if (editingThreadId && editingThreadName.trim()) {
      onRenameThread(editingThreadId, editingThreadName.trim())
      setEditingThreadId(null)
      setEditingThreadName("")
    }
  }

  const cancelEdit = () => {
    setEditingThreadId(null)
    setEditingThreadName("")
  }

  return (
    <div className="w-64 border-r flex flex-col bg-background">
      <div className="p-4">
        <Button onClick={onCreateThread} className="w-full justify-start bg-slate-800 hover:bg-slate-950 text-primary-foreground" variant="secondary">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2" style={{ position: "absolute" }}>
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                "group relative mb-2 rounded-md hover:bg-gray-200 transition-colors",
                activeThreadId === thread.id && "bg-gray-100"
              )}
            >
              {editingThreadId === thread.id ? (
                <div className="flex items-center gap-2 p-2">
                  <Input
                    value={editingThreadName}
                    onChange={(e) => setEditingThreadName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit()
                      if (e.key === "Escape") cancelEdit()
                    }}
                    className="h-8"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 px-2">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 px-2">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between p-2 cursor-pointer"
                  onClick={() => onSelectThread(thread.id)}
                >
                  <span className="truncate text-sm">{thread.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => startEditing(thread.id, thread.name)} className="cursor-pointer">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteThread(thread.id)}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

