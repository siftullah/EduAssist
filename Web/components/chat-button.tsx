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
          "rounded-full w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-900 shadow-lg",
          "hover:from-gray-600 hover:to-gray-800 transition-all duration-300",
          "flex items-center justify-center [&_svg]:size-8"
        )}
        aria-label="Open chat"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    </div>
  )
}
