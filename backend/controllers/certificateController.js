import { db } from "../firebase.js";
import admin from "firebase-admin";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { format } from 'date-fns';
import axios from 'axios';

/**
 * Generates and returns a certificate for a completed induction
 * The backend handles the entire certificate generation process for security
 */
export const generateCertificate = async (req, res) => {
  try {
    const { userInductionId } = req.params;
    let logoBuffer = null;
    
    if (!userInductionId) {
      return res.status(400).json({ 
        success: false, 
        message: "User Induction ID is required"
      });
    }
    
    // Fetch the user induction record
    const userInductionRef = db.collection("userInductions").doc(userInductionId);
    const userInductionDoc = await userInductionRef.get();
    
    if (!userInductionDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "User Induction not found" 
      });
    }
    
    const userInduction = userInductionDoc.data();
    
    // Verify this induction is actually completed
    if (userInduction.status !== 'complete') {
      return res.status(403).json({ 
        success: false, 
        message: "Cannot generate certificate for incomplete induction",
        status: userInduction.status
      });
    }
    
    // Get the induction details
    let inductionName = userInduction.inductionName || "Induction Program";
    try {
      const inductionDoc = await db.collection("inductions").doc(userInduction.inductionId).get();
      if (inductionDoc.exists) {
        const inductionData = inductionDoc.data();
        inductionName = inductionData.name || inductionName;
      }
    } catch (inductionError) {
      console.error(`Error fetching induction ${userInduction.inductionId}:`, inductionError);
      // Continue with the existing induction name
    }
    
    // Get user details
    const userId = userInduction.userId;
    let userDetails = { email: "Team Member" };
    try {
      const userAuthData = await admin.auth().getUser(userId);
      userDetails = {
        uid: userAuthData.uid,
        email: userAuthData.email,
        displayName: userAuthData.displayName || userAuthData.email
      };
    } catch (userError) {
      console.error(`Error fetching user ${userId}:`, userError);
      // Continue with limited user details
    }

    // Generate a secure certificate ID
    const certificateId = `CERT-${userInductionId.substring(0, 6).toUpperCase()}`;
    
    // Format completion date
    const completionDate = userInduction.completedAt ? 
      format(userInduction.completedAt.toDate(), 'MMMM d, yyyy') : 
      format(new Date(), 'MMMM d, yyyy');
    
    // Try to load the AUT Events logo
    try {
      const logoUrl = 'https://dev-aut-events-induction.vercel.app/images/AUTEventsInductionPortal.jpg';
      const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      logoBuffer = Buffer.from(logoResponse.data, 'binary');
    } catch (logoError) {
      console.error("Failed to load logo:", logoError);
      // Continue without logo if it fails to load
    }
    
    // Create temp directory for certificate
    const tempDir = os.tmpdir();
    const pdfPath = path.join(tempDir, `${certificateId}.pdf`);

    // IMPORTANT: Using fixed dimensions to ensure content fits on one page
    // A4 landscape: 842 x 595 points
    const pageWidth = 842;
    const pageHeight = 595;
    
    // Generate the PDF certificate
    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: 0,
      autoFirstPage: true,
      bufferPages: false, // Important: This prevents automatic page management
      info: {
        Title: `Certificate of Completion - ${inductionName}`,
        Author: 'AUT Events Induction Portal',
        Subject: 'Induction Completion Certificate',
        Keywords: 'certificate, completion, induction, AUTEVENTS',
        Creator: 'AUT Events Induction Portal',
        Producer: 'PDFKit'
      }
    });
    
    // CRITICAL: Disable automatic page creation
    const originalAddPage = doc.addPage;
    doc.addPage = function() {
      console.log('Blocked attempt to add new page');
      return this; // Return the document without adding a page
    };

    // Pipe to file
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Background
    doc.rect(0, 0, pageWidth, pageHeight).fill('white');
    
    // Add decorative border - keep it thin for more content space
    const borderWidth = 8;
    const borderColor = '#000000';
    doc.lineWidth(borderWidth);
    doc.rect(borderWidth/2, borderWidth/2, pageWidth - borderWidth, pageHeight - borderWidth)
       .stroke(borderColor);
    
    // Header strip with logo
    doc.rect(0, 0, pageWidth, 80).fill('#000000');
    
    // Add logo if available
    if (logoBuffer) {
      doc.image(logoBuffer, 50, 15, { width: 120 });
    }
    
    // Add certificate title
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('#000000')
       .text('Certificate of Completion', 0, 110, { align: 'center' });
    
    // Add decorative line
    const centerX = pageWidth / 2;
    doc.strokeColor('#52c41a')
       .lineWidth(2)
       .moveTo(centerX - 150, 160)
       .lineTo(centerX + 150, 160)
       .stroke();
    
    // Add certification text
    doc.font('Helvetica')
       .fontSize(16)
       .fillColor('#333333')
       .text('This is to certify that', 0, 180, { align: 'center' });
    
    // Add recipient name
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('#000000')
       .text(userDetails.displayName, 0, 210, { align: 'center' });
    
    // Add achievement text
    doc.font('Helvetica')
       .fontSize(16)
       .fillColor('#333333')
       .text('has successfully completed the', 0, 250, { align: 'center' });
    
    // Add course name
    doc.font('Helvetica-Bold')
       .fontSize(22)
       .fillColor('#000000')
       .text(inductionName, 0, 280, { align: 'center' });
    
    // Add completion date
    doc.font('Helvetica')
       .fontSize(16)
       .fillColor('#333333')
       .text(`Completed on ${completionDate}`, 0, 320, { align: 'center' });
    
    // Add verification information
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#666666')
       .text(`Certificate ID: ${certificateId}`, 0, 360, { align: 'center' });
    
    // Add footer strip
    doc.rect(0, pageHeight - 40, pageWidth, 40).fill('#000000');
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#ffffff')
       .text('AUT Events Induction Portal', pageWidth - 200, pageHeight - 25);
    
    // End document immediately to prevent auto page creation
    doc.end();
    
    // Wait for the PDF to be created
    stream.on('finish', async () => {
      try {
        // Log this certificate generation
        await db.collection("certificateLogs").add({
          certificateId: certificateId,
          userInductionId: userInductionId,
          userId: userId,
          inductionId: userInduction.inductionId,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: req.ip
        });
      } catch (logError) {
        console.error("Error logging certificate generation:", logError);
        // Continue even if logging fails
      }
      
      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${inductionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
      
      // Clean up temp file
      fs.unlink(pdfPath, (err) => {
        if (err) console.error('Error deleting temp PDF file:', err);
      });
    });
    
    // Handle errors in PDF creation
    stream.on('error', (err) => {
      console.error('Error creating PDF:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Error generating certificate PDF'
      });
      
      // Clean up temp file if it exists
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp PDF file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate certificate" 
    });
  }
};

