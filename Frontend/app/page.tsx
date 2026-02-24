import Image from "next/image";
import Link from "next/link";
import ButtonGetStarted from "./components/ButtonGetStarted";
import productDemo from "@/public/productDemo.jpeg";

export default function Home() {
  const faqs = [
    {
      q: "Who is this for?",
      a: "Product teams who want one clean place for feedback and a clear way to decide what ships next.",
    },
    {
      q: "How fast can we start?",
      a: "You can set up your first board in minutes and start collecting feedback the same day.",
    },
    {
      q: "How does billing work?",
      a: "Checkout is built in, and you can manage billing right from your account.",
    },
    {
      q: "Will the team need training?",
      a: "No. The flow is simple, so most teams can use it right away.",
    },
  ];

  return (
    <main>
      <header className="border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
        <div className="shell flex h-20 items-center justify-between">
          <div className="text-xl font-semibold tracking-tight text-[#0B0B0C] md:text-2xl">
            FeedersLab
          </div>
          <nav className="hidden items-center gap-10 text-base text-gray-600 md:flex">
            <a href="#product" className="hover:text-black transition-colors">
              Product
            </a>
            <a href="#pricing" className="hover:text-black transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-black transition-colors">
              FAQ
            </a>
          </nav>
          <ButtonGetStarted className="rounded-xl px-7 py-3 text-base" />
        </div>
      </header>

      <section className="pt-10 pb-12 md:pt-12 md:pb-14">
        <div className="shell grid items-center gap-8 md:gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="eyebrow">Built for product teams</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Collect customer feedback to build better products
            </h1>
            <p className="muted-text mt-5 max-w-xl text-base leading-7 md:text-lg">
              Create a feedback board in minutes, prioritize features, and build
              products your customers will love.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonGetStarted className="rounded-xl px-6 py-3" />
              <Link href="#product" className="btn-secondary-premium">
                See product
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Trusted workflow for focused teams.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="surface overflow-hidden p-2 shadow-sm">
              <Image
                src={productDemo}
                alt="FeedersLab product interface"
                className="h-auto w-full rounded-xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10 pb-10 border-y border-[#E5E7EB] bg-white/70 md:pt-14 md:pb-12">
        <div className="shell">
          <div className="mb-8 max-w-3xl">
            <span className="eyebrow">Why this works</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Make feedback easy to see and{" "}
              <span className="whitespace-nowrap">easy to act on</span>
            </h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <article className="border-l-2 border-[#E5E7EB] pl-5">
              <p className="text-xs font-medium tracking-wide text-gray-500">
                Problem
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                Feedback lives in too many places
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Requests get lost in calls, chats, and scattered notes.
              </p>
            </article>
            <article className="border-l-2 border-[#E5E7EB] pl-5">
              <p className="text-xs font-medium tracking-wide text-gray-500">
                Approach
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                One clear place for every request
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Capture demand once and keep the whole team aligned.
              </p>
            </article>
            <article className="border-l-2 border-[#E5E7EB] pl-5">
              <p className="text-xs font-medium tracking-wide text-gray-500">
                Result
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                Confident prioritization
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Decisions are faster because the signal stays visible.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="product" className="pt-12 pb-12 md:pt-14 md:pb-14">
        <div className="shell">
          <div className="mb-12 max-w-2xl">
            <span className="eyebrow">Product flow</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              A simple system your team actually uses
            </h2>
            <p className="muted-text mt-4 text-sm leading-7 md:text-base">
              Set up a board, collect requests, and plan what ships without
              losing context.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <article className="border-l-2 border-[#E5E7EB] pl-5">
              <p className="text-sm text-gray-500">Step 01</p>
              <h3 className="mt-2 text-xl font-semibold">Create a board</h3>
              <p className="muted-text mt-3 text-sm leading-7 md:text-base">
                Name it once and share it with your team in minutes.
              </p>
            </article>
            <article className="border-l-2 border-[#E5E7EB] pl-5">
              <p className="text-sm text-gray-500">Step 02</p>
              <h3 className="mt-2 text-xl font-semibold">
                Collect features feedback
              </h3>
              <p className="muted-text mt-3 text-sm leading-7 md:text-base">
                Keep all requests together so nothing slips through.
              </p>
            </article>
            <article className="border-l-2 border-[#E5E7EB] pl-5">
              <p className="text-sm text-gray-500">Step 03</p>
              <h3 className="mt-2 text-xl font-semibold">Plan what ships</h3>
              <p className="muted-text mt-3 text-sm leading-7 md:text-base">
                Decide faster because the tradeoffs are visible.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="pt-12 pb-14 md:pt-14 md:pb-16 bg-white border-y border-[#E5E7EB]"
      >
        <div className="shell">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Simple pricing that stays out of your way
            </h2>
            <p className="muted-text mt-3 text-sm leading-7 md:text-base">
              One plan with everything you need to collect feedback, manage
              boards, and keep the team aligned.
            </p>
          </div>

          <div className="mx-auto surface w-full max-w-sm py-6 pl-5 pr-3 md:py-6 md:pl-6 md:pr-4">
            <p className="text-sm font-medium text-gray-500">Monthly</p>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-[#0B0B0C]">$19</span>
              <span className="text-sm text-gray-500">per month</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="block h-3 w-3"
                  >
                    <path
                      d="M5 10.5L8.2 13.5L15 6.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>Collect customer feedback</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="block h-3 w-3"
                  >
                    <path
                      d="M5 10.5L8.2 13.5L15 6.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>Unlimited boards</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="block h-3 w-3"
                  >
                    <path
                      d="M5 10.5L8.2 13.5L15 6.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>Admin dashboard</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="block h-3 w-3"
                  >
                    <path
                      d="M5 10.5L8.2 13.5L15 6.8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>24/7 support</span>
              </li>
            </ul>
            <div className="mt-5">
              <ButtonGetStarted className="rounded-xl px-3 py-2 text-sm text-center" />
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="shell">
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Straight answers before you start
            </h2>
          </div>

          <div className="divide-y divide-[#E5E7EB] border-t border-[#E5E7EB]">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="grid gap-3 py-6 md:grid-cols-[220px_1fr] md:items-start"
              >
                <h3 className="text-base font-semibold tracking-tight text-[#0B0B0C]">
                  {item.q}
                </h3>
                <p className="muted-text text-sm leading-7 md:text-base">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="shell">
          <div className="surface p-8 text-center md:p-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Build with clarity. Ship with confidence.
            </h2>
            <p className="muted-text mx-auto mt-4 max-w-2xl leading-7">
              Start your first feedback board and create a reliable product
              decision system for your team.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonGetStarted className="rounded-xl px-6 py-3" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
