import { db } from "../firebase.js";
import { sendEmail } from "../utils/mailjet.js";
import admin from "firebase-admin";

// Utility for email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Submit contact form
export const submitContactForm = async (req, res) => {
  try {
    const { 
      fullName,  
      email, 
      contactType, 
      subject, 
      message, 
      userId,
      formType,
      skipUserConfirmation,
      feedbackData
    } = req.body;
    
    // Explicit validation
    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Initialize variables for department routing
    let userDepartment = null;
    let departmentEmail = null;
    let isLoggedIn = false;
    let authenticatedUserId = null;
    
    // First check if userId is provided in the request body to check if they are logged in and therefore staff
    if (userId) {
      isLoggedIn = true;
      authenticatedUserId = userId;
      
      // Get user data from Firestore to check their department
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          // Check for departments and department fields (Issue where some have s and some do not)
          if (userData.department) {
            userDepartment = userData.department;
          } else if (userData.departments) {
            userDepartment = userData.departments;
          }
        }
      } catch (userError) {
        console.error('Error fetching user data:', userError);
      }
    }
    
    // Additional check with auth token (as a fallback)
    if (!isLoggedIn) {
      const authToken = req.headers.authtoken;
      if (authToken) {
        try {
          // Verify the token
          const decodedToken = await admin.auth().verifyIdToken(authToken);
          authenticatedUserId = decodedToken.uid;
          isLoggedIn = true;
          
          // Only fetch user data if we didn't already do it above
          if (!userDepartment) {
            const userDoc = await db.collection("users").doc(authenticatedUserId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              // Check for departments and department fields (Issue where some have s and some do not)
              if (userData.department) {
                  userDepartment = userData.department;
              } else if (userData.departments) {
                  userDepartment = userData.departments;
              }
            }
          }
        } catch (authError) {
          console.error('Error verifying auth token:', authError);
          // Continue processing even if authentication fails
        }
      }
    }

    // For logged-in users (Staff) use their department or contactType if provided
    // For non-logged-in users (public users) do not set a department as will send to the main email address
    const targetDepartment = isLoggedIn ? (contactType || userDepartment) : null;
    
    // Look up the department email only if there's a target department
    if (targetDepartment) {
      try {
        const departmentDoc = await db.collection("departments").doc(targetDepartment).get();
        if (departmentDoc.exists) {
          const departmentData = departmentDoc.data();
          if (departmentData.email) {
            departmentEmail = departmentData.email;
          }
        }
      } catch (deptError) {
        console.error('Error fetching department email:', deptError);
      }
    }
    
    // Determine if this is a feedback form or regular contact form
    const isFeedback = formType === 'feedback';
    
    // Save to Firebase
    const newContact = {
      fullName,
      email,
      contactType: targetDepartment, // null for non-logged-in users
      subject,
      message,
      createdAt: new Date(),
      status: 'new',
      userId: authenticatedUserId || null, // null for non-logged-in users
      isLoggedIn: isLoggedIn,
      formType: isFeedback ? 'feedback' : 'contact', // Feedback or contact form type for filtering
      // For feedback forms, store the original data for analysis
      ...(isFeedback && feedbackData ? { feedbackData } : {})
    };
    
    const docRef = await db.collection("contactform").add(newContact);
    
    // Fetch email settings from the database
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz"; // Default
    let defaultManagerEmail = "autevents@brears.xyz"; // Default fallback manager email
    let fromEmail = "autevents@brears.xyz"; // Default from email for sending

    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
      fromEmail = emailSettings.defaultFrom || fromEmail;
      
      // Use a specific field for the default manager email (not the from address)
      // This should be where notifications go when there's no department email
      defaultManagerEmail = emailSettings.defaultManagerEmail || 
                           emailSettings.adminEmail || 
                           emailSettings.defaultReplyTo || 
                           defaultManagerEmail;
    }
    
    // Only send user confirmation if not skipped (feedback form skips)
    if (!skipUserConfirmation) {
      // Create user confirmation email body
      const userEmailBody = `
        <h1>Kia ora ${fullName}!</h1>
        <p>Thank you for contacting us. We have received your message and will be in touch soon.</p>
        <br>
        <h3>Your message details:</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>

        <p>If you have any further questions, please feel free to reach out to us.</p>
        <hr>
        <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>

        <br>
        <p><small>This is an automated message. (${docRef.id})<small></p>
      `;

      // Send confirmation email to user
      await sendEmail(
        email, 
        `Thank you for contacting us: ${subject}`,
        userEmailBody,
        replyToEmail, // Use the reply-to from settings
        [] // No CC for confirmation email
      );
    }
    
    // Create admin notification email body - customize based on form type
    let adminEmailSubject = '';
    let adminEmailBody = '';
    
    if (isFeedback) {
      // Subject and body for feedback submissions
      adminEmailSubject = `${subject}`;
      
      adminEmailBody = `
        <h2>Induction Feedback Submission</h2>
        <p><strong>From:</strong> ${fullName} (${email})</p>
        ${targetDepartment ? `<p><strong>Department:</strong> ${targetDepartment}</p>` : ''}
        <hr>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0066cc;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p><small>Submission Reference ID: ${docRef.id}<small></p>
      `;
    } else {
      // Regular contact form email
      adminEmailSubject = `New Contact Form Submission: ${subject}`;
      
      adminEmailBody = `
        <h3>New Contact Form Submission</h3>
        <p><strong>From:</strong> ${fullName} (${email})</p>
        <p><strong>Status:</strong> ${isLoggedIn ? 'Staff (Logged In)' : 'Public User (Not Logged In)'}</p>
        ${targetDepartment ? `<p><strong>Department:</strong> ${targetDepartment}</p>` : '<p><strong>Department:</strong> None</p>'}
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
        <p><small>Submission Reference ID: ${docRef.id}<small></p>
       `;
    }
    
    // Determine the recipient email address
    // Priority: departmentEmail > defaultManagerEmail
    const recipientEmail = departmentEmail || defaultManagerEmail;
    
    // Send notification email to the appropriate recipient
    await sendEmail(
      recipientEmail, // Send to department email or default manager email
      adminEmailSubject,
      adminEmailBody,
      email, // Set reply-to as user's email so replies go back to the submitter
      [] // No CC
    );
    
    res.status(201).json({ 
      message: 'Form submitted successfully',
      id: docRef.id,
      isLoggedIn: isLoggedIn, // Return login status in response for debugging
      departmentRouted: !!departmentEmail, // Indicate if it was routed to a department
      formType: isFeedback ? 'feedback' : 'contact' // Return form type in response
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Failed to submit form', error: error.message });
  }
};

