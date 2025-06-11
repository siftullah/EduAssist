"use client"

import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatButtonProps {
  isOpen: boolean
  onClick: () => void
}

export default function ChatButton({ onClick }: ChatButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-10">
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          "rounded-lg w-16 h-16 bg-gradient-to-r from-sky-400 to-sky-600 shadow-lg",
          "hover:from-sky-500 hover:to-sky-700 transition-all duration-300",
          "flex items-center justify-center [&_svg]:size-8",
        )}
        aria-label="Open chat"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    </div>
  )
}