/**
 * Verifies if a certificate is valid based on its ID
 */
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    if (!certificateId) {
      return res.status(400).json({ 
        success: false, 
        message: "Certificate ID is required" 
      });
    }
    
    // Extract userInductionId from certificate ID
    // Format is CERT-XXXXXX where XXXXXX is the first 6 chars of userInductionId
    if (!certificateId.startsWith('CERT-') || certificateId.length < 11) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid certificate ID format" 
      });
    }
    
    const idPrefix = certificateId.substring(5);
    
    // Look for a matching certificate log
    const logSnapshot = await db.collection("certificateLogs")
      .where("certificateId", "==", certificateId)
      .limit(1)
      .get();
    
    if (!logSnapshot.empty) {
      // Found in logs, certificate is valid
      const logData = logSnapshot.docs[0].data();
      
      // Get additional details
      const userInductionDoc = await db.collection("userInductions").doc(logData.userInductionId).get();
      let inductionName = "Induction Program";
      let completionDate = null;
      let recipientName = "";
      
      if (userInductionDoc.exists) {
        const userInduction = userInductionDoc.data();
        inductionName = userInduction.inductionName || inductionName;
        completionDate = userInduction.completedAt;
        
        // Get user details
        try {
          const userAuthData = await admin.auth().getUser(userInduction.userId);
          recipientName = userAuthData.displayName || userAuthData.email;
        } catch (userError) {
          console.error(`Error fetching user ${userInduction.userId}:`, userError);
        }
      }
      
      return res.json({
        success: true,
        isValid: true,
        certificate: {
          id: certificateId,
          recipientName: recipientName,
          inductionName: inductionName,
          completionDate: completionDate,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    }
    
    // Look for a matching userInduction with completed status
    const userInductionsSnapshot = await db.collection("userInductions")
      .where("status", "==", "complete")
      .get();
    
    let foundMatch = false;
    
    for (const doc of userInductionsSnapshot.docs) {
      if (doc.id.startsWith(idPrefix)) {
        foundMatch = true;
        const userInduction = doc.data();
        
        // Get user details
        let recipientName = "";
        try {
          const userAuthData = await admin.auth().getUser(userInduction.userId);
          recipientName = userAuthData.displayName || userAuthData.email;
        } catch (userError) {
          console.error(`Error fetching user ${userInduction.userId}:`, userError);
        }
        
        return res.json({
          success: true,
          isValid: true,
          certificate: {
            id: certificateId,
            recipientName: recipientName,
            inductionName: userInduction.inductionName || "Induction Program",
            completionDate: userInduction.completedAt,
            note: "Certificate verified but not found in logs"
          }
        });
      }
    }
    
    // No valid certificate found
    return res.json({
      success: true,
      isValid: false,
      message: "Certificate could not be verified"
    });
    
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to verify certificate" 
    });
  }
};