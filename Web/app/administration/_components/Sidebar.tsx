'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Home, BookOpen, Users, UserCog, MessageSquare, School, BarChart, UserPlus, Layers, FileSpreadsheet } from 'lucide-react'

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/administration" },
  { icon: UserCog, label: "Roles", href: "/administration/roles" },
  { icon: Users, label: "Administrators", href: "/administration/administrators" },
  { icon: School, label: "Departments", href: "/administration/departments" },
  { icon: Layers, label: "Batches", href: "/administration/batches" },
  { icon: BookOpen, label: "Courses", href: "/administration/courses" },
  { icon: Users, label: "Faculty", href: "/administration/faculty" },
  { icon: Users, label: "Students", href: "/administration/students" },
  { icon: School, label: "Classrooms", href: "/administration/classrooms" },
  { icon: Users, label: "Groups", href: "/administration/groups" },
  { icon: MessageSquare, label: "Forums", href: "/administration/forums" },
  { icon: FileSpreadsheet, label: "Bulk Actions", href: "/administration/bulk-actions" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-white text-gray-800 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out shadow-lg">
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          <span className="text-2xl font-bold">EduAssist</span>
        </div>
      </div>
      <nav>
        {sidebarItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200",
              pathname === item.href 
                ? "bg-blue-100 text-blue-800" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

