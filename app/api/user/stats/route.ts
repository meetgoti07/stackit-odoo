import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get the session using getSession
    const data = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!data?.session || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id

    // Get user basic info with reputation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        reputation: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user statistics
    const [questionsCount, answersCount, acceptedAnswersCount, totalVotes, badges] = await Promise.all([
      // Questions count
      prisma.question.count({
        where: { 
          authorId: userId,
          isDeleted: false 
        }
      }),
      
      // Answers count
      prisma.answer.count({
        where: { 
          authorId: userId,
          isDeleted: false 
        }
      }),
      
      // Accepted answers count
      prisma.answer.count({
        where: { 
          authorId: userId,
          isAccepted: true,
          isDeleted: false 
        }
      }),
      
      // Total votes received on answers
      prisma.vote.count({
        where: {
          answer: {
            authorId: userId,
            isDeleted: false
          },
          type: 'UPVOTE'
        }
      }),
      
      // User badges
      prisma.userBadges.findMany({
        where: { userId },
        include: {
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true
            }
          }
        },
        orderBy: {
          awardedAt: 'desc'
        }
      })
    ])

    // Calculate reputation change (simplified - you might want more complex logic)
    const reputationChange = totalVotes * 10 + acceptedAnswersCount * 15

    const userStats = {
      user,
      stats: {
        questionsAsked: questionsCount,
        answersGiven: answersCount,
        acceptedAnswers: acceptedAnswersCount,
        totalVotes,
        reputation: user.reputation,
        reputationChange: reputationChange > 0 ? `+${reputationChange}` : '0',
        badges: badges.map(ub => ({
          ...ub.badge,
          awardedAt: ub.awardedAt
        }))
      }
    }

    return NextResponse.json(userStats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
