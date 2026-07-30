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
  password: { type: String, required: true }
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
  metaDescription: { type: String, default: 'Download Sri Lankan Grade 1 to 13 Past Papers, Model Papers, Short Notes and Study Resources.' }
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
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('BN23@123x', 10);
    await Admin.create({ username: 'ZTX', password: hashedPassword });
  }

  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      siteName: 'EXAM PDF DOWNLOAD LK',
      monetagEnabled: true,
      monetagDirectLink: 'https://omg10.com/4/11453715'
    });
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
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: admin.username });
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