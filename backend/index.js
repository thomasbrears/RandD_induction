import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/authMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import inductionRoutes from "./routes/inductionRoutes.js";

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

// User Routes
app.use("/api/users", userRoutes);

// Induction Routes
app.use("/api/inductions", inductionRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
