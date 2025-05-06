import { db } from "../firebase.js";
import admin from "firebase-admin";
const FieldValue = admin.firestore.FieldValue;

// Get website content
export const getWebsiteContent = async (req, res) => {
  try {
    const snapshot = await db.collection("website_content").doc("homepage").get();
    
    if (!snapshot.exists) {
      // If document doesnt exist, create default structure
      const defaultContent = {
        about: {
          text: "We cater anywhere for anyone. Is it your place or ours?"
        },
        contact: {
          text: "If you have any questions, feedback or complaints, please don't hesitate to get in touch with us using the button below or by direct email to your manager."
        }
      };
      
      // Create the document with default content
      await db.collection("website_content").doc("homepage").set(defaultContent);
      
      res.json(defaultContent);
    } else {
      res.json(snapshot.data());
    }
  } catch (error) {
    console.error("Error fetching website content:", error);
    res.status(500).send(error);
  }
};

// Update website content
export const updateWebsiteContent = async (req, res) => {
  const { section, content } = req.body;
  
  try {
    // Get current content first
    const snapshot = await db.collection("website_content").doc("homepage").get();
    let currentContent = {};
    
    if (snapshot.exists) {
      currentContent = snapshot.data();
    }
    
    // Update only the specified section
    currentContent[section] = { text: content };
    
    // Save the updated content
    await db.collection("website_content").doc("homepage").set(currentContent, { merge: true });
    
    res.status(200).json({ success: true, message: "Content updated successfully" });
  } catch (error) {
    console.error("Error updating website content:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//Background Images
const defaultBackgrounds = {
  homeBg: { url: '/images/WG_OUTSIDE_AUT.webp', name: 'WG_OUTSIDE_AUT.webp', type: 'image/webp', size: 250000 },
  authBg: { url: '/images/WG_OUTSIDE_AUT.webp', name: 'WG_OUTSIDE_AUT.webp', type: 'image/webp', size: 250000 },
  aboutBg: { url: '/images/AUTEventsStaff.jpg', name: 'AUTEventsStaff.jpg', type: 'image/jpeg', size: 215000 }
};

export const getBackgroundImages = async (req, res) => {
  try {
    const docRef = db.collection("website_content").doc("background_images");
    const snapshot = await docRef.get();

    const data = snapshot.exists ? snapshot.data() : {};
    const mergedData = { ...defaultBackgrounds, ...data };

    res.json(mergedData);
  } catch (error) {
    console.error("Error fetching background images:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBackgroundImage = async (req, res) => {
  const { key, image } = req.body; // image is an object with url, name, type, size

  if (!key) {
    return res.status(400).json({ success: false, message: "Key is required." });
  }

  try {
    const updatePayload = image === null ? { [key]: FieldValue.delete() } : { [key]: image };

    await db.collection("website_content").doc("background_images").set(updatePayload, { merge: true });

    res.status(200).json({
      success: true,
      message: image === null
        ? `Background image '${key}' reset to default.`
        : `Background image '${key}' updated.`
    });
  } catch (error) {
    console.error("Error updating background image:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//Header images
export const getHeaderImages = async (req, res) => {
  try {
    const docRef = db.collection("website_content").doc("header_images");
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      await docRef.set({ images: [] });
      res.json({ images: [] });
    } else {
      res.json(snapshot.data());
    }
  } catch (error) {
    console.error("Error fetching header images:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateHeaderImages = async (req, res) => {
  const { images } = req.body; 

  if (!Array.isArray(images)) {
    return res.status(400).json({ success: false, message: "Images must be an array." });
  }

  try {
    await db.collection("website_content").doc("header_images").set({ images });
    res.status(200).json({ success: true, message: "Header images updated." });
  } catch (error) {
    console.error("Error updating header images:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};