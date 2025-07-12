"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { RightSidebar } from "@/components/sidebar-right/right-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Calendar, Star, MessageSquare, Award } from "lucide-react"

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  // This is a placeholder - in a real app you'd fetch user data by ID
  // For now, we'll show a simple placeholder
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="text-center py-12">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl bg-gray-200">
                U
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold mb-2">User Profile</h1>
            <p className="text-gray-600 mb-4">User ID: {params.id}</p>
            <p className="text-gray-500">
              User profile page is coming soon! This will show detailed user information, 
              their questions, answers, and activity.
            </p>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  )
}
