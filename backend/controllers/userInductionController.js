import { db } from "../firebase.js";
import admin from "firebase-admin";
import { sendEmail } from "../utils/mailjet.js";
import { format } from "date-fns";
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import axios from 'axios';

// Assign an induction to a user
export const assignInductionToUser = async (req, res) => {
  try {
    // Handle both single induction assignment and batch assignments
    const { userId, inductionId, dueDate, availableFrom, assignments } = req.body;

    // If we have an assignments array, handle batch mode
    if (assignments && Array.isArray(assignments)) {
      return handleBatchAssignments(req, res);
    }

    // Single induction assignment
    // Validate input
    if (!userId || !inductionId) {
      return res.status(400).json({ message: "User ID and Induction ID are required" });
    }

    // Check if user exists
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if induction exists
    const inductionRef = db.collection("inductions").doc(inductionId);
    const inductionDoc = await inductionRef.get();
    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }

    const inductionData = inductionDoc.data();
    const userData = userDoc.data();
    const userAuthData = await admin.auth().getUser(userId);

    // Create a new userInduction document
    const userInductionRef = db.collection("userInductions").doc();
    await userInductionRef.set({
      userId,
      inductionId,
      inductionName: inductionData.name,
      status: "assigned",
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      dueDate: dueDate ? new Date(dueDate) : null,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      completedAt: null
    });

    // Fetch email settings
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz"; // Default
    
    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
    }

    // Send email notification to user
    try {
      const firstName = userAuthData.displayName ? userAuthData.displayName.split(" ")[0] : "";
      const lastName = userAuthData.displayName ? userAuthData.displayName.split(" ")[1] || "" : "";
      const email = userAuthData.email;

      const formattedAvailableFrom = availableFrom
        ? format(new Date(availableFrom), "d MMMM yyyy")
        : "Immediately";
      const formattedDueDate = dueDate
        ? format(new Date(dueDate), "d MMMM yyyy")
        : "No deadline";

      const emailSubject = `You have a new induction to complete: ${inductionData.name || "Unnamed Induction"}`;
      const emailBody = `
        <h1>Kia ora ${firstName} ${lastName}!</h1>
        <p>You have been assigned a new induction module to complete.</p>
        <br>
        
        <h3>Here are the details:</h3>
        <p><strong>Induction Name:</strong> ${inductionData.name || "Unnamed Induction"}</p>
        <p><strong>Available from:</strong> ${formattedAvailableFrom}</p>
        <p><strong>Due Date:</strong> ${formattedDueDate}</p>

        <br>
        <h3>How to complete the induction?</h3>
        <p>Simply head to our induction portal website (${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://dev-aut-events-induction.vercel.app//'}) and log in using this email address. Navigate to the "My Inductions" tab, find this induction, and click "Start".</p>
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://dev-aut-events-induction.vercel.app//'}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

        <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>

        <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
      `;

      // Send email without CC for induction assignment
      const emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
      
      res.json({
        success: true,
        userInductionId: userInductionRef.id,
        emailResult: {
          success: true,
          message: "Email sent successfully"
        }
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      res.json({
        success: true,
        userInductionId: userInductionRef.id,
        emailResult: {
          success: false,
          error: emailError.message
        }
      });
    }
  } catch (error) {
    console.error("Error assigning induction:", error);
    res.status(500).json({
      error: error.message || "Unknown error occurred"
    });
  }
};
  
  // Helper function to handle batch assignments
const handleBatchAssignments = async (req, res) => {
  try {
    const { userId, assignments } = req.body;

    // Validate input
    if (!userId || !assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ message: "User ID and assignments array are required" });
    }

    // Check if user exists
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const userAuthData = await admin.auth().getUser(userId);

    // Process each assignment
    const results = [];
    const successfulAssignments = [];

    for (const assignment of assignments) {
      try {
        const { inductionId, dueDate, availableFrom } = assignment;

        // Validate each assignment
        if (!inductionId) {
          results.push({ 
            inductionId: assignment.inductionId || "unknown", 
            success: false, 
            error: "Induction ID is required" 
          });
          continue;
        }

        // Check if induction exists
        const inductionRef = db.collection("inductions").doc(inductionId);
        const inductionDoc = await inductionRef.get();
        if (!inductionDoc.exists) {
          results.push({ 
            inductionId, 
            success: false, 
            error: "Induction not found" 
          });
          continue;
        }

        const inductionData = inductionDoc.data();

        // Create a new userInduction document
        const userInductionRef = db.collection("userInductions").doc();
        await userInductionRef.set({
          userId,
          inductionId,
          inductionName: inductionData.name,
          status: "assigned",
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          dueDate: dueDate ? new Date(dueDate) : null,
          availableFrom: availableFrom ? new Date(availableFrom) : null,
          completedAt: null
        });

        // Add to successful assignments
        successfulAssignments.push({
          inductionId,
          inductionName: inductionData.name,
          dueDate,
          availableFrom,
          userInductionId: userInductionRef.id
        });

        results.push({ 
          inductionId, 
          success: true, 
          userInductionId: userInductionRef.id 
        });
      } catch (error) {
        console.error(`Error processing assignment for induction ${assignment.inductionId}:`, error);
        results.push({ 
          inductionId: assignment.inductionId || "unknown", 
          success: false, 
          error: error.message 
        });
      }
    }

    // Fetch email settings
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz"; // Default
    
    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
    }

    // Send email notification for batch assignments
    let emailResult = { success: false, message: "No email sent" };
    
    if (successfulAssignments.length > 0) {
      try {
        const firstName = userAuthData.displayName ? userAuthData.displayName.split(" ")[0] : "";
        const lastName = userAuthData.displayName ? userAuthData.displayName.split(" ")[1] || "" : "";
        const email = userAuthData.email;

        // Create HTML for induction list
        const inductionsHtml = successfulAssignments.map(ind => {
          const formattedAvailableFrom = ind.availableFrom
            ? format(new Date(ind.availableFrom), "d MMMM yyyy")
            : "Immediately";
          const formattedDueDate = ind.dueDate
            ? format(new Date(ind.dueDate), "d MMMM yyyy")
            : "No deadline";

          return `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <p><strong>Induction Name:</strong> ${ind.inductionName || "Unnamed Induction"}</p>
              <p><strong>Available from:</strong> ${formattedAvailableFrom}</p>
              <p><strong>Due Date:</strong> ${formattedDueDate}</p>
            </div>
          `;
        }).join('');

        const emailSubject = `New inductions assigned: ${successfulAssignments.length} induction${successfulAssignments.length > 1 ? 's' : ''}`;
        const emailBody = `
          <h1>Kia ora ${firstName} ${lastName}!</h1>
          <p>You have been assigned ${successfulAssignments.length} new induction${successfulAssignments.length > 1 ? 's' : ''} to complete.</p>
          <br>
          
          <h3>Here are the details:</h3>
          ${inductionsHtml}

          <br>
          <h3>How to complete these inductions?</h3>
          <p>Simply head to our induction portal website (${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://dev-aut-events-induction.vercel.app//'}) and log in using this email address. Navigate to the "My Inductions" tab, find each induction, and click "Start".</p>
          <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://dev-aut-events-induction.vercel.app//'}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

          <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>

          <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
        `;

        // Send email 
        emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
      } catch (emailError) {
        console.error("Error sending batch assignment email:", emailError);
        emailResult = {
          success: false,
          error: emailError.message
        };
      }
    }

    res.json({
      success: true,
      results,
      totalAssigned: successfulAssignments.length,
      emailResult
    });
  } catch (error) {
    console.error("Error processing batch assignments:", error);
    res.status(500).json({
      error: error.message || "Unknown error occurred"
    });
  }
};

// Get all user inductions for a specific user
export const getUserInductions = async (req, res) => {
    try {
      // Get userId from route parameter
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const snapshot = await db.collection("userInductions")
        .where("userId", "==", userId)
        .get();
        
      const userInductions = [];
      
      // Get all the user induction assignments
      for (const doc of snapshot.docs) {
        const userInduction = {
          id: doc.id,
          ...doc.data()
        };
        
        // Get the induction details for each assignment
        try {
          const inductionDoc = await db.collection("inductions").doc(userInduction.inductionId).get();
          if (inductionDoc.exists) {
            userInduction.induction = {
              id: inductionDoc.id,
              ...inductionDoc.data()
            };
          }
        } catch (inductionError) {
          console.error(`Error fetching induction ${userInduction.inductionId}:`, inductionError);
        }
        
        userInductions.push(userInduction);
      }
      
      res.json(userInductions);
    } catch (error) {
      console.error("Error fetching user inductions:", error);
      res.status(500).json({ error: error.message });
    }
  };

// Get a specific user induction by ID
export const getUserInductionById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ message: "User Induction ID is required" });
    }
    
    const userInductionRef = db.collection("userInductions").doc(id);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ message: "User Induction not found" });
    }
    
    const userInduction = {
      id: userInductionDoc.id,
      ...userInductionDoc.data()
    };
    
    // Get the induction details
    try {
      const inductionDoc = await db.collection("inductions").doc(userInduction.inductionId).get();
      if (inductionDoc.exists) {
        userInduction.induction = {
          id: inductionDoc.id,
          ...inductionDoc.data()
        };
      }
    } catch (inductionError) {
      console.error(`Error fetching induction ${userInduction.inductionId}:`, inductionError);
    }
    
    res.json(userInduction);
  } catch (error) {
    console.error("Error fetching user induction:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update a users induction assignment
export const updateUserInduction = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({ message: "User Induction ID is required" });
      }
      
      const userInductionRef = db.collection("userInductions").doc(id);
      const userInductionDoc = await userInductionRef.get();
      
      if (!userInductionDoc.exists) {
        return res.status(404).json({ message: "User Induction not found" });
      }
      
      const currentData = userInductionDoc.data();
      
      // Only allow updating specific fields
      const allowedUpdates = {
        status: updates.status,
        completedAt: updates.status === 'complete' && !currentData.completedAt 
          ? admin.firestore.FieldValue.serverTimestamp() 
          : updates.completedAt,
        startedAt: updates.status === 'in_progress' && !currentData.startedAt
          ? admin.firestore.FieldValue.serverTimestamp()
          : updates.startedAt,
        progress: updates.progress,
        feedback: updates.feedback,
        answers: updates.answers,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        availableFrom: updates.availableFrom ? new Date(updates.availableFrom) : undefined
      };
      
      // Remove undefined fields from the update
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );
      
      // Track which fields were actually changed
      const changedFields = {};
      Object.keys(allowedUpdates).forEach(key => {
        // Handle date comparisons specially
        if (key === 'dueDate' || key === 'availableFrom') {
          // Compare dates - only consider changed if the date is different
          const oldDate = currentData[key] ? new Date(currentData[key].toDate()) : null;
          const newDate = allowedUpdates[key] ? new Date(allowedUpdates[key]) : null;
          
          // If both dates exist and are different or one exists and the other doesn't
          if ((oldDate && newDate && oldDate.getTime() !== newDate.getTime()) || 
              (!oldDate && newDate) || (oldDate && !newDate)) {
            changedFields[key] = {
              old: oldDate,
              new: newDate
            };
          }
        } 
        // Handle special case for status to track
        else if (key === 'status' && currentData[key] !== allowedUpdates[key]) {
          changedFields[key] = {
            old: currentData[key],
            new: allowedUpdates[key]
          };
        }
        // Handle other fields
        else if (currentData[key] !== allowedUpdates[key]) {
          changedFields[key] = {
            old: currentData[key],
            new: allowedUpdates[key]
          };
        }
      });
      
      await userInductionRef.update(allowedUpdates);
      const updatedDoc = await userInductionRef.get();
      
      // Initialise email result
      let emailResult = { success: false, message: "No email sent - no significant changes" };
      
      // Determine if and what kind of email to send
      const isCompletionUpdate = changedFields.status && changedFields.status.new === 'complete';
      const isOverdueUpdate = changedFields.status && changedFields.status.new === 'overdue';
      const isDateUpdate = changedFields.dueDate || changedFields.availableFrom;
      
      let shouldSendEmail = isCompletionUpdate || isOverdueUpdate || isDateUpdate;
      
      // Skip email for in_progress status updates unless dates changed
      if (changedFields.status && changedFields.status.new === 'in_progress' && !isDateUpdate) {
        shouldSendEmail = false;
      }
            
      // Send email notification if needed
      if (shouldSendEmail) {
        try {
          // Get induction details
          const inductionRef = db.collection("inductions").doc(currentData.inductionId);
          const inductionDoc = await inductionRef.get();
          const inductionData = inductionDoc.exists ? inductionDoc.data() : { name: currentData.inductionName || "Unnamed Induction" };
          
          // Get user details
          const userId = currentData.userId;
          const userAuthData = await admin.auth().getUser(userId);
          const firstName = userAuthData.displayName ? userAuthData.displayName.split(" ")[0] : "";
          const lastName = userAuthData.displayName ? userAuthData.displayName.split(" ")[1] || "" : "";
          const email = userAuthData.email;
          
          // Format dates for display
          const formatDate = (date) => {
            return date ? format(new Date(date instanceof admin.firestore.Timestamp ? date.toDate() : date), "d MMMM yyyy") : "Not set";
          };
          
          // Fetch email settings
          const emailSettingsSnapshot = await db.collection("emailSettings").get();
          let replyToEmail = "autevents@brears.xyz"; // Default
          let ccEmails = ["manager@brears.xyz"]; // Default
          
          if (!emailSettingsSnapshot.empty) {
            const emailSettings = emailSettingsSnapshot.docs[0].data();
            replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
            ccEmails = emailSettings.defaultCc || ccEmails;
          }
          
          let emailSubject = '';
          let emailBody = '';
          
          // Different email content based on status
          if (isOverdueUpdate) {
            // Overdue notification email
            emailSubject = `⚠️ OVERDUE: Action required for ${inductionData.name || currentData.inductionName || "Induction"}`;
            emailBody = `
              <h1>Kia ora ${firstName} ${lastName}!</h1>
              <p>This is a reminder that you have an <strong>overdue induction</strong> that requires your immediate attention.</p>
              <br>
              
              <h3>Induction Details:</h3>
              <p><strong>Induction name:</strong> ${inductionData.name || currentData.inductionName || ""}</p>
              <p><strong>Due Date:</strong> ${formatDate(updatedDoc.data().dueDate)}</p>
              <p><strong>Status:</strong> <span style="color: red; font-weight: bold;">OVERDUE</span></p>
              
              <br>
              <h3>Urgent Action Required:</h3>
              <p>Please complete this induction as soon as possible.</p>
              
              <p>You can access your induction through our portal:</p>
              <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

              <br>
              <p>If you have any issues accessing or completing this induction, please contact your manager immediately.</p>

              <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
            `;
            
            // Send overdue email
            emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
          } else if (isCompletionUpdate) {
            // Congratulatory email for completion
            emailSubject = `🎉 Congratulations on completing ${inductionData.name || currentData.inductionName || "Unnamed Induction"}`;
            emailBody = `
              <h1>Kia ora ${firstName}!</h1>
              <p>Congratulations on completing your induction module! 🎉</p>
              <br>
              
              <h3>Induction Details:</h3>
              <p><strong>Induction name:</strong> ${inductionData.name || currentData.inductionName || ""}</p>
              <p><strong>Completed on:</strong> ${formatDate(updatedDoc.data().completedAt)}</p>
              
              <br>
              <p>This achievement has been recorded in our system.</p>
              
              <p>You can access your other inductions and see your completion certificate through our portal.</p>
              <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

              <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>

              <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
            `;
            
            emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
          } else {
            // Standard update email for date changes

            // Build the changes section of the email
            let changesHtml = '';
            
            if (changedFields.dueDate) {
              changesHtml += `<p><strong>Due Date</strong> Changed from "${formatDate(changedFields.dueDate.old)}" to "${formatDate(changedFields.dueDate.new)}"</p>`;
            }
            
            if (changedFields.availableFrom) {
              changesHtml += `<p><strong>Available From</strong> Changed from "${formatDate(changedFields.availableFrom.old)}" to "${formatDate(changedFields.availableFrom.new)}"</p>`;
            }
            
            emailSubject = `Update to your induction: ${inductionData.name || currentData.inductionName || "Induction"}`;
            emailBody = `
              <h1>Kia ora ${firstName} ${lastName}!</h1>
              <p>There have been updates made to one of your assigned induction modules.</p>
              <br>
              
              <p><strong>Induction:</strong> ${inductionData.name || currentData.inductionName || ""}</p>
              <br>
              <h3>Changes Made:</h3>
              ${changesHtml}
              <br>
              <h3>Induction Details:</h3>
              <p><strong>Current Status is </strong> ${updatedDoc.data().status === 'in_progress' ? 'In Progress' : 
                                              updatedDoc.data().status === 'complete' ? 'Completed' : 
                                              updatedDoc.data().status === 'overdue' ? '<span style="color: red; font-weight: bold;">OVERDUE</span>' :
                                              'Assigned'}</p>
              <p><strong>Available from </strong> ${formatDate(updatedDoc.data().availableFrom)}</p>
              <p><strong>Due on </strong> ${formatDate(updatedDoc.data().dueDate)}</p>

              <br>
              <h3>What does this mean for you?</h3>
              <p>Please review these changes and take appropriate action if needed. You can access your induction through our portal.</p>
              <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

              <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>

              <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
            `;
            
            // Send update email
            emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
          }
        } catch (emailError) {
          console.error("Error sending update notification email:", emailError);
          emailResult = {
            success: false,
            error: emailError.message
          };
        }
      }
      
      res.json({ 
        message: "User Induction updated successfully",
        id,
        changes: Object.keys(changedFields),
        emailResult,
        statusUpdate: changedFields.status ? changedFields.status.new : null
      });
    } catch (error) {
      console.error("Error updating user induction:", error);
      res.status(500).json({ error: error.message });
    }
  };

