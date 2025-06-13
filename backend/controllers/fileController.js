import { bucket, storage } from "../gcs.js";

const BUCKET_NAME = "r_and_d_induction_files";

// Helper function for uploading files without sending response (for internal use)
export const uploadFileToGCS = async (file, customFileName = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const safeOriginalName = file.originalname.replace(/\s+/g, "_");

    // Use provided customFileName or generate one
    const gcsFileName = customFileName 
      ? customFileName.replace(/\s+/g, "_")
      : `qualifications/${Date.now()}_${safeOriginalName}`;

    const blob = bucket.file(gcsFileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error("Error uploading file:", err);
      reject(err);
    });

    blobStream.on("finish", async () => {
      try {
        const options = {
          version: "v4",
          action: "read",
          expires: Date.now() + 60 * 60 * 1000,
        };

        const [signedUrl] = await blob.getSignedUrl(options);

        resolve({
          message: "File uploaded successfully!",
          url: signedUrl,
          gcsFileName,
          originalName: file.originalname
        });
      } catch (error) {
        console.error("Error generating signed URL:", error);
        reject(error);
      }
    });

    blobStream.end(file.buffer);
  });
};

// Original uploadFile function (for direct API endpoints)
export const uploadFile = async (req, res) => {
  try {
    const { file } = req;
    const { customFileName } = req.body;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const result = await uploadFileToGCS(file, customFileName);
    res.status(200).json(result);
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).send("Internal server error.");
  }
};

export const uploadPublicFile = async (req, res) => {
  try {
    const { file } = req;
    const { filePath } = req.body;

    if (!file || !filePath) {
      return res.status(400).send("File and filePath are required.");
    }

    // Ensure file name is safe
    const segments = filePath.split('/');
    const rawFileName = segments.pop(); // Get the filename from the path
    const safeFileName = rawFileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const safeFilePath = [...segments, safeFileName].join('/');

    const blob = bucket.file(safeFilePath);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    blobStream.on('error', (err) => {
      console.error('Error uploading file:', err);
      return res.status(500).send('Something went wrong.');
    });

    blobStream.on('finish', async () => {
      try {
        // Return the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${safeFilePath}`;
        res.status(200).json({
          message: 'File uploaded successfully!',
          url: publicUrl,
          filePath: safeFilePath,
        });
      } catch (error) {
        console.error('Error making file public:', error);
        res.status(500).send('Error finalizing file upload.');
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).send('Internal server error.');
  }
};

export const getSignedUrl = async (req, res) => {
  try {
    const fileName = req.headers['filename'];

    if (!fileName) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const file = storage.bucket(BUCKET_NAME).file(fileName);
    
    // Options for the signed URL
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour expiration
    };

    // Get the signed URL
    const [url] = await file.getSignedUrl(options);

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate signed URL", details: error.message });
  }
};

// Helper function for deleting files without sending response (for internal use)
export const deleteFileFromGCS = async (fileName) => {
  try {
    const file = storage.bucket(BUCKET_NAME).file(fileName);
    await file.delete();
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const deleteFile = async (req, res) => {
  try {
    const fileName = req.headers['filename'];

    if (!fileName) {
      return res.status(400).send("File name is required.");
    }

    await deleteFileFromGCS(fileName);
    res.status(200).send("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).send("Failed to delete file.");
  }
};

export const downloadFile = async (req, res) => {
  try {
    const gcsFileName = req.headers.filename;

    if (!gcsFileName) {
      return res.status(400).send("No filename provided in headers.");
    }

    const file = bucket.file(gcsFileName);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send("File not found.");
    }

    // Get file metadata to set proper content type and filename
    const [metadata] = await file.getMetadata();
    const originalFileName = gcsFileName.split('/').pop();
    
    // Set proper headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${originalFileName}"`);
    res.setHeader("Content-Type", metadata.contentType || "application/octet-stream");
    
    // Handle potential filename encoding issues
    if (originalFileName.includes(' ') || /[^\x00-\x7F]/.test(originalFileName)) {
      res.setHeader("Content-Disposition", 
        `attachment; filename*=UTF-8''${encodeURIComponent(originalFileName)}`);
    }

    // Stream the file directly to the response
    const stream = file.createReadStream();
    
    stream.on("error", (err) => {
      console.error("GCS read error:", err);
      if (!res.headersSent) {
        res.status(500).send("Error reading file.");
      }
    });

    stream.on("end", () => {
      console.log(`File ${gcsFileName} downloaded successfully`);
    });

    stream.pipe(res);
    
  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).send("Internal server error.");
    }
  }
};

export const getDownloadUrl = async (req, res) => {
  try {
    const fileName = req.headers['filename'];

    if (!fileName) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const file = storage.bucket(BUCKET_NAME).file(fileName);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Generate signed URL specifically for download
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour for download
      responseDisposition: `attachment; filename="${fileName.split('/').pop()}"`,
    };

    const [url] = await file.getSignedUrl(options);

    res.json({ downloadUrl: url });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(500).json({ error: "Failed to generate download URL", details: error.message });
  }
};
