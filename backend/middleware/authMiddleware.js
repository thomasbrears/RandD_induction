import admin from "firebase-admin";

// Middleware to check authentication
export const authMiddleware = async (req, res, next) => {
  const { authtoken } = req.headers;

  if (authtoken) {
    try {
      // Verify the ID token using Firebase Admin SDK
      req.user = await admin.auth().verifyIdToken(authtoken);
      next();  // Token is valid, proceed to the next middleware or route handler
    } catch (e) {
      console.error("Invalid token:", e);  // Log the error
      return res.status(401).send("Unauthorised");  // Invalid token
    }
  } else {
    return res.status(401).send("Unauthorised");  // No token provided
  }
};
