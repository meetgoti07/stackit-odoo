import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'popular' // popular, name, newest
    
    const offset = (page - 1) * limit

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
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
      case 'popular':
      default:
        orderBy = [
          { questionTags: { _count: 'desc' } },
          { name: 'asc' }
        ]
        break
    }

    // Get tags with question count
    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            questionTags: true,
            usersFollowing: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.tag.count({
      where: whereClause
    })

    // count the total pages
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        questionCount: tag._count.questionTags,
        followerCount: tag._count.usersFollowing,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString()
      })),
      // pagination
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
