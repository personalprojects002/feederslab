import Image from "next/image";
import Link from "next/link";
import ButtonGetStarted from "@/app/components/ButtonGetStarted";
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
      <header className="border-b border-[#E5E7EB] bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 flex h-16 sm:h-20 items-center justify-between">
          <div className="shrink-0 text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-[#0B0B0C]">
            FeedersLab
          </div>
          <nav className="hidden md:flex items-center gap-6 lg:gap-10 text-sm lg:text-base text-gray-600">
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
          <ButtonGetStarted className="max-w-[46vw] truncate whitespace-nowrap rounded-lg px-3 sm:max-w-none sm:px-6 lg:px-7 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-14 md:pb-16 px-5 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto grid items-center gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span
              className="block ml-[0.40em] text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-[0.08em] leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Built for product teams
            </span>
            <h1
              className="mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Collect customer feedback to build better products
            </h1>
            <p className="mt-4 sm:mt-5 max-w-xl text-sm sm:text-base md:text-lg leading-6 sm:leading-7 text-gray-600">
              Create a feedback board in minutes, prioritize features, and build
              products your customers will love.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <ButtonGetStarted className="rounded-lg px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base" />
              <Link
                href="#product"
                className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold border-2 border-black bg-white text-black hover:bg-white hover:text-black active:bg-white active:text-black transition-colors rounded-lg"
              >
                See product
              </Link>
            </div>
            <p className="mt-6 text-xs sm:text-sm text-gray-500">
              Trusted workflow for focused teams.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="overflow-hidden p-2 sm:p-3 md:p-4 shadow-lg rounded-2xl max-w-lg mx-auto">
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

      {/* Why it works section */}
      <section className="bg-white py-12 sm:py-16 md:py-20 lg:py-[5rem] px-5 sm:px-8 lg:px-10 border-t-4 sm:border-t-8 border-b-4 sm:border-b-8 border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 sm:mb-16 md:mb-20">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.8rem] font-bold tracking-tight text-black mb-4 sm:mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Make feedback easy to see and easy to act on
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-black"></div>
          </div>
          <div className="grid gap-6 sm:gap-8 md:gap-12 md:grid-cols-3">
            <div className="space-y-4 sm:space-y-6">
              <div className="text-gray-600 font-bold text-xs sm:text-sm md:text-lg tracking-tight uppercase">
                Problem
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold leading-tight text-black"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Feedback lives in too many places
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Emails, Slack messages, and meeting notes. Important requests
                get lost in the noise, leaving your team guessing what to build
                next.
              </p>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="text-gray-600 font-bold text-xs sm:text-sm md:text-lg tracking-tight uppercase">
                Approach
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold leading-tight text-black"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                One clear place for every request
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Give customers a dedicated space to share and upvote ideas.
                FeedersLab centralizes every insight into a single, organized
                dashboard.
              </p>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="text-gray-600 font-bold text-xs sm:text-sm md:text-lg tracking-tight uppercase">
                Result
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold leading-tight text-black"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Confident prioritization
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Focus your engineering resources on the features that will drive
                the most impact. Build with data-backed confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Flow */}
      <section
        id="product"
        className="py-12 sm:py-16 md:py-20 lg:py-[5rem] px-5 sm:px-8 lg:px-10 bg-gray-50 border-t-4 sm:border-t-8 border-b-4 sm:border-b-8 border-gray-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-24">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.8rem] font-bold tracking-tight text-black"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              A simple system your team actually uses
            </h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gray-300 -translate-y-1/2 z-0"></div>
            <div className="grid gap-5 sm:gap-6 md:gap-8 lg:gap-10 md:grid-cols-3 relative z-10">
              <div className="mx-auto w-full max-w-[20rem] sm:max-w-sm bg-white p-[15px] sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg mb-4 sm:mb-5">
                  1
                </div>
                <h3
                  className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-2.5 text-black"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Create a board
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Set up your public or private feedback board in less than 2
                  minutes. Brand it to match your product.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[20rem] sm:max-w-sm bg-white p-[15px] sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg mb-4 sm:mb-5">
                  2
                </div>
                <h3
                  className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-2.5 text-black"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Collect features feedback
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Direct your users to one link. Let them submit ideas and
                  upvote existing ones from other users.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[20rem] sm:max-w-sm bg-white p-[15px] sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg mb-4 sm:mb-5">
                  3
                </div>
                <h3
                  className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-2.5 text-black"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Plan what ships
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Sort requests by vote count or customer segments. Move the
                  best ideas to your public roadmap.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Pricing */}
      <section
        id="pricing"
        className="py-12 sm:py-16 md:py-20 lg:py-[5.5rem] px-5 sm:px-8 lg:px-10 bg-white border-t-4 sm:border-t-8 border-b-4 sm:border-b-8 border-gray-100"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-8 sm:mb-12 md:mb-16 text-black"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Simple, transparent pricing
          </h2>
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-lg border border-gray-200 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200 gap-4">
              <div>
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-black"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Standard Plan
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Everything you need to grow.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black">
                  $19
                </span>
                <span className="text-gray-600 font-medium text-xs sm:text-sm md:text-base">
                  /mo
                </span>
              </div>
            </div>
            <ul className="space-y-3 sm:space-y-4 md:space-y-6 mb-8 sm:mb-10 md:mb-12">
              <li className="flex items-start md:items-center gap-3 text-black text-sm sm:text-base">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Collect customer feedback</span>
              </li>
              <li className="flex items-start md:items-center gap-3 text-black text-sm sm:text-base">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Unlimited boards</span>
              </li>
              <li className="flex items-start md:items-center gap-3 text-black text-sm sm:text-base">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Admin dashboard</span>
              </li>
              <li className="flex items-start md:items-center gap-3 text-black text-sm sm:text-base">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>24/7 support</span>
              </li>
            </ul>
            <ButtonGetStarted className="w-full rounded-lg py-3 sm:py-4 md:py-5 text-sm sm:text-base" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="py-12 sm:py-16 md:py-20 lg:py-[5.5rem] px-5 sm:px-8 lg:px-10 bg-gray-50 border-t-4 sm:border-t-8 border-b-4 sm:border-b-8 border-gray-100"
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-8 sm:mb-12 md:mb-16 text-center text-black"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="bg-white rounded-lg p-4 sm:p-6 md:p-8 border border-gray-200"
              >
                <h4
                  className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 md:mb-4 text-black"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {item.q}
                </h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-[5.5rem] px-5 sm:px-8 lg:px-10 bg-black text-white border-t-4 sm:border-t-8 border-b-4 sm:border-b-8 border-gray-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-8 sm:mb-10 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Build with clarity. <br />
            Ship with confidence.
          </h2>
          <ButtonGetStarted
            className="rounded-lg py-3 sm:py-4 md:py-5 px-8 sm:px-10 text-sm sm:text-base"
            variant="light"
          />
        </div>
      </section>
    </main>
  );
}
