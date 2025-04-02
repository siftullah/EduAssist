import { Sidebar } from "./_components/Sidebar"
import { Header } from "./_components/Header"
import { Toaster } from "../../components/ui/toaster"
import { ClerkProvider } from "@clerk/nextjs";
import "../../styles/globals.css";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
  <ClerkProvider>
      <html lang="en">
      <body>
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
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

