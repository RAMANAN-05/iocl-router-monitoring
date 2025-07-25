const ping = require("ping");

const locations = [
  { location: "Google DNS", jio: "8.8.8.8", bsnl: "8.8.4.4" },
  { location: "Cloudflare DNS", jio: "1.1.1.1", bsnl: "1.0.0.1" },
  { location: "Quad9", jio: "9.9.9.9", bsnl: "149.112.112.112" },
  { location: "OpenDNS", jio: "208.67.222.222", bsnl: "208.67.220.220" },
  { location: "Comodo DNS", jio: "8.26.56.26", bsnl: "8.20.247.20" },
];

const checkPing = async (ip) => {
  const res = await ping.promise.probe(ip, { timeout: 2 });
  return res.alive ? "Good" : "Poor";
};

const runCheck = async () => {
  console.log("Checking Public IP Status...\n");

  for (const loc of locations) {
    const jioStatus = await checkPing(loc.jio);
    const bsnlStatus = await checkPing(loc.bsnl);

    console.log(
      `${loc.location.padEnd(15)} | Jio: ${jioStatus.padEnd(4)} | BSNL: ${bsnlStatus}`
    );
  }
};

runCheck();
