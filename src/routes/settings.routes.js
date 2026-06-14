const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// PUT update profile
router.put("/profile", async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: { id: true, name: true, email: true, image: true },
    });
    res.json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// PUT change password
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Current password is wrong" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    res.json({ message: "Password changed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;