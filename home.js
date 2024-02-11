const { Router } = require("express");
const express = require("express");
const router = express.Router();
const faceapi = require("face-api.js");
const { listAll, getDownloadURL, ref } = require("firebase/storage");
const imageDb = require("./firebase");
const path = require("path");
var fs = require("fs");
const multer = require('multer');
const tf = require('@tensorflow/tfjs');
const { Canvas, Image, ImageData } = require("canvas");
const storage = multer.memoryStorage(); // Use memory storage for receiving image data in memory
const upload = multer({ storage: storage });

const loadFaceAPIModels = async () => {
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
    faceapi.nets.ssdMobilenetv1.loadFromDisk(
      "C:/Users/vinay/Desktop/Backend SnapMatch/ssd_mobilenetv1_model-weights_manifest.json"
    ),
  ]);
};

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
const downloadFile = async (fileName) => {
  try {
    const storageRef = ref(imageDb, "match"); // Use ref directly on imageDb
    const fileRef = ref(storageRef, fileName); // Assuming fileName is the name of the file you want to download
    const downloadUrl = await getDownloadURL(fileRef);

    // Now you can use the downloadUrl to download the file using your preferred method
    // For example, you can use the Fetch API or any other method you prefer

    // For demonstration using the Fetch API:
    // const response = await fetch(downloadUrl);
    // const blob = await response.blob();

    // Now you can use the blob as needed, for example, display the image in an HTML img tag
    // const imageURL = URL.createObjectURL(blob);
    // document.getElementById("myImage").src = imageURL;

    return downloadUrl;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};


const fetchFirebaseImage = async (url) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const sharp = require('sharp');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image, status: ${response.status}`);
    }

    const buffer = await response.buffer();

    // Use sharp to decode the image and convert it to TensorFlow.js tensor
    const image = sharp(buffer);

    // Make sure to inspect the actual values and shape of the tensor
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    console.log('Actual shape:', [info.height, info.width, 3]); // Log the actual shape
    console.log('Actual number of values:', data.length); // Log the actual number of values

    // Assuming RGB image
    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');

    return tensor;
  } catch (error) {
    console.error("Error fetching Firebase image:", error);
    throw error;
  }
};


router.post('/upload', async (req, res) => {
  try {
    // Load models
    const results = [];
    await loadFaceAPIModels();
    // Fetch Firebase image
    const downloadUrls = await getDownloadUrls();
    const match = await downloadFile("fixedPath.jpg");
    const matchTensor = await fetchFirebaseImage(match);

    const matchDetection = await faceapi.detectSingleFace(matchTensor, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (matchDetection) {
      console.log("Match Descriptor:", matchDetection.descriptor);

      for (const imageUrl of downloadUrls) {
        try {
          const imageTensorNew = await fetchFirebaseImage(imageUrl);
          const detectionArray = await faceapi.detectSingleFace(imageTensorNew, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detectionArray) {
            // Compare facial descriptors
            const distance = faceapi.euclideanDistance(matchDetection.descriptor, detectionArray.descriptor);

            // You can adjust the threshold based on your requirement
            const threshold = 0.6; // Adjust as needed

            // Check if the distance is below the threshold
            if (distance < threshold) {
              // Add the result to the array
              results.push(imageUrl);
            }
          }
        } catch (error) {
          console.error(`Error processing image ${imageUrl}:`, error);
        }
      }
      
      console.log(results);
      
      // Send the results back to the client
      res.status(200).json({results});
       // Clear the results array
     
    } else {
      res.status(500).json({ error: "NoFaceDetected" });
    }
  } catch (error) {
    console.error("Error handling image upload:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
