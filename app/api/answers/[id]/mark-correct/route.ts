import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// POST MARK ANSWER AS CORRECT/INCORRECT
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const answerId = id;
    const body = await request.json();
    const { questionAuthorId, isAccepted } = body;

    // Validate required fields
    if (!questionAuthorId || typeof isAccepted !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: questionAuthorId, isAccepted (boolean)' },
        { status: 400 }
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
            name: true,
            reputation: true
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            authorId: true,
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

    // Verify that the requester is the question author
    if (answer.question.authorId !== questionAuthorId) {
      return NextResponse.json(
        { error: 'Only the question author can mark answers as correct' },
        { status: 403 }
      );
    }

    // Check if answer is already in the desired state
    if (answer.isAccepted === isAccepted) {
      return NextResponse.json(
        { 
          message: `Answer is already ${isAccepted ? 'accepted' : 'not accepted'}`,
          answer: {
            id: answer.id,
            isAccepted: answer.isAccepted,
            authorReputation: answer.author.reputation
          }
        }
      );
    }

    let reputationChange = 0;
    let notificationMessage = '';

    // Perform the operation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (isAccepted) {
        // Mark this answer as accepted and unaccept all other answers for this question
        await tx.answer.updateMany({
          where: {
            questionId: answer.question.id,
            isAccepted: true,
            id: { not: answerId }
          },
          data: {
            isAccepted: false
          }
        });

        // Mark the current answer as accepted
        const updatedAnswer = await tx.answer.update({
          where: { id: answerId },
          data: { isAccepted: true }
        });

        // Award reputation to answer author (+15 for accepted answer)
        reputationChange = 15;
        await tx.user.update({
          where: { id: answer.author.id },
          data: {
            reputation: {
              increment: reputationChange
            }
          }
        });

        // Create notification for answer author (if different from question author)
        if (answer.author.id !== questionAuthorId) {
          notificationMessage = `Your answer to "${answer.question.title}" has been accepted!`;
          await tx.notification.create({
            data: {
              recipientId: answer.author.id,
              type: 'ANSWER_ACCEPTED',
              message: notificationMessage,
              entityId: answerId,
              entityType: 'Answer'
            }
          });
        }

        return updatedAnswer;
      } else {
        // Unaccept the answer
        const updatedAnswer = await tx.answer.update({
          where: { id: answerId },
          data: { isAccepted: false }
        });

        // Remove reputation from answer author (-15 for unaccepted answer)
        reputationChange = -15;
        await tx.user.update({
          where: { id: answer.author.id },
          data: {
            reputation: {
              increment: reputationChange
            }
          }
        });

        return updatedAnswer;
      }
    });

    // Get updated author reputation
    const updatedAuthor = await prisma.user.findUnique({
      where: { id: answer.author.id },
      select: { reputation: true }
    });

    // Check if there are any accepted answers for this question
    const acceptedAnswersCount = await prisma.answer.count({
      where: {
        questionId: answer.question.id,
        isAccepted: true,
        isDeleted: false
      }
    });

    return NextResponse.json({
      success: true,
      message: isAccepted 
        ? 'Answer marked as correct successfully' 
        : 'Answer unmarked as correct successfully',
      answer: {
        id: result.id,
        isAccepted: result.isAccepted,
        authorId: answer.author.id,
        authorName: answer.author.name,
        authorReputation: updatedAuthor?.reputation || answer.author.reputation,
        questionId: answer.question.id,
        questionTitle: answer.question.title
      },
      reputationChange,
      questionHasAcceptedAnswer: acceptedAnswersCount > 0,
      notification: notificationMessage || null
    });

  } catch (error) {
    console.error('Error marking answer as correct:', error);
    return NextResponse.json(
      { error: 'Failed to mark answer as correct' },
      { status: 500 }
    );
  }
}
