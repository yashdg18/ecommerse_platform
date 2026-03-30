import JWT        from "jsonwebtoken";
import userModel  from "../models/userModel.js";

export const isAuth = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized — please login" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    req.user = await userModel.findById(decoded._id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found — please login again" });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};
