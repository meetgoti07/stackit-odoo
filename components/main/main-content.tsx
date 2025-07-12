import { WelcomeSection } from "./welcome-section"
import { ReputationCard } from "./reputation-card"
import { BadgeProgressCard } from "./badge-progress-card"
import { WatchedTagsCard } from "./watched-tags-card"
import { QuestionsFeed } from "./questions-feed"
// Main function
export function MainContent() {
  return (
    <main className="flex-1 p-6">
{/*       Importing the welocme section */}
      <WelcomeSection />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ReputationCard />
        <BadgeProgressCard />
        <WatchedTagsCard />
      </div>

      <QuestionsFeed />
    </main>
  )
}
