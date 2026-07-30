// State Management
const state = {
  currentPage: 'home',
  pdfs: [],
  selectedGrade: null,
  selectedSubject: '',
  selectedCategory: '',
  searchQuery: '',
  adminToken: localStorage.getItem('adminToken') || null,
  bookmarks: JSON.parse(localStorage.getItem('pdf_bookmarks') || '[]'),
  monetagDirectLink: 'https://omg10.com/4/11453715'
};

// Available Grades & Subjects Definition
const GRADES = Array.from({ length: 13 }, (_, i) => i + 1);

const SUBJECTS = [
  'Sinhala', 'English', 'Tamil', 'Mathematics', 'Science', 'History',
  'Geography', 'Buddhism', 'Catholic', 'Islam', 'Hinduism', 'ICT', 'Health',
  'Commerce', 'Accounting', 'Business Studies', 'Economics', 'Political Science',
  'Logic', 'Combined Maths', 'Biology', 'Physics', 'Chemistry', 'Agriculture',
  'Engineering Technology', 'Bio System Technology', 'SFT', 'ET', 'General English'
];

const CATEGORIES = [
  'Past Papers', 'Model Papers', 'School Term Test Papers', 'Provincial Papers',
  'Short Notes', 'Study Notes', 'Teacher Notes', 'Assignments', 'Model Answers',
  'Marking Schemes', 'PDF Books', 'Syllabus PDFs'
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupEventListeners();
  loadSettings();
  navigateTo('home');
});

// Theme Setup
function setupTheme() {
  const isDark = localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const darkNow = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', darkNow ? 'dark' : 'light');
  });
}

