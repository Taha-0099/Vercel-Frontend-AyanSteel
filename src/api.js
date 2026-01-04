import axios from "axios";

const api = axios.create({
  baseURL: "https://vercel-backend-ayan-steel.vercel.app",
});

export default api;
