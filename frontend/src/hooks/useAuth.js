import { useEffect, useState, useRef, useCallback } from "react";
import { auth } from "../firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const useAuth = () => {
  // State for user data and loading status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs to prevent duplicate toast notifications and track token timing
  const HAS_SHOWN_EXPIRED_TOAST = useRef(false); // Tracks if session expired toast was shown
  const HAS_SHOWN_SIGNOUT_TOAST = useRef(false); // Tracks if sign out toast was shown
  const TOKEN_EXPIRY_TIME = useRef(null); // Stores when the current token will expire
  const TOKEN_REFRESH_TIMEOUT = useRef(null); // Reference to the refresh timer
  
  // Activity tracking to manage token refreshes efficiently
  const LAST_ACTIVITY_TIME = useRef(Date.now()); // When user last interacted with the page
  const INACTIVE_THRESHOLD = 30 * 60 * 1000; // Consider user inactive after 30 minutes

  // Function to update the timestamp when user is active
  const updateActivityTimestamp = useCallback(() => {
    LAST_ACTIVITY_TIME.current = Date.now();
  }, []);

  // Set up event listeners to track user activity
  useEffect(() => {
    const EVENTS = ['mousedown', 'keypress', 'scroll', 'touchstart']; // Events that indicate user activity
    
    // Add event listeners
    EVENTS.forEach(event => 
      window.addEventListener(event, updateActivityTimestamp)
    );

    // Clean up event listeners when component unmounts
    return () => {
      EVENTS.forEach(event => 
        window.removeEventListener(event, updateActivityTimestamp)
      );
    };
  }, [updateActivityTimestamp]);

  // Function to refresh the users auth token
  const refreshUserToken = useCallback(async (currentUser) => {
    try {
      // Request a fresh token from Firebase auth
      const tokenResult = await currentUser.getIdTokenResult(true);
      
      // Calculate when the token will expire
      const EXPIRY_TIME = tokenResult.claims.exp * 1000; // Convert to milliseconds
      TOKEN_EXPIRY_TIME.current = EXPIRY_TIME;

      // Schedule next refresh 5 minutes before token expires
      const refreshTime = EXPIRY_TIME - Date.now() - (5 * 60 * 1000);
      
      // Clear any existing refresh timer
      if (TOKEN_REFRESH_TIMEOUT.current) {
        clearTimeout(TOKEN_REFRESH_TIMEOUT.current);
      }
      
      // Only set up next refresh if the calculated time is valid
      if (refreshTime > 0) {
        TOKEN_REFRESH_TIMEOUT.current = setTimeout(() => {
          // Only refresh if user has been active recently
          if (Date.now() - LAST_ACTIVITY_TIME.current < INACTIVE_THRESHOLD) {
            refreshUserToken(auth.currentUser);
          }
          // If inactive, the token refresh will happen when they return to the tab
        }, refreshTime);
      }
      
      // Update user state with fresh token and claims
      setUser({
        ...currentUser,
        role: tokenResult.claims.role,
        token: tokenResult.token,
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing token:", error);
      
      // Show expired session toast only once
      if (!HAS_SHOWN_EXPIRED_TOAST.current) {
        toast.error("Session expired, please sign in again.");
        HAS_SHOWN_EXPIRED_TOAST.current = true;
      }
      
      // Sign out without showing sign out toast (to avoid duplicate notifications)
      sessionStorage.setItem('previousUrl', location.pathname);
      signOut(false);
    }
  }, []);

  // Main auth state listener effect
  useEffect(() => {
    // Reset toast flags when component mounts
    HAS_SHOWN_EXPIRED_TOAST.current = false;
    HAS_SHOWN_SIGNOUT_TOAST.current = false;
    
    // Set up Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // User is signed in, refresh their token
        await refreshUserToken(currentUser);
      } else {
        // No user is signed in
        setUser(null);
        setLoading(false);
      }
    });

    // Clean up function for when component unmounts
    return () => {
      // Unsubscribe from auth state changes
      unsubscribe();
      
      // Clear any pending token refresh
      if (TOKEN_REFRESH_TIMEOUT.current) {
        clearTimeout(TOKEN_REFRESH_TIMEOUT.current);
      }
    };
  }, [refreshUserToken]);

  // Effect to handle tab visibility changes
  useEffect(() => {
    // Function to handle when user switches tabs
    const handleVisibilityChange = () => {
      // Only run if tab becomes visible again AND user is logged in
      if (document.visibilityState === 'visible' && user) {
        // Calculate time until current token expires
        const timeUntilExpiry = TOKEN_EXPIRY_TIME.current - Date.now();
        
        // If token expires soon (less than 10 minutes), refresh it immediately
        if (timeUntilExpiry < 10 * 60 * 1000) {
          refreshUserToken(auth.currentUser);
        }
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up listener when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUserToken]);

  // Function to sign out the user
  const signOut = (showToast = true) => {
    // Clear any scheduled token refresh
    if (TOKEN_REFRESH_TIMEOUT.current) {
      clearTimeout(TOKEN_REFRESH_TIMEOUT.current);
    }
    
    // Sign out from Firebase
    auth.signOut().then(() => {
      setUser(null);
      navigate("/");
      
      // Show sign out toast only if requested AND not already shown
      if (showToast && !HAS_SHOWN_SIGNOUT_TOAST.current) {
        toast.success("You have been signed out! Have a great day!");
        HAS_SHOWN_SIGNOUT_TOAST.current = true;
      }
    });
  };

  // Return the auth state and functions
  return { user, loading, signOut };
};

export default useAuth;