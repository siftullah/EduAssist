"use client";

import React, { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Menu,
  Bell,
  User,
  MessageSquare,
  FileText,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes, getPageTitle } from "@/app/routes";
import { useClerk } from "@clerk/nextjs";
interface SidebarProps {
  children: React.ReactNode;
  userType: "student" | "faculty";
}

const Sidebar: React.FC<SidebarProps> = ({ children, userType }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { signOut } = useClerk();
  const pathname = usePathname();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex bg-gray-100 min-h-screen text-primary">
      <aside
        className={`bg-gray-50 w-64 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:relative lg:translate-x-0 z-10 border-r border-gray-200 shadow-lg`}
      >
        <div className="flex justify-between items-center border-gray-200 bg-white p-4 border-b">
          <Link href="/" className="font-semibold text-2xl">
            EduAssist
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        <nav className="flex-1 px-2 pt-4">
          {routes
            .filter(
              (route) =>
                route.showInSidebar &&
                (!route.userType || route.userType === userType)
            )
            .map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.path} href={route.path}>
                  <Button
                    variant="ghost"
                    className="justify-start hover:bg-gray-200 mb-2 w-full transition-colors"
                  >
                    {Icon && <Icon className="mr-2 w-4 h-4" />}
                    {route.title}
                  </Button>
                </Link>
              );
            })}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden mr-4"
                onClick={toggleSidebar}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <h1 className="font-semibold text-2xl text-gray-900">
                {getPageTitle(pathname)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-gray-200 rounded-full transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-6 h-6" />
                  <span className="-top-1 -right-1 absolute flex justify-center items-center bg-red-600 rounded-full w-5 h-5 font-bold text-white text-xs">
                    3
                  </span>
                </Button>
                {showNotifications && (
                  <div className="top-7 right-0 z-10 absolute border-gray-200 bg-white shadow-xl mt-2 border rounded-lg w-80 overflow-hidden">
                    <div className="border-gray-200 bg-gray-50 p-4 border-b">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Notifications
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <Link
                        href={
                          userType === "faculty"
                            ? "/faculty/discussions"
                            : "/discussions"
                        }
                        onClick={() => setShowNotifications(false)}
                      >
                        <NotificationItem
                          icon={
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                          }
                          title="New Discussion"
                          description="Project Ideas"
                        />
                      </Link>

                      <Link
                        href={
                          userType === "faculty"
                            ? "/faculty/assignments"
                            : "/assignments"
                        }
                        onClick={() => setShowNotifications(false)}
                      >
                        <NotificationItem
                          icon={<FileText className="w-5 h-5 text-green-500" />}
                          title="New Assignment"
                          description="Math Homework"
                        />
                      </Link>

                      <Link
                        href={
                          userType === "faculty"
                            ? "/faculty/announcements"
                            : "/announcements"
                        }
                        onClick={() => setShowNotifications(false)}
                      >
                        <NotificationItem
                          icon={
                            <Megaphone className="w-5 h-5 text-yellow-500" />
                          }
                          title="New Announcement"
                          description="Class Canceled"
                        />
                      </Link>
                    </div>
                    <div className="border-gray-200 bg-gray-50 p-4 border-t">
                      <Button variant="default" className="w-full">
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div> */}
              <Link
                href={
                  userType === "faculty"
                    ? "/faculty/profile"
                    : "/student/profile"
                }
              >
                <Button
                  variant="ghost"
                  className="hover:bg-gray-200 rounded-full transition-colors"
                >
                  <User className="w-6 h-6" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="hover:bg-gray-200 rounded-full transition-colors"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto sm:px-6 lg:px-8 py-6 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NotificationItemProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex items-start p-4">
    <div className="flex-shrink-0">{icon}</div>
    <div className="ml-3">
      <p className="font-medium text-gray-900 text-sm">{title}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  </div>
);

export default Sidebar;
