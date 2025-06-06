import { db } from "../firebase.js";
import admin from "firebase-admin";
import Status from "../models/Status.js";
import { sendEmail } from "../utils/mailjet.js";
import { format } from "date-fns";

/**
 * Combined cron job that handles both overdue inductions and expired/expiring certificates
 * Runs daily and processes both tasks in sequence
 */
export const runDailyCronJobs = async (req, res) => {
  try {
    // Check authentication - either Vercel cron or API key
    const { apiKey } = req.query;
    const isVercelCron = req.headers['x-vercel-cron-signature'] !== undefined;
    const isValidApiKey = apiKey === process.env.CRON_API_KEY;
    
    if (!isVercelCron && !isValidApiKey) {
      console.log("Unauthorized access attempt");
      return res.status(401).json({ 
        error: "Unauthorized: Invalid or missing API key" 
      });
    }
    
    const source = isVercelCron ? 'Vercel Cron' : 'Manual API Call';
    console.log(`Daily cron jobs started via: ${source}`);
    
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    
    // Run both cron jobs
    const [inductionResults, qualificationResults] = await Promise.all([
      updateOverdueInductionsInternal(),
      checkQualificationExpiriesInternal()
    ]);
    
    const combinedResults = {
      success: true,
      executedAt: now.toISOString(),
      source: source,
      results: {
        overdue_inductions: inductionResults,
        qualification_expiries: qualificationResults
      }
    };
    
    console.log(`Daily cron jobs completed:`, combinedResults);
    res.json(combinedResults);
    
  } catch (error) {
    console.error("Error running daily cron jobs:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal server error"
    });
  }
};

/**
 * Updates induction statuses to "overdue" for assignments with passed due dates
 * Internal helper function - returns results instead of sending HTTP response
 */
const updateOverdueInductionsInternal = async () => {
  try {
    const now = new Date();
    
    // Get all userInductions that are not completed and have a due date
    const snapshot = await db.collection("userInductions")
      .where("status", "!=", Status.COMPLETE)
      .get();
    
    console.log(`Found ${snapshot.docs.length} non-completed inductions to check`);
    
    let updatedCount = 0;
    const updatedInductions = [];
    
    // Process each assignment
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      if (!data.dueDate) {
        continue;
      }
      
      const dueDate = new Date(data.dueDate.toDate());
      
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
        
        // Send overdue notification email
        try {
          await sendOverdueNotification(data.userId, data);
          console.log(`Sent overdue notification for induction ${doc.id}`);
        } catch (emailError) {
          console.error(`Error sending overdue notification for ${doc.id}:`, emailError);
        }
      }
    }
    
    const message = `${updatedCount} induction${updatedCount !== 1 ? 's' : ''} marked as overdue`;
    console.log(`Overdue inductions job completed: ${message}`);
    
    return {
      updated: updatedCount,
      message: message,
      updatedInductions
    };
    
  } catch (error) {
    console.error("Error updating overdue inductions:", error);
    throw error;
  }
};

/**
 * Checks for expired and expiring qualifications
 * Internal helper function - returns results for combined response
 */
