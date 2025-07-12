import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const data = await auth.api.getSession({
      headers: await headers(),
    })

    if (!data || !data.session || !data.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = data.user.id

    // Get user stats in parallel
    const [
      user,
      questionCount,
      answerCount,
      userBadges,
      watchedTags,
      totalVotes
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          reputation: true,
          image: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.question.count({
        where: { 
          authorId: userId,
          isDeleted: false 
        }
      }),
      prisma.answer.count({
        where: { 
          authorId: userId,
          isDeleted: false 
        }
      }),
      prisma.userBadges.findMany({
        where: { userId },
        include: {
          badge: true
        },
        orderBy: {
          awardedAt: 'desc'
        }
      }),
      prisma.tagsOnUsers.findMany({
        where: { userId },
        include: {
          tag: {
            include: {
              questionTags: {
                select: {
                  questionId: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.vote.count({
        where: {
          answer: {
            authorId: userId
          }
        }
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate next badge progress (simple example)
    const nextBadge = {
      name: 'Autobiographer',
      description: 'Complete your profile information',
      progress: user.name ? 50 : 0,
      target: 100,
      imageUrl: null
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        reputation: user.reputation,
        createdAt: user.createdAt
      },
      stats: {
        questionCount,
        answerCount,
        badgeCount: userBadges.length,
        totalVotes,
        reputation: user.reputation
      },
      badges: userBadges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        imageUrl: ub.badge.imageUrl,
        awardedAt: ub.awardedAt
      })),
      watchedTags: watchedTags.map(wt => ({
        id: wt.tag.id,
        name: wt.tag.name,
        description: wt.tag.description,
        questionCount: wt.tag.questionTags.length,
        followedAt: wt.createdAt
      })),
      nextBadge
    })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
