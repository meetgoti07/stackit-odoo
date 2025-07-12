import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET ALL ANSWERS FOR A SPECIFIC QUESTION
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Validate required questionId parameter
    if (!questionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: questionId' },
        { status: 400 }
      );
    }

    // Check if question exists and is not deleted
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    const whereClause = {
      questionId: questionId,
      isDeleted: false,
    };

    // Define order by clause with accepted answers prioritized
    const orderByClause = sortBy === 'votes' 
      ? [
          { isAccepted: 'desc' as const },
          { votes: { _count: order as 'asc' | 'desc' } }
        ]
      : [
          { isAccepted: 'desc' as const },
          { [sortBy]: order as 'asc' | 'desc' }
        ];

    const answers = await prisma.answer.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            reputation: true,
            bio: true
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

    // Format response data
    const formattedAnswers = answers.map(answer => {
      const upvotes = answer.votes.filter(vote => vote.type === 'UPVOTE').length;
      const downvotes = answer.votes.filter(vote => vote.type === 'DOWNVOTE').length;
      const netVotes = upvotes - downvotes;

      return {
        id: answer.id,
        content: answer.content,
        author: answer.author,
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
      question: {
        id: question.id,
        title: question.title,
        authorId: question.authorId
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch answers' },
      { status: 500 }
    );
  }
}

// POST NEW ANSWER
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, authorId, questionId } = body;

    // Validate required fields
    if (!content || !authorId || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields: content, authorId, questionId' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Answer content must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if question exists and is not deleted
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Create answer and update question answer count in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the answer
      const answer = await tx.answer.create({
        data: {
          content: content.trim(),
          authorId,
          questionId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              reputation: true,
              bio: true
            }
          },
          _count: {
            select: {
              votes: true,
              comments: true
            }
          }
        }
      });

      // Update question answer count
      await tx.question.update({
        where: { id: questionId },
        data: {
          answersCount: {
            increment: 1
          }
        }
      });

      // Create notification for question author (if different from answer author)
      if (question.author.id !== authorId) {
        await tx.notification.create({
          data: {
            recipientId: question.author.id,
            type: 'ANSWER_TO_QUESTION',
            message: `${user.name} answered your question: "${question.title}"`,
            entityId: answer.id,
            entityType: 'Answer'
          }
        });
      }

      return answer;
    });

    // Format response
    const formattedAnswer = {
      id: result.id,
      content: result.content,
      author: result.author,
      questionId: result.questionId,
      isAccepted: result.isAccepted,
      votes: {
        upvotes: 0,
        downvotes: 0,
        netVotes: 0,
        userVotes: []
      },
      comments: [],
      commentCount: 0,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };

    return NextResponse.json(
      { 
        answer: formattedAnswer, 
        message: 'Answer created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { error: 'Failed to create answer' },
      { status: 500 }
    );
  }
}