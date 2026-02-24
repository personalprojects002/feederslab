import axios from "axios";
import { authClient } from "./auth-client";
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});
backendApi.interceptors.request.use(
  async (config) => {
    try {
      const session = await authClient.getSession();
      if (session?.data) {
        console.log(
          "📦 Full Session object:",
          JSON.stringify(session.data, null, 2),
        );
        const sessionData = session.data as any;
        const token =
          sessionData.session?.token ||
          sessionData.token ||
          sessionData.session?.id ||
          sessionData.sessionToken ||
          sessionData.session?.sessionToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("✅ Token attached:", token.substring(0, 20) + "...");
        } else {
          console.error("❌ No token found in session");
          console.log("Session keys:", Object.keys(sessionData));
          if (sessionData.session) {
            console.log(
              "Session.session keys:",
              Object.keys(sessionData.session),
            );
          }
        }
      } else {
        console.warn("⚠️ No session found - user not authenticated");
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
      console.error("Unauthorized - token may be expired");
    }
    return Promise.reject(error);
  },
);

export default backendApi;
