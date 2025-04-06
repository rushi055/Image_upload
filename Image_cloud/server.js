const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const PORT = 5000;
const app = express();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

//Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

//Image Schema
const imageSchema = new mongoose.Schema({
  public_id: String,
  url: String,
});

//Image Model
const Image = mongoose.model("Image", imageSchema);

// Configure Cloudinary
cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    format: async (req, file) => "png",
    public_id: (req, file) =>
      file.originalname.split(".")[0] + "_" + Date.now(),
    transformation: [{ width: 800, height: 600, crop: "fill" }],
  },
});

// Initialize Multer with Cloudinary Storage
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      return cb(new Error("Only image files are allowed!"), false);
    }
  },
});

//upload image route
app.post("/upload", upload.single("image"), async (req, res) => {
  console.log(req.file);
  const uploadedImage = await Image.create({
    public_id: req.file.filename,
    url: req.file.path,
  });
  res.json({ message: "File uploaded successfully", uploadedImage });
});

//get all images route
app.get("/images", async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
