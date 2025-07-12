"use client"

import { useState } from "react"
import { useTags } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Hash, Users, MessageSquare } from "lucide-react"
import Link from "next/link"

export function TagsContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("popular")
  
  const { tags, pagination, isLoading, error } = useTags(
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
    { value: "popular", label: "Popular" },
    { value: "name", label: "Name" },
    { value: "newest", label: "Newest" }
  ]

  if (error) {
    return (
      <main className="flex-1 p-6">
        <div className="text-center text-red-600">
          Error loading tags: {error.message}
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tags</h1>
        <p className="text-gray-600 mb-6">
          A tag is a keyword or label that categorizes your question with other, similar questions. 
          Using the right tags makes it easier for others to find and answer your question.
        </p>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search tags..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      )}

      {/* Tags Grid */}
      {!isLoading && tags.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 mb-8">
            {tags.map((tag) => (
              <Card key={tag.id} className="hover:shadow-md transition-shadow h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Hash className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                    <CardTitle className="text-lg leading-tight min-w-0">
                      <Link 
                        href={`/questions?tag=${tag.name}`}
                        className="text-blue-600 hover:text-blue-800 break-words"
                      >
                        {tag.name}
                      </Link>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {tag.description && (
                    <CardDescription className="mb-3 text-sm leading-relaxed break-words">
                      {tag.description.length > 100 
                        ? `${tag.description.substring(0, 100)}...`
                        : tag.description
                      }
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <MessageSquare className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{tag.questionCount}</span>
                      <span className="text-xs truncate">questions</span>
                    </div>
                    
                    <div className="flex items-center gap-1 min-w-0">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">{tag.followerCount}</span>
                      <span className="text-xs truncate">followers</span>
                    </div>
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
      {!isLoading && tags.length === 0 && (
        <div className="text-center py-12">
          <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {search ? "No tags found" : "No tags yet"}
          </h3>
          <p className="text-gray-500">
            {search 
              ? `No tags match "${search}". Try adjusting your search.`
              : "Tags will appear here as questions are created."
            }
          </p>
        </div>
      )}
    </main>
  )
}
