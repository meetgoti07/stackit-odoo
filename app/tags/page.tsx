"use client"

import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { RightSidebar } from "@/components/sidebar-right/right-sidebar"
import { TagsContent } from "@/components/tags/tags-content"

export default function TagsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <TagsContent />
        <RightSidebar />
      </div>
    </div>
  )
}
