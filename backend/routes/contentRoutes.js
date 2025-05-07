import express from "express";
import { 
    getWebsiteContent, 
    updateWebsiteContent, 
    getBackgroundImages, 
    updateBackgroundImage,
    getHeaderImages,
    updateHeaderImages
} from "../controllers/contentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getWebsiteContent); // Public route to fetch content
router.put("/update", authMiddleware, updateWebsiteContent); // Protected route to update content

router.get("/get-backgrounds", getBackgroundImages);
router.put("/update-background-image",authMiddleware, updateBackgroundImage);
router.get("/get-header-images", getHeaderImages);
router.put("/update-header-images", authMiddleware, updateHeaderImages);

export default router;