function setupEventListeners() {
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    // Mobile navigation overlay logic if expanded
  });
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    if (settings.monetagDirectLink) {
      state.monetagDirectLink = settings.monetagDirectLink;
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

// Router Navigation Manager
function navigateTo(page, params = {}) {
  state.currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const app = document.getElementById('appContent');

  if (page === 'home') renderHome(app);
  else if (page === 'grades') renderGradesPage(app);
  else if (page === 'subjects') renderSubjectsPage(app);
  else if (page === 'bookmarks') renderBookmarksPage(app);
  else if (page === 'blog') renderBlogPage(app);
  else if (page === 'contact') renderContactPage(app);
  else if (page === 'admin') renderAdminPage(app);
}

// ---------------- UI RENDERERS ----------------

// 1. Home Page Renderer
async function renderHome(container) {
  container.innerHTML = `
    <!-- HERO SECTION -->
    <section class="gradient-hero text-white py-20 px-4 relative overflow-hidden">
      <div class="max-w-5xl mx-auto text-center space-y-6 relative z-10">
        <span class="inline-block px-4 py-1.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          🇱🇰 Sri Lanka's #1 Learning Repository
        </span>
        <h1 class="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          EXAM PDF DOWNLOAD LK
        </h1>
        <p class="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto font-light">
          Instant access to Grade 1 to 13 Past Papers, Model Papers, Short Notes, and Marking Schemes.
        </p>

        <!-- Live Instant Search Box -->
        <div class="max-w-2xl mx-auto mt-8 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 border border-white/20">
          <div class="flex-grow flex items-center px-4 gap-3 text-slate-800 dark:text-slate-100">
            <i class="fa-solid fa-magnifying-glass text-slate-400"></i>
            <input type="text" id="searchInput" placeholder="Search subject, term test paper, short notes..." 
              class="w-full bg-transparent border-0 focus:outline-none text-sm py-2">
          </div>
          <button onclick="handleSearch()" class="py-3 px-8 rounded-xl bg-[#1E88E5] hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-md">
            Search PDF
          </button>
        </div>

        <!-- Grade Quick Filters -->
        <div class="flex flex-wrap items-center justify-center gap-2 pt-4">
          <span class="text-xs text-blue-200 mr-2 font-semibold">Quick Grade:</span>
          ${[5, 10, 11, 12, 13].map(g => `
            <button onclick="filterByGrade(${g})" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/30 text-xs font-bold backdrop-blur-sm transition-all">
              Grade ${g}
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- CONTENT BODY -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <!-- CATEGORY BADGES -->
      <div>
        <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
          <i class="fa-solid fa-layer-group text-[#1E88E5]"></i> Browse Categories
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          ${CATEGORIES.slice(0, 6).map(cat => `
            <button onclick="filterByCategory('${cat}')" class="glass-card p-4 rounded-xl text-center hover:border-blue-500 transition-all hover:scale-105 group">
              <i class="fa-solid fa-folder-open text-2xl text-[#1E88E5] mb-2 group-hover:scale-110 transition-transform"></i>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">${cat}</p>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- MAIN PDF LISTINGS -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 class="text-2xl font-black tracking-tight">Latest Educational Uploads</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Updated daily with standard exam questions and marking guides.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <select id="gradeFilterSelect" onchange="applyFilters()" class="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold">
            <option value="">All Grades</option>
            ${GRADES.map(g => `<option value="${g}">Grade ${g}</option>`).join('')}
          </select>
          <select id="sortSelect" onchange="applyFilters()" class="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold">
            <option value="newest">Newest First</option>
            <option value="popular">Most Downloaded</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>

      <!-- PDF Grid -->
      <div id="pdfGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="col-span-full text-center py-12 text-slate-400">Loading resources...</div>
      </div>
    </section>
  `;

  loadPdfs();
}

// Fetch & Display PDFs
async function loadPdfs(params = {}) {
  const grid = document.getElementById('pdfGrid');
  if (!grid) return;

  try {
    const queryParams = new URLSearchParams(params).toString();
    const res = await fetch(`/api/pdfs?${queryParams}`);
    const data = await res.json();

    state.pdfs = data.pdfs || [];

    if (state.pdfs.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 glass-card rounded-2xl">
          <i class="fa-solid fa-folder-open text-4xl text-slate-400 mb-3"></i>
          <p class="text-base font-bold">No Educational Papers Found</p>
          <p class="text-xs text-slate-500">Try adjusting your search criteria or grade selection.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.pdfs.map(pdf => renderPdfCard(pdf)).join('');
  } catch (err) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500 font-bold">Failed to load resources. Please try again.</div>`;
  }
}

// PDF Card Component
function renderPdfCard(pdf) {
  const isBookmarked = state.bookmarks.includes(pdf._id);
  return `
    <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 group border border-slate-200 dark:border-slate-800">
      <div class="p-5 space-y-4">
        <!-- Top Badges -->
        <div class="flex items-center justify-between text-xs font-bold">
          <span class="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1E88E5] dark:text-blue-300">
            Grade ${pdf.grade}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            ${pdf.medium}
          </span>
        </div>

        <!-- Title -->
        <div>
          <span class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">${pdf.subject} • ${pdf.category}</span>
          <h3 class="font-bold text-base line-clamp-2 group-hover:text-[#1E88E5] transition-colors leading-snug">
            ${pdf.title}
          </h3>
        </div>

        <!-- Meta Info -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div><i class="fa-regular fa-file text-slate-400 mr-1"></i> ${pdf.fileSize || '3.0 MB'}</div>
          <div><i class="fa-solid fa-download text-emerald-500 mr-1"></i> ${pdf.downloads || 0} Downloads</div>
          <div><i class="fa-regular fa-eye text-blue-400 mr-1"></i> ${pdf.views || 0} Views</div>
          <div><i class="fa-regular fa-calendar text-slate-400 mr-1"></i> ${pdf.year || 2024}</div>
        </div>
      </div>

      <!-- Action Footer Buttons -->
      <div class="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button onclick="previewPdf('${pdf._id}', '${pdf.fileUrl}')" class="flex-1 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
          <i class="fa-regular fa-eye"></i> Preview
        </button>
        <button onclick="initiateDownload('${pdf._id}', '${pdf.title}')" class="flex-1 py-2 px-3 rounded-xl bg-[#0F4C81] hover:bg-[#0b3a63] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md">
          <i class="fa-solid fa-download"></i> Download
        </button>
        <button onclick="toggleBookmark('${pdf._id}')" class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${isBookmarked ? 'text-amber-500' : 'text-slate-400'}">
          <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
        </button>
      </div>
    </div>
  `;
}

// 2. Grades Page
function renderGradesPage(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div class="text-center max-w-2xl mx-auto space-y-3">
        <h1 class="text-3xl font-black">Browse Papers by Grade</h1>
        <p class="text-sm text-slate-500">Select any grade level from Primary to Advanced Level streams.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        ${GRADES.map(g => `
          <div onclick="filterByGrade(${g})" class="glass-card p-6 rounded-2xl text-center cursor-pointer hover:border-[#1E88E5] hover:scale-105 transition-all group">
            <div class="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-[#0F4C81] dark:text-blue-300 font-black text-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#0F4C81] group-hover:text-white transition-colors">
              ${g}
            </div>
            <h3 class="font-extrabold text-sm">Grade ${g}</h3>
            <span class="text-[10px] text-slate-400 block mt-1">All Resources</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 3. Subjects Page
function renderSubjectsPage(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div class="text-center max-w-2xl mx-auto space-y-3">
        <h1 class="text-3xl font-black">Subject Library</h1>
        <p class="text-sm text-slate-500">Find term papers and revision modules organized by subject field.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${SUBJECTS.map(s => `
          <div onclick="filterBySubject('${s}')" class="glass-card p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-bold">
                <i class="fa-solid fa-book"></i>
              </div>
              <span class="font-bold text-sm">${s}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 4. Bookmarks Page
function renderBookmarksPage(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <h1 class="text-3xl font-black flex items-center gap-3">
        <i class="fa-solid fa-bookmark text-amber-500"></i> Saved Educational PDFs
      </h1>
      <div id="pdfGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </div>
  `;

  if (state.bookmarks.length === 0) {
    document.getElementById('pdfGrid').innerHTML = `
      <div class="col-span-full text-center py-16 glass-card rounded-2xl">
        <p class="text-slate-400">No bookmarked papers yet. Click the bookmark icon on any paper card to save it here.</p>
      </div>
    `;
    return;
  }

  loadPdfs();
}

// 5. Exam News / Blog Page
function renderBlogPage(container) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 class="text-3xl font-black">Exam News & Study Tips</h1>
      <div class="space-y-6">
        <article class="glass-card p-6 rounded-2xl space-y-3">
          <span class="px-3 py-1 rounded-full bg-blue-100 text-[#0F4C81] text-xs font-bold">Exam Guidance</span>
          <h2 class="text-xl font-bold">G.C.E. O/L & A/L Exam Preparation Guidelines 2026</h2>
          <p class="text-sm text-slate-500 leading-relaxed">Key recommendations from top teachers on how to solve term papers, budget time effectively during final papers, and organize short notes.</p>
          <span class="text-xs text-slate-400 block">Published July 2026</span>
        </article>
      </div>
    </div>
  `;
}

// 6. Contact Page
function renderContactPage(container) {
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-black">Contact & Resource Requests</h1>
        <p class="text-sm text-slate-500">Need specific school papers or want to contribute study notes?</p>
      </div>

      <div class="glass-card p-8 rounded-3xl space-y-6">
        <form onsubmit="handleContactSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase mb-2 text-slate-500">Your Name</label>
            <input type="text" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase mb-2 text-slate-500">Email Address</label>
            <input type="email" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase mb-2 text-slate-500">Message / Request</label>
            <textarea rows="4" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none"></textarea>
          </div>
          <button type="submit" class="w-full py-3.5 rounded-xl bg-[#0F4C81] text-white font-bold text-sm shadow-md">Send Request</button>
        </form>
      </div>
    </div>
  `;
}

// 7. Admin Panel Dashboard
function renderAdminPage(container) {
  if (!state.adminToken) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-20">
        <div class="glass-card p-8 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-blue-100 text-[#0F4C81] flex items-center justify-center text-2xl mx-auto">
              <i class="fa-solid fa-lock"></i>
            </div>
            <h2 class="text-2xl font-black">Admin Access</h2>
            <p class="text-xs text-slate-400">EXAM PDF DOWNLOAD LK Control Center</p>
          </div>

          <form onsubmit="handleAdminLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Username</label>
              <input type="text" id="adminUser" value="ZTX" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Password</label>
              <input type="password" id="adminPass" value="BN23@123x" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none">
            </div>
            <button type="submit" class="w-full py-3.5 rounded-xl bg-[#0F4C81] text-white font-bold text-sm shadow-lg">Login to Dashboard</button>
          </form>
        </div>
      </div>
    `;
    return;
  }

  // Logged-in Admin Dashboard
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black">Admin Dashboard</h1>
          <p class="text-xs text-slate-400">Logged in as <strong>ZTX</strong></p>
        </div>
        <button onclick="adminLogout()" class="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition-all">
          Logout
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="adminStats">
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold block">Total PDFs</span>
          <span class="text-3xl font-black text-[#1E88E5]" id="statTotalPdfs">--</span>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold block">Total Downloads</span>
          <span class="text-3xl font-black text-emerald-500" id="statDownloads">--</span>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold block">Total Views</span>
          <span class="text-3xl font-black text-amber-500" id="statViews">--</span>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold block">Monetag Direct Link</span>
          <span class="text-xs font-bold text-emerald-500 block truncate mt-2">${state.monetagDirectLink}</span>
        </div>
      </div>

      <!-- Add New PDF Form -->
      <div class="glass-card p-8 rounded-3xl space-y-6">
        <h2 class="text-xl font-bold flex items-center gap-2"><i class="fa-solid fa-file-circle-plus text-blue-500"></i> Upload / Add New Resource</h2>
        <form onsubmit="handleAddPdf(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="col-span-full">
            <label class="block text-xs font-bold uppercase mb-1">Paper / Book Title</label>
            <input type="text" id="pdfTitle" placeholder="e.g. Grade 11 Mathematics Paper 1" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase mb-1">Grade</label>
            <select id="pdfGrade" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm">
              ${GRADES.map(g => `<option value="${g}">Grade ${g}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase mb-1">Subject</label>
            <select id="pdfSubject" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm">
              ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase mb-1">Category</label>
            <select id="pdfCategory" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm">
              ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase mb-1">Medium</label>
            <select id="pdfMedium" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm">
              <option value="Sinhala">Sinhala</option>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>
          <div class="col-span-full">
            <label class="block text-xs font-bold uppercase mb-1">PDF Direct Download URL</label>
            <input type="url" id="pdfUrl" placeholder="https://example.com/file.pdf" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm">
          </div>
          <button type="submit" class="col-span-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg">
            Save PDF Resource
          </button>
        </form>
      </div>
    </div>
  `;

  loadAdminStats();
}

// ---------------- ACTIONS & HANDLERS ----------------

function handleSearch() {
  const query = document.getElementById('searchInput')?.value;
  loadPdfs({ search: query });
}

function filterByGrade(grade) {
  navigateTo('home');
  setTimeout(() => {
    loadPdfs({ grade });
  }, 100);
}

function filterByCategory(category) {
  navigateTo('home');
  setTimeout(() => {
    loadPdfs({ category });
  }, 100);
}

function filterBySubject(subject) {
  navigateTo('home');
  setTimeout(() => {
    loadPdfs({ subject });
  }, 100);
}

function applyFilters() {
  const grade = document.getElementById('gradeFilterSelect')?.value;
  const sort = document.getElementById('sortSelect')?.value;
  loadPdfs({ grade, sort });
}

// Download System with Monetag 5-Second Timer Redirect
function initiateDownload(pdfId, pdfTitle) {
  const modal = document.getElementById('downloadModal');
  const modalTitle = document.getElementById('modalPdfTitle');
  const timerElem = document.getElementById('countdownTimer');
  const timerContainer = document.getElementById('timerContainer');
  const actionsElem = document.getElementById('downloadActions');
  const directBtn = document.getElementById('directDownloadBtn');

  if (!modal) return;

  modalTitle.textContent = pdfTitle;
  modal.classList.remove('hidden');
  timerContainer.classList.remove('hidden');
  actionsElem.classList.add('hidden');

  let seconds = 5;
  timerElem.textContent = seconds;

  // Track download on server
  fetch(`/api/pdfs/${pdfId}/download`, { method: 'POST' });

  const interval = setInterval(() => {
    seconds--;
    timerElem.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(interval);
      timerContainer.classList.add('hidden');
      actionsElem.classList.remove('hidden');

      // Trigger Monetag direct link
      window.open(state.monetagDirectLink, '_blank');
      directBtn.href = `/api/pdfs/${pdfId}`;
    }
  }, 1000);
}

function closeDownloadModal() {
  document.getElementById('downloadModal')?.classList.add('hidden');
}

// Built-in PDF Viewer Modal
function previewPdf(pdfId, fileUrl) {
  fetch(`/api/pdfs/${pdfId}/view`, { method: 'POST' });
  const viewer = document.getElementById('viewerModal');
  const iframe = document.getElementById('pdfIframe');

  if (viewer && iframe) {
    iframe.src = fileUrl;
    viewer.classList.remove('hidden');
  }
}

function closeViewer() {
  const viewer = document.getElementById('viewerModal');
  const iframe = document.getElementById('pdfIframe');
  if (viewer) viewer.classList.add('hidden');
  if (iframe) iframe.src = '';
}

// Bookmarking System
function toggleBookmark(pdfId) {
  const idx = state.bookmarks.indexOf(pdfId);
  if (idx > -1) {
    state.bookmarks.splice(idx, 1);
  } else {
    state.bookmarks.push(pdfId);
  }
  localStorage.setItem('pdf_bookmarks', JSON.stringify(state.bookmarks));
  
  if (state.currentPage === 'bookmarks') {
    renderBookmarksPage(document.getElementById('appContent'));
  } else {
    loadPdfs();
  }
}

// Admin Operations
async function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('adminUser').value;
  const password = document.getElementById('adminPass').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      state.adminToken = data.token;
      localStorage.setItem('adminToken', data.token);
      renderAdminPage(document.getElementById('appContent'));
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Login error');
  }
}

function adminLogout() {
  state.adminToken = null;
  localStorage.removeItem('adminToken');
  navigateTo('home');
}

async function loadAdminStats() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    document.getElementById('statTotalPdfs').textContent = stats.totalPdfs || 0;
    document.getElementById('statDownloads').textContent = stats.totalDownloads || 0;
    document.getElementById('statViews').textContent = stats.totalViews || 0;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function handleAddPdf(e) {
  e.preventDefault();
  const pdfData = {
    title: document.getElementById('pdfTitle').value,
    grade: Number(document.getElementById('pdfGrade').value),
    subject: document.getElementById('pdfSubject').value,
    category: document.getElementById('pdfCategory').value,
    medium: document.getElementById('pdfMedium').value,
    fileUrl: document.getElementById('pdfUrl').value
  };

  try {
    const res = await fetch('/api/admin/pdfs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify(pdfData)
    });

    if (res.ok) {
      alert('PDF Resource published successfully!');
      e.target.reset();
      loadAdminStats();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to add PDF');
    }
  } catch (err) {
    alert('Error posting PDF');
  }
}

function handleContactSubmit(e) {
  e.preventDefault();
  alert('Thank you! Your message has been sent to EXAM PDF DOWNLOAD LK administrators.');
  e.target.reset();
}

function showPolicy(type) {
  alert(`${type.toUpperCase()} Policy: EXAM PDF DOWNLOAD LK complies with educational fair-use principles and DMCA guidelines.`);
}