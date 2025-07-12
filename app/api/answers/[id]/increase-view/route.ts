import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// POST INCREASE VIEW COUNT FOR ANSWER (increments associated question's view count)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const answerId = id;

    // Check if answer exists and get associated question
    const answer = await prisma.answer.findUnique({
      where: {
        id: answerId,
        isDeleted: false
      },
      select: {
        id: true,
        content: true,
        question: {
          select: {
            id: true,
            title: true,
            views: true
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

    // Increment view count for the associated question
    const updatedQuestion = await prisma.question.update({
      where: { id: answer.question.id },
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
      answerId: answer.id,
      questionId: updatedQuestion.id,
      questionTitle: updatedQuestion.title,
      views: updatedQuestion.views,
      previousViews: answer.question.views,
      message: 'Question view count increased successfully (via answer view)'
    });

  } catch (error) {
    console.error('Error increasing view count for answer:', error);
    return NextResponse.json(
      { error: 'Failed to increase view count' },
      { status: 500 }
    );
  }
}