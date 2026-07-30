const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'exampdfdownloadlk_secret_key_2026';

// ---------------- MONGOOSE SCHEMAS & MODELS ----------------

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true },
  isSuperAdmin: { type: Boolean, default: false }
});

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'EXAM PDF DOWNLOAD LK' },
  monetagEnabled: { type: Boolean, default: true },
  monetagDirectLink: { type: String, default: 'https://omg10.com/4/11453715' },
  monetagHeaderBanner: { type: String, default: '' },
  monetagSidebarBanner: { type: String, default: '' },
  monetagFooterBanner: { type: String, default: '' },
  customHeaderCode: { type: String, default: '' },
  customFooterCode: { type: String, default: '' },
  metaDescription: { type: String, default: 'Download Sri Lankan Grade 1 to 13 Past Papers, Model Papers, Short Notes and Study Resources.' },

  // ---- Monetag Ad Format Codes & Enable Flags ----
  pushNotifEnabled:   { type: Boolean, default: false },
  pushNotifCode:      { type: String,  default: '' },
  inPagePushEnabled:  { type: Boolean, default: false },
  inPagePushCode:     { type: String,  default: '' },
  vignetteEnabled:    { type: Boolean, default: false },
  vignetteCode:       { type: String,  default: '' },
  onClickEnabled:     { type: Boolean, default: false },
  onClickCode:        { type: String,  default: '' },
  multitagEnabled:    { type: Boolean, default: false },
  multitagCode:       { type: String,  default: '' },
  directLinks:        { type: Array,   default: [] },

  // ---- Advanced Ad Settings ----
  autoInsertAds:      { type: Boolean, default: true },
  selectedPages:      { type: Array,   default: [] },
  mobileOnly:         { type: Boolean, default: false },
  desktopOnly:        { type: Boolean, default: false },
  adLoadingDelay:     { type: Number,  default: 0 },
  frequencyControl:   { type: Number,  default: 0 },
  excludeAdmin:       { type: Boolean, default: true },

  // ---- Backup & Audit Log ----
  adSettingsBackup:   { type: String,  default: '' },
  adActivityLog:      { type: Array,   default: [] },
  adLastUpdated:      { type: Date }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true }
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String }
});

const GradeSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  title: { type: String, required: true }
});

const PdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  grade: { type: Number, required: true },
  subject: { type: String, required: true },
  category: { type: String, required: true },
  medium: { type: String, enum: ['Sinhala', 'English', 'Tamil'], default: 'Sinhala' },
  year: { type: Number, default: 2024 },
  province: { type: String, default: 'All Island' },
  fileUrl: { type: String, required: true },
  fileSize: { type: String, default: '2.5 MB' },
  thumbnail: { type: String, default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60' },
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Admin' },
  date: { type: Date, default: Date.now }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
const Grade = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
const Pdf = mongoose.models.Pdf || mongoose.model('Pdf', PdfSchema);
const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Seed Default Data Function
const seedDefaults = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || 'ZTX';
  const adminPassword = process.env.ADMIN_PASSWORD || 'BN23@123x';
  const adminEmail = 'dinukanimsara031@gmail.com';

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.create({ username: adminUsername, password: hashedPassword, email: adminEmail, isSuperAdmin: true });
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.updateOne(
      { email: adminEmail },
      { $set: { username: adminUsername, password: hashedPassword, isSuperAdmin: true } }
    );
  }

  let settings = await Settings.findOne();
  const defaultDirectLink = 'https://omg10.com/4/11453715';
  const defaultAdTag = '<script src="https://omg10.com/4/11453715" async data-cfasync="false"></script>';

  if (!settings) {
    await Settings.create({
      siteName: 'EXAM PDF DOWNLOAD LK',
      monetagEnabled: true,
      monetagDirectLink: defaultDirectLink,
      autoInsertAds: true,
      excludeAdmin: true,
      pushNotifEnabled: true,
      pushNotifCode: defaultAdTag,
      inPagePushEnabled: true,
      inPagePushCode: defaultAdTag,
      vignetteEnabled: true,
      vignetteCode: defaultAdTag,
      onClickEnabled: true,
      onClickCode: defaultAdTag,
      multitagEnabled: true,
      multitagCode: defaultAdTag,
      frequencyControl: 600
    });
  } else {
    let updateFields = {};
    if (!settings.monetagDirectLink) updateFields.monetagDirectLink = defaultDirectLink;
    if (settings.autoInsertAds === false) updateFields.autoInsertAds = true;
    if (settings.excludeAdmin === false) updateFields.excludeAdmin = true;
    updateFields.frequencyControl = 600;
    
    if (!settings.multitagCode) { updateFields.multitagEnabled = true; updateFields.multitagCode = defaultAdTag; }
    if (!settings.onClickCode) { updateFields.onClickEnabled = true; updateFields.onClickCode = defaultAdTag; }
    if (!settings.vignetteCode) { updateFields.vignetteEnabled = true; updateFields.vignetteCode = defaultAdTag; }
    if (!settings.inPagePushCode) { updateFields.inPagePushEnabled = true; updateFields.inPagePushCode = defaultAdTag; }
    if (!settings.pushNotifCode) { updateFields.pushNotifEnabled = true; updateFields.pushNotifCode = defaultAdTag; }

    if (Object.keys(updateFields).length > 0) {
      await Settings.updateOne({ _id: settings._id }, { $set: updateFields });
    }
  }

  const pdfCount = await Pdf.countDocuments();
  if (pdfCount === 0) {
    const samplePdfs = [
      { title: 'Grade 11 Mathematics Term Test Paper 2024', grade: 11, subject: 'Mathematics', category: 'School Term Test Papers', medium: 'Sinhala', year: 2024, province: 'Western', fileSize: '3.2 MB', downloads: 1420, views: 3500, featured: true, fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'Grade 13 Combined Maths Short Notes - Integration', grade: 13, subject: 'Combined Maths', category: 'Short Notes', medium: 'Sinhala', year: 2024, province: 'All Island', fileSize: '1.8 MB', downloads: 2890, views: 5600, featured: true, fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'Grade 5 Scholarship Model Exam Paper 01', grade: 5, subject: 'Scholarship', category: 'Model Papers', medium: 'Sinhala', year: 2024, province: 'Central', fileSize: '4.1 MB', downloads: 5120, views: 8900, featured: true, fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'Grade 11 Science Past Paper GCE O/L 2023', grade: 11, subject: 'Science', category: 'Past Papers', medium: 'English', year: 2023, province: 'All Island', fileSize: '5.5 MB', downloads: 6400, views: 12000, featured: true, fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'Grade 13 Physics Practical Guide & Marking Scheme', grade: 13, subject: 'Physics', category: 'Marking Schemes', medium: 'Sinhala', year: 2024, province: 'Southern', fileSize: '6.0 MB', downloads: 1980, views: 4200, featured: false, fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { title: 'Grade 10 ICT Complete Syllabus Notes Unit 1-5', grade: 10, subject: 'ICT', category: 'Study Notes', medium: 'English', year: 2024, province: 'All Island', fileSize: '2.9 MB', downloads: 1100, views: 2400, featured: false, fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ];
    await Pdf.insertMany(samplePdfs);
  }
};

// Seed route trigger middleware
router.use(async (req, res, next) => {
  try {
    await seedDefaults();
  } catch (err) {
    console.error('Seeding error:', err);
  }
  next();
});

// ---------------- PUBLIC API ENDPOINTS ----------------

// Get All PDFs with Filters & Search
router.get('/pdfs', async (req, res) => {
  try {
    const { search, grade, subject, category, medium, sort, limit, page = 1 } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (grade) query.grade = Number(grade);
    if (subject) query.subject = subject;
    if (category) query.category = category;
    if (medium) query.medium = medium;

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { downloads: -1 };
    if (sort === 'views') sortOption = { views: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageSize = Number(limit) || 12;
    const skip = (Number(page) - 1) * pageSize;

    const pdfs = await Pdf.find(query).sort(sortOption).skip(skip).limit(pageSize);
    const total = await Pdf.countDocuments(query);

    res.json({ pdfs, total, page: Number(page), pages: Math.ceil(total / pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single PDF
router.get('/pdfs/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: 'PDF resource not found' });
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment View Count
router.post('/pdfs/:id/view', async (req, res) => {
  try {
    const pdf = await Pdf.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    res.json({ views: pdf ? pdf.views : 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment Download Count
router.post('/pdfs/:id/download', async (req, res) => {
  try {
    const pdf = await Pdf.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    res.json({ downloads: pdf ? pdf.downloads : 0, fileUrl: pdf.fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Public Settings & Ads
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Statistics for Dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalPdfs = await Pdf.countDocuments();
    const totalDownloadsObj = await Pdf.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]);
    const totalViewsObj = await Pdf.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);

    const totalDownloads = totalDownloadsObj[0] ? totalDownloadsObj[0].total : 0;
    const totalViews = totalViewsObj[0] ? totalViewsObj[0].total : 0;

    res.json({
      totalPdfs,
      totalDownloads,
      totalViews,
      todayDownloads: Math.floor(totalDownloads * 0.12),
      monthlyDownloads: Math.floor(totalDownloads * 0.85)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- ADMIN AUTH & ACTIONS ----------------

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, Username, and Password are all required', kickout: true });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const admin = await Admin.findOne({ email: cleanEmail, username: cleanUsername });

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized credentials', kickout: true });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized credentials', kickout: true });
    }

    const isSuperAdmin = (cleanEmail === 'dinukanimsara031@gmail.com');

    const token = jwt.sign({ id: admin._id, username: admin.username, email: admin.email, isSuperAdmin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: admin.username, email: admin.email, isSuperAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/access - Fetch all sub-admins (Protected, SuperAdmin only)
router.get('/admin/access', authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== 'dinukanimsara031@gmail.com') {
      return res.status(403).json({ error: 'Super Admin access required (dinukanimsara031@gmail.com only)' });
    }
    const admins = await Admin.find({}, { password: 0 }); // exclude passwords
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/access - Create sub-admin (Protected, SuperAdmin only)
router.post('/admin/access', authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== 'dinukanimsara031@gmail.com') {
      return res.status(403).json({ error: 'Super Admin access required (dinukanimsara031@gmail.com only)' });
    }
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, Username, and Password are all required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const existingAdmin = await Admin.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
    if (existingAdmin) return res.status(400).json({ error: 'Email or Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email: cleanEmail, username: cleanUsername, password: hashedPassword, isSuperAdmin: false });
    await newAdmin.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/access/:email - Delete sub-admin (Protected, SuperAdmin only)
router.delete('/admin/access/:email', authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== 'dinukanimsara031@gmail.com') {
      return res.status(403).json({ error: 'Super Admin access required (dinukanimsara031@gmail.com only)' });
    }
    const email = req.params.email.toLowerCase();
    
    if (email === 'dinukanimsara031@gmail.com') {
      return res.status(400).json({ error: 'Cannot delete Super Admin' });
    }

    await Admin.deleteOne({ email });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /admin/access/:email - Edit sub-admin credentials (Protected, SuperAdmin only)
router.put('/admin/access/:email', authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== 'dinukanimsara031@gmail.com') {
      return res.status(403).json({ error: 'Super Admin access required (dinukanimsara031@gmail.com only)' });
    }
    const targetEmail = req.params.email.toLowerCase();
    const { username, password } = req.body;
    
    if (targetEmail === 'dinukanimsara031@gmail.com') {
      return res.status(400).json({ error: 'Super Admin account cannot be modified via sub-admin update route' });
    }

    const admin = await Admin.findOne({ email: targetEmail });
    if (!admin) return res.status(404).json({ error: 'Admin account not found' });

    let updateData = {};
    if (username && username.trim()) updateData.username = username.trim();
    if (password && password.trim()) updateData.password = await bcrypt.hash(password.trim(), 10);

    await Admin.updateOne({ email: targetEmail }, { $set: updateData });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add PDF (Protected)
router.post('/admin/pdfs', authenticateToken, async (req, res) => {
  try {
    const newPdf = new Pdf(req.body);
    await newPdf.save();
    res.status(201).json(newPdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update PDF (Protected)
router.put('/admin/pdfs/:id', authenticateToken, async (req, res) => {
  try {
    const updatedPdf = await Pdf.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete PDF (Protected)
router.delete('/admin/pdfs/:id', authenticateToken, async (req, res) => {
  try {
    await Pdf.findByIdAndDelete(req.params.id);
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Settings / Ads (Protected)
router.put('/admin/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- MONETAG ADS MANAGEMENT ----------------

// GET /admin/ads – Retrieve all ad settings (Protected)
router.get('/admin/ads', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /admin/ads – Save ad format codes, toggles, direct links & advanced settings (Protected)
router.put('/admin/ads', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});

    const allowedFields = [
      'pushNotifEnabled', 'pushNotifCode',
      'inPagePushEnabled', 'inPagePushCode',
      'vignetteEnabled', 'vignetteCode',
      'onClickEnabled', 'onClickCode',
      'multitagEnabled', 'multitagCode',
      'directLinks', 'monetagDirectLink', 'monetagEnabled',
      'autoInsertAds', 'selectedPages', 'mobileOnly', 'desktopOnly',
      'adLoadingDelay', 'frequencyControl', 'excludeAdmin', 'adActivityLog'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    });

    // Prepend activity log entry if provided
    if (req.body._logAction) {
      const entry = {
        action: req.body._logAction,
        timestamp: new Date(),
        user: req.user.username,
        details: req.body._logDetails || ''
      };
      settings.adActivityLog = [entry, ...(settings.adActivityLog || [])].slice(0, 50);
    }

    settings.adLastUpdated = new Date();
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/ads/backup – Snapshot all current ad settings (Protected)
router.post('/admin/ads/backup', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) return res.status(404).json({ error: 'No settings found' });

    const snapshot = {
      pushNotifEnabled: settings.pushNotifEnabled, pushNotifCode: settings.pushNotifCode,
      inPagePushEnabled: settings.inPagePushEnabled, inPagePushCode: settings.inPagePushCode,
      vignetteEnabled: settings.vignetteEnabled, vignetteCode: settings.vignetteCode,
      onClickEnabled: settings.onClickEnabled, onClickCode: settings.onClickCode,
      multitagEnabled: settings.multitagEnabled, multitagCode: settings.multitagCode,
      directLinks: settings.directLinks,
      autoInsertAds: settings.autoInsertAds, selectedPages: settings.selectedPages,
      mobileOnly: settings.mobileOnly, desktopOnly: settings.desktopOnly,
      adLoadingDelay: settings.adLoadingDelay, frequencyControl: settings.frequencyControl,
      excludeAdmin: settings.excludeAdmin,
      backedUpAt: new Date().toISOString()
    };

    settings.adSettingsBackup = JSON.stringify(snapshot);
    const entry = { action: 'Settings Backed Up', timestamp: new Date(), user: req.user.username, details: 'Full ad settings snapshot saved to database' };
    settings.adActivityLog = [entry, ...(settings.adActivityLog || [])].slice(0, 50);
    settings.adLastUpdated = new Date();
    await settings.save();
    res.json({ success: true, backedUpAt: snapshot.backedUpAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/ads/restore – Restore ad settings from last backup (Protected)
router.post('/admin/ads/restore', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings || !settings.adSettingsBackup) {
      return res.status(404).json({ error: 'No backup found. Please create a backup first.' });
    }
    const backup = JSON.parse(settings.adSettingsBackup);
    const { backedUpAt, ...restoreFields } = backup;
    Object.assign(settings, restoreFields);
    const entry = { action: 'Settings Restored', timestamp: new Date(), user: req.user.username, details: 'Restored from backup made on ' + backedUpAt };
    settings.adActivityLog = [entry, ...(settings.adActivityLog || [])].slice(0, 50);
    settings.adLastUpdated = new Date();
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vercel Serverless Export Wrapper
const app = express();
app.use(express.json());
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
// On Vercel, the full path (e.g. /api/admin/login) is forwarded to this function,
// so mount at /api. On local dev, server.js already strips the /api prefix,
// so also mount at / as a fallback.
app.use('/api', router);
app.use('/', router);

module.exports = app;