// Get all contact form submissions (authenticated)
export const getAllContacts = async (req, res) => {
  try {
    const snapshot = await db.collection("contactform")
      .orderBy("createdAt", "desc")
      .get();
    
    const contacts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Failed to fetch contacts", error: error.message });
  }
};

// Get a contact submission by ID (authenticated)
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const docSnapshot = await db.collection("contactform").doc(id).get();
    
    if (!docSnapshot.exists) {
      return res.status(404).json({ message: "Contact submission not found" });
    }
    
    const contactData = {
      id: docSnapshot.id,
      ...docSnapshot.data(),
    };
    
    res.json(contactData);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ message: "Failed to fetch contact", error: error.message });
  }
};

// Update contact submission status (authenticated)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const docRef = db.collection("contactform").doc(id);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return res.status(404).json({ message: "Contact submission not found" });
    }
    
    await docRef.update({
      status,
      updatedAt: new Date(),
    });
    
    res.json({ message: "Contact status updated successfully" });
  } catch (error) {
    console.error("Error updating contact status:", error);
    res.status(500).json({ message: "Failed to update contact status", error: error.message });
  }
};

// Delete a contact submission (admin only)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const docRef = db.collection("contactform").doc(id);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return res.status(404).json({ message: "Contact submission not found" });
    }

    await docRef.delete();

    res.json({ message: "Contact submission deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ message: "Failed to delete contact", error: error.message });
  }
};