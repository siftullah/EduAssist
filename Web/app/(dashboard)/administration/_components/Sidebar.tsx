'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { 
  Home, 
  BookOpen, 
  Users, 
  UserCog, 
  MessageSquare, 
  School, 
  Layers, 
  FileSpreadsheet,
  LogOut
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"

const sidebarSections = {
  main: [
    { icon: Home, label: "Dashboard", href: "/administration" },
  ],
  userManagement: [
    { icon: UserCog, label: "Roles", href: "/administration/roles" },
    { icon: Users, label: "Administrators", href: "/administration/administrators" },
    { icon: Users, label: "Faculty", href: "/administration/faculty" },
    { icon: Users, label: "Students", href: "/administration/students" },
  ],
  academicStructure: [
    { icon: School, label: "Departments", href: "/administration/departments" },
    { icon: Layers, label: "Batches", href: "/administration/batches" }, 
    { icon: BookOpen, label: "Courses", href: "/administration/courses" },
    { icon: School, label: "Classrooms", href: "/administration/classrooms" },
  ],
  discussions: [
    { icon: Users, label: "Groups", href: "/administration/groups" },
    { icon: MessageSquare, label: "Forums", href: "/administration/forums" },
  ],
  actions: [
    { icon: FileSpreadsheet, label: "Bulk Actions", href: "/administration/bulk-actions" },
  ]
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-white w-64 min-h-screen py-6 flex flex-col">
      <div className="px-6 mb-8">
        <div className="flex items-center w-full">
          <div className="relative w-full h-12">
            <Image
              src="/fyp-logo.png"
              alt="EduAssist Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {/* Main Section */}
        <div className="space-y-1 mb-6">
          {sidebarSections.main.map((item) => (
            <SidebarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* User Management Section */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              User Management
            </h2>
          </div>
          <div className="space-y-1">
            {sidebarSections.userManagement.map((item) => (
              <SidebarItem key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        {/* Academic Structure Section */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Academic Structure
            </h2>
          </div>
          <div className="space-y-1">
            {sidebarSections.academicStructure.map((item) => (
              <SidebarItem key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        {/* Discussions Section */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Discussions
            </h2>
          </div>
          <div className="space-y-1">
            {sidebarSections.discussions.map((item) => (
              <SidebarItem key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        {/* Actions Section */}
        <div>
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </h2>
          </div>
          <div className="space-y-1">
            {sidebarSections.actions.map((item) => (
              <SidebarItem key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      <LogoutButton />
    </div>
  )
}

function LogoutButton() {
  const { signOut } = useClerk()

  return (
    <div className="px-3 pt-4">
      <Button 
        variant="outline" 
        className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        onClick={() => signOut({ redirectUrl: '/' })}
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Logout</span>
      </Button>
    </div>
  )
}

interface SidebarItemProps {
  item: {
    icon: LucideIcon;
    label: string;
    href: string;
  };
  pathname: string;
}

function SidebarItem({ item, pathname }: SidebarItemProps) {
  const Icon = item.icon
  const isActive = pathname === item.href

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
        isActive 
          ? "text-blue-700 bg-blue-50 shadow-sm" 
          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r" />
      )}
      <Icon className={cn(
        "h-5 w-5 flex-shrink-0",
        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
      )} />
      {item.label}
    </Link>
  )
}

