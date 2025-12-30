// src/api.js
import axios from "axios";

// CHANGE PORT IF YOUR BACKEND USES ANOTHER PORT
const api = axios.create({
  baseURL: "http://localhost:5001", // Node/Express backend
});

export default api;