// Delete a user induction assignment
export const deleteUserInduction = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ message: "User Induction ID is required" });
    }
    
    const userInductionRef = db.collection("userInductions").doc(id);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ message: "User Induction not found" });
    }
    
    await userInductionRef.delete();
    
    res.json({ message: "User Induction deleted successfully" });
  } catch (error) {
    console.error("Error deleting user induction:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users assigned to a specific induction
export const getUsersByInduction = async (req, res) => {
  try {
    const inductionId = req.query.inductionId;
    
    if (!inductionId) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    const snapshot = await db.collection("userInductions")
      .where("inductionId", "==", inductionId)
      .get();
      
    const assignments = [];
    
    for (const doc of snapshot.docs) {
      const assignment = {
        id: doc.id,
        ...doc.data()
      };
      
      // Get user details
      try {
        const userRecord = await admin.auth().getUser(assignment.userId);
        assignment.user = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        };
      } catch (userError) {
        console.error(`Error fetching user ${assignment.userId}:`, userError);
      }
      
      assignments.push(assignment);
    }
    
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching users by induction:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get induction completion statistics
export const getInductionStats = async (req, res) => {
  try {
    const inductionId = req.query.inductionId;
    
    if (!inductionId) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    const snapshot = await db.collection("userInductions")
      .where("inductionId", "==", inductionId)
      .get();
      
    const stats = {
      total: snapshot.size,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0
    };
    
    const now = new Date();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.status === 'complete') {
        stats.completed++;
      } else if (data.status === 'in_progress') {
        stats.inProgress++;
      } else {
        stats.assigned++;
      }
      
      // Check if overdue
      if (data.dueDate && data.status !== 'complete' && new Date(data.dueDate.toDate()) < now) {
        stats.overdue++;
      }
    });
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching induction stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get user induction results by ID (with answers)
export const getUserInductionResults = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ message: "User Induction ID is required" });
    }
    
    const userInductionRef = db.collection("userInductions").doc(id);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ message: "User Induction not found" });
    }
    
    const userInduction = {
      id: userInductionDoc.id,
      ...userInductionDoc.data()
    };
    
    // Get the induction details
    try {
      const inductionDoc = await db.collection("inductions").doc(userInduction.inductionId).get();
      if (inductionDoc.exists) {
        userInduction.induction = {
          id: inductionDoc.id,
          ...inductionDoc.data()
        };
      }
    } catch (inductionError) {
      console.error(`Error fetching induction ${userInduction.inductionId}:`, inductionError);
    }

    // Get the user details
    try {
      const userRecord = await admin.auth().getUser(userInduction.userId);
      userInduction.user = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      };
    } catch (userError) {
      console.error(`Error fetching user ${userInduction.userId}:`, userError);
    }
    
    res.json(userInduction);
  } catch (error) {
    console.error("Error fetching user induction results:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all results for a specific induction
export const getInductionResults = async (req, res) => {
  try {
    const inductionId = req.params.inductionId;
    
    if (!inductionId) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    // Get the induction details first
    const inductionRef = db.collection("inductions").doc(inductionId);
    const inductionDoc = await inductionRef.get();
    
    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }
    
    const induction = {
      id: inductionDoc.id,
      ...inductionDoc.data()
    };
    
    // Get all assignments for this induction
    const snapshot = await db.collection("userInductions")
      .where("inductionId", "==", inductionId)
      .get();
      
    const results = {
      induction,
      assignments: []
    };
    
    // Gather all assignments with user details
    for (const doc of snapshot.docs) {
      const assignment = {
        id: doc.id,
        ...doc.data()
      };
      
      // Get user details
      try {
        const userRecord = await admin.auth().getUser(assignment.userId);
        assignment.user = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        };
      } catch (userError) {
        console.error(`Error fetching user ${assignment.userId}:`, userError);
      }
      
      results.assignments.push(assignment);
    }
    
    // Calculate statistics
    results.stats = {
      total: results.assignments.length,
      completed: results.assignments.filter(a => a.status === 'complete').length,
      inProgress: results.assignments.filter(a => a.status === 'in_progress').length,
      assigned: results.assignments.filter(a => a.status === 'assigned').length,
      overdue: results.assignments.filter(a => {
        return a.status !== 'complete' && 
               a.dueDate && 
               new Date(a.dueDate.toDate()) < new Date();
      }).length
    };
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching induction results:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get detailed result statistics for an induction
export const getResultsStats = async (req, res) => {
  try {
    const inductionId = req.query.inductionId;
    
    if (!inductionId) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    const snapshot = await db.collection("userInductions")
      .where("inductionId", "==", inductionId)
      .get();
      
    // Basic stats
    const stats = {
      total: snapshot.size,
      completed: 0,
      inProgress: 0,
      assigned: 0,
      overdue: 0,
      averageCompletionTime: 0,
      completionRateByDay: {}
    };
    
    const now = new Date();
    let totalCompletionTimeMs = 0;
    let completionCount = 0;
    
    // Process each assignment
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by status
      if (data.status === 'complete') {
        stats.completed++;
        
        // Track completion date for time series
        if (data.completedAt) {
          const completionDate = data.completedAt.toDate();
          const dateStr = completionDate.toISOString().split('T')[0];
          
          if (!stats.completionRateByDay[dateStr]) {
            stats.completionRateByDay[dateStr] = 0;
          }
          stats.completionRateByDay[dateStr]++;
          
          // Calculate completion time if we have both start and end
          if (data.startedAt) {
            const startTime = data.startedAt.toDate();
            const completionTimeMs = completionDate - startTime;
            totalCompletionTimeMs += completionTimeMs;
            completionCount++;
          }
        }
      } else if (data.status === 'in_progress') {
        stats.inProgress++;
      } else {
        stats.assigned++;
      }
      
      // Check if overdue
      if (data.dueDate && data.status !== 'complete' && new Date(data.dueDate.toDate()) < now) {
        stats.overdue++;
      }
    });
    
    // Calculate average completion time (in minutes)
    if (completionCount > 0) {
      stats.averageCompletionTime = Math.round(totalCompletionTimeMs / completionCount / 60000);
    }
    
    // Convert completion rate object to array for easier frontend use
    stats.completionTimeline = Object.entries(stats.completionRateByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    delete stats.completionRateByDay;
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching results stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Send reminder email for a specific induction assignment
export const sendInductionReminder = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ message: "User Induction ID is required" });
    }
    
    const userInductionRef = db.collection("userInductions").doc(id);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ message: "User Induction not found" });
    }
    
    const userInduction = userInductionDoc.data();
    
    // Get the induction details
    const inductionRef = db.collection("inductions").doc(userInduction.inductionId);
    const inductionDoc = await inductionRef.get();
    const inductionData = inductionDoc.exists ? inductionDoc.data() : { name: userInduction.inductionName || "Unnamed Induction" };
    
    // Get user details
    const userAuthData = await admin.auth().getUser(userInduction.userId);
    const firstName = userAuthData.displayName ? userAuthData.displayName.split(" ")[0] : "";
    const lastName = userAuthData.displayName ? userAuthData.displayName.split(" ")[1] || "" : "";
    const email = userAuthData.email;
    
    // Format dates for display
    const formatDate = (date) => {
      return date ? format(new Date(date instanceof admin.firestore.Timestamp ? date.toDate() : date), "d MMMM yyyy") : "Not set";
    };
    
    // Fetch email settings from database
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz"; // Default
    
    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
    }
    
    // Create the email content
    const emailSubject = `Reminder: Complete your ${inductionData.name || userInduction.inductionName || "Unnamed Induction"} induction`;
    
    // Determine induction status
    const now = new Date();
    const dueDate = userInduction.dueDate ? new Date(userInduction.dueDate.toDate()) : null;
    const isOverdue = dueDate && dueDate < now;
    const statusText = isOverdue ? 
      '<span style="color: red; font-weight: bold;">OVERDUE</span>' : 
      (userInduction.status === 'in_progress' ? 'In Progress' : 'Assigned');
    
    const emailBody = `
      <h1>Kia ora ${firstName} ${lastName}!</h1>
      <p>This is a friendly reminder about your assigned induction module that requires your attention.</p>
      <br>
      
      <h3>Induction Details:</h3>
      <div style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Induction name:</strong> ${inductionData.name || userInduction.inductionName || "Unnamed Induction"}</p>
        <p><strong>Status:</strong> ${statusText}</p>
        ${dueDate ? `<p><strong>Due Date:</strong> ${formatDate(userInduction.dueDate)}</p>` : ''}
      </div>
      
      <h3>Action Required:</h3>
      <p>Please complete this induction${isOverdue ? ' as soon as possible' : ' by the due date'}.</p>
      
      <p>You can access your induction through our portal:</p>
      <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://dev-aut-events-induction.vercel.app//'}/inductions/my-inductions" 
         style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
        AUT Events Induction Portal
      </a>

      <br>
      <p>If you have any issues accessing or completing this induction, please contact your manager.</p>

      <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
    `;
    
    // Send the email without CC
    const emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
    
    // Update the userInduction document to record that a reminder was sent
    await userInductionRef.update({
      reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
      reminderCount: admin.firestore.FieldValue.increment(1)
    });
    
    res.json({
      success: true,
      message: `Reminder sent to ${userAuthData.displayName || email}`,
      emailResult
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to send reminder"
    });
  }
};

