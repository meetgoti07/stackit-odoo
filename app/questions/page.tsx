"use client"

import { useState } from "react"
import { Header } from "@/components/header/header"
import { Sidebar } from "@/components/sidebar/sidebar"
import { RightSidebar } from "@/components/sidebar-right/right-sidebar"
import { Button } from "@/components/ui/button"
import { QuestionCard } from "@/components/main/question-card"
import { useQuestions } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export default function QuestionsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  
  const router = useRouter()
  const limit = 10
  
  const { questions, pagination, isLoading, error, mutate } = useQuestions(
    currentPage,
    limit,
    selectedTag || undefined,
    searchTerm || undefined,
    sortBy,
    order
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSortBy: string, newOrder: string) => {
    setSortBy(newSortBy)
    setOrder(newOrder)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
    mutate() // Trigger re-fetch
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTag('')
    setCurrentPage(1)
    setSortBy('createdAt')
    setOrder('desc')
  }

  const renderPaginationItems = () => {
    if (!pagination) return null

    const { currentPage: current, totalPages } = pagination
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          href="#"
          onClick={(e) => {
            e.preventDefault()
            handlePageChange(1)
          }}
          isActive={current === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Show ellipsis if there's a gap between 1 and current page
    if (current > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(i)
            }}
            isActive={current === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Show ellipsis if there's a gap between current page and last page
    if (current < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(totalPages)
            }}
            isActive={current === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">All Questions</h1>
              {pagination && (
                <p className="text-gray-600 mt-1">
                  {pagination.totalCount} questions found
                </p>
              )}
            </div>
            <Button 
              className="cursor-pointer" 
              onClick={() => router.push("/questions/ask")}
            >
              Ask Question
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row gap-4">

              {/* Tag Filter */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Filter by tag..."
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2 mt-4">
              <span className="text-sm font-medium text-gray-700 py-2">Sort by:</span>
              <Button
                variant={sortBy === 'createdAt' && order === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('createdAt', 'desc')}
              >
                Newest
              </Button>
              <Button
                variant={sortBy === 'createdAt' && order === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('createdAt', 'asc')}
              >
                Oldest
              </Button>
              <Button
                variant={sortBy === 'views' && order === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('views', 'desc')}
              >
                Most Viewed
              </Button>
              <Button
                variant={sortBy === 'answersCount' && order === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('answersCount', 'desc')}
              >
                Most Answers
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
              <p className="font-medium">Error loading questions</p>
              <p className="text-sm">Please try again later</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => mutate()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Questions List */}
          {!isLoading && !error && (
            <>
              {questions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedTag 
                      ? "Try adjusting your search criteria or filters"
                      : "Be the first to ask a question!"
                    }
                  </p>
                  <Button onClick={() => router.push("/questions/ask")}>
                    Ask the First Question
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {questions.map((question) => (
                      <QuestionCard key={question.id} question={question} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (pagination.hasPrev) {
                                  handlePageChange(currentPage - 1)
                                }
                              }}
                              className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {renderPaginationItems()}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (pagination.hasNext) {
                                  handlePageChange(currentPage + 1)
                                }
                              }}
                              className={!pagination.hasNext ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  {/* Results Summary */}
                  {pagination && (
                    <div className="text-center mt-4 text-sm text-gray-600">
                      Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount} questions
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
