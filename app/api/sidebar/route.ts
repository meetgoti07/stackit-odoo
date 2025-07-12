import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get current date for time calculations
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel execution for better performance
    const [trendingQuestions, hotTopics, topAnsweredQuestions] = await Promise.all([
      // Trending questions (most views in last 7 days)
      prisma.question.findMany({
        where: {
          isDeleted: false,
          createdAt: {
            gte: sevenDaysAgo
          },
          views: {
            gt: 0
          }
        },
        orderBy: [
          { views: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          views: true,
          createdAt: true
        }
      }),

      // Hot topics (most answers in last 24 hours)
      prisma.question.findMany({
        where: {
          isDeleted: false,
          answers: {
            some: {
              createdAt: {
                gte: oneDayAgo
              }
            }
          }
        },
        orderBy: [
          { answersCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 4,
        select: {
          id: true,
          title: true,
          answersCount: true,
          createdAt: true
        }
      }),

      // Questions with most upvoted answers in last 30 days
      prisma.question.findMany({
        where: {
          isDeleted: false,
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        include: {
          answers: {
            where: {
              isDeleted: false
            },
            include: {
              votes: {
                where: {
                  createdAt: {
                    gte: thirtyDaysAgo
                  }
                }
              }
            }
          }
        },
        take: 20
      })
    ]);

    // Calculate featured questions based on vote scores
    const featuredQuestions = topAnsweredQuestions
      .map(question => {
        const totalVotes = question.answers.reduce((sum, answer) => {
          const netVotes = answer.votes.reduce((voteSum, vote) => {
            return voteSum + (vote.type === 'UPVOTE' ? 1 : -1);
          }, 0);
          return sum + netVotes;
        }, 0);
        
        return {
          id: question.id,
          title: question.title,
          netVotes: totalVotes,
          createdAt: question.createdAt,
          answerCount: question.answers.length
        };
      })
      .filter(q => q.netVotes > 0 || q.answerCount > 0) // Only include questions with positive engagement
      .sort((a, b) => {
        // Sort by net votes first, then by answer count
        if (b.netVotes !== a.netVotes) {
          return b.netVotes - a.netVotes;
        }
        return b.answerCount - a.answerCount;
      })
      .slice(0, 5);

    // Fallback data if no results
    const sections = [];

    if (trendingQuestions.length > 0) {
      sections.push({
        title: "🔥 Trending This Week",
        type: "trending" as const,
        posts: trendingQuestions.map(q => ({
          id: q.id,
          title: q.title,
          views: q.views,
          createdAt: q.createdAt.toISOString()
        }))
      });
    }

    if (hotTopics.length > 0) {
      sections.push({
        title: "💬 Hot Topics",
        type: "hot" as const,
        posts: hotTopics.map(q => ({
          id: q.id,
          title: q.title,
          answersCount: q.answersCount,
          createdAt: q.createdAt.toISOString()
        }))
      });
    }

    if (featuredQuestions.length > 0) {
      sections.push({
        title: "⭐ Featured",
        type: "featured" as const,
        posts: featuredQuestions.map(q => ({
          id: q.id,
          title: q.title,
          netVotes: q.netVotes,
          createdAt: q.createdAt.toISOString()
        }))
      });
    }

    // If no dynamic content available, provide fallback
    if (sections.length === 0) {
      const recentQuestions = await prisma.question.findMany({
        where: {
          isDeleted: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          id: true,
          title: true,
          views: true,
          createdAt: true
        }
      });

      if (recentQuestions.length > 0) {
        sections.push({
          title: "📰 Recent Questions",
          type: "trending" as const,
          posts: recentQuestions.map(q => ({
            id: q.id,
            title: q.title,
            views: q.views || 0,
            createdAt: q.createdAt.toISOString()
          }))
        });
      }
    }

    return NextResponse.json({
      sections,
      lastUpdated: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching sidebar data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sidebar data',
        sections: []
      },
      { status: 500 }
    );
  }
}
