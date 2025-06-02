import { db } from "../firebase.js";
import admin from "firebase-admin";
import Status from "../models/Status.js";
import { sendEmail } from "../utils/mailjet.js";
import { format } from "date-fns";

/**
 * Updates induction statuses to "overdue" for assignments with passed due dates
 * Supports both Vercel cron (automatic) and manual testing (with API key)
 */
export const updateOverdueInductions = async (req, res) => {
  try {
    // Check authentication - either Vercel cron or API key
    const { apiKey } = req.query;
    const isVercelCron = req.headers['x-vercel-cron-signature'] !== undefined;
    const isValidApiKey = apiKey === process.env.CRON_API_KEY;
    
    // Allow access if it's either a Vercel cron OR valid API key
    if (!isVercelCron && !isValidApiKey) {
      console.log("Unauthorized access attempt");
      return res.status(401).json({ 
        error: "Unauthorized: Invalid or missing API key" 
      });
    }
    
    // Log the execution source
    const source = isVercelCron ? 'Vercel Cron' : 'Manual API Call';
    console.log(`Cron job started via: ${source}`);
    
    // Get current date for comparison
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    
    // Get all userInductions that are not completed and have a due date
    const snapshot = await db.collection("userInductions")
      .where("status", "!=", Status.COMPLETE)
      .get();
    
    console.log(`Found ${snapshot.docs.length} non-completed inductions to check`);
    
    // Keep track of updates
    let updatedCount = 0;
    const updatedInductions = [];
    
    // Process each assignment
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if no due date
      if (!data.dueDate) {
        continue;
      }
      
      const dueDate = new Date(data.dueDate.toDate());
      
      // Check if due date has passed and status is not already overdue
      if (dueDate < now && data.status !== Status.OVERDUE) {
        await doc.ref.update({
          status: Status.OVERDUE,
          overdueAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updatedCount++;
        updatedInductions.push({
          id: doc.id,
          userId: data.userId,
          inductionName: data.inductionName,
          dueDate: dueDate
        });
        
        console.log(`Marked induction ${doc.id} as overdue for user ${data.userId}`);
        
        // Send overdue notification email to user
        try {
          await sendOverdueNotification(data.userId, data);
          console.log(`Sent overdue notification for induction ${doc.id}`);
        } catch (emailError) {
          console.error(`Error sending overdue notification for ${doc.id}:`, emailError);
        }
      }
    }
    
    const responseMessage = `${updatedCount} induction${updatedCount !== 1 ? 's' : ''} marked as overdue`;
    console.log(`Cron job completed: ${responseMessage}`);
    
    res.json({
      success: true,
      updated: updatedCount,
      message: responseMessage,
      updatedInductions,
      executedAt: now.toISOString(),
      source: source
    });
  } catch (error) {
    console.error("Error updating overdue inductions:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal server error"
    });
  }
};

/**
 * Sends an overdue notification email to the user and department
 */
const sendOverdueNotification = async (userId, inductionData) => {
  try {
    // Get user details
    const userAuthData = await admin.auth().getUser(userId);
    const firstName = userAuthData.displayName ? userAuthData.displayName.split(" ")[0] : "";
    const lastName = userAuthData.displayName ? userAuthData.displayName.split(" ")[1] || "" : "";
    const email = userAuthData.email;
    
    // Format dates for display
    const formatDate = (date) => {
      return date ? format(new Date(date instanceof admin.firestore.Timestamp ? date.toDate() : date), "d MMMM yyyy") : "Not set";
    };
    
    // Get user's department information
    let departmentEmail = null;
    let departmentName = "their department";
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Get department if it exists
        if (userData.departmentId) {
          const deptDoc = await db.collection("departments").doc(userData.departmentId).get();
          if (deptDoc.exists) {
            const deptData = deptDoc.data();
            departmentName = deptData.name || departmentName;
            departmentEmail = deptData.email || null;
          }
        }
      }
    } catch (deptError) {
      console.error("Error fetching user department:", deptError);
      // Continue with notification even if department fetch fails
    }
    
    // Create email content for user
    const emailSubject = `⚠️ OVERDUE: Action required for ${inductionData.inductionName || "Induction"}`;
    const emailBody = `
      <h1>Kia ora ${firstName} ${lastName}!</h1>
      <p>This is a reminder that you have an <strong>overdue induction</strong> that requires your immediate attention.</p>
      <br>
      
      <h3>Induction Details:</h3>
      <p><strong>Induction name:</strong> ${inductionData.inductionName || ""}</p>
      <p><strong>Due Date:</strong> ${formatDate(inductionData.dueDate)}</p>
      <p><strong>Status:</strong> <span style="color: red; font-weight: bold;">OVERDUE</span></p>
      
      <br>
      <h3>Urgent Action Required:</h3>
      <p>Please complete this induction as soon as possible.</p>
      
      <p>You can access your induction through our portal:</p>
      <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/inductions/my-inductions" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
        AUT Events Induction Portal
      </a>

      <br>
      <p>If you have any issues accessing or completing this induction, please contact your manager immediately.</p>

      <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
    `;
    
    // Fetch email settings from the database
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz"; // Default
    let ccEmails = ["manager@brears.xyz"]; // Default
    
    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
      ccEmails = emailSettings.defaultCc || ccEmails;
    }
    
    // Add department email to CC if available
    if (departmentEmail) {
      ccEmails.push(departmentEmail);
    }
    
    // Send email to user with department CC'd
    const userEmailResult = await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
    
    // If the department has an email but it's different from the standard CC, send a separate notification
    if (departmentEmail && !ccEmails.includes(departmentEmail)) {
      // Create department-specific notification
      const deptEmailSubject = `Staff Member Induction Overdue: ${userAuthData.displayName || email}`;
      const deptEmailBody = `
        <h1>Department Notification: Overdue Induction</h1>
        <p>This is an automated notification that a staff member in ${departmentName} has an <strong>overdue induction</strong>.</p>
        <br>
        
        <h3>Details:</h3>
        <p><strong>Staff Member:</strong> ${userAuthData.displayName || email}</p>
        <p><strong>Induction:</strong> ${inductionData.inductionName || ""}</p>
        <p><strong>Due Date:</strong> ${formatDate(inductionData.dueDate)}</p>
        <p><strong>Current Status:</strong> <span style="color: red; font-weight: bold;">OVERDUE</span></p>
        
        <br>
        <h3>Action Required:</h3>
        <p>Please follow up with this staff member to ensure timely completion of their required induction.</p>
        
        <p>You can access the management dashboard to check staff completion status:</p>
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/management/dashboard" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
          Management Dashboard
        </a>

        <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
      `;
      
      try {
        await sendEmail(departmentEmail, deptEmailSubject, deptEmailBody, replyToEmail, []);
      } catch (deptEmailError) {
        console.error("Error sending department notification:", deptEmailError);
      }
    }
    
    return userEmailResult;
  } catch (error) {
    console.error("Error sending overdue notification:", error);
    throw error;
  }
};