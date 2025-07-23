const express = require("express");
const router = express.Router();
const networkController = require("../controllers/NetworkController");

router.get("/status", networkController.getNetworkStatus); // 

module.exports = router;
