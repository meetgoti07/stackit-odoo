'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCommunities } from '@/lib/hooks/use-communities';
import { Header } from '@/components/header/header';
import { Sidebar } from '@/components/sidebar/sidebar';
import { RightSidebar } from '@/components/sidebar-right/right-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, MessageSquare, Lock, Globe } from 'lucide-react';

export default function CommunitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { communities, pagination, isLoading, isError } = useCommunities(
    page,
    12,
    searchQuery
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Error loading communities</h1>
              <p className="text-gray-600 mt-2">Please try again later.</p>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
                <p className="text-gray-600 mt-2">
                  Discover and join communities to engage in focused discussions
                </p>
              </div>
              <Link href="/communities/create">
                <Button>Create Community</Button>
              </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search communities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>

          {/* Communities Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No communities found' : 'No communities yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Be the first to create a community and start discussions!'}
              </p>
              {!searchQuery && (
                <Link href="/communities/create">
                  <Button>Create First Community</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {communities.map((community: any) => (
                  <Link key={community.id} href={`/communities/${community.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      {community.bannerUrl && (
                        <div className="h-32 bg-cover bg-center rounded-t-lg"
                             style={{ backgroundImage: `url(${community.bannerUrl})` }}>
                        </div>
                      )}
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={community.imageUrl || community.owner.image} />
                            <AvatarFallback>
                              {community.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg truncate">
                                {community.name}
                              </CardTitle>
                              {community.isPrivate ? (
                                <Lock className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Globe className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              by {community.owner.name}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4 line-clamp-2">
                          {community.description || 'No description available'}
                        </CardDescription>
                        
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{community.memberCount} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{community.questionCount} questions</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
