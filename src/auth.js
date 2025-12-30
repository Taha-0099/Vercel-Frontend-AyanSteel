import jwtDecode from "jwt-decode";
import Cookies from "js-cookie";

// NOTE: This project currently has no backend for issuing real JWTs.
// The helpers below store tokens in a cookie/localStorage and provide
// simple decode/isAuthenticated helpers for client-side route protection.

const TOKEN_KEY = "authToken";

export function saveToken(token) {
  try {
    Cookies.set(TOKEN_KEY, token, { sameSite: "lax" });
  } catch (e) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken() {
  return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

export function removeToken() {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token) {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload) return false;
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    removeToken();
    return false;
  }
  return true;
}

export function isAdmin() {
  const token = getToken();
  const payload = decodeToken(token);
  return payload && payload.role === "admin";
}

// For demo / offline usage: create a simple unsigned JWT-like token.
// This is NOT secure and only for local/demo use when no backend exists.
function base64Url(obj) {
  const json = JSON.stringify(obj);
  const b64 = typeof window !== "undefined" && window.btoa
    ? window.btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createDemoToken({ email, role }) {
  const header = { alg: "none", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const payload = { email, role, exp };
  return [base64Url(header), base64Url(payload), ""].join(".");
}

export function loginDemo({ email, role = "user" }) {
  const token = createDemoToken({ email, role });
  saveToken(token);
  return token;
}

export default {
  saveToken,
  getToken,
  removeToken,
  decodeToken,
  isAuthenticated,
  isAdmin,
  createDemoToken,
  loginDemo
};
