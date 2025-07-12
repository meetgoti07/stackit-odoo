import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'reputation' // reputation, newest, name
    
    const offset = (page - 1) * limit

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { bio: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // Build order by clause
    let orderBy: any
    switch (sortBy) {
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'reputation':
      default:
        orderBy = [
          { reputation: 'desc' },
          { name: 'asc' }
        ]
        break
    }

    // Get users with counts
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            questions: true,
            answers: true,
            UserBadges: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        reputation: user.reputation,
        bio: user.bio,
        location: user.location,
        website: user.website,
        role: user.role,
        questionCount: user._count.questions,
        answerCount: user._count.answers,
        badgeCount: user._count.UserBadges,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
