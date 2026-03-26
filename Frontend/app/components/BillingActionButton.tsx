"use client";

import { useEffect, useState } from "react";
import backendApi from "@/lib/backend-api";
import ButtonCheckout from "./ButtonCheckout";
import ButtonPortal from "./ButtonPortal";
import axios from "axios";

type BillingStatus = {
  has_access: boolean;
  customer_id?: string | null;
};

export default function BillingActionButton() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const response = await backendApi.get<BillingStatus>("/billing/status");
        if (isMounted) {
          setStatus(response.data);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && !error.response) {
          console.warn(
            "Billing status request failed at network layer; defaulting to checkout state",
          );
        }
        if (isMounted) {
          setStatus({ has_access: false, customer_id: null });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#0B0B0C]"
        aria-busy="true"
      >
        <span className="loading loading-spinner loading-xs" />
      </button>
    );
  }

  const hasAccess = Boolean(status?.has_access || status?.customer_id);

  return hasAccess ? <ButtonPortal /> : <ButtonCheckout />;
}
