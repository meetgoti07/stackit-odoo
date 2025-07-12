'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCommunity, useCommunityQuestions, joinCommunity, leaveCommunity } from '@/lib/hooks/use-communities';
import { Header } from '@/components/header/header';
import { Sidebar } from '@/components/sidebar/sidebar';
import { RightSidebar } from '@/components/sidebar-right/right-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Users, 
  MessageSquare, 
  Lock, 
  Globe, 
  Calendar,
  Settings,
  Plus,
  ArrowLeft
} from 'lucide-react';

interface CommunityPageProps {
  params: {
    id: string;
  };
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const { community, isLoading: communityLoading, isError: communityError, mutate: mutateCommunity } = useCommunity(params.id);
  const { questions, pagination, isLoading: questionsLoading, mutate: mutateQuestions } = useCommunityQuestions(
    params.id,
    page,
    10,
    searchQuery
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleJoinLeave = async () => {
    if (!community) return;
    
    setIsJoining(true);
    try {
      // This is a simplified check - you'll need to implement proper membership checking
      const isMember = false; // Replace with actual membership check
      
      if (isMember) {
        await leaveCommunity(community.id);
      } else {
        await joinCommunity(community.id);
      }
      
      // Refresh community data
      mutateCommunity();
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsJoining(false);
    }
  };

  if (communityError) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Community not found</h1>
              <p className="text-gray-600 mt-2">The community you're looking for doesn't exist.</p>
              <Link href="/communities">
                <Button className="mt-4">Back to Communities</Button>
              </Link>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              {/* Banner skeleton */}
              <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
              
              {/* Header skeleton */}
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  if (!community) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Banner */}
          {community.bannerUrl && (
            <div 
              className="h-48 bg-cover bg-center rounded-lg mb-6"
              style={{ backgroundImage: `url(${community.bannerUrl})` }}
            >
            </div>
          )}

          {/* Community Header */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={community.imageUrl} />
                <AvatarFallback className="text-2xl">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
                  {community.isPrivate ? (
                    <Lock className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Globe className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">
                  {community.description || 'No description available'}
                </p>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{community.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{community.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleJoinLeave}
                    disabled={isJoining}
                    variant="default"
                  >
                    {isJoining ? 'Loading...' : 'Join Community'} {/* Replace with actual membership status */}
                  </Button>
                  
                  <Link href={`/questions/ask?community=${community.id}`}>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Ask Question
                    </Button>
                  </Link>
                  
                  {/* Show settings button if user is owner/admin */}
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Community Owner */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Community Owner</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={community.owner.image} />
                <AvatarFallback>
                  {community.owner.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  href={`/users/${community.owner.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {community.owner.name}
                </Link>
                <p className="text-sm text-gray-600">{community.owner.reputation} reputation</p>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Questions</h2>
              <Link href={`/questions/ask?community=${community.id}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>
              </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            {/* Questions List */}
            {questionsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse border-b pb-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex gap-4">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No questions found' : 'No questions yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Be the first to ask a question in this community!'}
                </p>
                <Link href={`/questions/ask?community=${community.id}`}>
                  <Button>Ask First Question</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {questions.map((question: any) => (
                    <div key={question.id} className="border-b pb-4 last:border-b-0">
                      <Link 
                        href={`/questions/${question.id}`}
                        className="block hover:bg-gray-100 p-3 rounded-lg transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 mb-2 hover:text-blue-600">
                          {question.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {question.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={question.author.image} />
                              <AvatarFallback className="text-xs">
                                {question.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{question.author.name}</span>
                          </div>
                          <span>{question.answers} answers</span>
                          <span>{question.views} views</span>
                          <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                          {question.tags.length > 0 && (
                            <div className="flex gap-1">
                              {question.tags.slice(0, 3).map((tag: any) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
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
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
