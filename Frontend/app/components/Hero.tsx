import Image from "next/image";
import ButtonGetStarted from "./ButtonGetStarted";
import productDemo from "@/public/productDemo.jpeg";

export default function Hero() {
  return (
    <section className="flex justify-center max-lg:flex-col">
      <div className="w-full max-w-5xl flex gap-20 justify-center items-center py-3 mt-25 mb-25 max-lg:flex-col max-lg:items-center max-lg:text-center">
        <div>
          <Image
            className="w-lg max-md:w-64 rounded-2xl"
            src={productDemo}
            alt="Hero Image"
          />
        </div>

        <div className="space-y-5 w-2/3">
          <h1 className="font-bold text-4xl lg:text-5xl text-left mb-6 max-lg:text-center">
            Collect customer feedback to build better products
          </h1>

          <p className="text-left mb-10 max-lg:text-center">
            Create a feedback board in minutes, prioritize features, and build
            products your customers will love.
          </p>

          <ButtonGetStarted />
        </div>
      </div>
    </section>
  );
}