// Export induction results to Excel
export const exportInductionResultsToExcel = async (req, res) => {
  try {
    const inductionId = req.params.inductionId;
    const exportType = req.query.type || 'full'; // full or summary
    
    if (!inductionId) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    // Get the induction details first
    const inductionRef = db.collection("inductions").doc(inductionId);
    const inductionDoc = await inductionRef.get();
    
    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }
    
    const induction = {
      id: inductionDoc.id,
      ...inductionDoc.data()
    };
    
    // Get all assignments for this induction
    const snapshot = await db.collection("userInductions")
      .where("inductionId", "==", inductionId)
      .get();
    
    const assignments = [];
    
    // Gather all assignments with user details
    for (const doc of snapshot.docs) {
      const assignment = {
        id: doc.id,
        ...doc.data()
      };
      
      // Get user details
      try {
        const userRecord = await admin.auth().getUser(assignment.userId);
        assignment.user = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          firstName: userRecord.displayName ? userRecord.displayName.split(' ')[0] : '',
          lastName: userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : ''
        };
      } catch (userError) {
        console.error(`Error fetching user ${assignment.userId}:`, userError);
      }
      
      assignments.push(assignment);
    }

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AUT Events Induction Portal';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Helper functions for formatting and data handling
    const formatDateForExcel = (date) => {
      if (!date) return '';
      try {
        if (date instanceof Date) {
          return date;
        } else if (date.toDate) {
          // Handle Firestore Timestamp
          return date.toDate();
        }
        return new Date(date);
      } catch (e) {
        console.error("Date format error:", e);
        return '';
      }
    };

    const formatStatus = (status) => {
      switch(status) {
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'complete': return 'Completed';
        case 'overdue': return 'Overdue';
        default: return status;
      }
    };

    const calculateCompletionTime = (startDate, endDate) => {
      if (!startDate || !endDate) return '';
      try {
        const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        const diffMs = end - start;
        
        // Convert to hours, minutes
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } catch (e) {
        console.error("Completion time calculation error:", e);
        return '';
      }
    };
    
    // Helper function to create styled section headers
    const createSectionHeader = (sheet, cell, title) => {
      sheet.mergeCells(cell);
      const headerCell = sheet.getCell(cell.split(':')[0]);
      headerCell.value = title;
      headerCell.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '000000' }
      };
      headerCell.alignment = { horizontal: 'center' };
    };
    
    // Helper function to safely format dates
    const safeDate = (date) => {
      if (!date) return null;
      try {
        return date.toDate ? date.toDate() : new Date(date);
      } catch (e) {
        console.error("Date format error:", e, date);
        return null;
      }
    };
    
    // Helper function to safely format status
    const safeStatus = (status) => {
      switch(status) {
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'complete': return 'Completed';
        case 'overdue': return 'Overdue';
        default: return status || 'Unknown';
      }
    };
    
    // Helper function to calculate completion time as hours for Excel
    const calculateCompletionTimeHours = (startDate, endDate) => {
      if (!startDate || !endDate) return null;
      
      try {
        const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        const diffMs = end - start;
        
        // Return as hours for Excel formatting
        return diffMs / (1000 * 60 * 60);
      } catch (e) {
        console.error("Completion time calculation error:", e);
        return null;
      }
    };

    // Create worksheets based on export type
    if (exportType === 'summary') {
      try {
        // SUMMARY REPORT
        const summarySheet = workbook.addWorksheet('Summary');
        
        // Title
        summarySheet.mergeCells('A1:E1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = `Summary Report: ${induction.name || 'Induction'}`;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        
        // Add statistics section header
        createSectionHeader(summarySheet, 'A5:E5', 'Assignment Statistics');
        
        // Calculate statistics
        const stats = {
          total: assignments.length,
          completed: assignments.filter(a => a.status === 'complete').length,
          inProgress: assignments.filter(a => a.status === 'in_progress').length,
          assigned: assignments.filter(a => a.status !== 'complete' && a.status !== 'in_progress').length,
          overdue: assignments.filter(a => {
            // Safely check for overdue assignments
            if (a.status === 'complete') return false;
            if (!a.dueDate) return false;
            
            try {
              const dueDate = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
              return dueDate < new Date();
            } catch (e) {
              console.error("Error parsing due date:", e);
              return false;
            }
          }).length
        };
        
        // Display statistics
        const statsStartRow = 6;
        
        // Column 1
        summarySheet.getCell(`A${statsStartRow}`).value = 'Total Assignments:';
        summarySheet.getCell(`B${statsStartRow}`).value = stats.total;
        summarySheet.getCell(`A${statsStartRow}`).font = { bold: true };
        
        summarySheet.getCell(`A${statsStartRow+1}`).value = 'Completed:';
        summarySheet.getCell(`B${statsStartRow+1}`).value = stats.completed;
        summarySheet.getCell(`A${statsStartRow+1}`).font = { bold: true };
        
        // Column 2
        summarySheet.getCell(`D${statsStartRow}`).value = 'In Progress:';
        summarySheet.getCell(`E${statsStartRow}`).value = stats.inProgress;
        summarySheet.getCell(`D${statsStartRow}`).font = { bold: true };
        
        summarySheet.getCell(`D${statsStartRow+1}`).value = 'Assigned:';
        summarySheet.getCell(`E${statsStartRow+1}`).value = stats.assigned;
        summarySheet.getCell(`D${statsStartRow+1}`).font = { bold: true };
        
        // Overdue
        summarySheet.getCell(`A${statsStartRow+2}`).value = 'Overdue:';
        summarySheet.getCell(`B${statsStartRow+2}`).value = stats.overdue;
        summarySheet.getCell(`A${statsStartRow+2}`).font = { bold: true };
        
        // Calculate completion rate
        summarySheet.getCell(`A${statsStartRow+4}`).value = 'Completion Rate:';
        summarySheet.getCell(`B${statsStartRow+4}`).value = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) / 100 : 0;
        summarySheet.getCell(`B${statsStartRow+4}`).numFmt = '0.00%';
        summarySheet.getCell(`A${statsStartRow+4}`).font = { bold: true };
        
        // Add report generation footer
        summarySheet.getCell('A10').value = `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} from the AUT Events Induction Portal`;
        summarySheet.getCell('A10').font = { italic: true, color: { argb: '808080' } };
        
      } catch (summaryError) {
        console.error("Error in summary export:", summaryError);
        return res.status(500).json({ 
          error: "Failed to generate summary report", 
          details: summaryError.message 
        });
      }
    } else {
      try {        
        // FULL REPORT

        // Main sheet with all information
        const mainSheet = workbook.addWorksheet('Induction Report');
        
        // SECTION 1: HEADER AND TITLE
        mainSheet.mergeCells('A1:I1');
        const titleCell = mainSheet.getCell('A1');
        titleCell.value = `Induction Report: ${induction.name || 'Unnamed Induction'}`;
        titleCell.font = { size: 18, bold: true, color: { argb: '000000' } };
        titleCell.alignment = { horizontal: 'center' };
        
        // Add report metadata
        mainSheet.getCell('A3').value = 'Report Date:';
        mainSheet.getCell('B3').value = new Date();
        mainSheet.getCell('B3').numFmt = 'dd MMMM yyyy';
        mainSheet.getCell('A3').font = { bold: true };
        
        // SECTION 2: INDUCTION DETAILS
        // Add section header
        createSectionHeader(mainSheet, 'A5:I5', 'Induction Details');
        
        // Add induction details (2 collums)
        const detailsStartRow = 6;
        
        mainSheet.getCell(`A${detailsStartRow}`).value = 'Name:';
        mainSheet.getCell(`B${detailsStartRow}`).value = induction.name || 'Unnamed Induction';
        mainSheet.getCell(`A${detailsStartRow}`).font = { bold: true };
        
        mainSheet.getCell(`A${detailsStartRow+1}`).value = 'Department:';
        mainSheet.getCell(`B${detailsStartRow+1}`).value = induction.department || 'Not specified';
        mainSheet.getCell(`A${detailsStartRow+1}`).font = { bold: true };
        
        // Determine question count
        let questionCount = 0;
        if (induction.questions && Array.isArray(induction.questions)) {
          questionCount = induction.questions.length;
        } else if (induction.sections && Array.isArray(induction.sections)) {
          questionCount = induction.sections.reduce((count, section) => {
            return count + (Array.isArray(section.questions) ? section.questions.length : 0);
          }, 0);
        }
        
        mainSheet.getCell(`A${detailsStartRow+2}`).value = 'Number of Questions:';
        mainSheet.getCell(`B${detailsStartRow+2}`).value = questionCount;
        mainSheet.getCell(`A${detailsStartRow+2}`).font = { bold: true };
        
        // Description
        let description = 'No description provided';
        if (induction.description) {
          // Remove HTML tags for clean display in Excel
          description = induction.description.replace(/<[^>]*>?/gm, '');
        }
        
        mainSheet.getCell(`A${detailsStartRow+3}`).value = 'Description:';
        mainSheet.getCell(`B${detailsStartRow+3}`).value = description;
        mainSheet.getCell(`A${detailsStartRow+3}`).font = { bold: true };
        
        // Make the description cell wrap text
        mainSheet.getCell(`B${detailsStartRow+3}`).alignment = { wrapText: true };
        mainSheet.getRow(detailsStartRow+3).height = 60;
        
        // SECTION 3: SUMMARY STATISTICS
        // Add section header
        createSectionHeader(mainSheet, `A${detailsStartRow+5}:I${detailsStartRow+5}`, 'Summary Statistics');
        
        // Calculate statistics
        const stats = {
          total: assignments.length,
          completed: assignments.filter(a => a.status === 'complete').length,
          inProgress: assignments.filter(a => a.status === 'in_progress').length,
          assigned: assignments.filter(a => a.status !== 'complete' && a.status !== 'in_progress' && a.status !== 'overdue').length,
          overdue: assignments.filter(a => {
            // Safely check for overdue assignments
            if (a.status === 'complete') return false;
            if (!a.dueDate) return false;
            
            try {
              const dueDate = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
              return dueDate < new Date();
            } catch (e) {
              console.error("Error parsing due date:", e);
              return false;
            }
          }).length
        };
        
        // Create a statistics table (grid layout)
        const statsStartRow = detailsStartRow + 6;
        
        // Column 1
        mainSheet.getCell(`A${statsStartRow}`).value = 'Total Assignments:';
        mainSheet.getCell(`B${statsStartRow}`).value = stats.total;
        mainSheet.getCell(`A${statsStartRow}`).font = { bold: true };
        
        mainSheet.getCell(`A${statsStartRow+1}`).value = 'Completed:';
        mainSheet.getCell(`B${statsStartRow+1}`).value = stats.completed;
        mainSheet.getCell(`A${statsStartRow+1}`).font = { bold: true };
        
        // Column 2
        mainSheet.getCell(`D${statsStartRow}`).value = 'In Progress:';
        mainSheet.getCell(`E${statsStartRow}`).value = stats.inProgress;
        mainSheet.getCell(`D${statsStartRow}`).font = { bold: true };
        
        mainSheet.getCell(`D${statsStartRow+1}`).value = 'Assigned:';
        mainSheet.getCell(`E${statsStartRow+1}`).value = stats.assigned;
        mainSheet.getCell(`D${statsStartRow+1}`).font = { bold: true };
        
        // Column 3
        mainSheet.getCell(`G${statsStartRow}`).value = 'Overdue:';
        mainSheet.getCell(`H${statsStartRow}`).value = stats.overdue;
        mainSheet.getCell(`G${statsStartRow}`).font = { bold: true };
        
        // Completion rate
        mainSheet.getCell(`A${statsStartRow+3}`).value = 'Completion Rate:';
        mainSheet.getCell(`B${statsStartRow+3}`).value = stats.total > 0 ? 
          Math.round((stats.completed / stats.total) * 100) / 100 : 0;
        mainSheet.getCell(`B${statsStartRow+3}`).numFmt = '0.00%';
        mainSheet.getCell(`A${statsStartRow+3}`).font = { bold: true };
        
        // Calculate average completion time
        let avgCompletionTimeValue = null;
        let avgCompletionTimeText = 'N/A';
        
        const completedAssignments = assignments.filter(a => 
          a.status === 'complete' && a.startedAt && a.completedAt
        );
        
        if (completedAssignments.length > 0) {
          try {
            const totalMs = completedAssignments.reduce((total, assignment) => {
              const start = assignment.startedAt.toDate ? 
                assignment.startedAt.toDate() : 
                new Date(assignment.startedAt);
                
              const end = assignment.completedAt.toDate ? 
                assignment.completedAt.toDate() : 
                new Date(assignment.completedAt);
                
              return total + (end - start);
            }, 0);
            
            const avgMs = totalMs / completedAssignments.length;
            const avgHours = Math.floor(avgMs / (1000 * 60 * 60));
            const avgMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
            
            avgCompletionTimeValue = avgMs / (1000 * 60 * 60); // Hours as decimal
            avgCompletionTimeText = `${avgHours} hour${avgHours !== 1 ? 's' : ''}, ${avgMinutes} minute${avgMinutes !== 1 ? 's' : ''}`;
          } catch (e) {
            console.error("Error calculating average completion time:", e);
          }
        }
        
        mainSheet.getCell(`D${statsStartRow+3}`).value = 'Average Completion Time:';
        
        if (avgCompletionTimeValue !== null) {
          mainSheet.getCell(`E${statsStartRow+3}`).value = avgCompletionTimeValue;
          mainSheet.getCell(`E${statsStartRow+3}`).numFmt = '[h]:mm';
          mainSheet.getCell(`F${statsStartRow+3}`).value = `(${avgCompletionTimeText})`;
        } else {
          mainSheet.getCell(`E${statsStartRow+3}`).value = avgCompletionTimeText;
        }
        
        mainSheet.getCell(`D${statsStartRow+3}`).font = { bold: true };
        
        // SECTION 4: STAFF ASSIGNMENTS TABLE
        const staffTableRow = statsStartRow + 6;
        
        // Add section header
        createSectionHeader(mainSheet, `A${staffTableRow}:I${staffTableRow}`, 'Staff Assignments');
        
        // Create staff table headers - Row 1
        const tableHeaderRow = staffTableRow + 2;
        const tableHeaders = [
          { label: 'Staff Name', width: 25 },
          { label: 'Email', width: 30 },
          { label: 'Status', width: 15 },
          { label: 'Assigned Date', width: 15 },
          { label: 'Available From', width: 15 },
          { label: 'Due Date', width: 15 },
          { label: 'Started Date', width: 15 },
          { label: 'Completed Date', width: 15 },
          { label: 'Completion Time', width: 20 }
        ];
        
        // Apply headers
        tableHeaders.forEach((header, idx) => {
          const cell = mainSheet.getCell(tableHeaderRow, idx + 1);
          cell.value = header.label;
          cell.font = { bold: true, color: { argb: 'FFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '000000' }
          };
          cell.alignment = { horizontal: 'center' };
          
          mainSheet.getColumn(idx + 1).width = header.width;
        });
        
        // Add data rows
        let rowNum = tableHeaderRow + 1;
        for (const assignment of assignments) {
          try {
            // Define row values
            const rowValues = [
              assignment.user?.displayName || 'Unknown',
              assignment.user?.email || 'No email',
              safeStatus(assignment.status),
              safeDate(assignment.assignedAt),
              safeDate(assignment.availableFrom),
              safeDate(assignment.dueDate),
              safeDate(assignment.startedAt),
              assignment.status === 'complete' ? safeDate(assignment.completedAt) : null,
              assignment.status === 'complete' ? 
                calculateCompletionTimeHours(assignment.startedAt, assignment.completedAt) : null
            ];
            
            const row = mainSheet.getRow(rowNum);
            rowValues.forEach((value, idx) => {
              row.getCell(idx + 1).value = value;
            });
            
            // Format dates
            [4, 5, 6, 7, 8].forEach(col => {
              if (rowValues[col - 1]) {
                row.getCell(col).numFmt = 'dd/mm/yyyy';
              }
            });
            
            // Format completion time
            if (rowValues[8]) {
              row.getCell(9).numFmt = '[h]:mm';
            }
            
            // Apply status color coding
            const statusCell = row.getCell(3);
            switch(statusCell.value) {
              case 'Completed':
                statusCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'E2EFDA' } // Light green
                };
                break;
              case 'In Progress':
                statusCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF2CC' } // Light yellow
                };
                break;
              case 'Overdue':
                statusCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFC7CE' } // Light red
                };
                statusCell.font = { color: { argb: '9C0006' } };
                break;
            }
            
            // Alternate row shading for readability
            if (rowNum % 2 === 0) {
              [1, 2, 4, 5, 6, 7, 8, 9].forEach(col => {
                row.getCell(col).fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'F5F5F5' } // Light gray
                };
              });
            }
            
            rowNum++;
          } catch (rowError) {
            console.error("Error adding row for assignment:", rowError, assignment);
            // Continue with next assignment instead of failing the whole export
          }
        }
        
        // Add report footer
        const tableEndRow = rowNum - 1;
        mainSheet.getCell(`A${tableEndRow + 2}`).value = `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} from the AUT Events Induction Portal`;
        mainSheet.getCell(`A${tableEndRow + 2}`).font = { italic: true, color: { argb: '808080' } };
        
        // Auto-filter for the table
        mainSheet.autoFilter = {
          from: { row: tableHeaderRow, column: 1 },
          to: { row: tableEndRow, column: 9 }
        };
        
      } catch (fullReportError) {
        console.error("Error in full report export:", fullReportError);
        return res.status(500).json({ 
          error: "Failed to generate full report", 
          details: fullReportError.message 
        });
      }
    }
    
    // Set response headers for Excel download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${induction.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.xlsx`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ error: error.message });
  }
};

