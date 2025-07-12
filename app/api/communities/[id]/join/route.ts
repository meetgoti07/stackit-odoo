import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth-client';
import { headers } from 'next/headers';
import { prisma } from "@/lib/prisma";

// JOIN COMMUNITY
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: communityId } = params;

    // Get the session to extract user ID
    const { data: session, error: sessionError } = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    });

    if (sessionError || !session || !session.session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMembers.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this community' },
        { status: 409 }
      );
    }

    // Create membership
    const membership = await prisma.communityMembers.create({
      data: {
        userId,
        communityId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            reputation: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Successfully joined community',
      membership: {
        ...membership.user,
        role: membership.role,
        joinedAt: membership.joinedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error joining community:', error);
    return NextResponse.json(
      { error: 'Failed to join community' },
      { status: 500 }
    );
  }
}

// LEAVE COMMUNITY
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: communityId } = params;

    // Get the session to extract user ID
    const { data: session, error: sessionError } = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    });

    if (sessionError || !session || !session.session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Prevent owner from leaving their own community
    if (community.ownerId === userId) {
      return NextResponse.json(
        { error: 'Community owner cannot leave. Transfer ownership or delete the community.' },
        { status: 403 }
      );
    }

    // Check if user is a member
    const membership = await prisma.communityMembers.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 404 }
      );
    }

    // Remove membership
    await prisma.communityMembers.delete({
      where: {
        userId_communityId: {
          userId,
          communityId
        }
      }
    });

    return NextResponse.json({
      message: 'Successfully left community'
    }, { status: 200 });

  } catch (error) {
    console.error('Error leaving community:', error);
    return NextResponse.json(
      { error: 'Failed to leave community' },
      { status: 500 }
    );
  }
}
