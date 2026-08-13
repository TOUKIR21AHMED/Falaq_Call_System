const express = require("express");
const {
  register,
  login,
} = require("../controllers/authController");

const router = express.Router();
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");



router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
router.post("/register", register);
router.post("/login", login);

module.exports = router;