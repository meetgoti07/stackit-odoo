"use client"
// importing necessary libraries
import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { RightSidebar } from "@/components/sidebar-right/right-sidebar"
import { UsersContent } from "@/components/users/users-content"
// main function
export default function UsersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
{/*         using all the necessary components */}

        <Sidebar />
        <UsersContent />
        <RightSidebar />
      </div>
    </div>
  )
}
