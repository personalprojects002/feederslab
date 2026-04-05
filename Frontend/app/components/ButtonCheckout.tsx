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
      // Success/cancel URLs are derived from current location so checkout
      // returns users to the exact workspace context they started from.
      const response = await backendApi.post("/billing/create-checkout", {
        successUrl: window.location.href + "/success",
        cancelUrl: window.location.href,
      });

      const checkoutUrl = response.data.url;
      // Full-page redirect is required because Stripe Checkout lives on a
      // hosted domain and cannot be embedded reliably in-app.
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
      className="dashboard-billing-subscribe-btn inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors"
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
