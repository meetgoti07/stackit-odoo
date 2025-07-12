'use client'

import { useUserStats } from '@/lib/api'
import { Progress } from "@/components/ui/progress"
import { StatsCard } from "./stats-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function BadgeProgressCard() {
  const { userStats, isLoading, error } = useUserStats()

  if (isLoading) {
    return (
      <StatsCard title="Badge progress">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </StatsCard>
    )
  }

  if (error) {
    return (
      <StatsCard title="Badge progress">
        <div className="text-sm text-gray-500">
          Unable to load badge data
        </div>
      </StatsCard>
    )
  }

  const badges = userStats?.stats.badges || []
  const badgeCount = badges.length

  // For now, let's show the latest badge or a placeholder for next badge
  const latestBadge = badges[0]

  if (badges.length === 0) {
    return (
      <StatsCard title="Badge progress">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-300 text-gray-500 text-xs">
                ?
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium">First Badge</div>
              <div className="text-xs text-gray-500">Answer your first question to earn a badge</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Progress value={0} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0% complete</span>
              <span>0 badges earned</span>
            </div>
          </div>
        </div>
      </StatsCard>
    )
  }

  return (
    <StatsCard title="Badge progress">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            {latestBadge.imageUrl ? (
              <AvatarImage src={latestBadge.imageUrl} alt={latestBadge.name} />
            ) : (
              <AvatarFallback className="bg-blue-500 text-white text-xs">
                {latestBadge.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium">{latestBadge.name}</div>
            <div className="text-xs text-gray-500">{latestBadge.description}</div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Latest badge earned</span>
            <span>{badgeCount} badges total</span>
          </div>
        </div>
      </div>
    </StatsCard>
  )
}
