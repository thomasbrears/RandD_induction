import admin from "firebase-admin";

// Middleware to check authentication
export const authMiddleware = async (req, res, next) => {
  // Public routes that don't require authentication
  const publicPaths = [
    '/api/contact/submit',
    '/api/content',
    '/api/content/get-backgrounds',
    '/api/content/get-header-images'
  ];
  
  // Skip authentication for public routes
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  // Check for token in different places
  let token = req.headers.authtoken;
  
  // If not in headers, check URL query parameter (for file downloads)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (token) {
    try {
      // Verify the ID token using Firebase Admin SDK
      req.user = await admin.auth().verifyIdToken(token);
      next();  // Token is valid, proceed to the next middleware or route handler
    } catch (e) {
      console.error("Invalid token:", e);  // Log the error
      
      // Determine response format based on request type
      if (req.path.includes('/export-') && req.method === 'GET') {
        // For export endpoints, return a more user-friendly response
        return res.status(401).json({ 
          error: "Authentication failed. Please log in again to export data." 
        });
      } else {
        return res.status(401).send("Unauthorised");  // Standard invalid token response
      }
    }
  } else {
    // Determine response format based on request type
    if (req.path.includes('/export-') && req.method === 'GET') {
      // For export endpoints, return a more user-friendly response
      return res.status(401).json({ 
        error: "Authentication required. Please log in to export data." 
      });
    } else {
      return res.status(401).send("Unauthorised");  // Standard no token response
    }
  }
};