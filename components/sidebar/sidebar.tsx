"use client"

import { usePathname } from "next/navigation"
import { Home, MessageSquare, Tag, Bookmark, Zap, MessageCircle, FileText, Users, Building2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NavigationItem } from "./navigation-item"
// Starting the sidebar function
export function Sidebar() {
  const pathname = usePathname()
// navigate to defined path
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-14">
      <nav className="p-4 space-y-1">
        <NavigationItem 
          icon={<Home />} 
          label="Home" 
          href="/"
          isActive={isActive("/")} 
        />
        <NavigationItem 
          icon={<MessageSquare />} 
          label="Questions" 
          href="/questions"
          isActive={isActive("/questions")} 
        />
        <NavigationItem 
          icon={<Tag />} 
          label="Tags" 
          href="/tags"
          isActive={isActive("/tags")} 
        />
        <NavigationItem 
          icon={<Users />} 
          label="Users" 
          href="/users"
          isActive={isActive("/users")} 
        />

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">COLLECTIVES</span>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">Communities for your favorite technologies.</p>
        </div>

      </nav>
    </aside>
  )
}
