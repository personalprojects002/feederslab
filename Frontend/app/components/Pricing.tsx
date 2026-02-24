import ButtonGetStarted from "./ButtonGetStarted";

export default function Pricing() {
  const benefits: string[] = [
    "Collect customer feedback",
    "Unlimited boards",
    "Admin dashboard",
    "24/7 support",
  ];

  return (
    <section
      id="pricing"
      className="bg-base-200 flex items-center justify-center min-h-screen"
    >
      <div className="w-full max-w-5xl p-10 mb-25 flex flex-col items-center text-center">
        <button className="btn btn-neutral rounded-3xl p-7 mb-4">
          Pricing
        </button>

        <h2 className="mt-4 mb-14 text-3xl font-bold">
          A pricing that adapts to your needs
        </h2>

        <div className="bg-white p-7 rounded-3xl w-80 max-md:w-64">
          <div>
            <div className="flex items-baseline gap-1 mb-5 mt-1">
              <span className="text-3xl font-bold">$19</span>
              <span className="text-sm text-gray-600 relative top-1">
                /Month
              </span>
            </div>

            <ul className="list-none space-y-4 text-left">
              {benefits.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11.5 14.5 16 9" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <ButtonGetStarted className="rounded-lg" width="w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
