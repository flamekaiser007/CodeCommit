import jwt from "jsonwebtoken";

const STATE_SECRET = process.env.STATE_JWT_SECRET;
const SESSION_SECRET = process.env.SESSION_JWT_SECRET;

// The "state" token carries the extension's chromiumapp.org redirect URI
// through the GitHub OAuth round trip. It's short-lived and signed, so we
// don't need a server-side session store just to remember where to send
// the user back to.
export function signState(payload) {
  return jwt.sign(payload, STATE_SECRET, { expiresIn: "10m" });
}

export function verifyState(token) {
  return jwt.verify(token, STATE_SECRET);
}

// The "session" token is what the extension actually stores and sends on
// every future API request, e.g. as an Authorization: Bearer header.
export function signSession(payload) {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySession(token) {
  return jwt.verify(token, SESSION_SECRET);
}