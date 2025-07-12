import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// POST INCREASE VIEW COUNT FOR QUESTION
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;

    // Check if question exists and is not deleted
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
        isDeleted: false
      },
      select: {
        id: true,
        views: true,
        title: true
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Increment view count
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        views: {
          increment: 1
        }
      },
      select: {
        id: true,
        views: true,
        title: true
      }
    });

    return NextResponse.json({
      success: true,
      questionId: updatedQuestion.id,
      views: updatedQuestion.views,
      previousViews: existingQuestion.views,
      message: 'View count increased successfully'
    });

  } catch (error) {
    console.error('Error increasing view count:', error);
    return NextResponse.json(
      { error: 'Failed to increase view count' },
      { status: 500 }
    );
  }
}