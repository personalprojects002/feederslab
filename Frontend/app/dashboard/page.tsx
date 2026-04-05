import BoardInsightsPanel from "@/app/components/BoardInsightsPanel";
import NewBoard from "@/app/components/NewBoard";

export default async function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Creation flow is placed first to make the primary dashboard action
          immediately discoverable for new and returning users. */}
      <section className="dashboard-home-panel rounded-3xl border p-5 md:p-6 lg:p-7">
        <NewBoard />
      </section>

      {/* Insights live below creation so users can act first, then review data. */}
      <BoardInsightsPanel />
    </div>
  );
}
