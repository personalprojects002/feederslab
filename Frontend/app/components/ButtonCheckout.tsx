"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import backendApi from "@/lib/backend-api";

export default function ButtonCheckout() {
  const [isloading, setIsloading] = useState(false);

  async function checkOutHandler() {
    if (isloading) return;
    setIsloading(true);

    try {
      const response = await backendApi.post("/billing/create-checkout", {
        successUrl: window.location.href + "/success",
        cancelUrl: window.location.href,
      });

      const checkoutUrl = response.data.url;
      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      let errorMessage = "Something went wrong";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      toast.error(errorMessage);
      setIsloading(false);
    }
  }

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0B0B0C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]"
      onClick={checkOutHandler}
    >
      {isloading ? (
        <span className="flex items-center gap-2">
          <span className="loading loading-spinner loading-xs"></span>
          Subscribe
        </span>
      ) : (
        "Subscribe"
      )}
    </button>
  );
}
