import Link from "next/link";
export default async function SuccessPage()
{

    return (

        <div className="min-h-screen flex items-center justify-center">
  <main className="space-y-4 text-center p-10 rounded-xl shadow-md bg-white">
    <h3 className="text-xl font-semibold">Thank you for your Purchase 🖤</h3>
    <Link href="/dashboard" className="btn btn-neutral">Dashboard</Link>
  </main>
</div>


    )
}
