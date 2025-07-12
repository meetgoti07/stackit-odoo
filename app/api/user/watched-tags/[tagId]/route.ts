import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  try {
    // Get the session using getSession
    const data = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!data?.session || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { tagId } = params

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Check if user is watching this tag
    const watchedTag = await prisma.tagsOnUsers.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId
        }
      }
    })

    if (!watchedTag) {
      return NextResponse.json({ error: 'Tag not found in watched list' }, { status: 404 })
    }

    // Remove tag from user's watched tags
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
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
