"use client";

import { useState } from "react";
import ChatModal from "@/components/chat-modal";
import ChatButton from "@/components/chat-button";

export default function Aichat() {
  const [isOpen, setIsOpen] = useState(false);

  // Inline styles for the chat container
  const containerStyle = {
    
    color: "hsl(220, 10%, 98%)",
    padding: "10px",
    borderRadius: "8px",
  };

  return (
    <div style={containerStyle}>
      {/* Injecting global styles for scrollbar */}
      <style jsx global>{`
        /* Custom scrollbar for a more polished look */
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: hsl(220, 10%, 15%);
        }

        ::-webkit-scrollbar-thumb {
          background: hsl(220, 10%, 30%);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: hsl(220, 10%, 40%);
        }
      `}</style>

      <ChatButton isOpen={isOpen} onClick={() => setIsOpen(true)} />
      {isOpen && <ChatModal onClose={() => setIsOpen(false)} />}
    </div>
  );
}
