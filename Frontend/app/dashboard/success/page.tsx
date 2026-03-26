import Link from "next/link";

export default async function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-8">
      <main className="w-full max-w-md text-center space-y-8 sm:space-y-10">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Payment Successful
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Thank you for your purchase! Your subscription is now active and ready to use.
          </p>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 space-y-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className="text-sm font-semibold text-black bg-white px-3 py-1 rounded-full border border-black">Active</span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plan</span>
            <span className="text-sm font-semibold text-black">Standard Plan</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full bg-black text-white px-8 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-lg hover:bg-gray-900 transition-all duration-200 active:scale-95"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Go to Dashboard
        </Link>

        {/* Secondary Link */}
        <Link
          href="/"
          className="inline-flex items-center justify-center text-sm sm:text-base text-gray-600 hover:text-black transition-colors"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
