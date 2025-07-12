'use client'

import { useUserStats } from '@/lib/api'
import { StatsCard } from "./stats-card"

export function ReputationCard() {
  const { userStats, isLoading, error } = useUserStats()

  if (isLoading) {
    return (
      <StatsCard title="Reputation">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </StatsCard>
    )
  }

  if (error) {
    return (
      <StatsCard title="Reputation">
        <div className="text-2xl font-bold text-gray-400">--</div>
        <p className="text-xs text-gray-500 mt-1">
          Unable to load reputation data
        </p>
      </StatsCard>
    )
  }

  const reputation = userStats?.stats.reputation || 0
  const reputationChange = userStats?.stats.reputationChange || '+0'

  return (
    <StatsCard title="Reputation">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">{reputation.toLocaleString()}</div>
        {reputationChange !== '+0' && (
          <span className="text-sm text-green-600 font-medium">
            {reputationChange}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Earn reputation by <span className="text-blue-600">Asking</span>,{" "}
        <span className="text-blue-600">Answering</span> & <span className="text-blue-600">Editing</span>.
      </p>
    </StatsCard>
  )
}
