const express = require("express");
const router = express.Router();

const {
  getNetworkStatus,
  checkAlertStatus, // ✅ Add this
} = require("../controllers/NetworkController");

router.get("/status", getNetworkStatus);
router.get("/alert", checkAlertStatus); // ✅ New route for alerts

module.exports = router;
