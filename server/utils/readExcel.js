// utils/readExcel.js
const XLSX = require("xlsx");
const path = require("path");

const readLocationData = () => {
  const filePath = path.join(__dirname, "../data/locations.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const locations = jsonData
    .map((row) => {
      const location = row["Location Name"]?.trim();
      const jio = row["Jio WAN IP"]?.trim();
      const bsnl = row["BSNL WAN IP"]?.trim();
      return location ? { location, jio, bsnl } : null;
    })
    .filter(Boolean); // removes nulls

  return locations;
};

module.exports = readLocationData;
