import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getUserActivity } from "@/lib/actions/user.action"; // Create this
import QuestionCard from "@/components/cards/QuestionCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile | StackIt",
  description: "View your profile, questions, and answers on StackIt.",
};

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) return redirect("/sign-in");

  const userActivity = await getUserActivity({ clerkId: user.id });

  return (
    <section className="w-full">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <img
          src={user.imageUrl}
          alt="Profile"
          className="rounded-full w-28 h-28 object-cover"
        />
        <h2 className="h2-bold text-dark100_light900">{user.fullName}</h2>
        <p className="text-sm text-light-500">@{user.username || user.id.slice(0, 6)}</p>
      </div>

      <div className="mb-8 flex justify-around max-sm:flex-col gap-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-primary-500">{userActivity.reputation}</h3>
          <p className="text-sm text-light-500">Reputation</p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-primary-500">{userActivity.questions.length}</h3>
          <p className="text-sm text-light-500">Questions</p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-primary-500">{userActivity.answers.length}</h3>
          <p className="text-sm text-light-500">Answers</p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4">Your Questions</h3>
        {userActivity.questions.length > 0 ? (
          userActivity.questions.map((question: { _id: any; title: any; tags: any; author: any; upvotes: any; views: any; answers: any; createdAt: any; }) => (
            <QuestionCard
              key={question._id}
              _id={question._id}
              title={question.title}
              tags={question.tags}
              author={question.author}
              upvotes={question.upvotes}
              views={question.views}
              answers={question.answers}
              createdAt={question.createdAt}
            />
          ))
        ) : (
          <p className="text-light-500">You haven’t asked any questions yet.</p>
        )}
      </div>
    </section>
  );
}
