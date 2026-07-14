import { verifySession } from "../lib/jwt.js";
import { getUserById } from "../db/index.js";

// Attach this to any route that requires a logged-in extension user.
// Expects: Authorization: Bearer <sessionToken>
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header." });
  }

  try {
    const { userId } = verifySession(token);
    const user = getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}
