import { db } from "../firebase.js";
import admin from "firebase-admin";
import { uploadFileToGCS, deleteFileFromGCS } from "./fileController.js";
import { sendEmail } from "../utils/mailjet.js";
import { format } from "date-fns";

export const uploadUserQualification = async (req, res) => {
  try {
    const { userId, qualificationType, qualificationName, issuer, issueDate, expiryDate, notes } = req.body;
    
    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Upload file using helper function
    const fileResult = await uploadFileToGCS(req.file);
    
    // Create qualification record
    const qualificationData = {
      userId,
      qualificationType,
      qualificationName,
      issuer,
      issueDate: issueDate ? admin.firestore.Timestamp.fromDate(new Date(issueDate)) : null,
      expiryDate: expiryDate ? admin.firestore.Timestamp.fromDate(new Date(expiryDate)) : null,
      fileUrl: fileResult.url,
      fileName: fileResult.originalName,
      gcsFileName: fileResult.gcsFileName,
      status: 'active',
      notes: notes || '',
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      remindersSent: {
        twoMonths: false,
        oneMonth: false,
        expired: false
      }
    };
    
    const docRef = await db.collection("userQualifications").add(qualificationData);
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Qualification uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading qualification:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserQualifications = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Simple query without ordering
    const snapshot = await db.collection("userQualifications")
      .where("userId", "==", userId)
      .get();
    
    const qualifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps for frontend
      issueDate: doc.data().issueDate?.toDate(),
      expiryDate: doc.data().expiryDate?.toDate(),
      uploadedAt: doc.data().uploadedAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })).sort((a, b) => {
      // Sort by uploadedAt descending
      if (!a.uploadedAt && !b.uploadedAt) return 0;
      if (!a.uploadedAt) return 1;
      if (!b.uploadedAt) return -1;
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });
    
    res.json({ qualifications });
  } catch (error) {
    console.error("Error fetching qualifications:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateUserQualification = async (req, res) => {
  try {
    const { id } = req.params;
    const { qualificationType, qualificationName, issuer, issueDate, expiryDate, notes } = req.body;
    
    const updateData = {
      qualificationType,
      qualificationName,
      issuer,
      issueDate: issueDate ? admin.firestore.Timestamp.fromDate(new Date(issueDate)) : null,
      expiryDate: expiryDate ? admin.firestore.Timestamp.fromDate(new Date(expiryDate)) : null,
      notes: notes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle file replacement if new file uploaded
    if (req.file) {
      // Get the old qualification to delete old file
      const oldDoc = await db.collection("userQualifications").doc(id).get();
      const oldData = oldDoc.data();
      
      // Upload new file
      const fileResult = await uploadFileToGCS(req.file);
      updateData.fileUrl = fileResult.url;
      updateData.fileName = fileResult.originalName;
      updateData.gcsFileName = fileResult.gcsFileName;
      
      // Delete old file if it exists
      if (oldData && oldData.gcsFileName) {
        try {
          await deleteFileFromGCS(oldData.gcsFileName);
        } catch (deleteError) {
          console.error("Error deleting old file:", deleteError);
          // Continue with update even if old file deletion fails
        }
      }
    }
    
    await db.collection("userQualifications").doc(id).update(updateData);
    
    res.json({
      success: true,
      message: "Qualification updated successfully"
    });
  } catch (error) {
    console.error("Error updating qualification:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteUserQualification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get qualification data to delete file
    const doc = await db.collection("userQualifications").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Qualification not found" });
    }
    
    const data = doc.data();
    
    // Delete file from GCS
    if (data.gcsFileName) {
      try {
        await deleteFileFromGCS(data.gcsFileName);
      } catch (deleteError) {
        console.error("Error deleting file:", deleteError);
        // Continue with deletion even if file deletion fails
      }
    }
    
    // Delete from Firestore
    await db.collection("userQualifications").doc(id).delete();
    
    res.json({
      success: true,
      message: "Qualification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting qualification:", error);
    res.status(500).json({ error: error.message });
  }
};

// Management endpoints
export const getAllUserQualifications = async (req, res) => {
  try {
    const { status, expiryFilter, userId } = req.query;
    
    let query = db.collection("userQualifications");
    
    if (status) {
      query = query.where("status", "==", status);
    }
    
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    
    const snapshot = await query.get();
    
    let qualifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issueDate: doc.data().issueDate?.toDate(),
      expiryDate: doc.data().expiryDate?.toDate(),
      uploadedAt: doc.data().uploadedAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    // Sort in JavaScript
    qualifications.sort((a, b) => {
      if (!a.uploadedAt && !b.uploadedAt) return 0;
      if (!a.uploadedAt) return 1;
      if (!b.uploadedAt) return -1;
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });
    
    // Filter by expiry if requested
    if (expiryFilter) {
      const now = new Date();
      const oneMonth = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
      
      switch (expiryFilter) {
        case 'expired':
          qualifications = qualifications.filter(q => q.expiryDate && q.expiryDate < now);
          break;
        case 'expiring_soon':
          qualifications = qualifications.filter(q => q.expiryDate && q.expiryDate < twoMonths && q.expiryDate >= now);
          break;
      }
    }
    
    // Get user details for each qualification
    const qualificationsWithUsers = await Promise.all(
      qualifications.map(async (qual) => {
        try {
          const userAuth = await admin.auth().getUser(qual.userId);
          return {
            ...qual,
            userDisplayName: userAuth.displayName || 'Unknown User',
            userEmail: userAuth.email
          };
        } catch (error) {
          console.error(`Error fetching user ${qual.userId}:`, error);
          return {
            ...qual,
            userDisplayName: 'Unknown User',
            userEmail: 'Unknown'
          };
        }
      })
    );
    
    res.json({ qualifications: qualificationsWithUsers });
  } catch (error) {
    console.error("Error fetching all qualifications:", error);
    res.status(500).json({ error: error.message });
  }
};

export const requestQualificationFromUser = async (req, res) => {
  try {
    const { userId, qualificationType, message, dueDate } = req.body;
    const requestedBy = req.user.uid;
    
    const requestData = {
      userId,
      requestedBy,
      qualificationType,
      message: message || `Please upload your ${qualificationType}`,
      dueDate: dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null,
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection("qualificationRequests").add(requestData);
    
    // Send email notification to user
    try {
      const userAuth = await admin.auth().getUser(userId);
      const requesterAuth = await admin.auth().getUser(requestedBy);
      
      const emailSubject = `📋 Qualification Request: ${qualificationType}`;
      const emailBody = `
        <h1>Kia ora ${userAuth.displayName || 'Team Member'}!</h1>
        <p>You have received a request to upload a qualification.</p>
        <br>
        
        <h3>Request Details:</h3>
        <p><strong>Qualification Type:</strong> ${qualificationType}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${dueDate ? `<p><strong>Please upload by </strong> ${format(new Date(dueDate), "d MMMM yyyy")}</p>` : ''}
        
        <br>
        <p>Please upload your qualification through our induction portal:</p>
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/account/qualifications" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
          Upload Qualification
        </a>

        <p>Ngā mihi (kind regards),<br/>${requesterAuth.displayName || requesterAuth.email} <br />AUT Events Management</p>
      `;
      
      await sendEmail(userAuth.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error("Error sending request notification:", emailError);
    }
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Qualification request sent successfully"
    });
  } catch (error) {
    console.error("Error creating qualification request:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getQualificationRequests = async (req, res) => {
  try {
    const { status, userId } = req.query;
    
    let query = db.collection("qualificationRequests");
    
    if (status) {
      query = query.where("status", "==", status);
    }
    
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    
    const snapshot = await query.get();
    
    const requests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        try {
          const [userAuth, requesterAuth] = await Promise.all([
            admin.auth().getUser(data.userId),
            admin.auth().getUser(data.requestedBy)
          ]);
          
          return {
            id: doc.id,
            ...data,
            requestedAt: data.requestedAt?.toDate(),
            dueDate: data.dueDate?.toDate(),
            userDisplayName: userAuth.displayName || 'Unknown User',
            userEmail: userAuth.email,
            requesterDisplayName: requesterAuth.displayName || 'Unknown Manager',
            requesterEmail: requesterAuth.email
          };
        } catch (error) {
          console.error(`Error fetching user details for request ${doc.id}:`, error);
          return {
            id: doc.id,
            ...data,
            requestedAt: data.requestedAt?.toDate(),
            dueDate: data.dueDate?.toDate(),
            userDisplayName: 'Unknown User',
            userEmail: 'Unknown',
            requesterDisplayName: 'Unknown Manager',
            requesterEmail: 'Unknown'
          };
        }
      })
    );
    
    // Sort by requestedAt descending in JavaScript
    requests.sort((a, b) => {
      if (!a.requestedAt && !b.requestedAt) return 0;
      if (!a.requestedAt) return 1;
      if (!b.requestedAt) return -1;
      return new Date(b.requestedAt) - new Date(a.requestedAt);
    });
    
    res.json({ requests });
  } catch (error) {
    console.error("Error fetching qualification requests:", error);
    res.status(500).json({ error: error.message });
  }
};