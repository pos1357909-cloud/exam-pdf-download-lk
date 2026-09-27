const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../database');

const router = express.Router();
router.use(cors());
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

// History LMS Models
const HistoryGradeSchema = new mongoose.Schema({
  grade: { type: String, required: true, unique: true },
  lessons: { type: Array, default: [] }
});

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  plan: { type: String, default: 'Free' },
  coins: { type: Number, default: 0 },
  hasClaimedFreeCoins: { type: Boolean, default: false },
  todayUsedCoins: { type: Number, default: 0 },
  lastActiveDate: { type: String },
  grade: { type: String },
  phone: { type: String },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

const ApprovalSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  studentEmail: { type: String, required: true },
  studentName: { type: String, required: true },
  paymentId: { type: String, required: true },
  plan: { type: String, required: true },
  coins: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  date: { type: String }
}, { timestamps: true });

const HistoryGrade = mongoose.models.HistoryGrade || mongoose.model('HistoryGrade', HistoryGradeSchema);
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
const Approval = mongoose.models.Approval || mongoose.model('Approval', ApprovalSchema);

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
  if (mongoose.connection.readyState !== 1) return;
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
      frequencyControl: 600,
      adLoadingDelay: 1.5
    });
  } else {
    let updateFields = {};
    if (!settings.monetagDirectLink) updateFields.monetagDirectLink = defaultDirectLink;
    if (settings.autoInsertAds === false) updateFields.autoInsertAds = true;
    if (settings.excludeAdmin === false) updateFields.excludeAdmin = true;
    updateFields.frequencyControl = 600;
    updateFields.adLoadingDelay = 1.5;
    
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

let isSeeded = false;

// Seed route trigger middleware (runs once on cold start)
router.use(async (req, res, next) => {
  if (!isSeeded) {
    try {
      await seedDefaults();
      isSeeded = true;
    } catch (err) {
      console.error('Seeding error:', err);
    }
  }
  next();
});

// Helper: emit socket event if io is available
function emitEvent(req, event, data) {
  try {
    const io = req.app && req.app.get ? req.app.get('io') : null;
    if (io) io.emit(event, data);
  } catch (e) { /* ignore in serverless */ }
}

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

// ---------------- HISTORY LMS ENDPOINTS ----------------

// GET /api/history-data: Fetch all lessons and questions by grade
router.get('/history-data', async (req, res) => {
  const defaultData = {
    "6": [
      {
        lessonId: "l_6_1",
        lessonTitle: "1 පාඩම - අපේ මූලාශ්‍ර",
        mcq: [
          { id: "mcq_1", question: "ඉතිහාසය හැදෑරීම සඳහා භාවිත වන ප්‍රධාන මූලාශ්‍ර වර්ග දෙක කුමක්ද?", options: ["සාහිත්‍ය මූලාශ්‍ර සහ පුරාවිද්‍යා මූලාශ්‍ර", "ලිඛිත මූලාශ්‍ර සහ මුඛ පරම්පරාගත මූලාශ්‍ර", "ගල් පුවරු සහ තාලපත", "පොත්පත් සහ පුවත්පත්"], answer: 0, explanation: "ඉතිහාස මූලාශ්‍ර ප්‍රධාන වශයෙන් සාහිත්‍ය මූලාශ්‍ර සහ පුරාවිද්‍යා මූලාශ්‍ර ලෙස කොටස් දෙකකට බෙදේ." }
        ],
        short: [
          { id: "short_1", question: "පුරාවිද්‍යා මූලාශ්‍ර යනු මොනවාද?", answer: "අතීත මිනිසාගේ ක්‍රියාකාරකම් නිසා ඉතිරිවී ඇති භෞතික අවශේෂ පුරාවිද්‍යා මූලාශ්‍ර වේ." }
        ],
        essay: [
          { id: "essay_1", title: "ලංකාවේ ලිඛිත මූලාශ්‍රවල වැදගත්කම පැහැදිලි කරන්න.", answer: "අතීත රාජාවලිය සහ ශාසනික තොරතුරු නිවැරදිව තේරුම් ගැනීමට ලිඛිත මූලාශ්‍ර උපකාරී වේ." }
        ],
        shortNotes: [
          {
            id: "sn_1",
            title: "1. ඉතිහාස මූලාශ්‍රවල ප්‍රධාන වර්ගීකරණය",
            content: "අතීතය පිළිබඳ තොරතුරු ලබාදෙන සාක්ෂි ඉතිහාස මූලාශ්‍ර ලෙස හැඳින්වේ.\n• සාහිත්‍ය මූලාශ්‍ර (ලිඛිත හා මුඛ පරම්පරාගත තොරතුරු)\n• පුරාවිද්‍යා මූලාශ්‍ර (භෞතික අවශේෂ, සෙල්ලිපි, කාසි, ගොඩනැගිලි)"
          },
          {
            id: "sn_2",
            title: "2. සාහිත්‍ය මූලාශ්‍රවල වැදගත්කම",
            content: "දේශීය සාහිත්‍ය මූලාශ්‍ර (මහාවංශය, දීපවංශය, පූජාවලිය) සහ විදේශීය සාහිත්‍ය මූලාශ්‍ර (ෆාහියන් හිමියන්ගේ වාර්තා) මගින් අතීත රාජාවලිය හඳුනාගත හැක."
          }
        ],
        mindMap: [
          {
            id: "mm_1",
            topic: "අපේ ඉතිහාස මූලාශ්‍ර",
            nodes: [
              {
                title: "සාහිත්‍ය මූලාශ්‍ර",
                details: ["දේශීය (මහාවංශය, දීපවංශය)", "විදේශීය (චීන, ඉන්දියානු වාර්තා)"]
              },
              {
                title: "පුරාවිද්‍යා මූලාශ්‍ර",
                details: ["ශිලා ලේඛන (සෙල්ලිපි)", "කාසි සහ මුද්‍රා", "නටබුන් හා ගොඩනැගිලි"]
              },
              {
                title: "ජනශ්‍රැති",
                details: ["ජනකථා, ජනකවි", "මුඛ පරම්පරාගත කථා"]
              }
            ]
          }
        ],
        pdf: [
          {
            id: "pdf_1",
            title: "6 ශ්‍රේණිය - 1 පාඩම සම්පූර්ණ සාරාංශය සහ ප්‍රශ්න පත්‍රය PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileSize: "2.4 MB PDF Document",
            description: "1 පාඩමට අදාළ සියලුම MCQ, කෙටි ප්‍රශ්න, රචනා ප්‍රශ්න සහ පිළිතුරු සහිත PDF ගොනුව."
          }
        ]
      }
    ]
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(defaultData);
    }
    const grades = await HistoryGrade.find({});
    if (!grades || grades.length === 0) {
      return res.json(defaultData);
    }
    
    const formatted = {};
    grades.forEach(g => {
      formatted[g.grade] = g.lessons || [];
    });
    res.json(formatted);
  } catch (error) {
    res.json(defaultData);
  }
});

