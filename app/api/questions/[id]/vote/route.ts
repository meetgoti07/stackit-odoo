import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// POST VOTE ON ANSWER
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const body = await request.json();
    const { answerId, userId, voteType } = body;

    // Validate required fields
    if (!answerId || !userId || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields: answerId, userId, voteType' },
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

    // Check if answer exists and belongs to the question
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        questionId: questionId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            reputation: true
          }
        }
      }
    });

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found or does not belong to this question' },
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
      answerId,
      questionId
    });

  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}
