import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { SidebarPost } from "@/lib/api"

interface FeaturedSectionProps {
  title: string
  type: 'trending' | 'hot' | 'featured'
  posts: SidebarPost[]
}

export function FeaturedSection({ title, type, posts }: FeaturedSectionProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return '🔥'
      case 'hot':
        return '💬'
      case 'featured':
        return '⭐'
      default:
        return '📌'
    }
  }

  const getMetadata = (post: SidebarPost, type: string) => {
    switch (type) {
      case 'trending':
        return post.views ? `${post.views} view${post.views === 1 ? '' : 's'}` : '0 views'
      case 'hot':
        return post.answersCount ? `${post.answersCount} answer${post.answersCount === 1 ? '' : 's'}` : '0 answers'
      case 'featured':
        return post.netVotes ? `${post.netVotes} vote${post.netVotes === 1 ? '' : 's'}` : '0 votes'
      default:
        return ''
    }
  }

  const truncateTitle = (title: string, maxLength: number = 65) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
  }

  const getMetadataColor = (type: string) => {
    switch (type) {
      case 'trending':
        return 'text-orange-600'
      case 'hot':
        return 'text-green-600'
      case 'featured':
        return 'text-purple-600'
      default:
        return 'text-gray-500'
    }
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{getIcon(type)}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 italic">No content available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{getIcon(type)}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post, index) => (
          <div key={post.id} className="flex items-start justify-between space-x-3 group">
            <div className="flex items-start space-x-2 flex-1 min-w-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 group-hover:bg-blue-600 transition-colors"></div>
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/questions/${post.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer leading-relaxed block group-hover:underline transition-all duration-200"
                  title={post.title}
                >
                  {truncateTitle(post.title)}
                </Link>
                <div className={`text-xs mt-1 font-medium ${getMetadataColor(type)}`}>
                  {getMetadata(post, type)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
