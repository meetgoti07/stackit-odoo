import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET USER'S OWN ANSWERS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const filter = searchParams.get('filter'); // 'accepted', 'unaccepted', or null for all

    // Validate required userId parameter
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        reputation: true,
        bio: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      authorId: userId,
      isDeleted: false,
    };

    // Apply filter if specified
    if (filter === 'accepted') {
      whereClause.isAccepted = true;
    } else if (filter === 'unaccepted') {
      whereClause.isAccepted = false;
    }

    // Define order by clause with votes handling
    const orderByClause = sortBy === 'votes' 
      ? { votes: { _count: order as 'asc' | 'desc' } }
      : { [sortBy]: order as 'asc' | 'desc' };

    const answers = await prisma.answer.findMany({
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
        question: {
          select: {
            id: true,
            title: true,
            views: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        votes: {
          select: {
            id: true,
            type: true,
            userId: true
          }
        },
        comments: {
          where: {
            isDeleted: false
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            votes: true,
            comments: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.answer.count({
      where: whereClause
    });

    // Get statistics for the user's answers
    const stats = await prisma.answer.aggregate({
      where: {
        authorId: userId,
        isDeleted: false
      },
      _count: {
        id: true
      }
    });

    const acceptedAnswersCount = await prisma.answer.count({
      where: {
        authorId: userId,
        isDeleted: false,
        isAccepted: true
      }
    });

    // Format response data
    const formattedAnswers = answers.map(answer => {
      const upvotes = answer.votes.filter(vote => vote.type === 'UPVOTE').length;
      const downvotes = answer.votes.filter(vote => vote.type === 'DOWNVOTE').length;
      const netVotes = upvotes - downvotes;

      return {
        id: answer.id,
        content: answer.content,
        author: answer.author,
        question: {
          id: answer.question.id,
          title: answer.question.title,
          views: answer.question.views,
          createdAt: answer.question.createdAt,
          author: answer.question.author
        },
        isAccepted: answer.isAccepted,
        votes: {
          upvotes,
          downvotes,
          netVotes,
          userVotes: answer.votes.map(vote => ({
            userId: vote.userId,
            type: vote.type
          }))
        },
        comments: answer.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt
        })),
        commentCount: answer._count.comments,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt
      };
    });

    return NextResponse.json({
      answers: formattedAnswers,
      user: user,
      stats: {
        totalAnswers: stats._count.id,
        acceptedAnswers: acceptedAnswersCount,
        acceptanceRate: stats._count.id > 0 
          ? Math.round((acceptedAnswersCount / stats._count.id) * 100) 
          : 0
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      filter: filter || 'all'
    });

  } catch (error) {
    console.error('Error fetching user answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user answers' },
      { status: 500 }
    );
  }
}