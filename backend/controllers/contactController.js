import { db } from "../firebase.js";
import { sendEmail } from "../utils/mailjet.js";
import admin from "firebase-admin";

// Submit contact form
export const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, contactType, subject, message, userId } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Initialize variables for department routing
    let userDepartment = null;
    let departmentEmail = null;
    let isLoggedIn = false;
    let authenticatedUserId = null;
    
    // First check if userId is provided in the request body to check if they are loged in and therfor staff
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
    
    // Save to Firebase
    const newContact = {
      fullName,
      email,
      contactType: targetDepartment, // null for non-logged-in users
      subject,
      message,
      createdAt: new Date(),
      status: 'new',
      userId: authenticatedUserId || null, //  null for non-logged-in users
      isLoggedIn: isLoggedIn
    };
    
    const docRef = await db.collection("contactform").add(newContact);
    
    // Create user confirmation email body
    const userEmailBody = `
      <h1>Kia ora ${fullName}!</h1>
      <p>Thank you for contacting us. We have received your message and will be in touch soon.</p>
      <br>
      <h3>Your message details:</h3>
      <p><strong>Subject:</strong> ${subject}</p>
      ${targetDepartment ? `<p><strong>Department:</strong> ${targetDepartment}</p>` : ''}
      <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>

      <p>If you have any further questions, please feel free to reach out to us.</p>

      <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>

      <br>
      <p>(${docRef.id})</p>
    `;

    // Create admin notification email body
    const adminEmailBody = `
      <h3>New Contact Form Submission</h3>
      <p><strong>From:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Status:</strong> ${isLoggedIn ? 'Staff (Logged In)' : 'Public User (Not Logged In)'}</p>
      ${targetDepartment ? `<p><strong>Department:</strong> ${targetDepartment}</p>` : '<p><strong>Department:</strong> None</p>'}
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
      <p><strong>Reference ID:</strong> ${docRef.id}</p>
      ${authenticatedUserId ? `<p><strong>User ID:</strong> ${authenticatedUserId}</p>` : ''}
    `;

    // Send confirmation email to user
    await sendEmail(
      email, 
      `Thank you for contacting us: ${subject}`,
      userEmailBody,
      null, // No reply-to for confirmation email
      [] // No CC for confirmation email
    );
    
    // Get admin email from environment or use defult email
    const adminEmail = process.env.ADMIN_EMAIL || "autevents@brears.xyz";
    
    // Determine where to send the notification email
    if (isLoggedIn && departmentEmail) {
      // If logged-in user has a department with email, send to that department and CC admin
      await sendEmail(
        departmentEmail, // Send to department
        `New Contact Form Submission: ${subject}`,
        adminEmailBody,
        email, // Set reply-to as user's email
        [adminEmail] // CC admin as an array
      );
    } else {
      // For non-logged-in users or if no department email, send to admin only
      await sendEmail(
        adminEmail,
        `New Contact Form Submission: ${subject}`,
        adminEmailBody,
        email // Set reply-to as user's email
      );
    }
    
    res.status(201).json({ 
      message: 'Contact form submitted successfully',
      id: docRef.id,
      isLoggedIn: isLoggedIn, // Return login status in response for debugging
      departmentRouted: !!departmentEmail // Indicate if it was routed to a department
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Failed to submit contact form', error: error.message });
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
    
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ message: "Failed to delete contact", error: error.message });
  }
};