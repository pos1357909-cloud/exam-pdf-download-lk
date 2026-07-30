// State Management
const state = {
  currentPage: 'home',
  pdfs: [],
  selectedGrade: null,
  selectedSubject: '',
  selectedCategory: '',
  searchQuery: '',
  adminToken: localStorage.getItem('adminToken') || null,
  isSuperAdmin: localStorage.getItem('isSuperAdmin') === 'true',
  bookmarks: JSON.parse(localStorage.getItem('pdf_bookmarks') || '[]'),
  monetagDirectLink: 'https://omg10.com/4/11459250',
  adminActiveTab: 'overview',
  adScriptsInjected: false,
  adsSettings: null,
  allowedAdminEmails: []
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
    // Dynamically inject enabled Monetag ad scripts & setup popunder trigger
    injectMonetagAdScripts(settings);
    setupPopunderTrigger(settings);
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
          <form onsubmit="handleAdminLogin(event)" class="space-y-4" autocomplete="off">
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Email Address</label>
              <input type="email" id="adminEmail" placeholder="Enter admin email" autocomplete="off" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-[#0F4C81] transition-colors">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Username</label>
              <input type="text" id="adminUser" placeholder="Enter username" autocomplete="off" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-[#0F4C81] transition-colors">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Password</label>
              <input type="password" id="adminPass" placeholder="Enter password" autocomplete="new-password" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-[#0F4C81] transition-colors">
            </div>
            <button type="submit" class="w-full py-3.5 rounded-xl bg-[#0F4C81] text-white font-bold text-sm shadow-lg hover:bg-[#0b3a63] transition-colors">Login to Dashboard</button>
          </form>
        </div>
      </div>
    `;
    return;
  }

  const tabClass = (t) => t === state.adminActiveTab
    ? 'flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all bg-white dark:bg-slate-900 text-[#0F4C81] dark:text-blue-400 shadow-sm'
    : 'flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';

  const initContent = state.adminActiveTab === 'ads'
    ? renderAdsTab()
    : state.adminActiveTab === 'upload'
    ? renderUploadTab()
    : state.adminActiveTab === 'access' && state.isSuperAdmin
    ? renderAccessTab()
    : renderOverviewTab();

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black">Admin Dashboard</h1>
          <p class="text-xs text-slate-400 mt-1">Logged in as <strong class="text-slate-600 dark:text-slate-300">Admin</strong> ${state.isSuperAdmin ? '<span class="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] uppercase font-black tracking-wider border border-amber-200 dark:border-amber-800/50">Super Admin</span>' : ''}</p>
        </div>
        <button onclick="adminLogout()" class="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <i class="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      </div>

      <div class="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl overflow-x-auto hide-scrollbar">
        <button id="adminTabBtn-overview" onclick="switchAdminTab('overview')" class="${tabClass('overview')} whitespace-nowrap">
          <i class="fa-solid fa-chart-line"></i><span class="hidden sm:inline">Overview</span>
        </button>
        <button id="adminTabBtn-upload" onclick="switchAdminTab('upload')" class="${tabClass('upload')} whitespace-nowrap">
          <i class="fa-solid fa-file-circle-plus"></i><span class="hidden sm:inline">Upload PDF</span>
        </button>
        <button id="adminTabBtn-ads" onclick="switchAdminTab('ads')" class="${tabClass('ads')} whitespace-nowrap">
          <i class="fa-solid fa-rectangle-ad"></i><span class="hidden sm:inline">Monetag Ads</span>
        </button>
        ${state.isSuperAdmin ? `
        <button id="adminTabBtn-access" onclick="switchAdminTab('access')" class="${tabClass('access')} whitespace-nowrap">
          <i class="fa-solid fa-users-gear text-amber-500"></i><span class="hidden sm:inline">Access Control</span>
        </button>
        ` : ''}
      </div>

      <div id="adminTabContent">${initContent}</div>
    </div>
  `;

  if (state.adminActiveTab === 'overview') loadAdminStats();
  if (state.adminActiveTab === 'ads') loadAdsSettings();
  if (state.adminActiveTab === 'access' && state.isSuperAdmin) loadAccessSettings();
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
  const email = document.getElementById('adminEmail').value;
  const username = document.getElementById('adminUser').value;
  const password = document.getElementById('adminPass').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    const data = await res.json();

    if (res.ok) {
      state.adminToken = data.token;
      state.isSuperAdmin = data.isSuperAdmin === true;
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('isSuperAdmin', state.isSuperAdmin ? 'true' : 'false');
      renderAdminPage(document.getElementById('appContent'));
    } else {
      if (data.kickout) {
        // Kick out of the website completely
        alert('Access Denied. You are being redirected out of the website.');
        window.location.href = 'https://www.google.com';
      } else {
        alert(data.error || 'Login failed');
      }
    }
  } catch (err) {
    alert('Login error');
  }
}

function adminLogout() {
  state.adminToken = null;
  state.isSuperAdmin = false;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('isSuperAdmin');
  state.adminActiveTab = 'overview';
  renderAdminPage(document.getElementById('appContent'));
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

// ================================================================
// ADMIN PANEL – TAB SYSTEM
// ================================================================

function switchAdminTab(tab) {
  if (tab === 'access' && !state.isSuperAdmin) return;
  state.adminActiveTab = tab;
  const active = 'flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all bg-white dark:bg-slate-900 text-[#0F4C81] dark:text-blue-400 shadow-sm whitespace-nowrap';
  const inactive = 'flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap';
  ['overview','upload','ads','access'].forEach(t => {
    const btn = document.getElementById('adminTabBtn-' + t);
    if (btn) btn.className = (t === tab ? active : inactive);
  });
  const content = document.getElementById('adminTabContent');
  if (!content) return;
  if (tab === 'overview') { content.innerHTML = renderOverviewTab(); loadAdminStats(); }
  else if (tab === 'upload') { content.innerHTML = renderUploadTab(); }
  else if (tab === 'ads') { content.innerHTML = renderAdsTab(); loadAdsSettings(); }
  else if (tab === 'access') { content.innerHTML = renderAccessTab(); loadAccessSettings(); }
}

function renderOverviewTab() {
  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="adminStats">
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-2"><i class="fa-solid fa-file-pdf text-[#1E88E5]"></i> Total PDFs</span>
          <span class="text-3xl font-black text-[#1E88E5]" id="statTotalPdfs">--</span>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-2"><i class="fa-solid fa-download text-emerald-500"></i> Downloads</span>
          <span class="text-3xl font-black text-emerald-500" id="statDownloads">--</span>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-2"><i class="fa-regular fa-eye text-amber-500"></i> Views</span>
          <span class="text-3xl font-black text-amber-500" id="statViews">--</span>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <span class="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-2"><i class="fa-solid fa-link text-purple-500"></i> Monetag Direct</span>
          <span class="text-xs font-bold text-emerald-500 block truncate mt-2">${state.monetagDirectLink}</span>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="glass-card p-6 rounded-2xl">
          <h3 class="font-bold mb-4 text-sm flex items-center gap-2"><i class="fa-solid fa-bolt text-amber-500"></i> Quick Actions</h3>
          <div class="space-y-3">
            <button onclick="switchAdminTab('upload')" class="w-full py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400 hover:bg-blue-100 font-semibold text-sm transition-all flex items-center gap-2">
              <i class="fa-solid fa-file-circle-plus"></i> Upload New PDF Resource
            </button>
            <button onclick="switchAdminTab('ads')" class="w-full py-2.5 px-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 font-semibold text-sm transition-all flex items-center gap-2">
              <i class="fa-solid fa-rectangle-ad"></i> Manage Monetag Ads
            </button>
          </div>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <h3 class="font-bold mb-4 text-sm flex items-center gap-2"><i class="fa-solid fa-circle-info text-blue-500"></i> System Info</h3>
          <div class="space-y-2.5">
            <div class="flex justify-between text-xs"><span class="text-slate-400">Platform</span><span class="font-bold">Node.js + MongoDB</span></div>
            <div class="flex justify-between text-xs"><span class="text-slate-400">Status</span><span class="font-bold text-emerald-500 flex items-center gap-1"><i class="fa-solid fa-circle text-[8px]"></i> Live</span></div>
            <div class="flex justify-between text-xs"><span class="text-slate-400">Admin User</span><span class="font-bold">ZTX</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUploadTab() {
  return `
    <div class="glass-card p-8 rounded-3xl space-y-6">
      <h2 class="text-xl font-bold flex items-center gap-2"><i class="fa-solid fa-file-circle-plus text-blue-500"></i> Upload / Add New Resource</h2>
      <form onsubmit="handleAddPdf(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="col-span-full">
          <label class="block text-xs font-bold uppercase mb-1">Paper / Book Title</label>
          <input type="text" id="pdfTitle" placeholder="e.g. Grade 11 Mathematics Paper 1" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-bold uppercase mb-1">Grade</label>
          <select id="pdfGrade" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
            ${GRADES.map(g => `<option value="${g}">Grade ${g}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase mb-1">Subject</label>
          <select id="pdfSubject" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
            ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase mb-1">Category</label>
          <select id="pdfCategory" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase mb-1">Medium</label>
          <select id="pdfMedium" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
            <option value="Sinhala">Sinhala</option>
            <option value="English">English</option>
            <option value="Tamil">Tamil</option>
          </select>
        </div>
        <div class="col-span-full">
          <label class="block text-xs font-bold uppercase mb-1">PDF Direct Download URL</label>
          <input type="url" id="pdfUrl" placeholder="https://example.com/file.pdf" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-blue-500">
        </div>
        <button type="submit" class="col-span-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2">
          <i class="fa-solid fa-floppy-disk"></i> Save PDF Resource
        </button>
      </form>
    </div>
  `;
}

function renderAdsTab() {
  return `
    <div id="adsTabContent" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <i class="fa-solid fa-spinner animate-spin text-4xl text-[#1E88E5]"></i>
        <p class="text-sm text-slate-400 font-semibold">Loading Monetag Ads Settings...</p>
      </div>
    </div>
  `;
}

async function loadAdsSettings() {
  const container = document.getElementById('adsTabContent');
  if (!container) return;
  try {
    const res = await fetch('/api/admin/ads', { headers: { 'Authorization': 'Bearer ' + state.adminToken } });
    if (!res.ok) throw new Error('Unauthorized');
    const settings = await res.json();
    state.adsSettings = settings;
    container.innerHTML = renderAdsContent(settings);
  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-16">
        <i class="fa-solid fa-circle-exclamation text-red-500 text-4xl mb-3 block"></i>
        <p class="text-red-500 font-bold">Failed to load ad settings.</p>
        <button onclick="loadAdsSettings()" class="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition-all">Retry</button>
      </div>`;
  }
}

// ================================================================
// MONETAG ADS CONTENT RENDERERS
// ================================================================

function renderAdsContent(settings) {
  const directLinks = settings.directLinks || [];
  const activityLog = settings.adActivityLog || [];
  const formats = [
    { id: 'pushNotif',   label: 'Push Notifications',      icon: 'fa-bell',            color: 'blue',   desc: 'Subscribers receive push notifications even when off-site.' },
    { id: 'inPagePush', label: 'In-Page Push Ads',         icon: 'fa-bullhorn',        color: 'purple', desc: 'Banner-style push ads displayed directly inside your pages.' },
    { id: 'vignette',   label: 'Vignette Banner Ads',      icon: 'fa-film',            color: 'amber',  desc: 'Full-screen interstitial ads shown between page views.' },
    { id: 'onClick',    label: 'OnClick / Popunder Ads',   icon: 'fa-computer-mouse',  color: 'emerald',desc: 'Opens a new tab behind the browser on any user click.' },
    { id: 'multitag',   label: 'Multitag (All-in-One)',    icon: 'fa-layer-group',     color: 'rose',   desc: 'Smart format that auto-selects the best performing ad type.' }
  ];
  const activeCount   = formats.filter(f => settings[f.id + 'Enabled']).length;
  const disabledCount = formats.length - activeCount;
  const lastUpdated   = settings.adLastUpdated
    ? new Date(settings.adLastUpdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Never';

  return `
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black flex items-center gap-2"><i class="fa-solid fa-rectangle-ad text-[#1E88E5]"></i> Monetag Ads Management</h2>
          <p class="text-xs text-slate-400 mt-1">Control every Monetag ad format, direct links and advanced rules from one place.</p>
        </div>
        <div class="flex gap-2">
          <button onclick="backupAdSettings()" class="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 font-bold text-xs transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-cloud-arrow-up"></i> Backup
          </button>
          <button onclick="restoreAdSettings()" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-rotate-left"></i> Restore
          </button>
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="glass-card p-4 rounded-2xl text-center">
          <div class="text-2xl font-black text-emerald-500">${activeCount}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Formats</div>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center">
          <div class="text-2xl font-black text-red-400">${disabledCount}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Disabled</div>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center">
          <div class="text-2xl font-black text-[#1E88E5]">${directLinks.length}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Direct Links</div>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center">
          <div class="text-sm font-black text-slate-700 dark:text-slate-200">${lastUpdated}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Last Updated</div>
        </div>
        <div class="glass-card p-4 rounded-2xl text-center">
          <div class="text-sm font-black ${activeCount > 0 ? 'text-emerald-500' : 'text-slate-400'}">${activeCount > 0 ? '\u25cf LIVE' : '\u25cb IDLE'}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Status</div>
        </div>
      </div>

      <!-- Ad Format Cards -->
      <div class="space-y-4">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><i class="fa-solid fa-puzzle-piece"></i> Ad Format Management</p>
        ${formats.map(f => renderAdFormatCard(f, settings)).join('')}
      </div>

      <!-- Direct Links -->
      ${renderDirectLinksSection(directLinks)}

      <!-- Advanced Settings -->
      ${renderAdvancedSettings(settings)}

      <!-- Backup & Restore Card -->
      <div class="glass-card p-6 rounded-2xl space-y-4">
        <h3 class="font-bold flex items-center gap-2 text-sm"><i class="fa-solid fa-box-archive text-amber-500"></i> Backup & Restore</h3>
        <p class="text-xs text-slate-500">Create a full snapshot of all ad settings. Restore at any time to undo changes.</p>
        <div class="flex flex-wrap gap-3">
          <button onclick="backupAdSettings()" class="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all flex items-center gap-2">
            <i class="fa-solid fa-cloud-arrow-up"></i> Save Backup Now
          </button>
          <button onclick="restoreAdSettings()" class="py-2.5 px-5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold text-xs transition-all flex items-center gap-2">
            <i class="fa-solid fa-rotate-left"></i> Restore Last Backup
          </button>
          <button onclick="exportAdSettings()" class="py-2.5 px-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold text-xs transition-all flex items-center gap-2">
            <i class="fa-solid fa-file-export"></i> Export JSON
          </button>
        </div>
        ${settings.adSettingsBackup
          ? '<p class="text-xs text-emerald-500 flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> A backup snapshot exists in the database.</p>'
          : '<p class="text-xs text-slate-400">No backup saved yet.</p>'}
      </div>

      <!-- Activity Log -->
      <div class="glass-card p-6 rounded-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold flex items-center gap-2 text-sm"><i class="fa-solid fa-clock-rotate-left text-slate-500"></i> Activity Log <span class="ml-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">${activityLog.length}</span></h3>
          <button onclick="clearAdActivityLog()" class="text-xs text-red-400 hover:text-red-600 font-bold transition-colors flex items-center gap-1">
            <i class="fa-solid fa-trash-can"></i> Clear
          </button>
        </div>
        ${activityLog.length === 0
          ? '<p class="text-xs text-slate-400 text-center py-6">No activity recorded yet.</p>'
          : `<div class="space-y-2 max-h-72 overflow-y-auto pr-1">
              ${activityLog.map(log => `
                <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <i class="fa-solid fa-circle-dot text-[#1E88E5] mt-0.5 flex-shrink-0 text-[10px]"></i>
                  <div class="flex-grow min-w-0">
                    <div class="font-bold text-slate-700 dark:text-slate-300">${log.action || 'Action'}</div>
                    <div class="text-slate-400 mt-0.5 truncate">${log.details || ''}</div>
                  </div>
                  <div class="text-slate-400 flex-shrink-0 text-right text-[10px]">
                    <div class="font-semibold">${log.user || 'Admin'}</div>
                    <div>${log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : ''}</div>
                  </div>
                </div>
              `).join('')}
            </div>`}
      </div>
    </div>
  `;
}

function renderAdFormatCard(format, settings) {
  const isEnabled = !!settings[format.id + 'Enabled'];
  const code      = settings[format.id + 'Code'] || '';
  const cmap = {
    blue:   { icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       border: 'border-blue-200/60 dark:border-blue-800/40' },
    purple: { icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', border: 'border-purple-200/60 dark:border-purple-800/40' },
    amber:  { icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',     border: 'border-amber-200/60 dark:border-amber-800/40' },
    emerald:{ icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-800/40' },
    rose:   { icon: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',         border: 'border-rose-200/60 dark:border-rose-800/40' }
  };
  const c = cmap[format.color] || cmap.blue;
  // Safely escape for textarea content
  const safeCode = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `
    <div class="glass-card rounded-2xl border ${c.border} overflow-hidden" id="adCard-${format.id}">
      <div class="p-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0">
            <i class="fa-solid ${format.icon}"></i>
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-sm">${format.label}</h4>
            <p class="text-[11px] text-slate-400 line-clamp-1">${format.desc}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span id="adBadge-${format.id}" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">
            ${isEnabled ? '\u25cf Active' : '\u25cb Off'}
          </span>
          <label class="relative inline-flex items-center cursor-pointer" title="Enable / Disable">
            <input type="checkbox" class="sr-only peer" ${isEnabled ? 'checked' : ''} onchange="toggleAdFormat('${format.id}', this.checked)">
            <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>
      <div class="px-5 pb-5 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ad Script Code</label>
        <textarea id="adCode-${format.id}" rows="3"
          placeholder="Paste your Monetag ${format.label} script here...&#10;e.g. &lt;script src=&quot;https://...&quot; async&gt;&lt;/script&gt;"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-mono focus:outline-none focus:border-blue-500 resize-y transition-colors">${safeCode}</textarea>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="validateAdCode('${format.id}')" class="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-shield-check text-blue-500"></i> Validate
          </button>
          <button onclick="saveAdFormat('${format.id}')" class="py-2 px-4 rounded-xl bg-[#0F4C81] hover:bg-[#0b3a63] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
            <i class="fa-solid fa-floppy-disk"></i> Save
          </button>
          <button onclick="previewAdCode('${format.id}')" class="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-eye text-slate-500"></i> Preview
          </button>
          <span id="adStatus-${format.id}" class="text-xs font-semibold ml-auto"></span>
        </div>
        <div id="adPreview-${format.id}" class="hidden">
          <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <p class="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-1"><i class="fa-solid fa-code"></i> Code Preview</p>
            <pre id="adPreviewContent-${format.id}" class="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all"></pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDirectLinksSection(directLinks) {
  return `
    <div class="glass-card p-6 rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-bold flex items-center gap-2 text-sm"><i class="fa-solid fa-link text-[#1E88E5]"></i> Direct Link Ads</h3>
        <button onclick="showAddDirectLinkForm()" class="py-2 px-4 rounded-xl bg-[#0F4C81] hover:bg-[#0b3a63] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
          <i class="fa-solid fa-plus"></i> Add Link
        </button>
      </div>
      <p class="text-xs text-slate-500">Assign Monetag Direct Links to download buttons and custom elements across the site.</p>

      <div id="addDirectLinkForm" class="hidden p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600 space-y-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Direct Link</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500">Label</label>
            <input type="text" id="dlLabel" placeholder="e.g. Download Button" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500">Direct Link URL <span class="text-red-400">*</span></label>
            <input type="url" id="dlUrl" placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500">Assign To</label>
            <select id="dlTarget" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-500">
              <option value="download">Download Buttons</option>
              <option value="pdfDownload">PDF Download Buttons</option>
              <option value="externalDownload">External Download Buttons</option>
              <option value="custom">Custom Buttons</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button onclick="saveDirectLink()" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"><i class="fa-solid fa-check mr-1"></i>Save</button>
            <button onclick="hideAddDirectLinkForm()" class="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold transition-all">Cancel</button>
          </div>
        </div>
      </div>

      <div id="directLinksList">
        ${directLinks.length === 0
          ? '<p class="text-xs text-slate-400 text-center py-6 flex flex-col items-center gap-2"><i class="fa-solid fa-link-slash text-2xl text-slate-300"></i>No direct links yet. Click \"Add Link\" to create one.</p>'
          : `<div class="space-y-2">${directLinks.map((link, idx) => `
              <div class="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700" id="dlRow-${link.id || idx}">
                <div class="flex-grow min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold">${link.label || 'Unnamed'}</span>
                    <span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">${link.target || 'custom'}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${link.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}">${link.enabled !== false ? '\u25cf Active' : '\u25cb Off'}</span>
                  </div>
                  <p class="text-[10px] text-slate-400 truncate mt-0.5">${link.url || ''}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${link.enabled !== false ? 'checked' : ''} onchange="toggleDirectLink('${link.id || idx}', this.checked)">
                    <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <button onclick="deleteDirectLink('${link.id || idx}')" class="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center text-xs">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>`).join('')}</div>`}
      </div>
    </div>
  `;
}

function renderAdvancedSettings(settings) {
  const pages   = ['home','grades','subjects','bookmarks','blog','contact'];
  const selPages = settings.selectedPages || [];
  const toggles = [
    { key: 'autoInsertAds', icon: 'fa-wand-magic-sparkles', label: 'Auto Insert Ads',       desc: 'Inject enabled scripts on every page automatically' },
    { key: 'mobileOnly',    icon: 'fa-mobile-screen',       label: 'Mobile Devices Only',   desc: 'Show ads only on mobile browsers' },
    { key: 'desktopOnly',   icon: 'fa-desktop',             label: 'Desktop Devices Only',  desc: 'Show ads only on desktop browsers' },
    { key: 'excludeAdmin',  icon: 'fa-shield-halved',       label: 'Exclude Admin Panel',   desc: 'Prevent ads loading on admin pages' }
  ];
  return `
    <div class="glass-card p-6 rounded-2xl space-y-5">
      <h3 class="font-bold flex items-center gap-2 text-sm"><i class="fa-solid fa-sliders text-purple-500"></i> Advanced Ad Settings</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${toggles.map(opt => `
          <div class="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div class="flex items-start gap-2 min-w-0">
              <i class="fa-solid ${opt.icon} text-slate-400 mt-0.5 text-sm flex-shrink-0"></i>
              <div class="min-w-0">
                <p class="text-xs font-bold leading-tight">${opt.label}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">${opt.desc}</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" id="adv-${opt.key}" class="sr-only peer" ${settings[opt.key] ? 'checked' : ''}>
              <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F4C81]"></div>
            </label>
          </div>`).join('')}

        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
          <label class="block text-xs font-bold mb-1 flex items-center gap-1.5"><i class="fa-regular fa-clock text-slate-400"></i> Loading Delay</label>
          <p class="text-[10px] text-slate-400 mb-2">Seconds before injecting scripts. 0 = instant.</p>
          <div class="flex items-center gap-2">
            <input type="number" id="adv-adLoadingDelay" min="0" max="30" value="${settings.adLoadingDelay || 0}" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-center font-bold focus:outline-none focus:border-blue-500">
            <span class="text-xs text-slate-400 font-semibold">sec</span>
          </div>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
          <label class="block text-xs font-bold mb-1 flex items-center gap-1.5"><i class="fa-solid fa-gauge text-slate-400"></i> Frequency Control</label>
          <p class="text-[10px] text-slate-400 mb-2">Min hours between same ad. 0 = always show.</p>
          <div class="flex items-center gap-2">
            <input type="number" id="adv-frequencyControl" min="0" max="72" value="${settings.frequencyControl || 0}" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-center font-bold focus:outline-none focus:border-blue-500">
            <span class="text-xs text-slate-400 font-semibold">hrs</span>
          </div>
        </div>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
        <p class="text-xs font-bold mb-1 flex items-center gap-1.5"><i class="fa-solid fa-filter text-slate-400"></i> Display on Selected Pages Only</p>
        <p class="text-[10px] text-slate-400 mb-3">Leave all unchecked to display on all pages.</p>
        <div class="flex flex-wrap gap-2">
          ${pages.map(page => `
            <label class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors text-xs font-semibold">
              <input type="checkbox" name="selectedPages" value="${page}" ${selPages.includes(page) ? 'checked' : ''} class="w-3.5 h-3.5 rounded accent-[#0F4C81]">
              ${page.charAt(0).toUpperCase() + page.slice(1)}
            </label>`).join('')}
        </div>
      </div>

      <button onclick="saveAdvancedSettings()" class="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2">
        <i class="fa-solid fa-floppy-disk"></i> Save Advanced Settings
      </button>
    </div>
  `;
}

// ================================================================
// AD MANAGEMENT ACTIONS
// ================================================================

function validateAdCode(formatId) {
  const textarea = document.getElementById('adCode-' + formatId);
  const statusEl = document.getElementById('adStatus-' + formatId);
  if (!textarea || !statusEl) return false;
  const code = textarea.value.trim();
  if (!code) { statusEl.innerHTML = '<span class="text-slate-400">No code entered.</span>'; return false; }
  const hasTag = /<script[\s>]/i.test(code);
  const hasSrc = /src=["']https?:\/\/[^"']+["']/i.test(code);
  if (hasTag && hasSrc) {
    statusEl.innerHTML = '<span class="text-emerald-500"><i class="fa-solid fa-circle-check mr-1"></i>Valid script tag detected.</span>';
    return true;
  }
  if (hasTag) {
    statusEl.innerHTML = '<span class="text-amber-500"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Script tag found but no valid src URL. Double-check.</span>';
    return false;
  }
  statusEl.innerHTML = '<span class="text-red-500"><i class="fa-solid fa-circle-xmark mr-1"></i>No &lt;script&gt; tag found. Paste the full Monetag script.</span>';
  return false;
}

async function saveAdFormat(formatId) {
  const codeEl   = document.getElementById('adCode-' + formatId);
  const statusEl = document.getElementById('adStatus-' + formatId);
  const toggleEl = document.querySelector('#adCard-' + formatId + ' input[type="checkbox"]');
  if (!codeEl || !statusEl) return;
  const code    = codeEl.value.trim();
  const enabled = toggleEl ? toggleEl.checked : false;
  statusEl.innerHTML = '<span class="text-[#1E88E5]"><i class="fa-solid fa-spinner animate-spin mr-1"></i>Saving...</span>';
  try {
    const body = {};
    body[formatId + 'Code']    = code;
    body[formatId + 'Enabled'] = enabled;
    body._logAction  = formatId + ' Ad Code Updated';
    body._logDetails = 'Code saved – status: ' + (enabled ? 'enabled' : 'disabled');
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      state.adsSettings = await res.json();
      statusEl.innerHTML = '<span class="text-emerald-500"><i class="fa-solid fa-circle-check mr-1"></i>Saved!</span>';
      setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 3000);
    } else {
      const err = await res.json();
      statusEl.innerHTML = '<span class="text-red-500"><i class="fa-solid fa-circle-xmark mr-1"></i>' + (err.error || 'Save failed') + '</span>';
    }
  } catch (err) {
    statusEl.innerHTML = '<span class="text-red-500"><i class="fa-solid fa-circle-xmark mr-1"></i>Network error.</span>';
  }
}

async function toggleAdFormat(formatId, enabled) {
  const badgeEl = document.getElementById('adBadge-' + formatId);
  try {
    const body = {};
    body[formatId + 'Enabled'] = enabled;
    body._logAction  = formatId + ' Ad ' + (enabled ? 'Enabled' : 'Disabled');
    body._logDetails = 'Toggled via admin panel toggle switch';
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      state.adsSettings = await res.json();
      if (badgeEl) {
        badgeEl.className = 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ' +
          (enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400');
        badgeEl.textContent = enabled ? '\u25cf Active' : '\u25cb Off';
      }
      showToast((enabled ? 'Enabled' : 'Disabled') + ': ' + formatId + ' ads', enabled ? 'success' : 'info');
    }
  } catch (err) { showToast('Toggle failed', 'error'); }
}

function previewAdCode(formatId) {
  const textarea      = document.getElementById('adCode-' + formatId);
  const previewEl     = document.getElementById('adPreview-' + formatId);
  const previewContent = document.getElementById('adPreviewContent-' + formatId);
  if (!textarea || !previewEl || !previewContent) return;
  if (previewEl.classList.contains('hidden')) {
    previewContent.textContent = textarea.value || '(empty)';
    previewEl.classList.remove('hidden');
  } else {
    previewEl.classList.add('hidden');
  }
}

function showAddDirectLinkForm()  { document.getElementById('addDirectLinkForm')?.classList.remove('hidden'); }
function hideAddDirectLinkForm() {
  document.getElementById('addDirectLinkForm')?.classList.add('hidden');
  const lbl = document.getElementById('dlLabel'); if (lbl) lbl.value = '';
  const url = document.getElementById('dlUrl');   if (url) url.value = '';
}

async function saveDirectLink() {
  const urlEl    = document.getElementById('dlUrl');
  const labelEl  = document.getElementById('dlLabel');
  const targetEl = document.getElementById('dlTarget');
  const url = urlEl?.value.trim();
  if (!url) { showToast('Please enter a Direct Link URL', 'error'); return; }
  const newLink = { id: 'dl_' + Date.now(), label: labelEl?.value.trim() || 'Direct Link', url, target: targetEl?.value || 'custom', enabled: true };
  const updatedLinks = [...(state.adsSettings?.directLinks || []), newLink];
  try {
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({ directLinks: updatedLinks, _logAction: 'Direct Link Added', _logDetails: 'Added: ' + newLink.label + ' -> ' + newLink.url })
    });
    if (res.ok) {
      const data = await res.json(); state.adsSettings = data;
      hideAddDirectLinkForm();
      const dlList = document.getElementById('directLinksList');
      if (dlList) { const tmp = document.createElement('div'); tmp.innerHTML = renderDirectLinksSection(data.directLinks || []); const nl = tmp.querySelector('#directLinksList'); if (nl) dlList.innerHTML = nl.innerHTML; }
      showToast('Direct link saved!', 'success');
    }
  } catch (err) { showToast('Failed to save link', 'error'); }
}

async function deleteDirectLink(linkId) {
  if (!confirm('Delete this direct link?')) return;
  const updatedLinks = (state.adsSettings?.directLinks || []).filter(l => String(l.id) !== String(linkId));
  try {
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({ directLinks: updatedLinks, _logAction: 'Direct Link Deleted', _logDetails: 'ID: ' + linkId })
    });
    if (res.ok) {
      state.adsSettings = await res.json();
      const row = document.getElementById('dlRow-' + linkId); if (row) row.remove();
      showToast('Direct link deleted', 'info');
    }
  } catch (err) { showToast('Delete failed', 'error'); }
}

async function toggleDirectLink(linkId, enabled) {
  const updatedLinks = (state.adsSettings?.directLinks || []).map(l =>
    String(l.id) === String(linkId) ? Object.assign({}, l, { enabled }) : l
  );
  try {
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({ directLinks: updatedLinks, _logAction: 'Direct Link Toggled', _logDetails: 'ID: ' + linkId + ', enabled: ' + enabled })
    });
    if (res.ok) { state.adsSettings = await res.json(); }
  } catch (err) { console.error(err); }
}

async function saveAdvancedSettings() {
  const g = (id) => document.getElementById(id);
  const autoInsertAds    = g('adv-autoInsertAds')?.checked    ?? true;
  const mobileOnly       = g('adv-mobileOnly')?.checked       ?? false;
  const desktopOnly      = g('adv-desktopOnly')?.checked      ?? false;
  const excludeAdmin     = g('adv-excludeAdmin')?.checked     ?? true;
  const adLoadingDelay   = parseInt(g('adv-adLoadingDelay')?.value)   || 0;
  const frequencyControl = parseInt(g('adv-frequencyControl')?.value) || 0;
  const selectedPages    = [...document.querySelectorAll('input[name="selectedPages"]:checked')].map(el => el.value);
  try {
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({
        autoInsertAds, mobileOnly, desktopOnly, excludeAdmin,
        adLoadingDelay, frequencyControl, selectedPages,
        _logAction: 'Advanced Settings Saved',
        _logDetails: 'AutoInsert:' + autoInsertAds + ' Delay:' + adLoadingDelay + 's Mobile:' + mobileOnly + ' Desktop:' + desktopOnly
      })
    });
    if (res.ok) { state.adsSettings = await res.json(); showToast('Advanced settings saved!', 'success'); }
    else { showToast('Failed to save settings', 'error'); }
  } catch (err) { showToast('Network error', 'error'); }
}

async function backupAdSettings() {
  try {
    const res = await fetch('/api/admin/ads/backup', { method: 'POST', headers: { 'Authorization': 'Bearer ' + state.adminToken } });
    if (res.ok) { showToast('Settings backed up successfully!', 'success'); loadAdsSettings(); }
    else { showToast('Backup failed', 'error'); }
  } catch (err) { showToast('Network error during backup', 'error'); }
}

async function restoreAdSettings() {
  if (!confirm('Restore settings from last backup? Current settings will be overwritten.')) return;
  try {
    const res = await fetch('/api/admin/ads/restore', { method: 'POST', headers: { 'Authorization': 'Bearer ' + state.adminToken } });
    if (res.ok) { showToast('Settings restored from backup!', 'success'); loadAdsSettings(); }
    else { const err = await res.json(); showToast(err.error || 'Restore failed', 'error'); }
  } catch (err) { showToast('Network error during restore', 'error'); }
}

function exportAdSettings() {
  if (!state.adsSettings) { showToast('No settings loaded yet', 'error'); return; }
  const blob = new Blob([JSON.stringify(state.adsSettings, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'monetag-ads-' + new Date().toISOString().slice(0,10) + '.json'; a.click();
  URL.revokeObjectURL(url);
}

async function clearAdActivityLog() {
  if (!confirm('Clear all activity log entries?')) return;
  try {
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({ adActivityLog: [], _logAction: 'Activity Log Cleared', _logDetails: 'All entries removed by admin' })
    });
    if (res.ok) { showToast('Activity log cleared', 'info'); loadAdsSettings(); }
  } catch (err) { showToast('Failed to clear log', 'error'); }
}

// ================================================================
// TOAST NOTIFICATION
// ================================================================

function showToast(message, type) {
  type = type || 'info';
  const existing = document.getElementById('adminToast'); if (existing) existing.remove();
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-[#1E88E5]', warning: 'bg-amber-500' };
  const icons  = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const toast  = document.createElement('div');
  toast.id = 'adminToast';
  toast.className = 'fixed bottom-6 right-6 z-[9999] ' + (colors[type] || colors.info) + ' text-white px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-3';
  toast.style.cssText = 'animation: slideIn 0.3s ease; max-width:380px;';
  toast.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.info) + '"></i><span class="flex-grow">' + message + '</span><button onclick="this.parentElement.remove()" class="opacity-70 hover:opacity-100 ml-1 flex-shrink-0"><i class="fa-solid fa-xmark"></i></button>';
  document.body.appendChild(toast);
  setTimeout(() => { if (toast && toast.parentElement) toast.remove(); }, 4500);
}

// ================================================================
// ACCESS CONTROL MANAGER
// ================================================================

function renderAccessTab() {
  return `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="glass-card p-8 rounded-3xl space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 class="text-xl font-black flex items-center gap-2 text-amber-500"><i class="fa-solid fa-shield-halved"></i> Super Admin Access Control</h2>
          <p class="text-xs text-slate-400 mt-1">Create unique admin accounts. Sub-admins cannot change their own credentials or view this page.</p>
        </div>
        
        <form onsubmit="addAllowedEmail(event)" class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Create New Admin Account</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Email Address</label>
              <input type="email" id="newAdminEmail" placeholder="colleague@example.com" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-amber-500 transition-colors">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Username</label>
              <input type="text" id="newAdminUser" placeholder="e.g. KAMAL" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-amber-500 transition-colors">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase mb-1.5 text-slate-500">Password</label>
              <input type="password" id="newAdminPass" placeholder="e.g. Kam@123x" required class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-amber-500 transition-colors">
            </div>
          </div>
          <div class="flex justify-end pt-2">
            <button type="submit" class="py-3 px-8 rounded-xl bg-amber-500 text-white font-bold text-sm shadow-lg hover:bg-amber-600 transition-colors flex items-center gap-2">
              <i class="fa-solid fa-user-plus"></i> Create Account
            </button>
          </div>
        </form>

        <div class="mt-8">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Currently Active Admins</h3>
          <div id="allowedEmailsList" class="space-y-2">
            <div class="p-6 text-center text-slate-400 text-sm"><i class="fa-solid fa-spinner animate-spin"></i> Loading...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadAccessSettings() {
  try {
    const res = await fetch('/api/admin/access', { headers: { 'Authorization': 'Bearer ' + state.adminToken } });
    if (!res.ok) throw new Error('Unauthorized');
    const data = await res.json();
    state.admins = data.admins || [];
    renderAllowedEmailsList();
  } catch (err) {
    showToast('Failed to load access list', 'error');
  }
}

function renderAllowedEmailsList() {
  const container = document.getElementById('allowedEmailsList');
  if (!container) return;

  const superAdmins = state.admins.filter(a => a.isSuperAdmin);
  const subAdmins = state.admins.filter(a => !a.isSuperAdmin);

  const mainAdminHtml = superAdmins.map(admin => `
    <div class="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center text-lg"><i class="fa-solid fa-crown"></i></div>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-200">${admin.email} <span class="text-slate-400 font-normal">(@${admin.username})</span></p>
          <p class="text-[10px] text-amber-600 dark:text-amber-500 font-semibold uppercase tracking-wider">Super Admin (Unalterable)</p>
        </div>
      </div>
      <div class="text-amber-500"><i class="fa-solid fa-lock"></i></div>
    </div>
  `).join('');

  if (subAdmins.length === 0) {
    container.innerHTML = mainAdminHtml + `<p class="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl mt-4">No additional admin accounts created yet.</p>`;
    return;
  }

  const listHtml = subAdmins.map(admin => `
    <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mt-2 transition-all hover:border-slate-300 dark:hover:border-slate-600">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><i class="fa-regular fa-user"></i></div>
        <div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">${admin.email}</p>
          <p class="text-[10px] text-slate-500 font-bold tracking-wider">Username: @${admin.username}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="editSubAdmin('${admin.email}', '${admin.username}')" class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors flex items-center justify-center" title="Edit Username/Password">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="removeAllowedEmail('${admin.email}')" class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center" title="Revoke Access">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = mainAdminHtml + '<div class="mt-4">' + listHtml + '</div>';
}

async function editSubAdmin(email, currentUsername) {
  const newUsername = prompt(`Update Username for ${email}:`, currentUsername);
  if (newUsername === null) return; // Cancelled
  const newPassword = prompt(`Enter new Password for ${email} (Leave blank to keep unchanged):`);
  if (newPassword === null) return; // Cancelled

  if (!newUsername.trim() && !newPassword.trim()) {
    showToast('No changes made', 'info');
    return;
  }

  try {
    const res = await fetch('/api/admin/access/' + encodeURIComponent(email), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({ username: newUsername.trim(), password: newPassword.trim() })
    });

    if (res.ok) {
      await loadAccessSettings();
      showToast('Credentials updated for ' + email, 'success');
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to update credentials', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function addAllowedEmail(e) {
  e.preventDefault();
  const email = document.getElementById('newAdminEmail').value.trim().toLowerCase();
  const username = document.getElementById('newAdminUser').value.trim();
  const password = document.getElementById('newAdminPass').value.trim();
  
  if (!email || !username || !password) {
    showToast('All fields are required', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.adminToken },
      body: JSON.stringify({ email, username, password })
    });
    
    if (res.ok) {
      document.getElementById('newAdminEmail').value = '';
      document.getElementById('newAdminUser').value = '';
      document.getElementById('newAdminPass').value = '';
      await loadAccessSettings();
      showToast('Account created for ' + username, 'success');
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to create account', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function removeAllowedEmail(emailToRemove) {
  if (!confirm(`Are you sure you want to completely delete the Admin account for ${emailToRemove}?`)) return;
  
  try {
    const res = await fetch('/api/admin/access/' + encodeURIComponent(emailToRemove), {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + state.adminToken }
    });
    
    if (res.ok) {
      await loadAccessSettings();
      showToast('Account deleted', 'info');
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to delete account', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// ================================================================
// DYNAMIC AD SCRIPT INJECTION & POPUNDER TRIGGER
// ================================================================

function injectMonetagAdScripts(settings) {
  if (!settings || settings.autoInsertAds === false) return;
  // Do NOT run any ads on Admin Dashboard page or for logged in admins
  if (state.currentPage === 'admin') return;
  if (settings.excludeAdmin && state.adminToken) return;

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (settings.mobileOnly  && !isMobile) return;
  if (settings.desktopOnly &&  isMobile) return;

  const delay = (Number(settings.adLoadingDelay) || 0) * 1000;
  const doInject = function() {
    const formats = [
      { enabled: settings.pushNotifEnabled,  code: settings.pushNotifCode  },
      { enabled: settings.inPagePushEnabled, code: settings.inPagePushCode },
      { enabled: settings.vignetteEnabled,   code: settings.vignetteCode   },
      { enabled: settings.onClickEnabled,    code: settings.onClickCode    },
      { enabled: settings.multitagEnabled,   code: settings.multitagCode   }
    ];

    formats.forEach(function(f) {
      if (f.enabled && f.code && f.code.trim()) {
        executeAdSnippet(f.code);
      }
    });

    if (settings.customHeaderCode) executeAdSnippet(settings.customHeaderCode);
    if (settings.customFooterCode) executeAdSnippet(settings.customFooterCode);

    state.adScriptsInjected = true;
  };

  if (delay > 0) { setTimeout(doInject, delay); } else { doInject(); }
}

function executeAdSnippet(codeSnippet) {
  if (!codeSnippet || !codeSnippet.trim()) return;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = codeSnippet;
  const scripts = tempDiv.querySelectorAll('script');

  if (scripts.length > 0) {
    scripts.forEach(s => {
      const src = s.getAttribute('src');
      if (src) {
        if (document.querySelector('script[src="' + src + '"]')) return;
        const script = document.createElement('script');
        script.src = src;
        if (s.async || /\basync\b/.test(s.outerHTML)) script.async = true;
        if (s.defer) script.defer = true;
        Array.from(s.attributes).forEach(attr => {
          if (attr.name !== 'src') script.setAttribute(attr.name, attr.value);
        });
        script.setAttribute('data-monetag-injected', 'true');
        document.head.appendChild(script);
      } else if (s.textContent && s.textContent.trim()) {
        const script = document.createElement('script');
        script.text = s.textContent;
        script.setAttribute('data-monetag-injected', 'true');
        document.head.appendChild(script);
      }
    });
  } else {
    const urlMatch = codeSnippet.match(/https?:\/\/[^\s"'>]+/);
    if (urlMatch) {
      const src = urlMatch[0];
      if (document.querySelector('script[src="' + src + '"]')) return;
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-monetag-injected', 'true');
      document.head.appendChild(script);
    }
  }
}

function setupPopunderTrigger(settings) {
  if (!settings || !settings.onClickEnabled || !state.monetagDirectLink) return;
  
  const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

  const triggerPopunder = function(e) {
    // 1. Absolutely NO ads or popunders on Admin Dashboard page or for logged in admins
    if (state.currentPage === 'admin' || (settings.excludeAdmin && state.adminToken)) return;

    // 2. Do not trigger when interacting with inputs/forms
    if (e.target.closest('input, select, textarea, form, button[type="submit"]')) return;
    
    const now = Date.now();
    const lastAdTime = Number(sessionStorage.getItem('last_ad_trigger_time')) || 0;

    // 3. First click ever on site (lastAdTime === 0) OR 10 minutes elapsed since last ad
    if (lastAdTime === 0 || (now - lastAdTime) >= TEN_MINUTES_MS) {
      sessionStorage.setItem('last_ad_trigger_time', String(now));
      try {
        window.open(state.monetagDirectLink, '_blank');
      } catch(err) {}
    }
  };

  document.addEventListener('click', triggerPopunder, { capture: true });
}