import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';

// GET ALL COMMENTS FOR A SPECIFIC ANSWER
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const answerId = id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'asc';

    // Check if answer exists and is not deleted
    const answer = await prisma.answer.findUnique({
      where: {
        id: answerId,
        isDeleted: false
      },
      select: {
        id: true,
        content: true,
        author: {
          select: {
            id: true,
            name: true
          }
        },
        question: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    const whereClause = {
      answerId: answerId,
      isDeleted: false,
    };

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            reputation: true
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
    const totalCount = await prisma.comment.count({
      where: whereClause
    });

    // Format response data
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: comment.author,
      answerId: comment.answerId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    return NextResponse.json({
      comments: formattedComments,
      answer: {
        id: answer.id,
        author: answer.author,
        question: answer.question
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
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST NEW COMMENT ON ANSWER
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const answerId = id;
    const body = await request.json();
    const { content, authorId } = body;

    // Validate required fields
    if (!content || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields: content, authorId' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length < 5) {
      return NextResponse.json(
        { error: 'Comment content must be at least 5 characters long' },
        { status: 400 }
      );
    }

    if (content.trim().length > 600) {
      return NextResponse.json(
        { error: 'Comment content must be 600 characters or less' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        image: true,
        reputation: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if answer exists and is not deleted
    const answer = await prisma.answer.findUnique({
      where: {
        id: answerId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    // Create comment and send notifications in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the comment
      const comment = await tx.comment.create({
        data: {
          content: content.trim(),
          authorId,
          answerId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              reputation: true
            }
          }
        }
      });

      // Create notification for answer author (if different from comment author)
      if (answer.author.id !== authorId) {
        await tx.notification.create({
          data: {
            recipientId: answer.author.id,
            type: 'COMMENT_ON_ANSWER',
            message: `${user.name} commented on your answer to "${answer.question.title}"`,
            entityId: comment.id,
            entityType: 'Comment'
          }
        });
      }

      // Create notification for question author (if different from comment author and answer author)
      if (answer.question.author.id !== authorId && answer.question.author.id !== answer.author.id) {
        await tx.notification.create({
          data: {
            recipientId: answer.question.author.id,
            type: 'COMMENT_ON_ANSWER',
            message: `${user.name} commented on an answer to your question "${answer.question.title}"`,
            entityId: comment.id,
            entityType: 'Comment'
          }
        });
      }

      return comment;
    });

    // Format response
    const formattedComment = {
      id: result.id,
      content: result.content,
      author: result.author,
      answerId: result.answerId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };

    return NextResponse.json(
      { 
        comment: formattedComment, 
        message: 'Comment created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}