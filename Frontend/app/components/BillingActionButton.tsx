"use client";

import { useEffect, useState } from "react";
import backendApi, { initializeBackendAuthSession } from "@/lib/backend-api";
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
      let shouldStopLoading = true;

      try {
        const initialized = await initializeBackendAuthSession();
        if (!initialized) {
          // Auth flow will redirect; keep loading to avoid wrong fallback button flash.
          shouldStopLoading = false;
          return;
        }

        const response = await backendApi.get<BillingStatus>("/billing/status");
        if (isMounted) {
          setStatus(response.data);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const recovered = await initializeBackendAuthSession();
          if (recovered) {
            try {
              const retryResponse =
                await backendApi.get<BillingStatus>("/billing/status");
              if (isMounted) {
                setStatus(retryResponse.data);
              }
              return;
            } catch {
              // If retry also fails, allow global auth flow to redirect.
              shouldStopLoading = false;
              return;
            }
          }

          // Let global auth redirect handle unrecoverable 401.
          shouldStopLoading = false;
          return;
        }

        if (axios.isAxiosError(error) && !error.response) {
          console.warn(
            "Billing status request failed at network layer; defaulting to checkout state",
          );
        }
        if (isMounted) {
          setStatus({ has_access: false, customer_id: null });
        }
      } finally {
        if (isMounted && shouldStopLoading) {
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
