// Import the functions you need from the SDKs you need
var { initializeApp } = require("firebase/app");
var { getStorage } = require("firebase/storage");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNURcyPcLGJp63i2B3gtNmk8122STKsVA",
  authDomain: "snap-match-6b16b.firebaseapp.com",
  projectId: "snap-match-6b16b",
  storageBucket: "snap-match-6b16b.appspot.com",
  messagingSenderId: "277477629555",
  appId: "1:277477629555:web:8fe6eebd97bdf6d4a11406"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
module.exports = imageDb = getStorage(app);
