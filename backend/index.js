import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/authMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import inductionRoutes from "./routes/inductionRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import positionRoutes from "./routes/positionRoutes.js";

const app = express();

// dynamic cors options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://dev-aut-events-induction.vercel.app' 
    : true,  // Allow all origins in development
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

// Induction Routes
app.use("/api/inductions", inductionRoutes);

// Contact Routes
app.use("/api/contact", contactRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
