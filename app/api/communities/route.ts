import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth-client';
import { headers } from 'next/headers';
import { prisma } from "@/lib/prisma";

// GET ALL COMMUNITIES
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Search in name and description if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const communities = await prisma.community.findMany({
      where: whereClause,
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
      },
      orderBy: {
        [sortBy]: order as 'asc' | 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.community.count({
      where: whereClause
    });

    // Format response data
    const formattedCommunities = communities.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description,
      imageUrl: community.imageUrl,
      bannerUrl: community.bannerUrl,
      isPrivate: community.isPrivate,
      owner: community.owner,
      memberCount: community._count.members,
      questionCount: community._count.questions,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt
    }));

    return NextResponse.json({
      communities: formattedCommunities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

// CREATE NEW COMMUNITY
export async function POST(request: NextRequest) {
  try {
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

    // Check session expiration
    const expiresAt = new Date(session.session.expiresAt).getTime();
    const currentTime = Date.now();
    const isSessionValid = expiresAt > currentTime;

    if (!isSessionValid) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate = false, imageUrl, bannerUrl } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Community name is required' },
        { status: 400 }
      );
    }

    // Check if community name already exists
    const existingCommunity = await prisma.community.findUnique({
      where: { name }
    });

    if (existingCommunity) {
      return NextResponse.json(
        { error: 'Community name already exists' },
        { status: 409 }
      );
    }

    // Create community
    const community = await prisma.community.create({
      data: {
        name,
        description,
        isPrivate,
        imageUrl,
        bannerUrl,
        ownerId: session.user.id,
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

    // Add the owner as a member with OWNER role
    await prisma.communityMembers.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
        role: 'OWNER'
      }
    });

    const formattedCommunity = {
      id: community.id,
      name: community.name,
      description: community.description,
      imageUrl: community.imageUrl,
      bannerUrl: community.bannerUrl,
      isPrivate: community.isPrivate,
      owner: community.owner,
      memberCount: community._count.members + 1, // Include the owner
      questionCount: community._count.questions,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt
    };

    return NextResponse.json(formattedCommunity, { status: 201 });

  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    );
  }
}
