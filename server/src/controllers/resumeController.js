const path = require('path');
const fs = require('fs');
const util = require('util');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { analyzeResume } = require('../services/resumeService');

const unlink = util.promisify(fs.unlink);

async function uploadAndAnalyze(req, res, next) {
  try {
    // If a file was uploaded via multipart, use that.
    let filePath;
    let original;
    const userId = req.user?.id || null;

    if (req.file) {
      filePath = req.file.path;
      original = req.file.originalname;
    } else if (req.body?.url || req.query?.url) {
      // download remote or internal URL to uploads dir
      const url = req.body?.url || req.query?.url;
      const filename = Date.now() + '-' + path.basename(url).replace(/\s+/g, '_');
      const dest = path.join(__dirname, '../../uploads', filename);
      const resp = await fetch(url);
      if (!resp.ok) return res.status(400).json({ success: false, message: 'Failed to download resume' });
      const arrayBuf = await resp.arrayBuffer();
      await fs.promises.writeFile(dest, Buffer.from(arrayBuf));
      filePath = dest;
      original = path.basename(url);
    } else {
      return res.status(400).json({ success: false, message: 'No file uploaded or url provided' });
    }

    const doc = await analyzeResume(filePath, original, userId);

    // cleanup uploaded or downloaded file
    try { await unlink(filePath); } catch (e) {}

    return res.json({ success: true, data: doc });
  } catch (err) {
    return next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const query = userId ? { userId } : {};
    const items = await ResumeAnalysis.find(query).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadAndAnalyze, getHistory };
