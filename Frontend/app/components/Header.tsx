import ButtonGetStarted from "./ButtonGetStarted";

export default async function Header() {
  return (
    <main>
      <section className="bg-gray-100">
        <div className="flex justify-center items-center px-3 py-3">
          <div className="w-full max-w-5xl flex justify-between items-center">
            <div className="font-bold text-xl">FeedersLab</div>

            <div className="space-x-3 max-sm:hidden">
              <a
                href="#pricing"
                className=" text-gray-700 hover:text-black link link-hover"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-gray-700 hover:text-black link link-hover"
              >
                FAQ
              </a>
            </div>

            <ButtonGetStarted />
          </div>
        </div>
      </section>
    </main>
  );
}
