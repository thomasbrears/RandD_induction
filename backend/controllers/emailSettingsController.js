import { db } from "../firebase.js";

// Get all email settings
export const getEmailSettings = async (req, res) => {
  try {
    const snapshot = await db.collection("emailSettings").get();
    if (snapshot.empty) {
      // Return default settings if none exist
      return res.json({
        defaultFrom: "aut-events-induction-portal@pricehound.tech",
        defaultReplyTo: "autevents@brears.xyz",
        defaultCc: ["manager@brears.xyz"]
      });
    }
    
    const settings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(settings[0]); // Assuming we'll only have one document
  } catch (error) {
    console.error("Error fetching email settings:", error);
    res.status(500).send(error);
  }
};

// Update email settings
export const updateEmailSettings = async (req, res) => {
  try {
    const { defaultFrom, defaultReplyTo, defaultCc } = req.body;
    
    // Validate email format for all fields
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (defaultFrom && !isValidEmail(defaultFrom)) {
      return res.status(400).json({ message: 'Invalid email format for defaultFrom' });
    }
    
    if (defaultReplyTo && !isValidEmail(defaultReplyTo)) {
      return res.status(400).json({ message: 'Invalid email format for defaultReplyTo' });
    }
    
    if (defaultCc && Array.isArray(defaultCc)) {
      for (const email of defaultCc) {
        if (!isValidEmail(email)) {
          return res.status(400).json({ message: `Invalid email format in CC list: ${email}` });
        }
      }
    }
    
    // Get the existing settings document
    const snapshot = await db.collection("emailSettings").get();
    let docRef;
    
    if (snapshot.empty) {
      // Create new settings if none exist
      docRef = db.collection("emailSettings").doc("default");
      await docRef.set({
        defaultFrom: defaultFrom || "aut-events-induction-portal@pricehound.tech",
        defaultReplyTo: defaultReplyTo || "autevents@brears.xyz",
        defaultCc: defaultCc || ["manager@brears.xyz"],
        updatedAt: new Date()
      });
    } else {
      // Update existing settings
      docRef = db.collection("emailSettings").doc(snapshot.docs[0].id);
      const updateData = {
        updatedAt: new Date()
      };
      
      if (defaultFrom) updateData.defaultFrom = defaultFrom;
      if (defaultReplyTo) updateData.defaultReplyTo = defaultReplyTo;
      if (defaultCc) updateData.defaultCc = defaultCc;
      
      await docRef.update(updateData);
    }
    
    const updatedDoc = await docRef.get();
    
    res.status(200).json({
      message: "Email settings updated successfully",
      settings: updatedDoc.data()
    });
  } catch (error) {
    console.error("Error updating email settings:", error);
    res.status(500).send(error);
  }
};