const ping = require('ping');
const readLocationData = require('../utils/readExcel');
const PingLog = require('../models/PingLog'); // Log model

exports.getNetworkStatus = async (req, res) => {
  try {
    console.log("⚙️ Starting network status check...");

    const locations = readLocationData();
    if (!locations || locations.length === 0) {
      console.error("⚠️ No locations found from Excel.");
      return res.status(500).json({ message: 'No location data available' });
    }

    const checkedAt = new Date(); // Same timestamp for all logs

    const results = await Promise.all(
      locations.map(async (loc) => {
        const locationName = loc.location?.trim();
        const jioIP = loc.jio?.trim();
        const bsnlIP = loc.bsnl?.trim();

        console.log(`📍 Checking: ${locationName} (Jio: ${jioIP}, BSNL: ${bsnlIP})`);

        let jioResult = { alive: false };
        let bsnlResult = { alive: false };

        try {
          if (jioIP && !['No Link', 'NA'].includes(jioIP)) {
            jioResult = await ping.promise.probe(jioIP);
          }
          if (bsnlIP && !['No Link', 'NA'].includes(bsnlIP)) {
            bsnlResult = await ping.promise.probe(bsnlIP);
          }
        } catch (pingErr) {
          console.warn(`⚠️ Ping error at ${locationName}:`, pingErr);
        }

        const jioStatus = jioResult.alive ? 'good' : 'poor';
        const bsnlStatus = bsnlResult.alive ? 'good' : 'poor';

        try {
          await PingLog.create({
            location: locationName,
            jio: jioStatus,
            bsnl: bsnlStatus,
            checkedAt
          });
        } catch (dbErr) {
          console.error(`❌ DB Save Error for ${locationName}:`, dbErr);
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
    console.error("❌ Error fetching network status:", err);
    res.status(500).json({ message: 'Failed to get network status' });
  }
};
