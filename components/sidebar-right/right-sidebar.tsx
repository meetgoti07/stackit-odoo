import { FeaturedSection } from "./featured-section"
import { useSidebarData } from "@/lib/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200">
      <CardContent className="p-6 text-center">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-sm text-red-600 mb-3">
          Failed to load sidebar content
        </p>
        <button 
          onClick={onRetry}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-gray-400 mb-2">📭</div>
        <p className="text-sm text-gray-500">
          No content available at the moment
        </p>
      </CardContent>
    </Card>
  )
}

export function RightSidebar() {
  const { sections, isLoading, error, mutate } = useSidebarData()

  if (isLoading) {
    return (
      <aside className="w-80 p-6">
        <SidebarSkeleton />
      </aside>
    )
  }

  if (error) {
    return (
      <aside className="w-80 p-6">
        <ErrorState onRetry={() => mutate()} />
      </aside>
    )
  }

  if (!sections || sections.length === 0) {
    return (
      <aside className="w-80 p-6">
        <EmptyState />
      </aside>
    )
  }

  return (
    <aside className="w-80 p-6 space-y-6">
      {sections.map((section, index) => (
        <FeaturedSection 
          key={`${section.type}-${index}`} 
          title={section.title} 
          type={section.type}
          posts={section.posts} 
        />
      ))}
    </aside>
  )
}
