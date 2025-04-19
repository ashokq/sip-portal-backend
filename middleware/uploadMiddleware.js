// middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
// --- Choose ONE storage strategy ---

// Strategy 1: Local Storage (for development/testing ONLY)
const storageLocal = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure 'uploads/' folder exists
    },
    filename: function (req, file, cb) {
        // Create unique filename: fieldname-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `<span class="math-inline">\{file\.fieldname\}\-</span>{uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Strategy 2: AWS S3 Storage (Example - requires configuration)
/*
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const storageS3 = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) { // Unique key in S3
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `courses/resources/<span class="math-inline">\{file\.fieldname\}\-</span>{uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
*/

// --- File Filter ---
function checkFileType(file, cb) {
    // Define allowed extensions (customize as needed)
    const filetypes = /pdf|doc|docx|txt|jpg|jpeg|png|zip/; // Example allowed types
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Allowed file types are pdf, doc(x), txt, jpg, png, zip!'), false);
    }
}

// --- Configure Multer ---
const upload = multer({
    // storage: storageS3, // Use S3 storage for production
    storage: storageLocal, // Use local storage for development
    limits: { fileSize: 5 * 1024 * 1024 }, // Example: 5MB file size limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}); // Use '.single("resourceFile")' where 'resourceFile' is the form field name

export default upload;