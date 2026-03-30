import userModel from "../models/userModel.js";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";

const cookieOptions = {
  expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const registerController = async (req, res) => {
  try {
    const { name, email, password, address, city, country, phone, answer } = req.body;

    if (!name || !email || !password || !city || !address || !country || !phone || !answer) {
      return res.status(400).json({ success: false, message: "Please provide all fields" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already taken" });
    }

    const user = await userModel.create({ name, email, password, address, city, country, phone, answer });

    res.status(201).json({ success: true, message: "Registration successful, please login" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Error in Register API", error: error.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = user.generateToken();
    user.password = undefined;

    res.status(200).cookie("token", token, cookieOptions).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Error in Login API", error: error.message });
  }
};

export const getUserProfileController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    res.status(200).json({ success: true, message: "User profile fetched", user });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ success: false, message: "Error in Profile API", error: error.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    res.status(200)
      .cookie("token", "", { ...cookieOptions, expires: new Date(0) })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Error in Logout API", error: error.message });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const { name, email, address, city, country, phone } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;
    if (city) user.city = city;
    if (country) user.country = country;
    if (phone) user.phone = phone;

    await user.save();
    res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Error in Update Profile API", error: error.message });
  }
};

export const udpatePasswordController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide old and new password" });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid old password" });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ success: false, message: "Error in Update Password API", error: error.message });
  }
};

export const updateProfilePicController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const file = getDataUri(req.file);

    if (user.profilePic?.public_id) {
      await cloudinary.v2.uploader.destroy(user.profilePic.public_id);
    }

    const cdb = await cloudinary.v2.uploader.upload(file.content);
    user.profilePic = { public_id: cdb.public_id, url: cdb.secure_url };

    await user.save();
    res.status(200).json({ success: true, message: "Profile picture updated" });
  } catch (error) {
    console.error("Update pic error:", error);
    res.status(500).json({ success: false, message: "Error in Update Profile Pic API", error: error.message });
  }
};

export const passwordResetController = async (req, res) => {
  try {
    const { email, newPassword, answer } = req.body;

    if (!email || !newPassword || !answer) {
      return res.status(400).json({ success: false, message: "Please provide all fields" });
    }

    const user = await userModel.findOne({ email, answer });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email or security answer" });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successful, please login" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ success: false, message: "Error in Password Reset API", error: error.message });
  }
};