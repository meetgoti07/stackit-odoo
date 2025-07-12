"use client"

import { useState } from "react"
import { useUsers } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Globe, MessageSquare, Award, Star } from "lucide-react"
import Link from "next/link"

export function UsersContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("reputation")
  
  const { users, pagination, isLoading, error } = useUsers(
    currentPage,
    20,
    search,
    sortBy
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const sortOptions = [
    { value: "reputation", label: "Reputation" },
    { value: "name", label: "Name" },
    { value: "newest", label: "Newest" }
  ]

  const formatReputation = (reputation: number) => {
    if (reputation >= 1000) {
      return `${(reputation / 1000).toFixed(1)}k`
    }
    return reputation.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "today"
    if (diffInDays === 1) return "yesterday"
    if (diffInDays < 30) return `${diffInDays} days ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  if (error) {
    return (
      <main className="flex-1 p-6">
        <div className="text-center text-red-600">
          Error loading users: {error.message}
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Users</h1>
        <p className="text-gray-600 mb-6">
          Browse top users and their contributions to the community.
        </p>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </form>
          
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSortBy(option.value)
                  setCurrentPage(1)
                }}
                className="whitespace-nowrap"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      )}

      {/* Users Grid */}
      {!isLoading && users.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 mb-8">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={user.image || ""} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight">
                        <Link 
                          href={`/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-800 break-words"
                        >
                          {user.name}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="font-medium">{formatReputation(user.reputation)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {user.role !== 'user' && (
                    <Badge variant="secondary" className="w-fit mt-2">
                      {user.role}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {user.bio && (
                    <CardDescription className="text-sm leading-relaxed break-words">
                      {user.bio.length > 80 
                        ? `${user.bio.substring(0, 80)}...`
                        : user.bio
                      }
                    </CardDescription>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {user.location && (
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.location}</span>
                      </div>
                    )}
                    
                    {user.website && (
                      <div className="flex items-center gap-1 min-w-0">
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <a 
                          href={user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate"
                        >
                          {user.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{user.questionCount + user.answerCount}</span>
                      <span className="text-xs">posts</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{user.badgeCount}</span>
                      <span className="text-xs">badges</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Member for {formatDate(user.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="min-w-[80px]"
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600 px-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="min-w-[60px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-12">
          <Avatar className="w-16 h-16 mx-auto mb-4">
            <AvatarFallback className="text-2xl bg-gray-200">
              ?
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {search ? "No users found" : "No users yet"}
          </h3>
          <p className="text-gray-500">
            {search 
              ? `No users match "${search}". Try adjusting your search.`
              : "Users will appear here as they join the community."
            }
          </p>
        </div>
      )}
    </main>
  )
}
