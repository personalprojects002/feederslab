import ButtonLogout from "../components/ButtonLogout";
import NewBoard from "../components/NewBoard";
import BoardList from "../components/BoardList";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ButtonCheckout from "../components/ButtonCheckout";
import ButtonPortal from "../components/ButtonPortal";

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
    <>
      <div className="flex justify-between bg-base-200 p-4 mb-5">
        {/* Show both buttons - backend will determine access */}
        <div className="flex gap-2">
          <ButtonCheckout />
          <ButtonPortal />
        </div>

        <ButtonLogout color="btn btn-neutral" />
      </div>

      <div className="flex justify-center mt-10 mb-12">
        <NewBoard />
      </div>

      {/* Client component that fetches boards from FastAPI backend */}
      <BoardList />
    </>
  );
}
