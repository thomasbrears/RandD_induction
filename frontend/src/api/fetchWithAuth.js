import { auth } from "../firebaseConfig";
import { toast } from "react-toastify";

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://dev-aut-events-induction.vercel.app/api"
    : "http://localhost:8000/api";

let isLoggingOut = false; // Prevent multiple redirects

const fetchWithAuth = async (endpoint, options = {}, retry = true) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    let token = await user.getIdToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        authtoken: token,
        "Content-Type": "application/json",
      },
    });

    // Handle Unauthorized Response
    if (response.status === 401) {
      if (retry) {
        // Try refreshing token and retrying the request
        console.warn("Token might be expired, retrying with a fresh token...");
        const newToken = await user.getIdToken(true); // Force refresh token
        return fetchWithAuth(endpoint, { ...options, headers: { ...options.headers, authtoken: newToken } }, false);
      }

      // If retry already happened, force sign out
      if (!isLoggingOut) {
        isLoggingOut = true;
        toast.warning("Session expired. Please log in again.");
        await auth.signOut();
        window.location.href = "/auth/signin";
      }
      throw new Error("Unauthorized: Token expired or invalid");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in fetchWithAuth:", error);
    throw error;
  }
};

export default fetchWithAuth;