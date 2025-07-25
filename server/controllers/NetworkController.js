const tcpp = require('tcp-ping');
const readLocationData = require('../utils/readExcel');
const PingLog = require('../models/PingLog');

/**
 * TCP “ping” (no ICMP, works on Render).
 * Tries port 80 by default. Change to 443 if you prefer HTTPS.
 */
function tcpProbe(ip, port = 80) {
  return new Promise((resolve) => {
    tcpp.probe(ip, port, (err, isAlive) => {
      if (err || !isAlive) return resolve('poor');
      return resolve('good');
    });
  });
}

// =============== 1) LIVE STATUS ===============
const getNetworkStatus = async (req, res) => {
  try {
    const locations = readLocationData();
    const checkedAt = new Date();

    const results = await Promise.all(
      locations.map(async (loc) => {
        const location = loc.location?.trim();
        const jioIP = loc.jio?.trim();
        const bsnlIP = loc.bsnl?.trim();

        const jioStatus =
          jioIP && !['No Link', 'NA'].includes(jioIP)
            ? await tcpProbe(jioIP, 80)
            : 'poor';

        const bsnlStatus =
          bsnlIP && !['No Link', 'NA'].includes(bsnlIP)
            ? await tcpProbe(bsnlIP, 80)
            : 'poor';
        // Save
        await PingLog.create({
          location,
          jioStatus,
          bsnlStatus,
          timestamp: checkedAt,
        });

        return {
          location,
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
    console.error('❌ Error fetching network status:', err);
    res.status(500).json({ message: 'Failed to get network status' });
  }
};

// =============== 2) 30-MIN CONTINUOUS POOR ALERT ===============
const checkAlertStatus = async (req, res) => {
  try {
    const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);

    const groups = await PingLog.aggregate([
      { $match: { timestamp: { $gte: THIRTY_MINUTES_AGO } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$location',
          logs: {
          $push: {
              timestamp: '$timestamp',
              jioStatus: '$jioStatus',
              bsnlStatus: '$bsnlStatus',
            },
          },
        },
      },
    ]);

    const alerts = [];

    groups.forEach((g) => {
      const location = g._id;
      const logs = g.logs;

      if (!logs || logs.length === 0) return;

      const first = logs[logs.length - 1]?.timestamp;
      const last = logs[0]?.timestamp;
      const minutes = (new Date(last) - new Date(first)) / (1000 * 60);

      const jioDown = logs.every((l) => l.jioStatus === 'poor');
      const bsnlDown = logs.every((l) => l.bsnlStatus === 'poor');

      if ((jioDown || bsnlDown) && minutes >= 30) {            //
        alerts.push({
          location,
          jioStatus: jioDown ? 'poor' : 'ok',
          bsnlStatus: bsnlDown ? 'poor' : 'ok',
          alert: true,
        });
      }
    });

    res.json({ alerts });
  } catch (err) {
    console.error('❌ Error checking alerts:', err);
    res.status(500).json({ message: 'Failed to check alerts' });
  }
};

module.exports = {
  getNetworkStatus,
  checkAlertStatus,
};
