import { Button } from "@/components/ui/button"
import { QuestionCard } from "./question-card"
import { useRouter } from "next/navigation"
import { useQuestions } from "@/lib/api"

export function QuestionsFeed() {
    const router = useRouter();
    const { questions, isLoading, error } = useQuestions(1, 10);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Interesting posts for you</h2>
                    <Button className={"cursor-pointer"} onClick={() => router.push("/questions/ask")}>Ask Question</Button>
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Interesting posts for you</h2>
                    <Button className={"cursor-pointer"} onClick={() => router.push("/questions/ask")}>Ask Question</Button>
                </div>
                <div className="text-center py-8 text-red-600">
                    Error loading questions. Please try again.
                </div>
            </div>
        );
    }

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-bold">Interesting posts for you</h2>
				<Button className={"cursor-pointer"} onClick={() => router.push("/questions/ask")}>Ask Question</Button>
			</div>
			<p className="text-sm text-gray-600">
				Based on your viewing history and watched tags.{" "}
				<span className="text-blue-600 cursor-pointer">Customize your feed</span>
			</p>

			<div className="space-y-4">
				{questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No questions found. Be the first to ask!
                    </div>
                ) : (
                    questions.map((question) => (
                        <QuestionCard key={question.id} question={question} />
                    ))
                )}
			</div>
		</div>
	)
}
