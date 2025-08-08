
const fs = require("fs");
const path = require("path");

const META_PATH = path.join(__dirname, "../data/filelist.json");
const STORAGE_DIR = path.join(__dirname, "../storage");

function loadFileMeta() {
  if (!fs.existsSync(META_PATH)) return [];
  return JSON.parse(fs.readFileSync(META_PATH, "utf8"));
}

function saveFileMeta(meta) {
  const list = loadFileMeta();
  list.push(meta);
  fs.writeFileSync(META_PATH, JSON.stringify(list, null, 2));
}

function removeFileMeta(id) {
  const list = loadFileMeta().filter((f) => f.id !== id);
  fs.writeFileSync(META_PATH, JSON.stringify(list, null, 2));
}

function cleanupExpiredFiles() {
  const list = loadFileMeta();
  const now = new Date();
  const validList = [];

  for (const file of list) {
    const uploaded = new Date(file.uploadDate);
    const expired = new Date(uploaded);
    expired.setDate(expired.getDate() + (file.expireDays || 7));

    if (now > expired) {
      if (fs.existsSync(file.localPath)) fs.unlinkSync(file.localPath);
    } else {
      validList.push(file);
    }
  }

  fs.writeFileSync(META_PATH, JSON.stringify(validList, null, 2));
}

module.exports = { loadFileMeta, saveFileMeta, removeFileMeta, cleanupExpiredFiles };
