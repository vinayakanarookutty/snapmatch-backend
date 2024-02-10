const { Router } = require("express");
const express = require("express");
const router = express.Router();
const faceapi = require("face-api.js");
const { listAll, getDownloadURL, ref } = require("firebase/storage");
const imageDb = require("./firebase");
const path = require("path");
var fs = require("fs");
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const { Canvas, Image, ImageData } = require('canvas');
const storage = multer.memoryStorage(); // Use memory storage for receiving image data in memory
const upload = multer({ storage: storage });

const getDownloadUrls = async () => {
  try {
    const storageRef = ref(imageDb, "files"); // Use ref directly on imageDb
    const img = await listAll(storageRef);
    const uniqueItems = Array.from(new Set(img.items));
    const promises = uniqueItems.map((val) => getDownloadURL(val));
    const urls = await Promise.all(promises);

    return urls;
  } catch (error) {
    console.error("Error listing files:", error);
    console.error("Full error object:", error);
    throw error;
  }
};



// ... (your other imports)

// Modify the dataUrlToImg function to return a canvasasync function dataUrlToImg(image) {

// ... (your other functions)

router.post('/upload', upload.single('image'), async (req, res) => {
  // const image = new Canvas.Image(); // Create a new Canvas Image
  // image.src = req.file.buffer; // Set the image source to the buffer of the uploaded file

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromDisk(
        "C:/Users/vinay/Desktop/Backend SnapMatch/tiny_face_detector_model-weights_manifest.json"
      ),
      faceapi.nets.faceLandmark68Net.loadFromDisk(
        "C:/Users/vinay/Desktop/Backend SnapMatch/face_landmark_68_model-weights_manifest.json"
      ),
      faceapi.nets.faceRecognitionNet.loadFromDisk(
        "C:/Users/vinay/Desktop/Backend SnapMatch/face_recognition_model-weights_manifest.json"
      ),
      faceapi.nets.faceExpressionNet.loadFromDisk(
        "C:/Users/vinay/Desktop/Backend SnapMatch/face_expression_model-weights_manifest.json"
      ),
    ]).then(async () => {
      const downloadUrls = await getDownloadUrls();
      console.log(downloadUrls);
     

      const canvas = createCanvas(1, 1); // Adjust the size as needed
      const ctx = canvas.getContext('2d');

      const image = await loadImage(req.file.buffer);
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, image.width, image.height);

      // Convert canvas to HTMLImageElement
      const img = new Image();
      img.src = canvas.toDataURL('image/jpeg');

      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // Handle detections as needed
      console.log('Face detections:', detections);

      // Send the results back to the React application
      res.json({ detections });
      // Rest of your code...
    });
  } catch (error) {
    console.error("Error handling image upload:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
