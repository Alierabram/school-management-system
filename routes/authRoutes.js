const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, JWT_SECRET, JWT_EXPIRES } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const rememberMe = Boolean(req.body?.rememberMe);
    const token = jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : JWT_EXPIRES }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
