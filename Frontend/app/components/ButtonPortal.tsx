"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import backendApi from "@/lib/backend-api";

export default function ButtonPortal() {
  const [isloading, setIsloading] = useState(false);

  async function portalHandler() {
    if (isloading) return;
    setIsloading(true);

    try {
      const response = await backendApi.post("/billing/create-portal");

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
    <button className="btn btn-primary py-5" onClick={portalHandler}>
      {isloading ? (
        <span className="flex items-center gap-2">
          <span className="loading loading-spinner loading-xs"></span>
          Billing
        </span>
      ) : (
        "Billing"
      )}
    </button>
  );
}
