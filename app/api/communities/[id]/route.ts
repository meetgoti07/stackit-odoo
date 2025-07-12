import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth-client';
import { headers } from 'next/headers';
import { prisma } from "@/lib/prisma";

// GET COMMUNITY BY ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            reputation: true
          }
        },
        members: {
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
        },
        questions: {
          where: {
            isDeleted: false
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                reputation: true
              }
            },
            questionTags: {
              include: {
                tag: true
              }
            },
            _count: {
              select: {
                answers: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            members: true,
            questions: true
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Format response data
    const formattedCommunity = {
      id: community.id,
      name: community.name,
      description: community.description,
      imageUrl: community.imageUrl,
      bannerUrl: community.bannerUrl,
      isPrivate: community.isPrivate,
      owner: community.owner,
      members: community.members.map(member => ({
        ...member.user,
        role: member.role,
        joinedAt: member.joinedAt
      })),
      questions: community.questions.map(question => ({
        id: question.id,
        title: question.title,
        description: question.description,
        author: question.author,
        tags: question.questionTags.map(qt => qt.tag),
        answers: question._count.answers,
        views: question.views,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      })),
      memberCount: community._count.members,
      questionCount: community._count.questions,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt
    };

    return NextResponse.json(formattedCommunity);

  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    );
  }
}

// UPDATE COMMUNITY
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Check if community exists and user is owner or admin
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    const userMembership = community.members[0];
    const isOwner = community.ownerId === session.user.id;
    const isAdmin = userMembership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate, imageUrl, bannerUrl } = body;

    // Update community
    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            reputation: true
          }
        },
        _count: {
          select: {
            members: true,
            questions: true
          }
        }
      }
    });

    const formattedCommunity = {
      id: updatedCommunity.id,
      name: updatedCommunity.name,
      description: updatedCommunity.description,
      imageUrl: updatedCommunity.imageUrl,
      bannerUrl: updatedCommunity.bannerUrl,
      isPrivate: updatedCommunity.isPrivate,
      owner: updatedCommunity.owner,
      memberCount: updatedCommunity._count.members,
      questionCount: updatedCommunity._count.questions,
      createdAt: updatedCommunity.createdAt,
      updatedAt: updatedCommunity.updatedAt
    };

    return NextResponse.json(formattedCommunity);

  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    );
  }
}

// DELETE COMMUNITY
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Check if community exists and user is owner
    const community = await prisma.community.findUnique({
      where: { id }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    if (community.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Permission denied. Only community owner can delete.' },
        { status: 403 }
      );
    }

    // Delete community (this will cascade delete members and update questions)
    await prisma.community.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Community deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    );
  }
}
