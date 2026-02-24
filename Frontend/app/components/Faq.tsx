"use client";
import { useState } from "react";

export default function FAQ() {
  interface FAQItems {
    question: string;
    answer: string;
  }

  const faq: FAQItems[] = [
    {
      question: "What is this product for?",
      answer:
        "This product helps you build forms quickly. You can use these forms to collect feedback from your users about what features they want.",
    },
    {
      question: "How much does it cost?",
      answer:
        "The price for the service is 19 USD per month. This gives you full access to all features.",
    },
    {
      question: "How is the user feedback collected?",
      answer:
        "Any feedback you collect through the feedback board will be saved in your dashboard.",
    },
    {
      question: "Is there a free trial?",
      answer: "Sorry, we do not offer a free trial.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleHandler(index: number) {
    if (index === openIndex) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  }

  return (
    <section id="faq" className="flex items-center justify-center">
      <div className="w-full max-w-5xl p-10 mb-20 flex flex-col items-center text-center">
        <button className="btn btn-neutral rounded-3xl p-7 mb-4">FAQ</button>

        <h2 className="mt-4 mb-14 text-3xl font-bold">
          Frequently Asked Questions
        </h2>

        <ul className="flex flex-col items-center w-full">
          {faq.map((item, index) => (
            <li
              key={index}
              onClick={() => toggleHandler(index)}
              className="py-4 px-8 mb-3 bg-base-200 rounded-2xl w-full max-w-7xl flex flex-col text-lg cursor-pointer border-b border-black/20"
            >
              <div className="flex justify-between items-center w-full font-bold">
                <span>{item.question}</span>
                <span>
                  {openIndex === index ? (
                    // Minus icon when open
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="ml-6"
                    >
                      <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                    </svg>
                  ) : (
                    // Plus icon when closed
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="ml-6"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                    </svg>
                  )}
                </span>
              </div>

              {openIndex === index ? (
                <div className="w-full mt-4 text-left border-t border-black/10 pt-4 opacity-90">
                  {item.answer}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