const checkQualificationExpiriesInternal = async () => {
  try {
    const now = new Date();
    const twoMonthsFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    const oneMonthFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Get all qualifications with expiry dates
    const snapshot = await db.collection("userQualifications")
      .where("expiryDate", "!=", null)
      .get();
    
    console.log(`Found ${snapshot.docs.length} qualifications with expiry dates to check`);
    
    let reminderCount = 0;
    const processedQualifications = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const expiryDate = new Date(data.expiryDate.toDate());
      const reminderStatus = data.remindersSent || {};
      
      // Check if expired and not yet notified
      if (expiryDate < now && !reminderStatus.expired) {
        await sendQualificationExpiryNotification(data, 'expired');
        await doc.ref.update({
          'remindersSent.expired': true,
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        reminderCount++;
        processedQualifications.push({ ...data, reminderType: 'expired' });
        console.log(`Sent expired notification for qualification ${doc.id}`);
      }
      // Check if expiring in 1 month and not yet notified
      else if (expiryDate < oneMonthFromNow && !reminderStatus.oneMonth) {
        await sendQualificationExpiryNotification(data, 'oneMonth');
        await doc.ref.update({
          'remindersSent.oneMonth': true,
          status: 'expiring_soon',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        reminderCount++;
        processedQualifications.push({ ...data, reminderType: 'oneMonth' });
        console.log(`Sent 1-month expiry notification for qualification ${doc.id}`);
      }
      // Check if expiring in 2 months and not yet notified
      else if (expiryDate < twoMonthsFromNow && !reminderStatus.twoMonths) {
        await sendQualificationExpiryNotification(data, 'twoMonths');
        await doc.ref.update({
          'remindersSent.twoMonths': true,
          status: 'expiring_soon',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        reminderCount++;
        processedQualifications.push({ ...data, reminderType: 'twoMonths' });
        console.log(`Sent 2-month expiry notification for qualification ${doc.id}`);
      }
    }
    
    const message = `${reminderCount} qualification expiry reminder${reminderCount !== 1 ? 's' : ''} sent`;
    console.log(`Qualification expiry check completed: ${message}`);
    
    return {
      remindersSent: reminderCount,
      message: message,
      processedQualifications
    };
    
  } catch (error) {
    console.error("Error checking qualification expiries:", error);
    throw error;
  }
};

/**
 * Sends qualification expiry notifications
 */
const sendQualificationExpiryNotification = async (qualificationData, reminderType) => {
  try {
    // Get user details
    const userAuthData = await admin.auth().getUser(qualificationData.userId);
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
      const userDoc = await db.collection("users").doc(qualificationData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        
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
    }
    
    // Create email content based on reminder type
    let emailSubject, urgencyLevel, actionText;
    
    switch (reminderType) {
      case 'expired':
        emailSubject = `ACTION REQUIRED: ${qualificationData.qualificationName} has EXPIRED`;
        urgencyLevel = "EXPIRED";
        actionText = "Please upload a renewed qualification immediately.";
        break;
      case 'oneMonth':
        emailSubject = `Action needed: ${qualificationData.qualificationName} expires in 1 month`;
        urgencyLevel = "EXPIRING SOON";
        actionText = "Please renew this qualification before it expires.";
        break;
      case 'twoMonths':
        emailSubject = `Reminder: ${qualificationData.qualificationName} expires in 2 months`;
        urgencyLevel = "RENEWAL REQUIRED";
        actionText = "Please start the renewal process for this qualification.";
        break;
    }
    
    const emailBody = `
      <h1>Kia ora ${firstName} ${lastName}!</h1>
      <p>This is a reminder about your qualification/certificate that requires attention.</p>
      <br>
      
      <h3>Qualification Details:</h3>
      <p><strong>Qualification:</strong> ${qualificationData.qualificationName || ""}</p>
      <p><strong>Type:</strong> ${qualificationData.qualificationType || ""}</p>
      <p><strong>Issuer:</strong> ${qualificationData.issuer || ""}</p>
      <p><strong>Expiry Date:</strong> ${formatDate(qualificationData.expiryDate)}</p>
      <p><strong>Status:</strong> <span style="color: ${reminderType === 'expired' ? 'red' : 'orange'}; font-weight: bold;">${urgencyLevel}</span></p>
      
      <br>
      <h3>Action Required:</h3>
      <p>${actionText}</p>
      
      <p>You can manage your qualifications through our induction portal:</p>
      <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/account/qualifications" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
        Manage My Qualifications
      </a>

      <br>
      <p>If you have any questions about qualification renewal, please contact your manager.</p>

      <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
    `;
    
    // Get email settings
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz";
    let ccEmails = ["manager@brears.xyz"];
    
    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
      ccEmails = emailSettings.defaultCc || ccEmails;
    }
    
    if (departmentEmail) {
      ccEmails.push(departmentEmail);
    }
    
    // Send email
    return await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
    
  } catch (error) {
    console.error("Error sending qualification expiry notification:", error);
    throw error;
  }
};

// Exported functions for individual endpoint access
export const updateOverdueInductions = async (req, res) => {
  try {
    const { apiKey } = req.query;
    const isVercelCron = req.headers['x-vercel-cron-signature'] !== undefined;
    const isValidApiKey = apiKey === process.env.CRON_API_KEY;
    
    if (!isVercelCron && !isValidApiKey) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
    }
    
    const results = await updateOverdueInductionsInternal();
    const now = new Date();
    
    res.json({
      success: true,
      ...results,
      executedAt: now.toISOString(),
      source: isVercelCron ? 'Vercel Cron' : 'Manual API Call'
    });
  } catch (error) {
    console.error("Error updating overdue inductions:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal server error"
    });
  }
};

export const checkQualificationExpiries = async (req, res) => {
  try {
    const { apiKey } = req.query;
    const isVercelCron = req.headers['x-vercel-cron-signature'] !== undefined;
    const isValidApiKey = apiKey === process.env.CRON_API_KEY;
    
    if (!isVercelCron && !isValidApiKey) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
    }
    
    const results = await checkQualificationExpiriesInternal();
    const now = new Date();
    
    res.json({
      success: true,
      ...results,
      executedAt: now.toISOString(),
      source: isVercelCron ? 'Vercel Cron' : 'Manual API Call'
    });
  } catch (error) {
    console.error("Error checking qualification expiries:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal server error"
    });
  }
};

// Notification function
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
    const emailSubject = `[ACTION REQUIRED] Overdue induction module: ${inductionData.inductionName || "Induction"}`;
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
      const deptEmailSubject = `Staff Induction Overdue: ${userAuthData.displayName || email}`;
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