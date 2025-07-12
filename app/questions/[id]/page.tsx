"use client"

import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import QuestionPage from "@/components/questions/question-page"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuestionDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <QuestionPage params={params} />
      </div>
    </div>
  )
}
