import { db } from "../firebase.js";
import admin from "firebase-admin";
import { sendEmail } from "../utils/mailjet.js";
import { format } from "date-fns";

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
          <p>Simply head to our induction portal website (${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://your-portal-url.com'}) and log in using this email address. Navigate to the "My Inductions" tab, find this induction, and click "Start".</p>
          <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://your-portal-url.com'}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>
  
          <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>
  
          <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
        `;
  
        const replyToEmail = "autevents@brears.xyz";
        const ccEmails = ["manager@brears.xyz"];
  
        const emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
        
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
            <p>Simply head to our induction portal website (${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://your-portal-url.com'}) and log in using this email address. Navigate to the "My Inductions" tab, find each induction, and click "Start".</p>
            <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://your-portal-url.com'}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>
  
            <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>
  
            <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
          `;
  
          const replyToEmail = "autevents@brears.xyz";
          const ccEmails = ["manager@brears.xyz"];
  
          emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
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
          }

          const replyToEmail = "autevents@brears.xyz";
          const ccEmails = ["manager@brears.xyz"];

          emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
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
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT || 'https://your-portal-url.com'}/inductions/my-inductions" 
           style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
          AUT Events Induction Portal
        </a>
  
        <br>
        <p>If you have any issues accessing or completing this induction, please contact your manager.</p>
  
        <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
      `;
      
      const replyToEmail = "autevents@brears.xyz";
      const ccEmails = ["manager@brears.xyz"];
      
      // Send the email
      const emailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
      
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