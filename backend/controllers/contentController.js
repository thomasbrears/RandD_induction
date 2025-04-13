import { db } from "../firebase.js";

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