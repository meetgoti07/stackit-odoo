import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// POST VOTE ON ANSWER
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const answerId = params.id;
    const body = await request.json();
    const { userId, voteType } = body;

    // Validate required fields
    if (!userId || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, voteType' },
        { status: 400 }
      );
    }

    // Validate vote type
    if (!['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be UPVOTE or DOWNVOTE' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if answer exists and is not deleted
    const answer = await prisma.answer.findFirst({
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

    // Prevent users from voting on their own answers
    if (answer.author.id === userId) {
      return NextResponse.json(
        { error: 'Cannot vote on your own answer' },
        { status: 403 }
      );
    }

    // Check if user has already voted on this answer
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_answerId: {
          userId: userId,
          answerId: answerId
        }
      }
    });

    let voteResult;
    let reputationChange = 0;

    if (existingVote) {
      if (existingVote.type === voteType) {
        // User is trying to vote the same way again - remove the vote (toggle off)
        await prisma.$transaction(async (tx) => {
          await tx.vote.delete({
            where: { id: existingVote.id }
          });

          // Reverse reputation change
          const repChange = existingVote.type === 'UPVOTE' ? -10 : 5; // Reverse the reputation
          await tx.user.update({
            where: { id: answer.author.id },
            data: {
              reputation: {
                increment: repChange
              }
            }
          });
        });

        voteResult = {
          action: 'removed',
          voteType: null,
          message: 'Vote removed successfully'
        };
        reputationChange = voteType === 'UPVOTE' ? -10 : 5;
      } else {
        // User is changing their vote (upvote to downvote or vice versa)
        await prisma.$transaction(async (tx) => {
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: voteType }
          });

          // Calculate reputation change (reverse old vote and apply new vote)
          const oldRepChange = existingVote.type === 'UPVOTE' ? -10 : 5;
          const newRepChange = voteType === 'UPVOTE' ? 10 : -2;
          const totalRepChange = oldRepChange + newRepChange;

          await tx.user.update({
            where: { id: answer.author.id },
            data: {
              reputation: {
                increment: totalRepChange
              }
            }
          });
        });

        voteResult = {
          action: 'changed',
          voteType: voteType,
          message: `Vote changed to ${voteType.toLowerCase()} successfully`
        };
        reputationChange = voteType === 'UPVOTE' ? 20 : -7; // Net change from switching
      }
    } else {
      // New vote
      await prisma.$transaction(async (tx) => {
        await tx.vote.create({
          data: {
            userId: userId,
            answerId: answerId,
            type: voteType
          }
        });

        // Update reputation
        reputationChange = voteType === 'UPVOTE' ? 10 : -2;
        await tx.user.update({
          where: { id: answer.author.id },
          data: {
            reputation: {
              increment: reputationChange
            }
          }
        });

        // Create notification for significant vote milestones
        const currentVoteCount = await tx.vote.count({
          where: { 
            answerId: answerId,
            type: 'UPVOTE'
          }
        });

        // Notify at vote milestones (5, 10, 25, 50, 100, etc.)
        const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
        if (voteType === 'UPVOTE' && milestones.includes(currentVoteCount)) {
          await tx.notification.create({
            data: {
              recipientId: answer.author.id,
              type: 'VOTE_THRESHOLD',
              message: `Your answer has reached ${currentVoteCount} upvotes!`,
              entityId: answerId,
              entityType: 'Answer'
            }
          });
        }
      });

      voteResult = {
        action: 'created',
        voteType: voteType,
        message: `${voteType.toLowerCase()} added successfully`
      };
    }

    // Get updated vote counts
    const voteCounts = await prisma.vote.groupBy({
      by: ['type'],
      where: { answerId: answerId },
      _count: { type: true }
    });

    const upvotes = voteCounts.find(v => v.type === 'UPVOTE')?._count.type || 0;
    const downvotes = voteCounts.find(v => v.type === 'DOWNVOTE')?._count.type || 0;
    const netVotes = upvotes - downvotes;

    // Get updated user's vote status
    const userCurrentVote = await prisma.vote.findUnique({
      where: {
        userId_answerId: {
          userId: userId,
          answerId: answerId
        }
      }
    });

    // Get updated author reputation
    const updatedAuthor = await prisma.user.findUnique({
      where: { id: answer.author.id },
      select: { reputation: true }
    });

    return NextResponse.json({
      success: true,
      vote: voteResult,
      voteCounts: {
        upvotes,
        downvotes,
        netVotes
      },
      userVote: userCurrentVote?.type || null,
      reputationChange,
      authorReputation: updatedAuthor?.reputation || answer.author.reputation,
      answerId,
      questionId: answer.question.id
    });

  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}