// Export induction results to PDF 
export const exportInductionResultsToPDF = async (req, res) => {
  try {
    const inductionId = req.params.inductionId;
    const exportType = req.query.type || 'full'; // full or summary
    
    if (!inductionId) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    // Get the induction details first
    const inductionRef = db.collection("inductions").doc(inductionId);
    const inductionDoc = await inductionRef.get();
    
    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }
    
    const induction = {
      id: inductionDoc.id,
      ...inductionDoc.data()
    };
    
    // Get all assignments for this induction
    const snapshot = await db.collection("userInductions")
      .where("inductionId", "==", inductionId)
      .get();
    
    const assignments = [];
    
    // Gather all assignments with user details
    for (const doc of snapshot.docs) {
      const assignment = {
        id: doc.id,
        ...doc.data()
      };
      
      // Get user details
      try {
        const userRecord = await admin.auth().getUser(assignment.userId);
        assignment.user = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          firstName: userRecord.displayName ? userRecord.displayName.split(' ')[0] : '',
          lastName: userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : ''
        };
      } catch (userError) {
        console.error(`Error fetching user ${assignment.userId}:`, userError);
      }
      
      assignments.push(assignment);
    }

    // Helper functions for formatting and data handling
    const formatDate = (date) => {
      if (!date) return 'N/A';
      try {
        if (date instanceof Date) {
          return format(date, 'dd/MM/yyyy');
        } else if (date.toDate) {
          // Handle Firestore Timestamp
          return format(date.toDate(), 'dd/MM/yyyy');
        }
        return format(new Date(date), 'dd/MM/yyyy');
      } catch (e) {
        console.error("Date format error:", e);
        return 'N/A';
      }
    };

    const formatStatus = (status) => {
      switch(status) {
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'complete': return 'Completed';
        case 'overdue': return 'Overdue';
        default: return status || 'Unknown';
      }
    };

    const calculateCompletionTime = (startDate, endDate) => {
      if (!startDate || !endDate) return 'N/A';
      try {
        const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        const diffMs = end - start;
        
        // Convert to hours, minutes
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } catch (e) {
        console.error("Completion time calculation error:", e);
        return 'N/A';
      }
    };
    
    // Calculate statistics
    const stats = {
      total: assignments.length,
      completed: assignments.filter(a => a.status === 'complete').length,
      inProgress: assignments.filter(a => a.status === 'in_progress').length,
      assigned: assignments.filter(a => a.status !== 'complete' && a.status !== 'in_progress' && a.status !== 'overdue').length,
      overdue: assignments.filter(a => {
        // Safely check for overdue assignments
        if (a.status === 'complete') return false;
        if (!a.dueDate) return false;
        
        try {
          const dueDate = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
          return dueDate < new Date();
        } catch (e) {
          console.error("Error parsing due date:", e);
          return false;
        }
      }).length
    };
    
    // Calculate completion rate
    const completionRate = stats.total > 0 ? 
      Math.round((stats.completed / stats.total) * 100) / 100 : 0;
    
    // Calculate average completion time
    let avgCompletionTimeText = 'N/A';
    
    const completedAssignments = assignments.filter(a => 
      a.status === 'complete' && a.startedAt && a.completedAt
    );
    
    if (completedAssignments.length > 0) {
      try {
        const totalMs = completedAssignments.reduce((total, assignment) => {
          // Safely convert to dates
          const start = assignment.startedAt.toDate ? 
            assignment.startedAt.toDate() : 
            new Date(assignment.startedAt);
            
          const end = assignment.completedAt.toDate ? 
            assignment.completedAt.toDate() : 
            new Date(assignment.completedAt);
            
          return total + (end - start);
        }, 0);
        
        const avgMs = totalMs / completedAssignments.length;
        const avgHours = Math.floor(avgMs / (1000 * 60 * 60));
        const avgMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
        
        avgCompletionTimeText = `${avgHours} hour${avgHours !== 1 ? 's' : ''}, ${avgMinutes} minute${avgMinutes !== 1 ? 's' : ''}`;
      } catch (e) {
        console.error("Error calculating average completion time:", e);
      }
    }
    
    // Remove HTML tags from description
    let description = 'No description provided';
    if (induction.description) {
      description = induction.description.replace(/<[^>]*>?/gm, '');
    }
    
    // Determine question count
    let questionCount = 0;
    if (induction.questions && Array.isArray(induction.questions)) {
      questionCount = induction.questions.length;
    } else if (induction.sections && Array.isArray(induction.sections)) {
      questionCount = induction.sections.reduce((count, section) => {
        return count + (Array.isArray(section.questions) ? section.questions.length : 0);
      }, 0);
    }
    
    // Try to download the AUT Events Induction Protal logo
    let logoBuffer = null;
    try {
      const logoUrl = 'https://dev-aut-events-induction.vercel.app/images/AUTEventsInductionPortal.jpg';
      const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      logoBuffer = Buffer.from(logoResponse.data, 'binary');
    } catch (logoError) {
      console.error("Failed to load logo:", logoError);
      // Continue without logo if it fails to load
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `${induction.name} - ${exportType === 'full' ? 'Full' : 'Summary'} Report`,
        Author: 'AUT Events Induction Portal',
        Subject: 'Induction Report',
        Keywords: 'induction, report, AUTEVENTS',
        Creator: 'AUT Events Induction Portal',
        Producer: 'PDFKit'
      }
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${induction.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.pdf`
    );
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // PDF Helper Functions
    const addPageHeader = () => {
      // Add black header bar
      doc.rect(0, 0, 595.28, 80)
         .fill('#000000');
      
      // Add title
      const title = `${exportType === 'full' ? 'Full' : 'Summary'} Report: ${induction.name}`;
      doc.fontSize(16)
         .fillColor('white')
         .text(title, 50, 30, { width: 350 });
      
      // Add logo (if available)
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 450, 15, { width: 100 });
        } catch (imgError) {
          console.error("Error adding logo to PDF:", imgError);
        }
      }
    };
    
    // Helper for consistent styling
    const addSectionTitle = (title, yPosition) => {
      doc.fontSize(16)
         .fillColor('#000000')
         .text(title, 50, yPosition || doc.y);
      
      doc.moveTo(50, doc.y + 5)
         .lineTo(545, doc.y + 5)
         .stroke('#000000');
      
      doc.moveDown(1);
      return doc.y;
    };
    
    // Helper for table headers
    const addTableHeader = (headers, widths, yPos) => {
      let x = 50;
      
      // Draw header background
      doc.rect(50, yPos, widths.reduce((a, b) => a + b, 0), 25)
         .fill('#000000');
      
      // Draw headers
      headers.forEach((header, i) => {
        doc.fontSize(10)
           .fillColor('white')
           .text(header, x + 5, yPos + 8, { width: widths[i] - 10 });
        
        x += widths[i];
      });
      
      return yPos + 25;
    };
    
    // Helper to draw status bars
    const drawStatusBars = (yPos) => {
      const barWidth = 400;
      const barHeight = 20;
      const gapBetweenBars = 25;
      let currentY = yPos;
      
      // Calculate percentages
      const totalCount = stats.total || 1;
      const completedPercent = (stats.completed / totalCount) * 100;
      const inProgressPercent = (stats.inProgress / totalCount) * 100;
      const assignedPercent = (stats.assigned / totalCount) * 100;
      const overduePercent = (stats.overdue / totalCount) * 100;
      
      // Title
      doc.fontSize(14)
         .fillColor('#000000')
         .text('Completion Status', 50, currentY);
      
      currentY += 30;
      
      // Completed bar
      doc.rect(50, currentY, barWidth, barHeight).fill('#f5f5f5');
      doc.rect(50, currentY, (completedPercent / 100) * barWidth, barHeight).fill('#4CAF50');
      doc.fontSize(10)
         .fillColor('black')
         .text(`Completed: ${stats.completed} (${completedPercent.toFixed(1)}%)`, 60, currentY + 5);
      
      currentY += gapBetweenBars;
      
      // In Progress bar
      doc.rect(50, currentY, barWidth, barHeight).fill('#f5f5f5');
      doc.rect(50, currentY, (inProgressPercent / 100) * barWidth, barHeight).fill('#2196F3');
      doc.fillColor('black')
         .text(`In Progress: ${stats.inProgress} (${inProgressPercent.toFixed(1)}%)`, 60, currentY + 5);
      
      currentY += gapBetweenBars;
      
      // Assigned bar
      doc.rect(50, currentY, barWidth, barHeight).fill('#f5f5f5');
      doc.rect(50, currentY, (assignedPercent / 100) * barWidth, barHeight).fill('#FFC107');
      doc.fillColor('black')
         .text(`Assigned: ${stats.assigned} (${assignedPercent.toFixed(1)}%)`, 60, currentY + 5);
      
      currentY += gapBetweenBars;
      
      // Overdue bar
      doc.rect(50, currentY, barWidth, barHeight).fill('#f5f5f5');
      doc.rect(50, currentY, (overduePercent / 100) * barWidth, barHeight).fill('#F44336');
      doc.fillColor('black')
         .text(`Overdue: ${stats.overdue} (${overduePercent.toFixed(1)}%)`, 60, currentY + 5);
      
      return currentY + 30;
    };
    
    // PDF Content Generator based on export type
    if (exportType === 'summary') {
      // SUMMARY REPORT
      
      // Add the page header
      addPageHeader();
      
      // Start content below header
      doc.y = 100;

      // Add generation date
      doc.fontSize(9)
         .fillColor('#666666')
         .text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { 
           align: 'left', 
           width: 250 
         });

      doc.moveDown(2);
      
      // Statistics Section
      addSectionTitle('Assignment Statistics');
      
      // Statistics Table
      const statsData = [
        ['Total Assignments:', stats.total.toString()],
        ['Completed:', stats.completed.toString()],
        ['In Progress:', stats.inProgress.toString()],
        ['Assigned:', stats.assigned.toString()],
        ['Overdue:', stats.overdue.toString()],
        ['Completion Rate:', `${(completionRate * 100).toFixed(2)}%`]
      ];
      
      const tableWidth = 300;
      const colWidth = [200, 100];
      const rowHeight = 25;
      let yPos = doc.y;
      
      // Draw stats table
      statsData.forEach((row, i) => {
        // Draw cell background
        if (i % 2 === 1) {
          doc.rect(50, yPos, tableWidth, rowHeight).fill('#f5f5f5');
        }
        
        // Draw text
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + 7, { width: colWidth[0] - 10 })
           .text(row[1], 60 + colWidth[0], yPos + 7, { width: colWidth[1] - 10 });
        
        yPos += rowHeight;
      });
      
      // Add status bar
      if (stats.total > 0) {
        yPos += 30;
        drawStatusBars(yPos);
      }
      
    } else {
      // FULL REPORT
      
      // Add the page header
      addPageHeader();
      
      // Start content below header
      doc.y = 100;

      // Add generation date
      doc.fontSize(9)
         .fillColor('#666666')
         .text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { 
           align: 'left', 
           width: 250 
         });
         
      doc.moveDown(2);
    
      // Induction Details Section
      addSectionTitle('Induction Details');
      
      // Details table
      const detailsData = [
        ['Name:', induction.name || 'Unnamed Induction'],
        ['Department:', induction.department || 'Not specified'],
        ['Number of Questions:', questionCount.toString()],
        ['Description:', description]
      ];
      
      let yPos = doc.y;
      
      detailsData.forEach((row, i) => {
        // Get text height for description which might be multiline
        const textOptions = { width: 350 };
        const textHeight = row[0] === 'Description:' ? 
          doc.heightOfString(row[1], textOptions) : 20;
        
        // Draw row background for alternating rows
        if (i % 2 === 1) {
          doc.rect(50, yPos, 500, textHeight + 10).fill('#f5f5f5');
        }
        
        // Draw text
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + 5);
        
        doc.fillColor('#000000')
           .text(row[1], 200, yPos + 5, { width: 350 });
        
        yPos += textHeight + 10;
      });
      
      // Move down
      doc.moveDown(2);
      
      // Check if we need to start a new page for Summary Statistics
      if (doc.y > 700) {
        doc.addPage();
        addPageHeader();
        doc.y = 100;
      }
      
      // Summary Statistics Section
      addSectionTitle('Summary Statistics');
      
      // Statistics Tables (2 columns)
      const statsCol1 = [
        ['Total Assignments:', stats.total.toString()],
        ['Completed:', stats.completed.toString()]
      ];
      
      const statsCol2 = [
        ['In Progress:', stats.inProgress.toString()],
        ['Assigned:', stats.assigned.toString()]
      ];
      
      const statsCol3 = [
        ['Overdue:', stats.overdue.toString()]
      ];
      
      // Draw Column 1
      yPos = doc.y;
      
      statsCol1.forEach((row, i) => {
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + (i * 25))
           .text(row[1], 180, yPos + (i * 25));
      });
      
      // Draw Column 2
      statsCol2.forEach((row, i) => {
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 250, yPos + (i * 25))
           .text(row[1], 370, yPos + (i * 25));
      });
      
      // Draw Column 3 (for overdue)
      statsCol3.forEach((row, i) => {
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + (statsCol1.length * 25) + (i * 25))
           .text(row[1], 180, yPos + (statsCol1.length * 25) + (i * 25));
      });
      
      // Move down past the columns
      doc.moveDown(statsCol1.length + 2);
      
      // Additional Stats
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Completion Rate:', 60)
         .text(`${(completionRate * 100).toFixed(2)}%`, 180)
         .moveDown(0.5);
      
      doc.fillColor('#000000')
         .text('Average Completion Time:', 60)
         .text(avgCompletionTimeText, 180)
         .moveDown(2);
      
      // Add status bars
      if (stats.total > 0) {
        // Check if we need a new page for the status bars
        if (doc.y > 600) {
          doc.addPage();
          addPageHeader();
          doc.y = 100;
        }
        
        drawStatusBars(doc.y);
        doc.moveDown(8);
      }
      
      // Check if we need a new page for Staff Assignments
      if (doc.y > 650) {
        doc.addPage();
        addPageHeader();
        doc.y = 100;
      }
      
      // Staff Assignments Table
      addSectionTitle('Staff Assignments');
      
      // Table headers
      const headers = [
        'Staff Name',
        'Status',
        'Assigned Date',
        'Due Date',
        'Completed Date',
        'Completion Time'
      ];
      
      // Column widths
      const colWidths = [120, 80, 80, 80, 80, 100];
      const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
      
      // Draw table header
      let tableY = doc.y + 10;
      tableY = addTableHeader(headers, colWidths, tableY);
      
      // Draw table rows
      let rowCount = 0;
      for (const assignment of assignments) {
        // Check if we need a new page
        if (tableY > 730) {
          doc.addPage();
          addPageHeader();
          tableY = 100;
          tableY = addTableHeader(headers, colWidths, tableY);
        }
        
        // Row background for alternating rows
        if (rowCount % 2 === 1) {
          doc.rect(50, tableY, totalWidth, 25).fill('#f5f5f5');
        }
        
        // Row data
        const rowData = [
          assignment.user?.displayName || 'Unknown',
          formatStatus(assignment.status),
          formatDate(assignment.assignedAt),
          formatDate(assignment.dueDate),
          assignment.status === 'complete' ? formatDate(assignment.completedAt) : 'N/A',
          assignment.status === 'complete' ? 
            calculateCompletionTime(assignment.startedAt, assignment.completedAt) : 'N/A'
        ];
        
        // Draw row cells
        let xOffset = 50;
        rowData.forEach((data, i) => {
          // Set color for status cell
          if (i === 1) {
            if (data === 'Completed') {
              doc.fillColor('#2e7d32'); // Green for completed
            } else if (data === 'In Progress') {
              doc.fillColor('#f57c00'); // Orange for in progress
            } else if (data === 'Overdue') {
              doc.fillColor('#c62828'); // Red for overdue
            } else {
              doc.fillColor('#000000'); // Default
            }
          } else {
            doc.fillColor('#000000');
          }
          
          doc.fontSize(9)
             .text(
               data, 
               xOffset + 5, 
               tableY + 8, 
               { width: colWidths[i] - 10, ellipsis: true }
             );
          
          xOffset += colWidths[i];
        });
        
        tableY += 25;
        rowCount++;
      }
    }
    
    // Finalise the PDF document
    doc.end();
    
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({ error: error.message });
  }
};

// Function to get answer value
const getAnswerValue = (answer) => {
  if (!answer) return "No answer provided";
  
  try {    
    // For multichoice with selectedOptions
    if (answer.selectedOptions) {
      if (Array.isArray(answer.selectedOptions)) {
        return answer.selectedOptions.join(', ');
      }
      return String(answer.selectedOptions);
    }
    
    // Direct value access - expanded check
    if (answer.value !== undefined) {
      if (Array.isArray(answer.value)) {
        return answer.value.join(', ');
      } else if (typeof answer.value === 'object' && answer.value !== null) {
        return JSON.stringify(answer.value);
      }
      return String(answer.value);
    }
    
    // Text value for short answers
    if (answer.textValue !== undefined) {
      return String(answer.textValue);
    }
    
    // Try all common property names
    const valuePropNames = [
      'selectedOption', 'selected', 'answer', 'text', 'response', 
      'content', 'input', 'data', 'result'
    ];
    
    for (const prop of valuePropNames) {
      if (answer[prop] !== undefined) {
        if (Array.isArray(answer[prop])) {
          return answer[prop].join(', ');
        } else if (typeof answer[prop] === 'object' && answer[prop] !== null) {
          return JSON.stringify(answer[prop]);
        }
        return String(answer[prop]);
      }
    }
    
    // Last attempt: find any non-metadata property that might contain the answer
    for (const key in answer) {
      // Skip common metadata properties
      if (['id', 'questionId', 'type', 'questionType', 'createdAt', 'updatedAt'].includes(key)) {
        continue;
      }
      
      const val = answer[key];
      if (val !== undefined && val !== null && typeof val !== 'object') {
        return String(val);
      }
    }
    
    // If we reach here, return a debug-friendly message
    return `Answer data: ${JSON.stringify(answer)}`;
    
  } catch (err) {
    console.error("Error processing answer:", err);
    return "Error processing answer";
  }
};

// Export staff induction results to Excel
export const exportStaffInductionResultsToExcel = async (req, res) => {
  try {
    const userInductionId = req.params.userInductionId;
    const exportType = req.query.type || 'full'; // full or summary
    
    if (!userInductionId) {
      return res.status(400).json({ message: "User Induction ID is required" });
    }
    
    // Get the user induction details first
    const userInductionRef = db.collection("userInductions").doc(userInductionId);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ message: "User Induction not found" });
    }
    
    const userInduction = {
      id: userInductionDoc.id,
      ...userInductionDoc.data()
    };
    
    // Get the induction details
    const inductionRef = db.collection("inductions").doc(userInduction.inductionId);
    const inductionDoc = await inductionRef.get();
    
    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }
    
    const induction = {
      id: inductionDoc.id,
      ...inductionDoc.data()
    };
    
    // Get user details
    let userData = { displayName: "Unknown User", email: "No email available" };
    try {
      const userRecord = await admin.auth().getUser(userInduction.userId);
      userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        firstName: userRecord.displayName ? userRecord.displayName.split(' ')[0] : '',
        lastName: userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : ''
      };
    } catch (userError) {
      console.error(`Error fetching user ${userInduction.userId}:`, userError);
    }

    // Helper function to safely extract question text
    const getQuestionText = (question) => {
      if (!question) return 'Unknown question';
      
      // First, check for the most common property names
      if (question.title) return question.title;
      if (question.question) return question.question;
      if (question.questionTitle) return question.questionTitle;
      if (question.text) return question.text;
      
      // Additional checks for nested properties
      if (question.content) return question.content;
      if (question.prompt) return question.prompt;
      
      // Special case check - in some formats the question might be directly a string
      if (typeof question === 'string') return question;
      
      // Debug
      const textProperties = ['title', 'question', 'questionTitle', 'text', 'content', 'prompt'];
      for (const key of Object.keys(question)) {
        if (typeof question[key] === 'string' && 
            (key.toLowerCase().includes('question') || 
            key.toLowerCase().includes('title') || 
            key.toLowerCase().includes('text'))) {
          return question[key];
        }
      }
      
      return 'Unable to retrieve question text';
    };

    // Helper to get a readable question type label
    const getQuestionTypeLabel = (question, answer) => {
      // Try to get type from question first, then fallback to answer
      const type = question?.type || answer?.questionType || 'unknown';
      
      switch (type.toLowerCase()) {
        case 'multichoice':
        case 'multi':
        case 'multiple_choice':
          return "Multiple Choice";
        case 'true_false':
          return "True/False";
        case 'yes_no':
          return "Yes/No";
        case 'dropdown':
          return "Dropdown";
        case 'short_answer':
        case 'text':
          return "Short Answer";
        case 'textarea':
        case 'long_answer':
          return "Long Answer";
        case 'file_upload':
        case 'file':
          return "File Upload";
        case 'info_block':
        case 'information':
          return "Information";
        default:
          return type;
      }
    };

    // Function to format answers with options
    const formatAnswerWithOptions = (answer) => {
      if (!answer) return "No answer provided";

      // File upload questions
      if (answer.type === 'file_upload' || answer.questionType === 'file_upload' || 
      answer.type === 'file' || answer.questionType === 'file') {
    
        // Use generic message for all file upload questions
        return "For file responses, please refer to the website interface to view or download any uploaded files";
      }

      // short answer questions
      if (answer.type === 'short_answer' || answer.questionType === 'short_answer' || 
        answer.type === 'text' || answer.questionType === 'text') {
      
        // Check if its likely an unanswered text input
        if (!answer.value && !answer.textValue && !answer.text && !answer.response) {
          return "No answer provided for this text input";
        }
      }
      
      try {
        // For questions with options (multichoice, dropdown, true/false)
        if (answer.allOptions && Array.isArray(answer.allOptions)) {
          let result = [];
          
          // For multichoice with multiple selections
          if (answer.selectedOptions && Array.isArray(answer.selectedOptions)) {
            // Convert string indexes to numbers if needed
            const selectedIndexes = answer.selectedOptions.map(idx => 
              typeof idx === 'string' ? parseInt(idx, 10) : idx);
            
            // Show all options, marking selected ones
            answer.allOptions.forEach((option, index) => {
              const isSelected = selectedIndexes.includes(index);
              if (isSelected) {
                result.push(`• ${option} (Selected)`);
              } else {
                result.push(`• ${option}`);
              }
            });
            
            return result.join('\n');
          }
          
          // For dropdown or true/false with single selection
          if (answer.selectedOption !== undefined) {
            // Convert to number if needed
            const selectedIndex = typeof answer.selectedOption === 'string' ? 
                                parseInt(answer.selectedOption, 10) : 
                                answer.selectedOption;
            
            // Show all options, marking the selected one
            answer.allOptions.forEach((option, index) => {
              const isSelected = index === selectedIndex;
              if (isSelected) {
                result.push(`• ${option} (Selected)`);
              } else {
                result.push(`• ${option}`);
              }
            });
            
            return result.join('\n');
          }
          
          // If no selection found but we have options, just list them
          return answer.allOptions.map(opt => `• ${opt}`).join('\n');
        }
        
        // For other answer types
        if (answer.value !== undefined) {
          if (Array.isArray(answer.value)) {
            return answer.value.join(', ');
          } else if (typeof answer.value === 'object' && answer.value !== null) {
            return JSON.stringify(answer.value);
          }
          return String(answer.value);
        }
        
        // Fallback
        return "No specific answer format detected";
      } catch (err) {
        console.error("Error formatting answer with options:", err);
        return "Error processing answer";
      }
    };

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AUT Events Induction Portal';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Helper functions for formatting and data handling
    const formatDateForExcel = (date) => {
      if (!date) return '';
      try {
        if (date instanceof Date) {
          return date;
        } else if (date.toDate) {
          // Handle Firestore Timestamp
          return date.toDate();
        }
        return new Date(date);
      } catch (e) {
        console.error("Date format error:", e);
        return '';
      }
    };

    const formatStatus = (status) => {
      switch(status) {
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'complete': return 'Completed';
        case 'overdue': return 'Overdue';
        default: return status;
      }
    };

    const calculateCompletionTime = (startDate, endDate) => {
      if (!startDate || !endDate) return '';
      try {
        const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        const diffMs = end - start;
        
        // Convert to hours, minutes
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } catch (e) {
        console.error("Completion time calculation error:", e);
        return '';
      }
    };
    
    // Helper function to create styled section headers
    const createSectionHeader = (sheet, cell, title) => {
      sheet.mergeCells(cell);
      const headerCell = sheet.getCell(cell.split(':')[0]);
      headerCell.value = title;
      headerCell.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '000000' }
      };
      headerCell.alignment = { horizontal: 'center' };
    };
    
    // Helper function to safely format dates
    const safeDate = (date) => {
      if (!date) return null;
      try {
        return date.toDate ? date.toDate() : new Date(date);
      } catch (e) {
        console.error("Date format error:", e, date);
        return null;
      }
    };
    
    // Helper function to safely format status
    const safeStatus = (status) => {
      switch(status) {
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'complete': return 'Completed';
        case 'overdue': return 'Overdue';
        default: return status || 'Unknown';
      }
    };
    
    // Helper function to calculate completion time as hours for Excel
    const calculateCompletionTimeHours = (startDate, endDate) => {
      if (!startDate || !endDate) return null;
      
      try {
        const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        const diffMs = end - start;
        
        // Return as hours for Excel formatting
        return diffMs / (1000 * 60 * 60);
      } catch (e) {
        console.error("Completion time calculation error:", e);
        return null;
      }
    };

    // Check if induction is completed
    const isCompleted = userInduction.status === 'complete';
    
    if (!isCompleted) {
      return res.status(400).json({ message: "Cannot export incomplete induction results" });
    }

    // Create worksheets based on export type
    if (exportType === 'summary') {
      try {
        // SUMMARY EXPORT
        const summarySheet = workbook.addWorksheet('Summary');
        
        // Title
        summarySheet.mergeCells('A1:E1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = `Staff Induction Summary: ${userData.displayName} - ${induction.name || 'Induction'}`;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        
        // Section header
        createSectionHeader(summarySheet, 'A5:E5', 'Staff Details');
        
        // Staff details
        const detailsStartRow = 6;
        
        summarySheet.getCell(`A${detailsStartRow}`).value = 'Name:';
        summarySheet.getCell(`B${detailsStartRow}`).value = userData.displayName;
        summarySheet.getCell(`A${detailsStartRow}`).font = { bold: true };
        
        summarySheet.getCell(`A${detailsStartRow+1}`).value = 'Email:';
        summarySheet.getCell(`B${detailsStartRow+1}`).value = userData.email;
        summarySheet.getCell(`A${detailsStartRow+1}`).font = { bold: true };
        
        // Induction details section header
        createSectionHeader(summarySheet, 'A8:E8', 'Induction Details');
        
        // Induction details
        const inductionStartRow = 9;
        
        summarySheet.getCell(`A${inductionStartRow}`).value = 'Induction:';
        summarySheet.getCell(`B${inductionStartRow}`).value = induction.name;
        summarySheet.getCell(`A${inductionStartRow}`).font = { bold: true };
        
        summarySheet.getCell(`A${inductionStartRow+1}`).value = 'Department:';
        summarySheet.getCell(`B${inductionStartRow+1}`).value = induction.department || 'Not specified';
        summarySheet.getCell(`A${inductionStartRow+1}`).font = { bold: true };
        
        // Assignment details section header
        createSectionHeader(summarySheet, 'A11:E11', 'Assignment Details');
        
        // Assignment details
        const assignmentStartRow = 12;
        
        summarySheet.getCell(`A${assignmentStartRow}`).value = 'Status:';
        summarySheet.getCell(`B${assignmentStartRow}`).value = formatStatus(userInduction.status);
        summarySheet.getCell(`A${assignmentStartRow}`).font = { bold: true };
        
        if (userInduction.status === 'complete') {
          summarySheet.getCell(`B${assignmentStartRow}`).font = { color: { argb: '006100' } }; // Green for complete
        } else if (userInduction.status === 'overdue') {
          summarySheet.getCell(`B${assignmentStartRow}`).font = { color: { argb: '9C0006' } }; // Red for overdue
        }
        
        summarySheet.getCell(`A${assignmentStartRow+1}`).value = 'Assigned Date:';
        summarySheet.getCell(`B${assignmentStartRow+1}`).value = safeDate(userInduction.assignedAt);
        summarySheet.getCell(`B${assignmentStartRow+1}`).numFmt = 'dd/mm/yyyy';
        summarySheet.getCell(`A${assignmentStartRow+1}`).font = { bold: true };
        
        summarySheet.getCell(`A${assignmentStartRow+2}`).value = 'Due Date:';
        summarySheet.getCell(`B${assignmentStartRow+2}`).value = safeDate(userInduction.dueDate);
        summarySheet.getCell(`B${assignmentStartRow+2}`).numFmt = 'dd/mm/yyyy';
        summarySheet.getCell(`A${assignmentStartRow+2}`).font = { bold: true };
        
        summarySheet.getCell(`A${assignmentStartRow+3}`).value = 'Started Date:';
        summarySheet.getCell(`B${assignmentStartRow+3}`).value = safeDate(userInduction.startedAt);
        summarySheet.getCell(`B${assignmentStartRow+3}`).numFmt = 'dd/mm/yyyy';
        summarySheet.getCell(`A${assignmentStartRow+3}`).font = { bold: true };
        
        summarySheet.getCell(`A${assignmentStartRow+4}`).value = 'Completed Date:';
        summarySheet.getCell(`B${assignmentStartRow+4}`).value = safeDate(userInduction.completedAt);
        summarySheet.getCell(`B${assignmentStartRow+4}`).numFmt = 'dd/mm/yyyy';
        summarySheet.getCell(`A${assignmentStartRow+4}`).font = { bold: true };
        
        summarySheet.getCell(`A${assignmentStartRow+5}`).value = 'Completion Time:';
        const completionTime = calculateCompletionTimeHours(userInduction.startedAt, userInduction.completedAt);
        
        if (completionTime !== null) {
          summarySheet.getCell(`B${assignmentStartRow+5}`).value = completionTime;
          summarySheet.getCell(`B${assignmentStartRow+5}`).numFmt = '[h]:mm';
        } else {
          summarySheet.getCell(`B${assignmentStartRow+5}`).value = 'N/A';
        }
        
        summarySheet.getCell(`A${assignmentStartRow+5}`).font = { bold: true };
        
        // Report generation footer
        summarySheet.getCell('A20').value = `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} from the AUT Events Induction Portal`;
        summarySheet.getCell('A20').font = { italic: true, color: { argb: '808080' } };
        
      } catch (summaryError) {
        console.error("Error in summary export:", summaryError);
        return res.status(500).json({ 
          error: "Failed to generate summary report", 
          details: summaryError.message 
        });
      }
    } else {
      try {
        // FULL REPORT EXPORT

        const mainSheet = workbook.addWorksheet('Staff Induction Report');
        
        // SECTION 1: HEADER AND TITLE
        mainSheet.mergeCells('A1:I1');
        const titleCell = mainSheet.getCell('A1');
        titleCell.value = `Staff Induction Report: ${userData.displayName} - ${induction.name || 'Unnamed Induction'}`;
        titleCell.font = { size: 18, bold: true, color: { argb: '000000' } };
        titleCell.alignment = { horizontal: 'center' };
        
        // Add report metadata
        mainSheet.getCell('A3').value = 'Report Date:';
        mainSheet.getCell('B3').value = new Date();
        mainSheet.getCell('B3').numFmt = 'dd MMMM yyyy';
        mainSheet.getCell('A3').font = { bold: true };
        
        // SECTION 2: STAFF DETAILS
        createSectionHeader(mainSheet, 'A5:I5', 'Staff Details');
        
        // Add staff details (2 columns)
        const staffStartRow = 6;
        
        mainSheet.getCell(`A${staffStartRow}`).value = 'Name:';
        mainSheet.getCell(`B${staffStartRow}`).value = userData.displayName;
        mainSheet.getCell(`A${staffStartRow}`).font = { bold: true };
        
        mainSheet.getCell(`A${staffStartRow+1}`).value = 'Email:';
        mainSheet.getCell(`B${staffStartRow+1}`).value = userData.email;
        mainSheet.getCell(`A${staffStartRow+1}`).font = { bold: true };
        
        // SECTION 3: INDUCTION DETAILS
        createSectionHeader(mainSheet, 'A8:I8', 'Induction Details');
        
        // Add induction details
        const detailsStartRow = 9;
        
        mainSheet.getCell(`A${detailsStartRow}`).value = 'Name:';
        mainSheet.getCell(`B${detailsStartRow}`).value = induction.name || 'Unnamed Induction';
        mainSheet.getCell(`A${detailsStartRow}`).font = { bold: true };
        
        mainSheet.getCell(`A${detailsStartRow+1}`).value = 'Department:';
        mainSheet.getCell(`B${detailsStartRow+1}`).value = induction.department || 'Not specified';
        mainSheet.getCell(`A${detailsStartRow+1}`).font = { bold: true };
        
        // Determine question count
        let questionCount = 0;
        if (induction.questions && Array.isArray(induction.questions)) {
          questionCount = induction.questions.length;
        } else if (induction.sections && Array.isArray(induction.sections)) {
          questionCount = induction.sections.reduce((count, section) => {
            return count + (Array.isArray(section.questions) ? section.questions.length : 0);
          }, 0);
        }
        
        mainSheet.getCell(`A${detailsStartRow+2}`).value = 'Number of Questions:';
        mainSheet.getCell(`B${detailsStartRow+2}`).value = questionCount;
        mainSheet.getCell(`A${detailsStartRow+2}`).font = { bold: true };
        
        // Description
        let description = 'No description provided';
        if (induction.description) {
          // Remove HTML tags for clean display in Excel
          description = induction.description.replace(/<[^>]*>?/gm, '');
        }
        
        mainSheet.getCell(`A${detailsStartRow+3}`).value = 'Description:';
        mainSheet.getCell(`B${detailsStartRow+3}`).value = description;
        mainSheet.getCell(`A${detailsStartRow+3}`).font = { bold: true };
        
        // Make the description cell wrap text
        mainSheet.getCell(`B${detailsStartRow+3}`).alignment = { wrapText: true };
        mainSheet.getRow(detailsStartRow+3).height = 60; // Set row height to accommodate wrapped text
        
        // SECTION 4: ASSIGNMENT DETAILS
        createSectionHeader(mainSheet, `A${detailsStartRow+5}:I${detailsStartRow+5}`, 'Assignment Details');
        
        // Add assignment details
        const assignmentStartRow = detailsStartRow + 6;
        
        mainSheet.getCell(`A${assignmentStartRow}`).value = 'Status:';
        mainSheet.getCell(`B${assignmentStartRow}`).value = formatStatus(userInduction.status);
        mainSheet.getCell(`A${assignmentStartRow}`).font = { bold: true };
        
        if (userInduction.status === 'complete') {
          mainSheet.getCell(`B${assignmentStartRow}`).font = { color: { argb: '006100' } }; // Green for complete
        } else if (userInduction.status === 'overdue') {
          mainSheet.getCell(`B${assignmentStartRow}`).font = { color: { argb: '9C0006' } }; // Red for overdue
        }
        
        mainSheet.getCell(`A${assignmentStartRow+1}`).value = 'Assigned Date:';
        mainSheet.getCell(`B${assignmentStartRow+1}`).value = safeDate(userInduction.assignedAt);
        mainSheet.getCell(`B${assignmentStartRow+1}`).numFmt = 'dd/mm/yyyy';
        mainSheet.getCell(`A${assignmentStartRow+1}`).font = { bold: true };
        
        mainSheet.getCell(`A${assignmentStartRow+2}`).value = 'Available From:';
        mainSheet.getCell(`B${assignmentStartRow+2}`).value = safeDate(userInduction.availableFrom);
        mainSheet.getCell(`B${assignmentStartRow+2}`).numFmt = 'dd/mm/yyyy';
        mainSheet.getCell(`A${assignmentStartRow+2}`).font = { bold: true };
        
        mainSheet.getCell(`A${assignmentStartRow+3}`).value = 'Due Date:';
        mainSheet.getCell(`B${assignmentStartRow+3}`).value = safeDate(userInduction.dueDate);
        mainSheet.getCell(`B${assignmentStartRow+3}`).numFmt = 'dd/mm/yyyy';
        mainSheet.getCell(`A${assignmentStartRow+3}`).font = { bold: true };
        
        mainSheet.getCell(`A${assignmentStartRow+4}`).value = 'Started Date:';
        mainSheet.getCell(`B${assignmentStartRow+4}`).value = safeDate(userInduction.startedAt);
        mainSheet.getCell(`B${assignmentStartRow+4}`).numFmt = 'dd/mm/yyyy';
        mainSheet.getCell(`A${assignmentStartRow+4}`).font = { bold: true };
        
        mainSheet.getCell(`A${assignmentStartRow+5}`).value = 'Completed Date:';
        mainSheet.getCell(`B${assignmentStartRow+5}`).value = safeDate(userInduction.completedAt);
        mainSheet.getCell(`B${assignmentStartRow+5}`).numFmt = 'dd/mm/yyyy';
        mainSheet.getCell(`A${assignmentStartRow+5}`).font = { bold: true };
        
        mainSheet.getCell(`A${assignmentStartRow+6}`).value = 'Completion Time:';
        const completionTime = calculateCompletionTimeHours(userInduction.startedAt, userInduction.completedAt);
        
        if (completionTime !== null) {
          mainSheet.getCell(`B${assignmentStartRow+6}`).value = completionTime;
          mainSheet.getCell(`B${assignmentStartRow+6}`).numFmt = '[h]:mm';
        } else {
          mainSheet.getCell(`B${assignmentStartRow+6}`).value = 'N/A';
        }
        
        mainSheet.getCell(`A${assignmentStartRow+6}`).font = { bold: true };
        
        // SECTION 5: RESPONSES AND ANSWERS
        const responsesStartRow = assignmentStartRow + 8;
        
        createSectionHeader(mainSheet, `A${responsesStartRow}:I${responsesStartRow}`, 'Responses');
        
        // Process the answers
        let currentRow = responsesStartRow + 2;
        
        // Determine whether to use sections or flat question list
        if (induction.sections && Array.isArray(induction.sections)) {
          // Process questions from sections
          induction.sections.forEach((section, sectionIndex) => {
            // Add section title
            mainSheet.mergeCells(`A${currentRow}:I${currentRow}`);
            mainSheet.getCell(`A${currentRow}`).value = section.title || `Section ${sectionIndex + 1}`;
            mainSheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
            mainSheet.getCell(`A${currentRow}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'E0E0E0' } // Light gray
            };
            
            currentRow += 1;
            
            // Process questions in this section
            if (section.questions && Array.isArray(section.questions)) {
              section.questions.forEach((question, questionIndex) => {
                // Find answer for this question
                const answer = userInduction.answers && Array.isArray(userInduction.answers) 
                  ? userInduction.answers.find(a => a.questionId === question.id)
                  : null;
                
                // Question number (count within the section)
                const questionNumber = `${sectionIndex + 1}.${questionIndex + 1}`;
                
                // Get question text
                const questionText = getQuestionText(question);
                
                // Get question type
                const questionType = getQuestionTypeLabel(question, answer);
                
                // Question text with number and type
                mainSheet.mergeCells(`A${currentRow}:I${currentRow}`);
                mainSheet.getCell(`A${currentRow}`).value = `Q${questionNumber}: ${questionText} (${questionType})`;
                mainSheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
                
                currentRow += 1;
                
                // Answer with all options
                mainSheet.mergeCells(`A${currentRow}:I${currentRow}`);
                
                const answerText = formatAnswerWithOptions(answer);
                
                mainSheet.getCell(`A${currentRow}`).value = answerText;
                mainSheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
                
                // Adjust row height based on answer content
                const numberOfLines = (answerText.match(/\n/g) || []).length + 1;
                mainSheet.getRow(currentRow).height = Math.max(15 * numberOfLines, 30);
                
                if (answerText.includes('(Selected)')) {
                  mainSheet.getCell(`A${currentRow}`).font = { color: { argb: '0066CC' } };
                }
                
                currentRow += 2; 
              });
            }
            
            currentRow += 1; // Add space after section
          });
        } else if (induction.questions && Array.isArray(induction.questions)) {
          // Process flat list of questions
          induction.questions.forEach((question, questionIndex) => {
            // Find answer for this question
            const answer = userInduction.answers && Array.isArray(userInduction.answers) 
              ? userInduction.answers.find(a => a.questionId === question.id)
              : null;
            
            // Question number
            const questionNumber = `${questionIndex + 1}`;
            
            // Get question text
            const questionText = getQuestionText(question);
            
            // Get question type
            const questionType = getQuestionTypeLabel(question, answer);
            
            // Question text with number and type
            mainSheet.mergeCells(`A${currentRow}:I${currentRow}`);
            mainSheet.getCell(`A${currentRow}`).value = `Q${questionNumber}: ${questionText} (${questionType})`;
            mainSheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
            
            currentRow += 1;
            
            // Answer with all options
            mainSheet.mergeCells(`A${currentRow}:I${currentRow}`);
            
            const answerText = formatAnswerWithOptions(answer);
            
            mainSheet.getCell(`A${currentRow}`).value = answerText;
            mainSheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
            
            // Adjust row height based on answer content
            const numberOfLines = (answerText.match(/\n/g) || []).length + 1;
            mainSheet.getRow(currentRow).height = Math.max(15 * numberOfLines, 30);
            
            // Apply conditional formatting for selected options
            if (answerText.includes('(Selected)')) {
              mainSheet.getCell(`A${currentRow}`).font = { color: { argb: '0066CC' } };
            }
            
            currentRow += 2; // Add some space between questions
          });
        }
        
        // SECTION 6: FEEDBACK
        if (userInduction.feedback) {
          currentRow += 2; // Add extra space before feedback section
          
          createSectionHeader(mainSheet, `A${currentRow}:I${currentRow}`, 'Feedback');
          currentRow += 2;
          
          let feedback = typeof userInduction.feedback === 'object'
            ? userInduction.feedback
            : { detailedFeedback: String(userInduction.feedback) };
          
          // Overall Rating
          if (feedback.overallRating) {
            mainSheet.getCell(`A${currentRow}`).value = 'Overall Experience Rating:';
            mainSheet.getCell(`A${currentRow}`).font = { bold: true };
            
            let ratingText = '';
            let ratingColor = '';
            
            switch(feedback.overallRating) {
              case 1:
                ratingText = 'Not Satisfied';
                ratingColor = '9C0006'; // Red
                break;
              case 2:
                ratingText = 'Neutral';
                ratingColor = 'F79646'; // Orange
                break;
              case 3:
                ratingText = 'Satisfied';
                ratingColor = '006100'; // Green
                break;
              default:
                ratingText = `Rating: ${feedback.overallRating}`;
            }
            
            mainSheet.getCell(`B${currentRow}`).value = ratingText;
            if (ratingColor) {
              mainSheet.getCell(`B${currentRow}`).font = { color: { argb: ratingColor } };
            }
            currentRow += 1;
          }
          
          // Website Usability
          if (feedback.websiteUsability) {
            mainSheet.getCell(`A${currentRow}`).value = 'Website Usability:';
            mainSheet.getCell(`A${currentRow}`).font = { bold: true };
            
            let usabilityText = '';
            let usabilityColor = '';
            
            switch(feedback.websiteUsability) {
              case 'veryEasy':
                usabilityText = 'Very easy - Had no issues';
                usabilityColor = '006100'; // Green
                break;
              case 'easy':
                usabilityText = 'Easy - Had minor issues';
                usabilityColor = '548235'; // Light green
                break;
              case 'neutral':
                usabilityText = 'Neutral';
                usabilityColor = 'F79646'; // Orange
                break;
              case 'difficult':
                usabilityText = 'Difficult - Had several issues';
                usabilityColor = 'C65911'; // Dark orange
                break;
              case 'veryDifficult':
                usabilityText = 'Very difficult - Had many issues';
                usabilityColor = '9C0006'; // Red
                break;
              default:
                usabilityText = feedback.websiteUsability;
            }
            
            mainSheet.getCell(`B${currentRow}`).value = usabilityText;
            if (usabilityColor) {
              mainSheet.getCell(`B${currentRow}`).font = { color: { argb: usabilityColor } };
            }
            currentRow += 1;
          }
          
          // Content Clarity
          if (feedback.contentClarity) {
            mainSheet.getCell(`A${currentRow}`).value = 'Content Clarity:';
            mainSheet.getCell(`A${currentRow}`).font = { bold: true };
            
            let clarityText = '';
            let clarityColor = '';
            
            switch(feedback.contentClarity) {
              case 'veryClear':
                clarityText = 'Very clear and helpful';
                clarityColor = '006100'; // Green
                break;
              case 'mostlyClear':
                clarityText = 'Mostly clear and helpful';
                clarityColor = '548235'; // Light green
                break;
              case 'somewhatClear':
                clarityText = 'Somewhat clear and helpful';
                clarityColor = 'F79646'; // Orange
                break;
              case 'notClear':
                clarityText = 'Not clear or helpful';
                clarityColor = '9C0006'; // Red
                break;
              default:
                clarityText = feedback.contentClarity;
            }
            
            mainSheet.getCell(`B${currentRow}`).value = clarityText;
            if (clarityColor) {
              mainSheet.getCell(`B${currentRow}`).font = { color: { argb: clarityColor } };
            }
            currentRow += 1;
          }
          
          // Detailed Feedback
          if (feedback.detailedFeedback) {
            mainSheet.getCell(`A${currentRow}`).value = 'Additional Feedback:';
            mainSheet.getCell(`A${currentRow}`).font = { bold: true };
            currentRow += 1;
            
            mainSheet.mergeCells(`A${currentRow}:I${currentRow}`);
            mainSheet.getCell(`A${currentRow}`).value = feedback.detailedFeedback;
            mainSheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
            mainSheet.getRow(currentRow).height = 100;
            
            currentRow += 1;
          }
        }
        
        // Report Generation footer
        currentRow += 2;
        mainSheet.getCell(`A${currentRow}`).value = `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} from the AUT Events Induction Portal`;
        mainSheet.getCell(`A${currentRow}`).font = { italic: true, color: { argb: '808080' } };
        
        // Column widths for better readability
        mainSheet.getColumn('A').width = 20;
        mainSheet.getColumn('B').width = 30;
        mainSheet.getColumn('C').width = 20;
      } catch (fullReportError) {
        console.error("Error in full staff report export:", fullReportError);
        return res.status(500).json({ 
          error: "Failed to generate full staff report", 
          details: fullReportError.message 
        });
      }
    }
    
    // Set response headers for Excel download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    // Create a sanitised filename
    const fileName = `${userData.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${induction.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.xlsx`;
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ error: error.message });
  }
};

