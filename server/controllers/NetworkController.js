const ping = require('ping');
const readLocationData = require('../utils/readExcel');
const PingLog = require('../models/PingLog'); // Log model

// GET /api/network/status
exports.getNetworkStatus = async (req, res) => {
  try {
    console.log("⚙️ Starting network status check...");

    const locations = readLocationData();
    if (!locations || locations.length === 0) {
      console.error("⚠️ No locations found from Excel.");
      return res.status(500).json({ message: 'No location data available' });
    }

    const checkedAt = new Date(); // Shared timestamp

    const results = await Promise.all(
      locations.map(async (loc) => {
        const locationName = loc.location?.trim();
        const jioIP = loc.jio?.trim();
        const bsnlIP = loc.bsnl?.trim();

        console.log(`📍 Checking: ${locationName} (Jio: ${jioIP}, BSNL: ${bsnlIP})`);

        let jioStatus = 'poor';
        let bsnlStatus = 'poor';

        try {
          if (jioIP && !['No Link', 'NA'].includes(jioIP)) {
            const jioRes = await ping.promise.probe(jioIP);
            jioStatus = jioRes.alive ? 'good' : 'poor';
          }
        } catch (jioErr) {
          console.warn(`⚠️ Jio ping failed for ${locationName}:`, jioErr.message);
        }

        try {
          if (bsnlIP && !['No Link', 'NA'].includes(bsnlIP)) {
            const bsnlRes = await ping.promise.probe(bsnlIP);
            bsnlStatus = bsnlRes.alive ? 'good' : 'poor';
          }
        } catch (bsnlErr) {
          console.warn(`⚠️ BSNL ping failed for ${locationName}:`, bsnlErr.message);
        }

        try {
          await PingLog.create({
            location: locationName,
            jio: jioStatus,
            bsnl: bsnlStatus,
            checkedAt,
          });
        } catch (dbErr) {
          console.error(`❌ DB Save Error for ${locationName}:`, dbErr.message);
        }

        return {
          location: locationName,
          jio: jioStatus,
          bsnl: bsnlStatus,
          checkedAt: checkedAt.toLocaleString('en-IN', {
            hour12: true,
            timeStyle: 'medium',
            dateStyle: 'short',
          }),
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error in getNetworkStatus:", err.message);
    res.status(500).json({ message: 'Failed to get network status' });
  }
};

// GET /api/network/history
exports.getNetworkHistory = async (req, res) => {
  try {
    const history = await PingLog.find().sort({ checkedAt: -1 }).limit(100);
    res.status(200).json(history);
  } catch (err) {
    console.error("❌ Error in getNetworkHistory:", err.message);
    res.status(500).json({ message: 'Failed to get network history' });
  }
};
