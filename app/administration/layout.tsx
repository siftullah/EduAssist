"use client"

import { Sidebar } from "./_components/Sidebar"
import { Header } from "./_components/Header"
import { Toaster } from "../../components/ui/toaster"
import { ClerkProvider } from "@clerk/nextjs";
import "../../styles/globals.css";
import { useState } from "react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [showSidebar, setShowSidebar] = useState(true);

  return (
  <ClerkProvider>
      <html lang="en">
        <head>
          <title>EduAssist | Administration</title>
          <meta name="description" content="EduAssist Administration Dashboard" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </head>
      <body>
    <div className="flex h-screen bg-slate-50">
      { showSidebar && (<Sidebar />)}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setShowSidebar={setShowSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      
    </div>
    <Toaster />
    </body>
    </html>
    </ClerkProvider>
  )
}
