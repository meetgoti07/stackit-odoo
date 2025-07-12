import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET SINGLE QUESTION BY ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = id;

    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
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
        questionTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        answers: {
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
            },
            votes: true,
            _count: {
              select: {
                votes: true,
                comments: true
              }
            }
          },
          orderBy: [
            { isAccepted: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: {
            answers: true
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

    // Increment view count
    await prisma.question.update({
      where: { id: questionId },
      data: { views: { increment: 1 } }
    });

    // Format response data
    const formattedQuestion = {
      id: question.id,
      title: question.title,
      description: question.description,
      attempt: question.attempt,
      author: question.author,
      tags: question.questionTags.map(qt => qt.tag),
      answers: question.answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        author: answer.author,
        isAccepted: answer.isAccepted,
        voteCount: answer.votes.reduce((sum, vote) => 
          sum + (vote.type === 'UPVOTE' ? 1 : -1), 0
        ),
        commentCount: answer._count.comments,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt
      })),
      votes: 0, // Implement question voting if needed
      answerCount: question._count.answers,
      views: question.views + 1, // Return incremented view count
      hasAcceptedAnswer: question.answers.some(answer => answer.isAccepted),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };

    return NextResponse.json({ question: formattedQuestion });

  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// UPDATE QUESTION (PUT - Full Update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = id;
    const body = await request.json();
    const { title, description, attempt, tags, authorId } = body;

    // Check if question exists and user is authorized
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      select: { authorId: true }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (existingQuestion.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this question' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!title || !description || !attempt) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, attempt' },
        { status: 400 }
      );
    }

    // Update question with new tags
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // Delete existing tags
      await tx.tagsOnQuestions.deleteMany({
        where: { questionId }
      });

      // Update question
      return await tx.question.update({
        where: { id: questionId },
        data: {
          title,
          description,
          attempt,
          questionTags: tags && tags.length > 0 ? {
            create: await Promise.all(
              tags.map(async (tagName: string) => {
                const tag = await tx.tag.upsert({
                  where: { name: tagName.toLowerCase() },
                  update: {},
                  create: {
                    name: tagName.toLowerCase(),
                    description: `Questions related to ${tagName}`
                  }
                });
                return { tagId: tag.id };
              })
            )
          } : undefined
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
          questionTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    });

    const formattedQuestion = {
      id: updatedQuestion.id,
      title: updatedQuestion.title,
      description: updatedQuestion.description,
      attempt: updatedQuestion.attempt,
      author: updatedQuestion.author,
      tags: updatedQuestion.questionTags.map(qt => qt.tag),
      views: updatedQuestion.views,
      createdAt: updatedQuestion.createdAt,
      updatedAt: updatedQuestion.updatedAt
    };

    return NextResponse.json({
      question: formattedQuestion,
      message: 'Question updated successfully'
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// PARTIAL UPDATE QUESTION (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = id;
    const body = await request.json();
    const { authorId, ...updateData } = body;

    // Check if question exists and user is authorized
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      select: { authorId: true }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (existingQuestion.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this question' },
        { status: 403 }
      );
    }

    // Handle tags separately if provided
    let updatedQuestion;
    if (updateData.tags) {
      const { tags, ...otherUpdates } = updateData;
      
      updatedQuestion = await prisma.$transaction(async (tx) => {
        // Delete existing tags
        await tx.tagsOnQuestions.deleteMany({
          where: { questionId }
        });

        // Update question with new tags
        return await tx.question.update({
          where: { id: questionId },
          data: {
            ...otherUpdates,
            questionTags: tags && tags.length > 0 ? {
              create: await Promise.all(
                tags.map(async (tagName: string) => {
                  const tag = await tx.tag.upsert({
                    where: { name: tagName.toLowerCase() },
                    update: {},
                    create: {
                      name: tagName.toLowerCase(),
                      description: `Questions related to ${tagName}`
                    }
                  });
                  return { tagId: tag.id };
                })
              )
            } : undefined
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
            questionTags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });
      });
    } else {
      // Update without tags
      updatedQuestion = await prisma.question.update({
        where: { id: questionId },
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
          questionTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    }

    const formattedQuestion = {
      id: updatedQuestion.id,
      title: updatedQuestion.title,
      description: updatedQuestion.description,
      attempt: updatedQuestion.attempt,
      author: updatedQuestion.author,
      tags: updatedQuestion.questionTags.map(qt => qt.tag),
      views: updatedQuestion.views,
      createdAt: updatedQuestion.createdAt,
      updatedAt: updatedQuestion.updatedAt
    };

    return NextResponse.json({
      question: formattedQuestion,
      message: 'Question updated successfully'
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE QUESTION (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = id;
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');

    if (!authorId) {
      return NextResponse.json(
        { error: 'Missing required parameter: authorId' },
        { status: 400 }
      );
    }

    // Check if question exists and user is authorized
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      select: { authorId: true, title: true }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (existingQuestion.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this question' },
        { status: 403 }
      );
    }

    // Soft delete the question
    await prisma.question.update({
      where: { id: questionId },
      data: { isDeleted: true }
    });

    return NextResponse.json({
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
