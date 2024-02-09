const { Router } = require('express');
const express = require('express');
const router = express.Router();
const faceapi = require('face-api.js');
const { listAll, getDownloadURL, ref } = require('firebase/storage');
const imageDb=require("./firebase")
const path =require('path')

const getDownloadUrls = async () => {
  try {
   
    const storageRef = ref(imageDb, 'files'); // Use ref directly on imageDb
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

// Express route to handle file upload
router.post('/upload', async (req, res) => {
  const { image } = req.body;
  try {
    const downloadUrls = await getDownloadUrls();

    const modelsPath = path.resolve(__dirname, 'models');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
    ]).then(async () => {
      // Detect faces and landmarks in the image
      const detections = await faceapi
        .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections && detections.length > 0) {
        console.log("Faces detected:", detections);

        // Array to store matching face URLs
        const matchingFaces = [];

        // Iterate over the detected faces
        for (const face of detections) {
          // Check for matching faces in the downloadUrls array
          const matchingFace = await findMatchingFace(face.descriptor, downloadUrls);
          if (matchingFace) {
            console.log("Matching face found:", matchingFace);
            matchingFaces.push(matchingFace);
          } else {
            console.log("No matching face found.");
          }
        }

        // Send the matching face URLs to the frontend
        res.json({ message: 'Matching faces found.', matchingFaces });
      } else {
        res.json({ message: 'No Face Found. Take Photo Again.' });
      }
    });
  } catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const findMatchingFace = async (targetDescriptor, downloadUrls) => {
  try {
    for (const url of downloadUrls) {
      const img = await faceapi.fetchImage(url);
      const descriptor = await getFaceDescriptor(img);

      const distance = faceapi.euclideanDistance(targetDescriptor, descriptor);

      // Set a threshold for similarity (you may need to adjust this)
      if (distance < 0.6) {
        return url; // Matching face found
      }
    }

    return null; // No matching face found
  } catch (error) {
    console.error('Error finding matching face:', error);
    throw error;
  }
};

const getFaceDescriptor = async (img) => {
  try {
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (detection) {
      return detection.descriptor;
    }
    return null;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    throw error;
  }
};

module.exports = router;
