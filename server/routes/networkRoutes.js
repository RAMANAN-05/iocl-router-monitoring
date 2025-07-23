const express = require("express");
const router = express.Router();
const networkController = require("../controllers/NetworkController");

router.get("/status", networkController.getNetworkStatus); // ✅ Existing route
router.get("/history", networkController.getNetworkHistory); // ✅ New route

module.exports = router;
