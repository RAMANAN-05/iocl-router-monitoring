const express = require("express");
const router = express.Router();
const { getNetworkStatus } = require("../controllers/NetworkController");

router.get("/status", getNetworkStatus);

module.exports = router;
