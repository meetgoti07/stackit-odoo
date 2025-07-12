"use client"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor"
import { useQuestion, useCurrentUser, createAnswer, useComments, createComment, voteOnAnswer } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

function AnswerCard({ answer, user, onAnswerUpdate }: { 
  answer: any, 
  user: any, 
  onAnswerUpdate: () => void 
}) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isVoting, setIsVoting] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)
  const [voteState, setVoteState] = useState({
    upvotes: answer.votes?.upvotes || 0,
    downvotes: answer.votes?.downvotes || 0,
    netVotes: answer.votes?.netVotes || answer.voteCount || 0,
    userVote: answer.votes?.userVotes?.find((v: any) => v.userId === user?.id)?.type || null
  })

  const { comments, mutate: mutateComments } = useComments(answer.id)

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      alert('You must be logged in to vote.')
      return
    }

    if (answer.author.id === user.id) {
      alert('You cannot vote on your own answer.')
      return
    }

    setIsVoting(true)
    
    try {
      const response = await voteOnAnswer(answer.id, {
        userId: user.id,
        voteType: voteType
      })

      setVoteState({
        upvotes: response.voteCounts.upvotes,
        downvotes: response.voteCounts.downvotes,
        netVotes: response.voteCounts.netVotes,
        userVote: response.userVote
      })

      // Update the answer data in parent
      onAnswerUpdate()
    } catch (error) {
      console.error('Failed to vote:', error)
      alert(error instanceof Error ? error.message : 'Failed to vote. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      alert('Please enter a comment.')
      return
    }

    if (!user) {
      alert('You must be logged in to comment.')
      return
    }

    if (commentText.trim().length < 5) {
      alert('Comment must be at least 5 characters long.')
      return
    }

    if (commentText.trim().length > 600) {
      alert('Comment must be 600 characters or less.')
      return
    }

    setIsCommenting(true)

    try {
      await createComment(answer.id, {
        content: commentText,
        authorId: user.id
      })

      setCommentText("")
      setShowCommentForm(false)
      mutateComments()
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert(error instanceof Error ? error.message : 'Failed to create comment. Please try again.')
    } finally {
      setIsCommenting(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  return (
    <div className="border border-gray-200 p-4 rounded">
      {answer.isAccepted && (
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            ✓ Accepted Answer
          </span>
        </div>
      )}
      
      <div className="prose max-w-none mb-4">
        <div dangerouslySetInnerHTML={{ __html: answer.content }} />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Voting buttons */}
          <div className="flex items-center gap-1">
            <button 
              className={`p-1 hover:bg-gray-100 rounded ${
                voteState.userVote === 'UPVOTE' ? 'bg-green-100 text-green-600' : ''
              }`}
              onClick={() => handleVote('UPVOTE')}
              disabled={isVoting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="font-medium">{voteState.netVotes}</span>
            <button 
              className={`p-1 hover:bg-gray-100 rounded ${
                voteState.userVote === 'DOWNVOTE' ? 'bg-red-100 text-red-600' : ''
              }`}
              onClick={() => handleVote('DOWNVOTE')}
              disabled={isVoting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <button 
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            Add comment
          </button>
          
          <span className="text-sm text-gray-500">
            {comments.length} comments
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {answer.author.image ? (
            <img
              src={answer.author.image}
              alt={answer.author.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs font-medium">
                {answer.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-sm">
            <div className="font-medium">{answer.author.name}</div>
            <div className="text-gray-500">
              answered {formatTimeAgo(answer.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {comments.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 text-sm">
                {comment.author.image ? (
                  <img
                    src={comment.author.image}
                    alt={comment.author.name}
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <span className="text-gray-900">{comment.content}</span>
                  <span className="text-gray-500 ml-2">
                    - {comment.author.name} {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment form */}
      {showCommentForm && (
        <div className="border-t pt-3 mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              maxLength={600}
            />
            <Button 
              size="sm" 
              onClick={handleSubmitComment}
              disabled={isCommenting || !commentText.trim()}
            >
              {isCommenting ? 'Adding...' : 'Add'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setShowCommentForm(false)
                setCommentText("")
              }}
            >
              Cancel
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {commentText.length}/600 characters
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const questionId = resolvedParams.id
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { question, isLoading, error, mutate } = useQuestion(questionId)
  const { user } = useCurrentUser()

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please enter an answer before submitting.')
      return
    }

    if (!user) {
      alert('You must be logged in to submit an answer.')
      return
    }

    if (answer.trim().length < 10) {
      alert('Answer must be at least 10 characters long.')
      return
    }

    setIsSubmitting(true)
    
    try {
      await createAnswer({
        content: answer,
        authorId: user.id,
        questionId: questionId
      })
      
      // Clear the answer form
      setAnswer("")
      
      // Refresh the question data to show the new answer
      mutate()
      
      alert('Answer submitted successfully!')
    } catch (error) {
      console.error('Failed to submit answer:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="flex-1 p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-white">
        <main className="flex-1 p-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h1>
            <p className="text-gray-600">The question you're looking for doesn't exist or has been deleted.</p>
          </div>
        </main>
      </div>
    )
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
        <div className="text-sm text-gray-500 mb-4">
          Asked {formatTimeAgo(question.createdAt)} • Modified {formatTimeAgo(question.updatedAt)} • Viewed {question.views} times
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <div className="bg-white  p-4 rounded">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: question.description }} />
          </div>
        </div>

        {/* Attempt */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">What I tried</h3>
          <div className="bg-white  p-4 rounded">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: question.attempt }} />
          </div>
        </div>

        {/* Author info */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <div className="flex items-center gap-3">
            {question.author.image ? (
              <img
                src={question.author.image}
                alt={question.author.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {question.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium">{question.author.name}</div>
              <div className="text-sm text-gray-500">{question.author.reputation} reputation</div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4">
            {question.answerCount} {question.answerCount === 1 ? 'Answer' : 'Answers'}
          </h2>
          
          {question.answers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No answers yet. Be the first to answer!
            </div>
          ) : (
            <div className="space-y-4">
              {question.answers.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} user={user} onAnswerUpdate={mutate} />
              ))}
            </div>
          )}
        </div>

        {/* Your Answer Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Your Answer</h2>
          {user ? (
            <>
              <RichTextEditor
                value={answer}
                onChange={setAnswer}
                placeholder="Share your solution to help others..."
                minHeight="150px"
              />
              <Button 
                className="mt-4" 
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answer.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post Your Answer'}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Please log in to post an answer.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}