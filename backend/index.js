import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/authMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import userInductionRoutes from "./routes/userInductionRoutes.js";
import inductionRoutes from "./routes/inductionRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import positionRoutes from "./routes/positionRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";

const app = express();

// dynamic cors (v2.1)
const corsOptions = {
  origin: (origin, callback) => {
    // List of allowed origins
    const allowedOrigins = [
      'https://dev-aut-events-induction.vercel.app',
      'https://aut-events-induction.vercel.app'
    ];
    
    // Check for thomasbrears-projects pattern matching
    const isThomaseProject = origin && 
      (origin.startsWith('https://thomasbrears-projects.vercel.app') || 
       origin.includes('-thomasbrears-projects.vercel.app'));
    
    // In production, check against allowed list or pattern
    if (process.env.NODE_ENV === 'production') {
      // Check if origin is allowed or matches Thomasbrears pattern
      if (!origin || allowedOrigins.includes(origin) || isThomaseProject) {
        callback(null, true);
      } else {
        console.log(`CORS rejected: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: true
};

// CORS middleware to allow cross-origin requests
app.use(cors(corsOptions));

app.use(express.json());

// Authentication middleware
app.use(authMiddleware);

// Department Routes
app.use("/api/departments", departmentRoutes);

// Location Routes
app.use("/api/locations", locationRoutes);

// Position Routes
app.use("/api/positions", positionRoutes);

// User Routes
app.use("/api/users", userRoutes);

// User InductionRoutes
app.use("/api/user-inductions", userInductionRoutes);

// Induction Routes
app.use("/api/inductions", inductionRoutes);

// Contact Routes
app.use("/api/contact", contactRoutes);

//File Routes
app.use("/api/files", fileRoutes);

// Content Routes
app.use("/api/content", contentRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
