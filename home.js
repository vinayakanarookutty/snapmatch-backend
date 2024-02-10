const { Router } = require('express');
const express = require('express');
const router = express.Router();
const faceapi = require('face-api.js');
const { listAll, getDownloadURL, ref, } = require('firebase/storage');
const imageDb = require("./firebase");
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

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
function dataUrlToImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(img);
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = dataUrl;
  });
}
// Express route to handle file upload
router.post('/upload', async (req, res) => {
  const { image } = req.body;
  try{
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromDisk("C:/Users/vinay/Desktop/Backend SnapMatch/tiny_face_detector_model-weights_manifest.json"),
      faceapi.nets.faceLandmark68Net.loadFromDisk("C:/Users/vinay/Desktop/Backend SnapMatch/face_landmark_68_model-weights_manifest.json"),
      faceapi.nets.faceRecognitionNet.loadFromDisk("C:/Users/vinay/Desktop/Backend SnapMatch/face_recognition_model-weights_manifest.json"),
      faceapi.nets.faceExpressionNet.loadFromDisk("C:/Users/vinay/Desktop/Backend SnapMatch/face_expression_model-weights_manifest.json"),
    ]).then(async()=>{
      const downloadUrls = await getDownloadUrls();
      console.log(downloadUrls)
      console.log(image)
      try{
       
       const newImage=dataUrlToImageElement(image)
        const detections = await faceapi.detectAllFaces(newImage, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        if (detections && detections.length > 0) {
          console.log("Faces detected:", detections);
        } else {
          console.log("No faces detected.");
        }
  
      }
      catch (error) {
        console.error('New Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
      }
     
    })
   
  }
  catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
 });

module.exports = router;
