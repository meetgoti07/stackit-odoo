import useSWR from 'swr'

// Types for API responses
export interface Question {
  id: string
  title: string
  description: string
  attempt: string
  author: {
    id: string
    name: string
    image: string | null
    reputation: number
  }
  tags: Array<{
    id: string
    name: string
  }>
  votes: number
  answers: number
  views: number
  hasAcceptedAnswer: boolean
  createdAt: string
  updatedAt: string
}

export interface QuestionsResponse {
  questions: Question[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CreateQuestionRequest {
  title: string
  description: string
  attempt: string
  tags: string[]
}

export interface CreateQuestionResponse {
  question: Question
  message: string
}

export interface Answer {
  id: string
  content: string
  author: {
    id: string
    name: string
    image: string | null
    reputation: number
  }
  isAccepted: boolean
  voteCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface QuestionDetail {
  id: string
  title: string
  description: string
  attempt: string
  author: {
    id: string
    name: string
    image: string | null
    reputation: number
  }
  tags: Array<{
    id: string
    name: string
  }>
  votes: number
  answers: Answer[]
  views: number
  hasAcceptedAnswer: boolean
  answerCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateAnswerRequest {
  content: string
  authorId: string
  questionId: string
}

export interface CreateAnswerResponse {
  answer: Answer
  message: string
}

export interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    image: string | null
    reputation: number
  }
  answerId: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentRequest {
  content: string
  authorId: string
}

export interface CreateCommentResponse {
  comment: Comment
  message: string
}

export interface VoteRequest {
  userId: string
  voteType: 'UPVOTE' | 'DOWNVOTE'
}

export interface VoteResponse {
  success: boolean
  vote: {
    action: 'created' | 'changed' | 'removed'
    voteType: 'UPVOTE' | 'DOWNVOTE' | null
    message: string
  }
  voteCounts: {
    upvotes: number
    downvotes: number
    netVotes: number
  }
  userVote: 'UPVOTE' | 'DOWNVOTE' | null
  reputationChange: number
  authorReputation: number
  answerId: string
  questionId: string
}

export interface Tag {
  id: string
  name: string
  description: string | null
  questionCount: number
  followerCount: number
  createdAt: string
  updatedAt: string
}

export interface TagsResponse {
  tags: Tag[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface User {
  id: string
  name: string
  email: string
  image: string | null
  reputation: number
  bio: string | null
  location: string | null
  website: string | null
  role: string
  questionCount: number
  answerCount: number
  badgeCount: number
  createdAt: string
  updatedAt: string
}

export interface UsersResponse {
  users: User[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
}

// API hooks using SWR
export function useQuestions(
  page = 1,
  limit = 10,
  tag?: string,
  search?: string,
  sortBy = 'createdAt',
  order = 'desc'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    order,
  })
  
  if (tag) params.append('tag', tag)
  if (search) params.append('search', search)

  const { data, error, isLoading, mutate } = useSWR<QuestionsResponse>(
    `/api/questions?${params.toString()}`,
    fetcher
  )

  return {
    questions: data?.questions || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  }
}

export function useQuestion(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{ question: QuestionDetail }>(
    id ? `/api/questions/${id}` : null,
    fetcher
  )

  return {
    question: data?.question,
    isLoading,
    error,
    mutate,
  }
}

export function useComments(answerId: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    comments: Comment[]
    pagination: any
  }>(
    answerId ? `/api/answers/${answerId}/comments` : null,
    fetcher
  )

  return {
    comments: data?.comments || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  }
}

export function useTags(
  page = 1,
  limit = 20,
  search?: string,
  sortBy = 'popular'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
  })
  
  if (search) params.append('search', search)

  const { data, error, isLoading, mutate } = useSWR<TagsResponse>(
    `/api/tags?${params.toString()}`,
    fetcher
  )

  return {
    tags: data?.tags || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  }
}

export function useUsers(
  page = 1,
  limit = 20,
  search?: string,
  sortBy = 'reputation'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
  })
  
  if (search) params.append('search', search)

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/users?${params.toString()}`,
    fetcher
  )

  return {
    users: data?.users || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  }
}

// API functions for mutations
export async function createQuestion(questionData: CreateQuestionRequest): Promise<CreateQuestionResponse> {
  const response = await fetch('/api/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(questionData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create question')
  }

  return response.json()
}

export async function createAnswer(answerData: CreateAnswerRequest): Promise<CreateAnswerResponse> {
  const response = await fetch('/api/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answerData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create answer')
  }

  return response.json()
}

export async function createComment(answerId: string, commentData: CreateCommentRequest): Promise<CreateCommentResponse> {
  const response = await fetch(`/api/answers/${answerId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create comment')
  }

  return response.json()
}

export async function voteOnAnswer(answerId: string, voteData: VoteRequest): Promise<VoteResponse> {
  const response = await fetch(`/api/answers/${answerId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(voteData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to vote on answer')
  }

  return response.json()
}

export async function getCurrentUser() {
  const response = await fetch('/api/auth/session')
  
  if (!response.ok) {
    throw new Error('Failed to get user session')
  }
  
  return response.json()
}

export function useCurrentUser() {
  const { data, error, isLoading } = useSWR('/api/auth/session', fetcher)
  
  return {
    user: data?.user,
    isLoading,
    error,
  }
}

// Sidebar types and hooks
export interface SidebarPost {
  id: string
  title: string
  views?: number
  answersCount?: number
  netVotes?: number
  createdAt: string
}

export interface SidebarSection {
  title: string
  type: 'trending' | 'hot' | 'featured'
  posts: SidebarPost[]
}

export interface SidebarResponse {
  sections: SidebarSection[]
  lastUpdated: string
}

export function useSidebarData() {
  const { data, error, isLoading, mutate } = useSWR<SidebarResponse>(
    '/api/sidebar',
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: false, // Don't revalidate on window focus
      dedupingInterval: 2 * 60 * 1000, // Dedupe requests for 2 minutes
    }
  )

  return {
    sections: data?.sections || [],
    lastUpdated: data?.lastUpdated,
    isLoading,
    error,
    mutate,
  }
}