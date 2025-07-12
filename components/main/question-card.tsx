import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { Question } from "@/lib/api"

interface QuestionCardProps {
  question: Question
}

export function QuestionCard({ question }: QuestionCardProps) {
  const router = useRouter()
  
  const stripHtmlTags = (html: string) => {
    // Remove HTML tags using regex
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim() // Remove leading/trailing whitespace
  }
  
  const truncateDescription = (text: string, maxLength: number = 150) => {
    // First strip HTML tags, then truncate
    const plainText = stripHtmlTags(text)
    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength) + "..."
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const handleClick = () => {
    router.push(`/questions/${question.id}`)
  }

  return (
    <Card className="border border-gray-100 hover:border-gray-200 transition-colors shadow-none">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          {/* Vote/Answer Stats */}
          <div className="flex flex-col items-center space-y-2 text-sm text-gray-600 min-w-[80px]">
            <div className="text-center">
              <div className="font-medium">{question.votes}</div>
              <div>votes</div>
            </div>
            <div
              className={`text-center px-2 py-1 rounded ${
                question.hasAcceptedAnswer ? "bg-green-100 text-green-800" : "bg-gray-100"
              }`}
            >
              <div className="font-medium">{question.answers}</div>
              <div>answers</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{question.views}</div>
              <div>views</div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1">
            <h3 
              className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer mb-2"
              onClick={handleClick}
            >
              {question.title}
            </h3>

            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {truncateDescription(question.description)}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {question.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Avatar className="w-4 h-4">
                  <AvatarFallback className="text-xs">
                    {question.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{question.author.name}</span>
                <span>{formatTimeAgo(question.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
