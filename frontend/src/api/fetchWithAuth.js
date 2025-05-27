import { auth } from "../firebaseConfig";
import { toast } from "react-toastify";

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://dev-aut-events-induction.vercel.app/api"
    : "http://localhost:8000/api";

let isLoggingOut = false; // Prevent multiple redirects

/**
 * Makes an authenticated API request with the current user's token
 * @param {string} endpoint - The API endpoint to call (starting with /)
 * @param {Object} options - Fetch options
 * @param {boolean} retry - Whether to retry with a fresh token if authentication fails
 * @returns {Promise<any>} - The API response
 */
const fetchWithAuth = async (endpoint, options = {}, retry = true) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    let token = await user.getIdToken();
    
    // Set up our request headers with authentication
    const headers = {
      ...options.headers,
      authtoken: token,
    };
    
    // Only set Content-Type to application/json if we're not handling binary data
    if (options.responseType !== 'blob') {
      headers['Content-Type'] = 'application/json';
    }
    
    // Create the fetch request with proper headers
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
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
    
    // Handle different response types
    if (options.responseType === 'blob') {
      // For binary data, return a response that the caller can process
      return response;
    } else if (options.responseType === 'text') {
      return response.text();
    } else {
      // Default to JSON
      return response.json();
    }
  } catch (error) {
    console.error("Error in fetchWithAuth:", error);
    throw error;
  }
};

export default fetchWithAuth;
