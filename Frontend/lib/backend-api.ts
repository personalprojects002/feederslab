import axios from "axios";
import { authClient } from "./auth-client";

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const backendBaseUrl =
  rawBackendUrl && rawBackendUrl.trim().length > 0
    ? rawBackendUrl.trim()
    : "http://localhost:8000";

const backendApi = axios.create({
  baseURL: backendBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

backendApi.interceptors.request.use(
  async (config) => {
    try {
      const session = await authClient.getSession();

      if (session?.data) {
        let token: string | undefined;

        // Better Auth JWT plugin returns token directly in session.data
        if (
          (session.data as any).token &&
          typeof (session.data as any).token === "string"
        ) {
          token = (session.data as any).token;
        }
        // Fallback: check in session object
        else if (
          (session.data as any).session?.token &&
          typeof (session.data as any).session.token === "string"
        ) {
          token = (session.data as any).session.token;
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("✅ JWT token attached to request");
        } else {
          console.warn("⚠️ No JWT token found in session");
          console.debug("Session structure:", {
            hasData: !!session.data,
            keys: Object.keys(session.data || {}),
            fullData: session.data,
          });
        }
      } else {
        console.debug("ℹ️ No session found - user not authenticated");
      }
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ Unauthorized - token may be expired or invalid");
    }

    if (axios.isAxiosError(error) && !error.response) {
      const details = {
        baseURL: backendApi.defaults.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        code: error.code,
        message: error.message,
      };
      console.error("❌ Network/CORS error reaching backend", details);
    }

    return Promise.reject(error);
  },
);

export default backendApi;
