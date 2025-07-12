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

    // Get user's watched tags
    const watchedTags = await prisma.tagsOnUsers.findMany({
      where: { userId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                questionTags: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedTags = watchedTags.map(watchedTag => ({
      id: watchedTag.tag.id,
      name: watchedTag.tag.name,
      description: watchedTag.tag.description,
      questionsCount: watchedTag.tag._count.questionTags,
      watchedAt: watchedTag.createdAt
    }))

    return NextResponse.json({
      watchedTags: formattedTags,
      total: formattedTags.length
    })
  } catch (error) {
    console.error('Error fetching watched tags:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session using getSession
    const data = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!data?.session || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { tagName } = await request.json()

    if (!tagName || typeof tagName !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    // Check if tag exists, create if it doesn't
    let tag = await prisma.tag.findUnique({
      where: { name: tagName.toLowerCase() }
    })

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tagName.toLowerCase(),
          description: `Questions related to ${tagName}`
        }
      })
    }

    // Check if user is already watching this tag
    const existingWatch = await prisma.tagsOnUsers.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId: tag.id
        }
      }
    })

    if (existingWatch) {
      return NextResponse.json({ error: 'Tag is already being watched' }, { status: 400 })
    }

    // Add tag to user's watched tags
    await prisma.tagsOnUsers.create({
      data: {
        userId,
        tagId: tag.id
      }
    })

    return NextResponse.json({
      message: 'Tag added to watched list',
      tag: {
        id: tag.id,
        name: tag.name,
        description: tag.description
      }
    })
  } catch (error) {
    console.error('Error adding watched tag:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
