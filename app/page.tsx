"use client"

import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MainContent } from "@/components/main/main-content"
import { RightSidebar } from "@/components/sidebar-right/right-sidebar"

export default function StackOverflowHomepage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <MainContent />
        <RightSidebar />
      </div>
    </div>
  )
}
