"use client"
// import necessary libraries 
import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { RightSidebar } from "@/components/sidebar-right/right-sidebar"
import { TagsContent } from "@/components/tags/tags-content"
// main page
export default function TagsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
{/*         using all imported components */}
        <Sidebar />
        <TagsContent />
        <RightSidebar />
      </div>
    </div>
  )
}