// POST /api/history-data: Save or update full history data
router.post('/history-data', async (req, res) => {
  try {
    const data = req.body;
    for (const [grade, lessons] of Object.entries(data)) {
      await HistoryGrade.findOneAndUpdate(
        { grade: grade.toString() },
        { grade: grade.toString(), lessons },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'History data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- FALLBACK FILE/MEMORY STORAGE ----------------
const fs = require('fs');
const path = require('path');
const FALLBACK_FILE = path.join(__dirname, '../data_fallback.json');

function loadFallbackData() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
      return { students: parsed.students || [], approvals: parsed.approvals || [] };
    }
  } catch (e) {}
  return { students: [], approvals: [] };
}

function saveFallbackData(data) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

const memoryStore = loadFallbackData();

// POST /api/students/register
router.post('/students/register', async (req, res) => {
  try {
    const { name, email, password, studentId, grade, phone } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    let createdStudent = null;

    if (mongoose.connection.readyState === 1) {
      const existing = await Student.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const newStudent = new Student({
        studentId: studentId || ('STD-' + Math.floor(100000 + Math.random() * 900000)),
        name: name || 'Student',
        email: cleanEmail,
        password,
        role: 'user',
        plan: 'Free',
        coins: 0,
        hasClaimedFreeCoins: false,
        todayUsedCoins: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        grade: grade || '',
        phone: phone || ''
      });

      await newStudent.save();
      createdStudent = newStudent.toObject();
    } else {
      const existing = memoryStore.students.find(s => s.email === cleanEmail);
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      createdStudent = {
        studentId: studentId || ('STD-' + Math.floor(100000 + Math.random() * 900000)),
        name: name || 'Student',
        email: cleanEmail,
        password,
        role: 'user',
        plan: 'Free',
        coins: 0,
        hasClaimedFreeCoins: false,
        todayUsedCoins: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        grade: grade || '',
        phone: phone || '',
        createdAt: new Date()
      };
      memoryStore.students.unshift(createdStudent);
      saveFallbackData(memoryStore);
    }

    // 🔴 Real-time: Notify Admin that a new student registered
    emitEvent(req, 'student:registered', {
      studentId: createdStudent.studentId,
      name: createdStudent.name,
      email: createdStudent.email,
      plan: createdStudent.plan,
      coins: createdStudent.coins,
      createdAt: createdStudent.createdAt
    });
    res.status(201).json(createdStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/login
router.post('/students/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanEmail === 'exampaperlkonlinepapershop@gmail.com') {
      if (password === 'FG@#478f') {
        return res.json({
          student: {
            name: "System Admin",
            email: "exampaperlkonlinepapershop@gmail.com",
            role: "admin",
            plan: "Admin Unlimited",
            coins: 999999,
            todayUsedCoins: 0,
            lastActiveDate: new Date().toISOString().split('T')[0]
          }
        });
      } else {
        return res.status(401).json({ error: 'Admin password incorrect' });
      }
    }

    let student = null;
    if (mongoose.connection.readyState === 1) {
      student = await Student.findOne({ email: cleanEmail });
    } else {
      student = memoryStore.students.find(s => s.email === cleanEmail);
    }

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if student account is pending admin approval
    if (student.status === 'pending') {
      return res.status(403).json({ error: 'pending', message: 'ඔබගේ ගිණුම තවමත් Admin අනුමතය (Approval) ලැබීමට ඇත. Admin OK කිරීමෙන් පසු ඔබට ලොග් වීමට හැකිවේ. කරුණාකර රැඳී සිටින්න.' });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/students: List all registered students
router.get('/students', async (req, res) => {
  try {
    let mongoStudents = [];
    if (mongoose.connection.readyState === 1) {
      mongoStudents = await Student.find({}).sort({ createdAt: -1 });
    }
    const studentMap = new Map();
    (memoryStore.students || []).forEach(s => { if (s && s.email) studentMap.set(s.email.toLowerCase(), s); });
    mongoStudents.forEach(s => {
      const obj = s.toObject ? s.toObject() : s;
      if (obj && obj.email) studentMap.set(obj.email.toLowerCase(), obj);
    });

    res.json(Array.from(studentMap.values()));
  } catch (error) {
    res.json(memoryStore.students || []);
  }
});

// PUT /api/students/:id: Update student coins, password, etc.
router.put('/students/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    let updated = null;

    if (mongoose.connection.readyState === 1) {
      updated = await Student.findOneAndUpdate(
        { $or: [{ studentId: targetId }, { email: targetId }] },
        req.body,
        { new: true }
      );
    } else {
      const idx = memoryStore.students.findIndex(s => s.studentId === targetId || s.email === targetId);
      if (idx !== -1) {
        Object.assign(memoryStore.students[idx], req.body);
        updated = memoryStore.students[idx];
        saveFallbackData(memoryStore);
      }
    }

    if (updated) {
      // 🔴 Real-time: Notify the specific student of their updated data
      emitEvent(req, 'student:updated', {
        email: updated.email,
        coins: updated.coins,
        plan: updated.plan,
        status: updated.status,
        todayUsedCoins: updated.todayUsedCoins
      });
    }
    res.json(updated || { success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/students: Delete ALL registered students
router.delete('/students', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Student.deleteMany({});
    }
    memoryStore.students = [];
    saveFallbackData(memoryStore);

    res.json({ success: true, message: 'All registered students deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/students/:id: Delete student by ID or email
router.delete('/students/:id', async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);

    // Find the student's email before deleting (for socket notification)
    let removedEmail = null;
    if (mongoose.connection.readyState === 1) {
      const found = await Student.findOne({ $or: [{ studentId: targetId }, { email: targetId }] });
      if (found) removedEmail = found.email;
      await Student.deleteOne({ $or: [{ studentId: targetId }, { email: targetId }] });
    }

    const fallbackStudent = memoryStore.students.find(s => s.studentId === targetId || s.email === targetId);
    if (!removedEmail && fallbackStudent) removedEmail = fallbackStudent.email;
    memoryStore.students = memoryStore.students.filter(s => s.studentId !== targetId && s.email !== targetId);
    saveFallbackData(memoryStore);

    // 🔴 Real-time: Force logout the removed student
    if (removedEmail) {
      emitEvent(req, 'student:removed', { email: removedEmail });
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/consume-coin
router.post('/students/consume-coin', async (req, res) => {
  try {
    const { email, amount } = req.body;
    const coinsToDeduct = Math.max(1, parseInt(amount) || 1);
    if (!email) return res.status(400).json({ error: 'Email required' });

    let student = null;
    if (mongoose.connection.readyState === 1) {
      student = await Student.findOne({ email: email.toLowerCase() });
      if (student && student.coins > 0) {
        student.coins = Math.max(0, student.coins - coinsToDeduct);
        student.todayUsedCoins = (student.todayUsedCoins || 0) + coinsToDeduct;
        await student.save();
      }
    } else {
      student = memoryStore.students.find(s => s.email === email.toLowerCase());
      if (student && student.coins > 0) {
        student.coins = Math.max(0, student.coins - coinsToDeduct);
        student.todayUsedCoins = (student.todayUsedCoins || 0) + coinsToDeduct;
        saveFallbackData(memoryStore);
      }
    }
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ coins: student.coins, todayUsedCoins: student.todayUsedCoins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/approvals: List all payment approvals
router.get('/approvals', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const approvals = await Approval.find({}).sort({ createdAt: -1 });
      res.json(approvals);
    } else {
      res.json(memoryStore.approvals);
    }
  } catch (error) {
    res.json(memoryStore.approvals);
  }
});

// POST /api/approvals: Submit payment claim
router.post('/approvals', async (req, res) => {
  try {
    let createdApproval = null;
    if (mongoose.connection.readyState === 1) {
      const approval = new Approval(req.body);
      await approval.save();
      createdApproval = approval.toObject();
    } else {
      createdApproval = { ...req.body, createdAt: new Date() };
      memoryStore.approvals.unshift(createdApproval);
      saveFallbackData(memoryStore);
    }

    // 🔴 Real-time: Notify Admin of a new payment claim
    emitEvent(req, 'approval:new', {
      requestId: createdApproval.requestId,
      studentEmail: createdApproval.studentEmail,
      studentName: createdApproval.studentName,
      plan: createdApproval.plan,
      coins: createdApproval.coins,
      paymentId: createdApproval.paymentId,
      date: createdApproval.date
    });
    res.status(201).json(createdApproval);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/approvals/:id: Approve or Reject
router.put('/approvals/:id', async (req, res) => {
  try {
    const { status } = req.body;
    let approval = null;
    let updatedStudent = null;

    if (mongoose.connection.readyState === 1) {
      approval = await Approval.findOne({ requestId: req.params.id });
      if (!approval) return res.status(404).json({ error: 'Approval request not found' });

      approval.status = status;
      await approval.save();

      if (status === 'approved') {
        const student = await Student.findOne({ email: approval.studentEmail.toLowerCase() });
        if (student) {
          student.plan = approval.plan;
          student.coins = (student.coins || 0) + Number(approval.coins);
          // Activate student account and grant free coins if not yet claimed
          if (student.status === 'pending') {
            student.status = 'active';
            if (!student.hasClaimedFreeCoins) {
              student.coins += 75;
              student.hasClaimedFreeCoins = true;
            }
          }
          await student.save();
          updatedStudent = student;
        }
      }
    } else {
      approval = memoryStore.approvals.find(a => a.requestId === req.params.id);
      if (!approval) return res.status(404).json({ error: 'Approval request not found' });

      approval.status = status;
      if (status === 'approved') {
        const student = memoryStore.students.find(s => s.email.toLowerCase() === approval.studentEmail.toLowerCase());
        if (student) {
          student.plan = approval.plan;
          student.coins = (student.coins || 0) + Number(approval.coins);
          // Activate student account and grant free coins if not yet claimed
          if (student.status === 'pending') {
            student.status = 'active';
            if (!student.hasClaimedFreeCoins) {
              student.coins += 75;
              student.hasClaimedFreeCoins = true;
            }
          }
          updatedStudent = student;
        }
      }
      saveFallbackData(memoryStore);
    }

    // 🔴 Real-time: Notify student of approval status change
    emitEvent(req, 'approval:updated', {
      requestId: approval.requestId,
      studentEmail: approval.studentEmail,
      status: approval.status,
      plan: approval.plan,
      coins: updatedStudent ? updatedStudent.coins : null,
      coinsAdded: Number(approval.coins)
    });

    res.json({ success: true, approval });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vercel Serverless Export Wrapper
const app = express();
app.use(express.json());
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error in serverless wrapper:', err.message);
  }
  next();
});
// On Vercel, the full path (e.g. /api/admin/login) is forwarded to this function,
// so mount at /api. On local dev, server.js already strips the /api prefix,
// so also mount at / as a fallback.
app.use('/api', router);
app.use('/', router);

module.exports = app;