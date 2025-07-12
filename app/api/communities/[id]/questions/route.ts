import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET COMMUNITY QUESTIONS
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: communityId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const skip = (page - 1) * limit;

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

    const whereClause: any = {
      communityId,
      isDeleted: false,
    };

    // Search in title and description if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
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
        answers: {
          select: {
            isAccepted: true
          }
        },
        _count: {
          select: {
            answers: true
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
    const totalCount = await prisma.question.count({
      where: whereClause
    });

    // Format response data
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      description: question.description,
      author: question.author,
      tags: question.questionTags.map(qt => qt.tag),
      votes: 0, // You'll need to implement vote counting if needed
      answers: question._count.answers,
      views: question.views,
      hasAcceptedAnswer: question.answers.some(answer => answer.isAccepted),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    }));

    return NextResponse.json({
      questions: formattedQuestions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching community questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community questions' },
      { status: 500 }
    );
  }
}
