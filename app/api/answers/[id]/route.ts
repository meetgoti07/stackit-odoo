import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET SINGLE ANSWER BY ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const answerId = params.id;

    const answer = await prisma.answer.findUnique({
      where: {
        id: answerId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            reputation: true,
            bio: true,
            location: true,
            website: true,
            createdAt: true
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            description: true,
            views: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        votes: {
          select: {
            id: true,
            type: true,
            userId: true,
            createdAt: true
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
                image: true,
                reputation: true
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
      }
    });

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    // Calculate vote statistics
    const upvotes = answer.votes.filter(vote => vote.type === 'UPVOTE').length;
    const downvotes = answer.votes.filter(vote => vote.type === 'DOWNVOTE').length;
    const netVotes = upvotes - downvotes;

    // Format response data
    const formattedAnswer = {
      id: answer.id,
      content: answer.content,
      author: answer.author,
      question: answer.question,
      isAccepted: answer.isAccepted,
      votes: {
        upvotes,
        downvotes,
        netVotes,
        userVotes: answer.votes.map(vote => ({
          userId: vote.userId,
          type: vote.type,
          createdAt: vote.createdAt
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

    return NextResponse.json({ answer: formattedAnswer });

  } catch (error) {
    console.error('Error fetching answer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch answer' },
      { status: 500 }
    );
  }
}

// UPDATE ANSWER (PUT - Full Update)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const answerId = params.id;
    const body = await request.json();
    const { content, authorId } = body;

    // Check if answer exists and user is authorized
    const existingAnswer = await prisma.answer.findUnique({
      where: { id: answerId, isDeleted: false },
      select: { 
        authorId: true,
        questionId: true,
        question: {
          select: {
            title: true
          }
        }
      }
    });

    if (!existingAnswer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    if (existingAnswer.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this answer' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
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

    // Update answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        content: content.trim()
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
        question: {
          select: {
            id: true,
            title: true
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

    const formattedAnswer = {
      id: updatedAnswer.id,
      content: updatedAnswer.content,
      author: updatedAnswer.author,
      question: updatedAnswer.question,
      isAccepted: updatedAnswer.isAccepted,
      commentCount: updatedAnswer._count.comments,
      createdAt: updatedAnswer.createdAt,
      updatedAt: updatedAnswer.updatedAt
    };

    return NextResponse.json({
      answer: formattedAnswer,
      message: 'Answer updated successfully'
    });

  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json(
      { error: 'Failed to update answer' },
      { status: 500 }
    );
  }
}

// PARTIAL UPDATE ANSWER (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const answerId = params.id;
    const body = await request.json();
    const { authorId, questionAuthorId, ...updateData } = body;

    // Check if answer exists
    const existingAnswer = await prisma.answer.findUnique({
      where: { id: answerId, isDeleted: false },
      include: {
        question: {
          select: {
            authorId: true,
            title: true
          }
        }
      }
    });

    if (!existingAnswer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    // Authorization check based on operation
    if (updateData.content !== undefined) {
      // Only answer author can update content
      if (existingAnswer.authorId !== authorId) {
        return NextResponse.json(
          { error: 'Unauthorized to update answer content' },
          { status: 403 }
        );
      }

      // Validate content length
      if (updateData.content.trim().length < 10) {
        return NextResponse.json(
          { error: 'Answer content must be at least 10 characters long' },
          { status: 400 }
        );
      }
      updateData.content = updateData.content.trim();
    }

    if (updateData.isAccepted !== undefined) {
      // Only question author can accept/unaccept answers
      if (existingAnswer.question.authorId !== questionAuthorId) {
        return NextResponse.json(
          { error: 'Unauthorized to accept/unaccept this answer' },
          { status: 403 }
        );
      }

      // If accepting this answer, unaccept all other answers for this question
      if (updateData.isAccepted === true) {
        await prisma.answer.updateMany({
          where: {
            questionId: existingAnswer.questionId,
            isAccepted: true,
            id: { not: answerId }
          },
          data: {
            isAccepted: false
          }
        });

        // Create notification for answer author if different from question author
        if (existingAnswer.authorId !== questionAuthorId) {
          const answerAuthor = await prisma.user.findUnique({
            where: { id: existingAnswer.authorId },
            select: { name: true }
          });

          await prisma.notification.create({
            data: {
              recipientId: existingAnswer.authorId,
              type: 'ANSWER_ACCEPTED',
              message: `Your answer to "${existingAnswer.question.title}" has been accepted!`,
              entityId: answerId,
              entityType: 'Answer'
            }
          });

          // Award reputation to answer author for accepted answer
          await prisma.user.update({
            where: { id: existingAnswer.authorId },
            data: {
              reputation: {
                increment: 15 // +15 reputation for accepted answer
              }
            }
          });
        }
      } else if (updateData.isAccepted === false) {
        // Remove reputation when answer is unaccepted
        await prisma.user.update({
          where: { id: existingAnswer.authorId },
          data: {
            reputation: {
              increment: -15 // Remove 15 reputation when unaccepted
            }
          }
        });
      }
    }

    // Update answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: updateData,
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
            title: true
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

    const formattedAnswer = {
      id: updatedAnswer.id,
      content: updatedAnswer.content,
      author: updatedAnswer.author,
      question: updatedAnswer.question,
      isAccepted: updatedAnswer.isAccepted,
      commentCount: updatedAnswer._count.comments,
      createdAt: updatedAnswer.createdAt,
      updatedAt: updatedAnswer.updatedAt
    };

    return NextResponse.json({
      answer: formattedAnswer,
      message: 'Answer updated successfully'
    });

  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json(
      { error: 'Failed to update answer' },
      { status: 500 }
    );
  }
}

// DELETE ANSWER (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const answerId = params.id;
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');

    if (!authorId) {
      return NextResponse.json(
        { error: 'Missing required parameter: authorId' },
        { status: 400 }
      );
    }

    // Check if answer exists and user is authorized
    const existingAnswer = await prisma.answer.findUnique({
      where: { id: answerId, isDeleted: false },
      select: { 
        authorId: true, 
        questionId: true,
        isAccepted: true
      }
    });

    if (!existingAnswer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    if (existingAnswer.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this answer' },
        { status: 403 }
      );
    }

    // Soft delete the answer and update question answer count
    await prisma.$transaction(async (tx) => {
      await tx.answer.update({
        where: { id: answerId },
        data: { isDeleted: true }
      });

      // Decrement question answer count
      await tx.question.update({
        where: { id: existingAnswer.questionId },
        data: {
          amswersCount: {
            decrement: 1
          }
        }
      });

      // If this was an accepted answer, remove the reputation bonus
      if (existingAnswer.isAccepted) {
        await tx.user.update({
          where: { id: authorId },
          data: {
            reputation: {
              increment: -15 // Remove 15 reputation for deleted accepted answer
            }
          }
        });
      }
    });

    return NextResponse.json({
      message: 'Answer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting answer:', error);
    return NextResponse.json(
      { error: 'Failed to delete answer' },
      { status: 500 }
    );
  }
}
