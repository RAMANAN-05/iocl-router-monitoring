// server/models/NetworkLog.js
const mongoose = require('mongoose');

const networkLogSchema = new mongoose.Schema({
  location: String,
  jioStatus: String,      // 'good' or 'poor'
  bsnlStatus: String,     // 'good' or 'poor'
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NetworkLog', networkLogSchema);