// Export staff induction results to PDF
export const exportStaffInductionResultsToPDF = async (req, res) => {
  try {
    // Helper function to safely extract question text
    const getQuestionText = (question) => {
      if (!question) return 'Unknown question';
      
      // Simple string case
      if (typeof question === 'string') return question;
      
      // Direct properties, in order of likelihood
      const directProps = ['title', 'question', 'questionTitle', 'text', 'content', 'prompt'];
      for (const prop of directProps) {
        if (question[prop] && typeof question[prop] === 'string') {
          return question[prop];
        }
      }
      
      // Deeper object properties
      for (const key in question) {
        if (typeof question[key] === 'object' && question[key] !== null) {
          for (const prop of directProps) {
            if (question[key][prop] && typeof question[key][prop] === 'string') {
              return question[key][prop];
            }
          }
        }
      }
      
      // Last resort: use any string property that might be the question
      for (const key in question) {
        if (typeof question[key] === 'string' && 
            (key.toLowerCase().includes('question') || 
             key.toLowerCase().includes('title') || 
             key.toLowerCase().includes('text'))) {
          return question[key];
        }
      }      
      return 'Unable to retrieve question text';
    };

    // Helper to get a readable question type label
    const getQuestionTypeLabel = (question, answer) => {
      // Try to get type from question first, then fallback to answer
      const type = question?.type || answer?.questionType || 'unknown';
      
      switch (type.toLowerCase()) {
        case 'multichoice':
        case 'multi':
        case 'multiple_choice':
          return "Multiple Choice";
        case 'true_false':
          return "True/False";
        case 'yes_no':
          return "Yes/No";
        case 'dropdown':
          return "Dropdown";
        case 'short_answer':
        case 'text':
          return "Short Answer";
        case 'textarea':
        case 'long_answer':
          return "Long Answer";
        case 'file_upload':
        case 'file':
          return "File Upload";
        case 'info_block':
        case 'information':
          return "Information";
        default:
          return type;
      }
    };

    // Function to normalize Firestore data to prevent issues with Timestamps and references
    const normalizeFirestoreData = (data) => {
      if (!data) return null;
      
      try {
        // Handle simple values
        if (typeof data !== 'object') return data;
        
        // Handle arrays
        if (Array.isArray(data)) {
          return data.map(item => normalizeFirestoreData(item));
        }
        
        // Handle Firestore Timestamp
        if (data.toDate && typeof data.toDate === 'function') {
          return data.toDate().toISOString();
        }
        
        // Handle plain objects recursively
        const normalized = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            normalized[key] = normalizeFirestoreData(data[key]);
          }
        });
        
        return normalized;
      } catch (err) {
        console.error("Error normalizing Firestore data:", err);
        return data; // Return original on error
      }
    };

    // Enhanced function to render answer with all options and highlight selected ones
    const renderAnswerWithOptions = (answer) => {
      if (!answer) {
        return "No answer provided";
      }

      // File upload 
      if (answer.type === 'file_upload' || answer.questionType === 'file_upload' || 
      answer.type === 'file' || answer.questionType === 'file') {
    
        // Use generic message for all file upload questions
        return "For file responses, please refer to the website interface to view or download any uploaded files";
      }

      // short answer text
      if (answer.type === 'short_answer' || answer.questionType === 'short_answer' || 
        answer.type === 'text' || answer.questionType === 'text') {
      
        // Check if its likely an unanswered text input
        if (!answer.value && !answer.textValue && !answer.text && !answer.response) {
          return "No answer provided for this text input";
        }
      }
      
      try {
        // Standardize answer object through normalization
        const normalizedAnswer = normalizeFirestoreData(answer);

        // Initialise fallback values for when specific formats fail
        let fallbackValue = null;
        let fallbackRendered = false;
        
        // Try to extract ANY value that might be the answer for fallback
        for (const key in normalizedAnswer) {
          // Skip common metadata properties
          if (['id', 'questionId', 'type', 'questionType', 'createdAt', 'updatedAt'].includes(key)) {
            continue; 
          }
          
          if (normalizedAnswer[key] !== undefined && normalizedAnswer[key] !== null) {
            if (Array.isArray(normalizedAnswer[key])) {
              fallbackValue = normalizedAnswer[key].join(', ');
              fallbackRendered = true;
            } else if (typeof normalizedAnswer[key] !== 'object') {
              fallbackValue = String(normalizedAnswer[key]);
              fallbackRendered = true;
            }
          }
        }
        
        // HANDLE MULTI-CHOICE ANSWERS
        
        // Case 1: Most common format - allOptions array with selectedOptions indexes
        if (normalizedAnswer.allOptions && Array.isArray(normalizedAnswer.allOptions) && 
            normalizedAnswer.selectedOptions && Array.isArray(normalizedAnswer.selectedOptions)) {
          let result = "";
          
          // Convert string indexes to numbers if needed
          const selectedIndexes = normalizedAnswer.selectedOptions.map(idx => 
            typeof idx === 'string' ? parseInt(idx, 10) : idx);
          
          normalizedAnswer.allOptions.forEach((option, index) => {
            const isSelected = selectedIndexes.includes(index);
            if (isSelected) {
              result += `• ${option} (Selected)\n`;
            } else {
              result += `• ${option}\n`;
            }
          });
          
          return result.trim();
        }
        
        // Case 2: Multi-choice with selectedOption (single selection)
        if (normalizedAnswer.allOptions && Array.isArray(normalizedAnswer.allOptions) && 
            normalizedAnswer.selectedOption !== undefined) {
          let result = "";
          
          const selectedIndex = typeof normalizedAnswer.selectedOption === 'string' ? 
                              parseInt(normalizedAnswer.selectedOption, 10) : 
                              normalizedAnswer.selectedOption;
          
          normalizedAnswer.allOptions.forEach((option, index) => {
            const isSelected = index === selectedIndex;
            if (isSelected) {
              result += `• ${option} (Selected)\n`;
            } else {
              result += `• ${option}\n`;
            }
          });
          
          return result.trim();
        }
        
        // Case 3: Multi-choice where selection is in value array
        if (normalizedAnswer.allOptions && Array.isArray(normalizedAnswer.allOptions) && 
            normalizedAnswer.value && Array.isArray(normalizedAnswer.value)) {
          let result = "";
          
          normalizedAnswer.allOptions.forEach((option) => {
            const isSelected = normalizedAnswer.value.includes(option);
            if (isSelected) {
              result += `• ${option} (Selected)\n`;
            } else {
              result += `• ${option}\n`;
            }
          });
          
          return result.trim();
        }
        
        // Case 4: Text representation (short_answer, textarea)
        if (normalizedAnswer.textValue !== undefined) {
          return String(normalizedAnswer.textValue);
        }
        
        // Case 5: Direct value representation (common format)
        if (normalizedAnswer.value !== undefined) {
          if (Array.isArray(normalizedAnswer.value)) {
            return normalizedAnswer.value.join(', ');
          } else if (typeof normalizedAnswer.value === 'object' && normalizedAnswer.value !== null) {
            return JSON.stringify(normalizedAnswer.value);
          }
          return String(normalizedAnswer.value);
        }
        
        // Case 6: Look for properties that might contain text answers
        const commonTextProperties = ['text', 'answer', 'response', 'content', 'selected', 'input'];
        for (const prop of commonTextProperties) {
          if (normalizedAnswer[prop] !== undefined) {
            if (Array.isArray(normalizedAnswer[prop])) {
              return normalizedAnswer[prop].join(', ');
            } else if (typeof normalizedAnswer[prop] === 'object' && normalizedAnswer[prop] !== null) {
              return JSON.stringify(normalizedAnswer[prop]);
            }
            return String(normalizedAnswer[prop]);
          }
        }
        
        // Case 7: For enumeration/multiple-choice without structure
        // Try to construct selection logic from properties
        if ((normalizedAnswer.type === 'multichoice' || normalizedAnswer.type === 'dropdown' || 
            normalizedAnswer.questionType === 'multichoice' || normalizedAnswer.questionType === 'dropdown')) {
          
          // Look for properties that might contain selection info
          const allProperties = Object.keys(normalizedAnswer);
          
          // Find options that might be selected (have truthy values)
          const selectedOptions = [];
          for (const prop of allProperties) {
            // Skip common metadata properties
            if (['id', 'questionId', 'type', 'questionType', 'createdAt', 'updatedAt'].includes(prop)) {
              continue;
            }
            
            if (normalizedAnswer[prop] === true || normalizedAnswer[prop] === 'selected' || normalizedAnswer[prop] === 'true') {
              selectedOptions.push(prop);
            }
          }
          
          if (selectedOptions.length > 0) {
            return selectedOptions.map(opt => `• ${opt} (Selected)`).join('\n');
          }
        }
        
        // Case 8: Use the fallback if we've identified a likely value
        if (fallbackRendered && fallbackValue) {
          return fallbackValue;
        }
        
        // Case 9: Last resort - try to extract useful information from answer object
        let result = [];
        const propertiesToSkip = ['id', 'questionId', 'type', 'questionType', 'createdAt', 'updatedAt'];
        
        for (const [key, value] of Object.entries(normalizedAnswer)) {
          if (propertiesToSkip.includes(key)) continue;
          
          if (value !== null && value !== undefined) {
            if (typeof value === 'object' && !Array.isArray(value)) {
              result.push(`${key}: ${JSON.stringify(value)}`);
            } else {
              result.push(`${key}: ${value}`);
            }
          }
        }
        
        if (result.length > 0) {
          return result.join('\n');
        }
        
        // Ultimate fallback with verbose answer data
        return `No recognizable answer format. Raw data: ${JSON.stringify(normalizedAnswer)}`;
        
      } catch (err) {
        console.error("Error rendering answer with options:", err);
        return "Error processing answer. Please check server logs.";
      }
    };

    // Function to find the best matching answer for a question
    const findMatchingAnswer = (question, answers) => {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return null;
      }
      
      // Try exact match first
      const exactMatch = answers.find(a => a.questionId === question.id);
      if (exactMatch) return exactMatch;
      
      // Try string/number conversion match
      const numberIdMatch = answers.find(a => 
        String(a.questionId) === String(question.id)
      );
      if (numberIdMatch) return numberIdMatch;
      
      // Try matching by questionId nested in question object
      const nestedMatch = answers.find(a => 
        a.question && a.question.id === question.id
      );
      if (nestedMatch) return nestedMatch;
      
      console.log(`Could not find answer for question ${question.id}`);
      return null;
    };

    const userInductionId = req.params.userInductionId;
    const exportType = req.query.type || 'full'; // full or summary
    
    if (!userInductionId) {
      return res.status(400).json({ message: "User Induction ID is required" });
    }
    
    // Get the user induction details first
    const userInductionRef = db.collection("userInductions").doc(userInductionId);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ message: "User Induction not found" });
    }
    
    // Extract and normalize the user induction data
    const userInduction = {
      id: userInductionDoc.id,
      ...userInductionDoc.data()
    };
    
    // Get the induction details
    const inductionRef = db.collection("inductions").doc(userInduction.inductionId);
    const inductionDoc = await inductionRef.get();
    
    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }
    
    const induction = {
      id: inductionDoc.id,
      ...inductionDoc.data()
    };
    
    // Get user details
    let userData = { displayName: "Unknown User", email: "No email available" };
    try {
      const userRecord = await admin.auth().getUser(userInduction.userId);
      userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        firstName: userRecord.displayName ? userRecord.displayName.split(' ')[0] : '',
        lastName: userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : ''
      };
    } catch (userError) {
      console.error(`Error fetching user ${userInduction.userId}:`, userError);
    }

    // Helper functions for formatting and data handling
    const formatDate = (date) => {
      if (!date) return 'N/A';
      try {
        if (date instanceof Date) {
          return format(date, 'dd/MM/yyyy');
        } else if (date.toDate) {
          // Handle Firestore Timestamp
          return format(date.toDate(), 'dd/MM/yyyy');
        }
        return format(new Date(date), 'dd/MM/yyyy');
      } catch (e) {
        console.error("Date format error:", e);
        return 'N/A';
      }
    };

    const formatStatus = (status) => {
      switch(status) {
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'complete': return 'Completed';
        case 'overdue': return 'Overdue';
        default: return status || 'Unknown';
      }
    };

    const calculateCompletionTime = (startDate, endDate) => {
      if (!startDate || !endDate) return 'N/A';
      try {
        const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        const diffMs = end - start;
        
        // Convert to hours, minutes
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } catch (e) {
        console.error("Completion time calculation error:", e);
        return 'N/A';
      }
    };
    
    // Check if induction is completed
    const isCompleted = userInduction.status === 'complete';
    
    if (!isCompleted) {
      return res.status(400).json({ message: "Cannot export incomplete induction results" });
    }
    
    // Try to download the AUT Events Induction Portal logo
    let logoBuffer = null;
    try {
      const logoUrl = 'https://dev-aut-events-induction.vercel.app/images/AUTEventsInductionPortal.jpg';
      const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      logoBuffer = Buffer.from(logoResponse.data, 'binary');
    } catch (logoError) {
      console.error("Failed to load logo:", logoError);
      // Continue without logo if it fails to load
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `${userData.displayName} - ${induction.name} - ${exportType === 'full' ? 'Full' : 'Summary'} Report`,
        Author: 'AUT Events Induction Portal',
        Subject: 'Staff Induction Report',
        Keywords: 'induction, report, AUTEVENTS',
        Creator: 'AUT Events Induction Portal',
        Producer: 'PDFKit'
      }
    });
    
    // Set response headers for PDF download - with explicit content type and headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Create a sanitised filename
    const fileName = `${userData.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${induction.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.pdf`;
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // PDF Helper Functions
    const addPageHeader = () => {
      doc.rect(0, 0, 595.28, 80)
         .fill('#000000');
      
      // Title in the header
      const title = `${exportType === 'full' ? 'Full' : 'Summary'} Report: ${userData.displayName} - ${induction.name}`;
      doc.fontSize(16)
         .fillColor('white')
         .text(title, 50, 30, { width: 350 });
      
      // Add logo (if available)
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 450, 15, { width: 100 });
        } catch (imgError) {
          console.error("Error adding logo to PDF:", imgError);
          // Continue without logo
        }
      }
    };
    
    // Helper for consistent styling
    const addSectionTitle = (title, yPosition) => {
      doc.fontSize(16)
         .fillColor('#000000')
         .text(title, 50, yPosition || doc.y);
      
      doc.moveTo(50, doc.y + 5)
         .lineTo(545, doc.y + 5)
         .stroke('#000000');
      
      doc.moveDown(1);
      return doc.y;
    };
    
    // Helper for table headers
    const addTableHeader = (headers, widths, yPos) => {
      let x = 50;
      
      // Draw header background
      doc.rect(50, yPos, widths.reduce((a, b) => a + b, 0), 25)
         .fill('#000000');
      
      // Draw headers
      headers.forEach((header, i) => {
        doc.fontSize(10)
           .fillColor('white')
           .text(header, x + 5, yPos + 8, { width: widths[i] - 10 });
        
        x += widths[i];
      });
      
      return yPos + 25;
    };
    
    // PDF Content Generator based on export type
    if (exportType === 'summary') {
      // SUMMARY REPORT
      
      // Add page header
      addPageHeader();
      
      // Start content below header
      doc.y = 100;

      // Add generation date
      doc.fontSize(9)
         .fillColor('#666666')
         .text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { 
           align: 'left', 
           width: 250 
         });
         
      doc.moveDown(2);
      
      // Staff Details Section
      addSectionTitle('Staff Details');
      
      // Details table
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Name:', 50, doc.y)
         .text(userData.displayName, 200, doc.y);
      
      doc.moveDown(0.5);
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Email:', 50, doc.y)
         .text(userData.email, 200, doc.y);
      
      doc.moveDown(2);
      
      // Induction Details Section
      addSectionTitle('Induction Details');
      
      // Table format for induction details
      const data = [
        ['Induction:', induction.name],
        ['Department:', induction.department || 'Not specified'],
        ['Status:', formatStatus(userInduction.status)],
        ['Assigned Date:', formatDate(userInduction.assignedAt)],
        ['Due Date:', formatDate(userInduction.dueDate)],
        ['Started Date:', formatDate(userInduction.startedAt)],
        ['Completed Date:', formatDate(userInduction.completedAt)],
        ['Completion Time:', calculateCompletionTime(userInduction.startedAt, userInduction.completedAt)]
      ];
      
      const tableWidth = 500;
      const colWidths = [150, 350];
      
      let yPos = doc.y;
      
      data.forEach((row, i) => {
        // Alternate row background
        if (i % 2 === 1) {
          doc.rect(50, yPos, tableWidth, 25).fill('#f5f5f5'); // Light gray
        }
        
        // Draw text
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + 7, { width: colWidths[0] - 10 })
           .text(row[1], 200, yPos + 7, { width: colWidths[1] - 10 });
        
        yPos += 25;
      });
      
    } else {
      // FULL REPORT
      let pageNumber = 1;
      
      // Add page header
      addPageHeader();
      
      // Start content below header
      doc.y = 100;

      // Add generation date
      doc.fontSize(9)
         .fillColor('#666666')
         .text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { 
           align: 'left', 
           width: 250 
         });
         
      doc.moveDown(2);
      
      // Staff Details Section
      addSectionTitle('Staff Details');
      
      // Details table
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Name:', 50, doc.y)
         .text(userData.displayName, 200, doc.y);
      
      doc.moveDown(0.5);
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Email:', 50, doc.y)
         .text(userData.email, 200, doc.y);
      
      doc.moveDown(2);
      
      // Induction Details Section
      addSectionTitle('Induction Details');
      
      // Induction table data
      const inductionData = [
        ['Induction:', induction.name],
        ['Department:', induction.department || 'Not specified']
      ];
      
      let yPos = doc.y;
      
      inductionData.forEach((row, i) => {
        // Alternate row background
        if (i % 2 === 1) {
          doc.rect(50, yPos, 500, 25).fill('#f5f5f5'); // Light gray
        }
        
        // Draw text
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + 7)
           .text(row[1], 200, yPos + 7);
        
        yPos += 25;
      });
      
      doc.moveDown(2);
      
      // Assignment Details Section
      addSectionTitle('Assignment Details');
      
      // Assignment table data
      const assignmentData = [
        ['Status:', formatStatus(userInduction.status)],
        ['Assigned Date:', formatDate(userInduction.assignedAt)],
        ['Available From:', formatDate(userInduction.availableFrom)],
        ['Due Date:', formatDate(userInduction.dueDate)],
        ['Started Date:', formatDate(userInduction.startedAt)],
        ['Completed Date:', formatDate(userInduction.completedAt)],
        ['Completion Time:', calculateCompletionTime(userInduction.startedAt, userInduction.completedAt)]
      ];
      
      yPos = doc.y;
      
      assignmentData.forEach((row, i) => {
        // Alternate row background
        if (i % 2 === 1) {
          doc.rect(50, yPos, 500, 25).fill('#f5f5f5');
        }
        
        // Draw text
        doc.fontSize(12)
           .fillColor('#000000')
           .text(row[0], 60, yPos + 7)
           .text(row[1], 200, yPos + 7);
        
        yPos += 25;
      });
      
      doc.moveDown(2);
      
      // Check if we need a new page for responses
      if (doc.y > 650) {
        doc.addPage();
        addPageHeader();
        doc.y = 100;
        pageNumber++;
      }
      
      // Responses Section
      addSectionTitle('Responses');

      // Process sections and questions
      if (induction.sections && Array.isArray(induction.sections)) {
        // Process sections
        induction.sections.forEach((section, sectionIndex) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
            addPageHeader();
            doc.y = 100;
            pageNumber++;
          }
          
          // Section title
          doc.fontSize(14)
             .fillColor('#000000')
             .text(section.title || `Section ${sectionIndex + 1}`, 50, doc.y)
             .moveDown(0.5);
          
          // Process questions in this section
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question, questionIndex) => {
              // Check if we need a new page
              if (doc.y > 700) {
                doc.addPage();
                addPageHeader();
                doc.y = 100;
                pageNumber++;
              }
              
              // Find answer for this question using the enhanced function
              const answer = findMatchingAnswer(question, userInduction.answers);
              
              // Question number (count within the section)
              const questionNumber = `${sectionIndex + 1}.${questionIndex + 1}`;
              
              // Question text with number and type
              const questionText = getQuestionText(question);
              const questionType = getQuestionTypeLabel(question, answer);
              
              doc.fontSize(10)
                 .fillColor('#000000')
                 .font('Helvetica-Bold')
                 .text(`Q${questionNumber}: ${questionText}`, 50, doc.y, { width: 495 })
                 .font('Helvetica')
                 .fontSize(8)
                 .fillColor('#666666')
                 .text(`(${questionType})`, 50, doc.y, { width: 495 })
                 .moveDown(0.3);
              
              // Answer with all options
              const answerText = renderAnswerWithOptions(answer);
              doc.fontSize(9)
                 .font('Helvetica')
                 .fillColor('#000000')
                 .text(``, 60, doc.y, { width: 485 })
                 .moveDown(0.2);
              
              // Split answer by lines to process each option
              const answerLines = answerText.split('\n');
              answerLines.forEach(line => {
                // Highlight selected options
                if (line.includes('(Selected)')) {
                  doc.font('Helvetica-Bold')
                     .fillColor('#0066CC')
                     .text(line, 70, doc.y, { width: 475 });
                } else {
                  doc.font('Helvetica')
                     .fillColor('#333333')
                     .text(line, 70, doc.y, { width: 475 });
                }
              });
              
              doc.moveDown(0.8);
            });
          }
          
          doc.moveDown(1);
        });
      } else if (induction.questions && Array.isArray(induction.questions)) {
        // Process flat list of questions
        induction.questions.forEach((question, questionIndex) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
            addPageHeader();
            doc.y = 100;
            pageNumber++;
          }
          
          // Find answer for this question using the enhanced function
          const answer = findMatchingAnswer(question, userInduction.answers);
          
          // Question number
          const questionNumber = `${questionIndex + 1}`;
          
          // Question text with number and type
          const questionText = getQuestionText(question);
          const questionType = getQuestionTypeLabel(question, answer);
          
          doc.fontSize(10)
             .fillColor('#000000')
             .font('Helvetica-Bold')
             .text(`Q${questionNumber}: ${questionText}`, 50, doc.y, { width: 495 })
             .font('Helvetica')
             .fontSize(8)
             .fillColor('#666666')
             .text(`(${questionType})`, 50, doc.y, { width: 495 })
             .moveDown(0.3);
          
          // Answer with all options
          const answerText = renderAnswerWithOptions(answer);
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#000000')
             .text(``, 60, doc.y, { width: 485 })
             .moveDown(0.2);
          
          // Split answer by lines to process each option
          const answerLines = answerText.split('\n');
          answerLines.forEach(line => {
            // Highlight selected options
            if (line.includes('(Selected)')) {
              doc.font('Helvetica-Bold')
                 .fillColor('#0066CC')
                 .text(line, 70, doc.y, { width: 475 });
            } else {
              doc.font('Helvetica')
                 .fillColor('#333333')
                 .text(line, 70, doc.y, { width: 475 });
            }
          });
          
          doc.moveDown(0.8);
        });
      }
      
      // Check if we need a new page for feedback
      if (doc.y > 650 && userInduction.feedback) {
        doc.addPage();
        addPageHeader();
        doc.y = 100;
        pageNumber++;
      }
      
      // Feedback Section
      if (userInduction.feedback) {
        addSectionTitle('Feedback');
        
        let feedback = typeof userInduction.feedback === 'object'
          ? userInduction.feedback
          : { detailedFeedback: String(userInduction.feedback) };
        
        // Overall Rating
        if (feedback.overallRating) {
          doc.fontSize(10)
             .fillColor('#000000')
             .font('Helvetica-Bold')
             .text('Overall Experience Rating:', 50, doc.y)
             .moveDown(0.5);
          
          let ratingText = '';
          let ratingColor = '#000000';
          
          switch(feedback.overallRating) {
            case 1:
              ratingText = 'Not Satisfied';
              ratingColor = '#c62828'; // Red
              break;
            case 2:
              ratingText = 'Neutral';
              ratingColor = '#f57c00'; // Orange
              break;
            case 3:
              ratingText = 'Satisfied';
              ratingColor = '#2e7d32'; // Green
              break;
            default:
              ratingText = `Rating: ${feedback.overallRating}`;
          }
          
          doc.fontSize(10)
             .fillColor(ratingColor)
             .font('Helvetica')
             .text(ratingText, 60, doc.y)
             .moveDown(1);
        }
        
        // Website Usability
        if (feedback.websiteUsability) {
          doc.fontSize(12)
             .fillColor('#000000')
             .font('Helvetica-Bold')
             .text('Website Usability:', 50, doc.y)
             .moveDown(0.5);
          
          let usabilityText = '';
          let usabilityColor = '#000000';
          
          switch(feedback.websiteUsability) {
            case 'veryEasy':
              usabilityText = 'Very easy - Had no issues';
              usabilityColor = '#2e7d32'; // Green
              break;
            case 'easy':
              usabilityText = 'Easy - Had minor issues';
              usabilityColor = '#689f38'; // Light green
              break;
            case 'neutral':
              usabilityText = 'Neutral';
              usabilityColor = '#f57c00'; // Orange
              break;
            case 'difficult':
              usabilityText = 'Difficult - Had several issues';
              usabilityColor = '#e64a19'; // Dark orange
              break;
            case 'veryDifficult':
              usabilityText = 'Very difficult - Had many issues';
              usabilityColor = '#c62828'; // Red
              break;
            default:
              usabilityText = feedback.websiteUsability;
          }
          
          doc.fontSize(10)
             .fillColor(usabilityColor)
             .font('Helvetica')
             .text(usabilityText, 60, doc.y)
             .moveDown(1);
        }
        
        // Content Clarity
        if (feedback.contentClarity) {
          doc.fontSize(10)
             .fillColor('#000000')
             .font('Helvetica-Bold')
             .text('Content Clarity:', 50, doc.y)
             .moveDown(0.5);
          
          let clarityText = '';
          let clarityColor = '#000000';
          
          switch(feedback.contentClarity) {
            case 'veryClear':
              clarityText = 'Very clear and helpful';
              clarityColor = '#2e7d32'; // Green
              break;
            case 'mostlyClear':
              clarityText = 'Mostly clear and helpful';
              clarityColor = '#689f38'; // Light green
              break;
            case 'somewhatClear':
              clarityText = 'Somewhat clear and helpful';
              clarityColor = '#f57c00'; // Orange
              break;
            case 'notClear':
              clarityText = 'Not clear or helpful';
              clarityColor = '#c62828'; // Red
              break;
            default:
              clarityText = feedback.contentClarity;
          }
          
          doc.fontSize(10)
             .fillColor(clarityColor)
             .font('Helvetica')
             .text(clarityText, 60, doc.y)
             .moveDown(1);
        }
        
        // Detailed Feedback
        if (feedback.detailedFeedback) {
          doc.fontSize(10)
             .fillColor('#000000')
             .font('Helvetica-Bold')
             .text('Additional Feedback:', 50, doc.y)
             .moveDown(0.5);
          
          doc.fontSize(12)
             .fillColor('#000000')
             .font('Helvetica')
             .text(feedback.detailedFeedback, 60, doc.y, { width: 485 })
             .moveDown(1);
        }
      }
    }

    // Finalise the PDF document
    doc.end();
    
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({ error: error.message });
  }
};