'use client'

import { useUserStats } from '@/lib/api'

export function WelcomeSection() {
  const { userStats, isLoading, error } = useUserStats()

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-4xl">👋</div>
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-4xl">👋</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600">Find answers to your technical questions and help others answer theirs.</p>
          </div>
        </div>
      </div>
    )
  }

  const firstName = userStats?.user.name?.split(' ')[0] || 'there'

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-4xl">👋</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
          <p className="text-gray-600">Find answers to your technical questions and help others answer theirs.</p>
        </div>
      </div>
    </div>
  )
}
