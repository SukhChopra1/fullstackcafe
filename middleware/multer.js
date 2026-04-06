const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= UPLOAD PATH ================= */
// Using path.resolve to ensure we get the absolute path from the project root
const uploadPath = path.resolve(__dirname, "../public/uploads");

/* Create folder if it doesn't exist */
try {
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log("✅ Uploads directory created at:", uploadPath);
    }
} catch (err) {
    console.error("❌ Error creating uploads directory:", err);
}

/* ================= STORAGE ================= */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Double check existence before saving to prevent Multer "no such directory" errors
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        // Create a unique filename: timestamp + random number + original extension
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + extension);
    }
});

/* ================= IMAGE FILTER ================= */
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|webp/;
    
    // Check extension
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Error: Images Only (jpeg, jpg, png, webp)!"));
    }
};

/* ================= EXPORT ================= */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Increased to 5MB for convenience
    }
});

module.exports = upload;