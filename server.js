
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB制限
});

const STORAGE_DIR = path.join(__dirname, "storage");
const DATA_FILE = path.join(__dirname, "data", "filelist.json");

app.use(express.static("public"));
app.use(express.json());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("storage")) fs.mkdirSync("storage");
if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded.");
  const id = uuidv4();
  const newPath = path.join(STORAGE_DIR, `${id}_${file.originalname}`);
  fs.renameSync(file.path, newPath);

  const files = JSON.parse(fs.readFileSync(DATA_FILE));
  const deleteKey = uuidv4();
  files.push({
    id,
    name: file.originalname,
    path: newPath,
    createdAt: Date.now(),
    deleteKey,
  });
  fs.writeFileSync(DATA_FILE, JSON.stringify(files, null, 2));
  res.json({ id, deleteKey });
});

app.get("/f/:id", (req, res) => {
  const { id } = req.params;
  const files = JSON.parse(fs.readFileSync(DATA_FILE));
  const file = files.find(f => f.id === id);
  if (!file) return res.status(404).send("File not found.");
  res.download(file.path, file.name);
});

app.post("/delete", (req, res) => {
  const { id, key } = req.body;
  const files = JSON.parse(fs.readFileSync(DATA_FILE));
  const fileIndex = files.findIndex(f => f.id === id && f.deleteKey === key);
  if (fileIndex === -1) return res.status(403).send("Invalid delete key.");

  const file = files[fileIndex];
  fs.unlinkSync(file.path);
  files.splice(fileIndex, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(files, null, 2));
  res.send("Deleted.");
});

setInterval(() => {
  const now = Date.now();
  const files = JSON.parse(fs.readFileSync(DATA_FILE));
  const kept = files.filter(file => {
    if (now - file.createdAt < 24 * 60 * 60 * 1000) return true;
    fs.unlinkSync(file.path);
    return false;
  });
  fs.writeFileSync(DATA_FILE, JSON.stringify(kept, null, 2));
}, 60 * 1000); // 1分ごとにチェック

app.listen(PORT, () => console.log(`Yua File Bin running on port ${PORT}`));
