import { db } from "../firebase.js";
import admin from "firebase-admin";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { format } from 'date-fns';

/**
 * Generates and returns a certificate for a completed induction
 * The backend handles the entire certificate generation process for security
 */
export const generateCertificate = async (req, res) => {
  try {
    const { userInductionId } = req.params;
    
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
    
    // Create temp directory for certificate
    const tempDir = os.tmpdir();
    const pdfPath = path.join(tempDir, `${certificateId}.pdf`);
    
    // Generate the PDF certificate
    const doc = new PDFDocument({
      size: 'A4', 
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // Pipe to file
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Add header strip
    doc.rect(0, 0, doc.page.width, 70).fill('#000000');
    
    // Add content
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#000000');
    doc.text('Certificate of Completion', 0, 100, { align: 'center' });
    
    doc.font('Helvetica').fontSize(18).fillColor('#000000');
    doc.text('This is to certify that', 0, 150, { align: 'center' });
    
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#000000');
    doc.text(userDetails.displayName, 0, 190, { align: 'center' });
    
    doc.font('Helvetica').fontSize(18).fillColor('#000000');
    doc.text('has successfully completed the', 0, 230, { align: 'center' });
    
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#000000');
    doc.text(inductionName, 0, 270, { align: 'center' });
    
    doc.font('Helvetica').fontSize(16).fillColor('#000000');
    doc.text(`Completion Date: ${completionDate}`, 0, 330, { align: 'center' });
    
    doc.font('Helvetica').fontSize(12).fillColor('#666666');
    doc.text(`Certificate ID: ${certificateId}`, 0, 380, { align: 'center' });
    doc.text('Verified by AUT Events Induction Portal', 0, 400, { align: 'center' });
    
    // Add footer strip
    doc.rect(0, doc.page.height - 20, doc.page.width, 20).fill('#000000');
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the PDF to be created
    stream.on('finish', async () => {
      // Generate download URL
      const certificate = {
        id: certificateId,
        recipientName: userDetails.displayName,
        inductionName: inductionName,
        completionDate: userInduction.completedAt,
        userId: userId,
        userInductionId: userInductionId,
        validated: true
      };
      
      // Log this certificate generation
      try {
        await db.collection("certificateLogs").add({
          certificateId: certificateId,
          userInductionId: userInductionId,
          userId: userId,
          inductionId: userInduction.inductionId,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: req.ip // If you want to track IP for audit purposes
        });
      } catch (logError) {
        console.error("Error logging certificate generation:", logError);
        // Continue even if logging fails
      }
      
      // Read PDF file and send it as response
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Set response headers for PDF
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
