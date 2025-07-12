import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
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

    const watchedTags = await prisma.tagsOnUsers.findMany({
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
    })

    return NextResponse.json({
      watchedTags: watchedTags.map(wt => ({
        id: wt.tag.id,
        name: wt.tag.name,
        description: wt.tag.description,
        questionCount: wt.tag.questionTags.length,
        followedAt: wt.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching watched tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { tagId, tagName } = await request.json()

    let tag
    if (tagId) {
      tag = await prisma.tag.findUnique({
        where: { id: tagId }
      })
    } else if (tagName) {
      tag = await prisma.tag.findUnique({
        where: { name: tagName.toLowerCase() }
      })
      
      // Create tag if it doesn't exist
      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName.toLowerCase(),
            description: `Questions about ${tagName}`
          }
        })
      }
    }

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Check if already watching
    const existingWatch = await prisma.tagsOnUsers.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId: tag.id
        }
      }
    })

    if (existingWatch) {
      return NextResponse.json(
        { error: 'Already watching this tag' },
        { status: 400 }
      )
    }

    // Add to watched tags
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    await prisma.tagsOnUsers.delete({
      where: {
        userId_tagId: {
          userId,
          tagId
        }
      }
    })

    return NextResponse.json({
      message: 'Tag removed from watched list'
    })

  } catch (error) {
    console.error('Error removing watched tag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
