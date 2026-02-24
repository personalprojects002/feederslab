import ButtonLogout from "../components/ButtonLogout";
import BillingActionButton from "../components/BillingActionButton";
import NewBoard from "../components/NewBoard";
import BoardList from "../components/BoardList";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Note: has_access status will be determined by backend when creating boards
  // For now, we show both buttons and let the backend handle authorization
  // You can enhance this by fetching user data from backend if needed

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 md:px-10">
          <BillingActionButton />
          <ButtonLogout />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
        <section className="flex justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-5 md:p-6">
            <NewBoard />
          </div>
        </section>

        <section className="mt-6">
          <BoardList />
        </section>
      </div>
    </main>
  );
}
