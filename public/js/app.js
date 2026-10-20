/**
 * Government Hospital Vijayapura – Multilingual QR Code Navigation System
 * DTSI Project Prototype
 * Client Application Logic
 */

// Application State
let currentLang = localStorage.getItem('hospital_lang') || 'en';
let departmentsData = [];
let filteredDepartments = [];
let activeSymptom = null;
let activeFloorFilter = 'all';
let serverInfo = {
  status: 'online',
  isPubliclyDeployed: false,
  publicUrl: null,
  localUrl: window.location.origin,
  networkUrl: window.location.origin,
  allNetworkUrls: []
};

// DOM Elements Cache
const elements = {
  // Language & Headers
  langButtons: document.querySelectorAll('.lang-btn'),
  hospitalTitle: document.getElementById('hospitalTitle'),
  hospitalTagline: document.getElementById('hospitalTagline'),
  academicBadge: document.getElementById('academicBadge'),
  academicNoticeBanner: document.getElementById('academicNoticeBanner'),
  emergencyAlertText: document.getElementById('emergencyAlertText'),
  emergencyBannerBtn: document.getElementById('emergencyBannerBtn'),
  emergencyHeaderBtn: document.getElementById('emergencyHeaderBtn'),
  qrStationHeaderBtn: document.getElementById('qrStationHeaderBtn'),
  manageDeptsBtn: document.getElementById('manageDeptsBtn'),

  // Search & Symptoms
  heroTitle: document.getElementById('heroTitle'),
  heroSubtitle: document.getElementById('heroSubtitle'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  searchSubmitBtn: document.getElementById('searchSubmitBtn'),
  symptomsTitle: document.getElementById('symptomsTitle'),
  symptomChipsContainer: document.getElementById('symptomChipsContainer'),

  // Toolbar & Filters
  resultsCount: document.getElementById('resultsCount'),
  floorFilterButtons: document.querySelectorAll('.filter-btn'),

  // Grid
  departmentsGrid: document.getElementById('departmentsGrid'),
  sampleDisclaimer: document.getElementById('sampleDisclaimer'),

  // QR Modal
  qrModal: document.getElementById('qrModal'),
  qrModalTitle: document.getElementById('qrModalTitle'),
  qrModalSubtitle: document.getElementById('qrModalSubtitle'),
  qrStatusBadge: document.getElementById('qrStatusBadge'),
  qrExplainerText: document.getElementById('qrExplainerText'),
  qrImage: document.getElementById('qrImage'),
  qrUrlInput: document.getElementById('qrUrlInput'),
  qrCurrentUrlLabel: document.getElementById('qrCurrentUrlLabel'),
  qrRegenerateBtn: document.getElementById('qrRegenerateBtn'),
  qrDownloadBtn: document.getElementById('qrDownloadBtn'),
  qrPrintPosterBtn: document.getElementById('qrPrintPosterBtn'),
  qrWifiHint: document.getElementById('qrWifiHint'),

  // Emergency Modal
  emergencyModal: document.getElementById('emergencyModal'),
  emergencyModalTitle: document.getElementById('emergencyModalTitle'),
  emergencySubtitle: document.getElementById('emergencySubtitle'),
  emergencyRushTitle: document.getElementById('emergencyRushTitle'),
  emergencySignsList: document.getElementById('emergencySignsList'),
  emergencyLocationText: document.getElementById('emergencyLocationText'),
  callAmbulanceBtn: document.getElementById('callAmbulanceBtn'),
  callCasualtyBtn: document.getElementById('callCasualtyBtn'),
  getCasualtyRouteBtn: document.getElementById('getCasualtyRouteBtn'),

  // Department QR Modal
  deptQrModal: document.getElementById('deptQrModal'),
  deptQrTitle: document.getElementById('deptQrTitle'),
  deptQrImage: document.getElementById('deptQrImage'),
  deptQrText: document.getElementById('deptQrText'),
  deptQrCopyBtn: document.getElementById('deptQrCopyBtn'),

  // Admin / Edit Modal
  adminModal: document.getElementById('adminModal'),
  adminModalTitle: document.getElementById('adminModalTitle'),
  adminModalSubtitle: document.getElementById('adminModalSubtitle'),
  adminDeptsList: document.getElementById('adminDeptsList'),
  adminResetBtn: document.getElementById('adminResetBtn'),
  adminAddDeptBtn: document.getElementById('adminAddDeptBtn'),

  // Footer Branding
  footerHospitalName: document.getElementById('footerHospitalName'),
  footerProjectTitle: document.getElementById('footerProjectTitle'),

  // Printable Area
  printContainer: document.getElementById('printContainer')
};

// ================= PUBLIC DEPLOYMENT HELPERS ================= //
function isPrivateOrLocalUrl(urlStr) {
  if (!urlStr) return true;
  try {
    const parsed = new URL(urlStr);
    const h = parsed.hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '0.0.0.0' ||
      h.startsWith('192.168.') ||
      h.startsWith('10.') ||
      h.startsWith('172.16.')
    );
  } catch (e) {
    return true;
  }
}

function getActivePublicUrl() {
  // 1. Check user configured public URL in localStorage
  const saved = localStorage.getItem('hospital_configured_public_url');
  if (saved && !isPrivateOrLocalUrl(saved)) {
    return saved.replace(/\/$/, '');
  }
  // 2. Check public URL returned by server (e.g. from RENDER_EXTERNAL_URL or PUBLIC_URL)
  if (serverInfo.publicUrl && !isPrivateOrLocalUrl(serverInfo.publicUrl)) {
    return serverInfo.publicUrl.replace(/\/$/, '');
  }
  // 3. Check if current browser window is already loaded on a public HTTPS domain
  if (!isPrivateOrLocalUrl(window.location.origin)) {
    return window.location.origin;
  }
  return null;
}

// ================= INITIALIZATION ================= //
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  applyLanguage(currentLang);
  await fetchServerInfo();
  await loadDepartments();
  handleUrlHash();
});

// Fetch Server and Wi-Fi Network Details
async function fetchServerInfo() {
  try {
    const res = await fetch('/api/info');
    if (res.ok) {
      serverInfo = await res.json();
      const activePublic = getActivePublicUrl();
      if (elements.qrUrlInput) {
        elements.qrUrlInput.value = activePublic || serverInfo.networkUrl || window.location.origin;
      }
    }
  } catch (err) {
    console.warn('Could not fetch server info, using window.location.origin:', err);
  }
}

// Load Departments from Server
async function loadDepartments() {
  try {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to load departments');
    departmentsData = await res.json();
    renderSymptomChips();
    applyFilters();
  } catch (err) {
    console.error('Error fetching departments:', err);
    elements.departmentsGrid.innerHTML = `
      <div class="no-results-state">
        <div class="no-results-icon">⚠️</div>
        <div class="no-results-title">Failed to load department data</div>
        <div class="no-results-desc">Please ensure the Node.js server is running and refresh the page.</div>
      </div>
    `;
  }
}

// ================= LANGUAGE & I18N ================= //
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('hospital_lang', lang);

  // Update active state on language buttons
  elements.langButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  const t = translations[lang] || translations.en;

  // Document Title
  document.title = t.projectTitle || "Government Hospital Vijayapura – Multilingual QR Code Navigation System";

  // Header & Branding
  if (elements.hospitalTitle) elements.hospitalTitle.textContent = t.hospitalName;
  if (elements.hospitalTagline) elements.hospitalTagline.textContent = t.tagline;
  if (elements.academicBadge) elements.academicBadge.textContent = t.academicBadge;
  if (elements.academicNoticeBanner) {
    elements.academicNoticeBanner.innerHTML = `⚠️ <strong>${t.academicBadge}:</strong> ${escapeHtml(t.academicNotice.replace(/^⚠️\s*/, ''))}`;
  }
  if (elements.emergencyAlertText) elements.emergencyAlertText.textContent = t.emergencyAlert;
  if (elements.emergencyBannerBtn) elements.emergencyBannerBtn.textContent = t.emergencyBtn;
  if (elements.emergencyHeaderBtn) elements.emergencyHeaderBtn.innerHTML = `🚨 ${t.emergencyBtn}`;
  if (elements.qrStationBtn) elements.qrStationBtn.innerHTML = `📱 ${t.qrStationBtn}`;
  if (elements.manageDeptsBtn) elements.manageDeptsBtn.innerHTML = `✏️ ${t.editDataBtn}`;

  // Footer
  if (elements.footerHospitalName) elements.footerHospitalName.textContent = `🏥 ${t.hospitalName}`;
  if (elements.footerProjectTitle) elements.footerProjectTitle.textContent = t.tagline;

  // Search & Hero
  if (elements.heroTitle) {
    elements.heroTitle.textContent = lang === 'kn' ? "ಯಾವ ವಿಭಾಗಕ್ಕೆ ಹೋಗಬೇಕು? ಇಲ್ಲಿ ಸುಲಭವಾಗಿ ಹುಡುಕಿ"
      : lang === 'hi' ? "किस विभाग में जाना है? यहाँ आसानी से खोजें"
      : "Where do you need to go? Find your way instantly.";
  }
  if (elements.heroSubtitle) {
    elements.heroSubtitle.textContent = lang === 'kn' ? "ನಿಮ್ಮ ರೋಗಲಕ್ಷಣ ಅಥವಾ ಸಮಸ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ನೇರ ಮಾರ್ಗವನ್ನು ಪಡೆಯಿರಿ."
      : lang === 'hi' ? "अपनी समस्या या लक्षण चुनें और सटीक कमरा नंबर व दिशा-निर्देश पाएं।"
      : "Select your symptom or search below to get exact room, floor, landmark and walking directions.";
  }
  if (elements.searchInput) elements.searchInput.placeholder = t.searchPlaceholder;
  if (elements.searchSubmitBtn) elements.searchSubmitBtn.textContent = t.searchBtn;
  if (elements.symptomsTitle) elements.symptomsTitle.textContent = t.popularSymptomsTitle;

  // Floor Filters
  const floorButtons = document.querySelectorAll('.filter-btn');
  floorButtons.forEach(btn => {
    const f = btn.getAttribute('data-floor');
    if (f === 'all') btn.textContent = t.filterAll;
    else if (f === 'G') btn.textContent = t.filterGround;
    else if (f === '1') btn.textContent = t.filterFirst;
    else if (f === '2') btn.textContent = t.filterSecond;
    else if (f === '3') btn.textContent = t.filterThird;
    else if (f === 'B1') btn.textContent = t.filterBasement;
    else if (f === 'emergency') btn.textContent = t.filterEmergency;
  });

  // Disclaimer
  if (elements.sampleDisclaimer) elements.sampleDisclaimer.textContent = t.sampleDisclaimer;

  // Emergency Modal Texts
  if (elements.emergencyModalTitle) elements.emergencyModalTitle.textContent = t.emergencyModalTitle;
  if (elements.emergencySubtitle) elements.emergencySubtitle.textContent = t.emergencySubtitle;
  if (elements.emergencyRushTitle) elements.emergencyRushTitle.textContent = t.emergencyRushChecklistTitle;
  if (elements.emergencyLocationText) elements.emergencyLocationText.textContent = t.emergencyCasualtyLocation;
  if (elements.callAmbulanceBtn) elements.callAmbulanceBtn.textContent = t.callAmbulanceBtn;
  if (elements.callCasualtyBtn) elements.callCasualtyBtn.textContent = t.callCasualtyBtn;
  if (elements.getCasualtyRouteBtn) elements.getCasualtyRouteBtn.textContent = t.getCasualtyRouteBtn;

  // Emergency signs list
  if (elements.emergencySignsList) {
    elements.emergencySignsList.innerHTML = t.emergencySigns.map(sign => `
      <li class="emergency-check-item">
        <span>⚠️</span>
        <div>${escapeHtml(sign)}</div>
      </li>
    `).join('');
  }

  // QR Modal Texts
  if (elements.qrModalTitle) elements.qrModalTitle.textContent = t.qrModalTitle;
  if (elements.qrModalSubtitle) elements.qrModalSubtitle.textContent = t.qrModalSubtitle;
  if (elements.qrCurrentUrlLabel) elements.qrCurrentUrlLabel.textContent = t.qrCurrentUrlLabel;
  if (elements.qrRegenerateBtn) elements.qrRegenerateBtn.textContent = t.qrSavePublicUrlBtn || t.qrRegenerate;
  if (elements.qrDownloadBtn) elements.qrDownloadBtn.textContent = t.qrDownloadBtn;
  if (elements.qrPrintPosterBtn) elements.qrPrintPosterBtn.textContent = t.qrPrintPosterBtn;
  if (elements.qrWifiHint) elements.qrWifiHint.textContent = t.qrWifiHint;

  // Re-render components with the new language
  renderSymptomChips();
  renderDepartments(filteredDepartments.length > 0 ? filteredDepartments : departmentsData);
  updateQrModalState();
}

// ================= SYMPTOM CHIPS ================= //
const symptomMapping = [
  { key: 'fever', icon: '🌡️', query: 'fever' },
  { key: 'tooth_pain', icon: '🦷', query: 'tooth' },
  { key: 'skin_problems', icon: '🧴', query: 'skin' },
  { key: 'eye_problems', icon: '👁️', query: 'eye' },
  { key: 'bone_pain', icon: '🦴', query: 'bone' },
  { key: 'chest_pain', icon: '❤️', query: 'chest' },
  { key: 'pregnancy', icon: '🤰', query: 'pregnancy' },
  { key: 'child_health', icon: '👶', query: 'child' },
  { key: 'ear_nose', icon: '👂', query: 'ear' },
  { key: 'stomach_pain', icon: '🚽', query: 'stomach' },
  { key: 'mental_health', icon: '🧠', query: 'headache' },
  { key: 'kidney_urinary', icon: '💧', query: 'kidney' },
  { key: 'blood_test', icon: '🔬', query: 'blood' },
  { key: 'xray_scan', icon: '🩻', query: 'scan' }
];

function renderSymptomChips() {
  if (!elements.symptomChipsContainer) return;
  const t = translations[currentLang] || translations.en;

  elements.symptomChipsContainer.innerHTML = symptomMapping.map(item => {
    const label = t.symptoms[item.key] || item.key;
    const isActive = activeSymptom === item.key;
    return `
      <button class="symptom-chip ${isActive ? 'active' : ''}" data-symptom-key="${item.key}" data-query="${item.query}">
        <span>${item.icon}</span>
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }).join('');

  // Attach click listeners to chips
  elements.symptomChipsContainer.querySelectorAll('.symptom-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.getAttribute('data-symptom-key');
      const query = chip.getAttribute('data-query');

      if (activeSymptom === key) {
        // Deselect
        activeSymptom = null;
        elements.searchInput.value = '';
        elements.clearSearchBtn.classList.remove('visible');
      } else {
        // Select
        activeSymptom = key;
        elements.searchInput.value = query;
        elements.clearSearchBtn.classList.add('visible');
      }

      renderSymptomChips();
      applyFilters();
    });
  });
}

// ================= FILTERING & SEARCH ================= //
function applyFilters() {
  const query = (elements.searchInput.value || '').trim().toLowerCase();
  
  // Show or hide clear button
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.classList.toggle('visible', query.length > 0);
  }

  filteredDepartments = departmentsData.filter(dept => {
    // 1. Floor / Emergency Filter
    if (activeFloorFilter === 'emergency' && !dept.isEmergency) {
      return false;
    } else if (activeFloorFilter !== 'all' && activeFloorFilter !== 'emergency') {
      if (dept.floorCode !== activeFloorFilter) return false;
    }

    // 2. Query Search
    if (!query) return true;

    // Search in names across all 3 languages
    const names = [dept.names.en, dept.names.kn, dept.names.hi].filter(Boolean).map(s => s.toLowerCase());
    if (names.some(n => n.includes(query))) return true;

    // Search in symptoms list
    if (dept.symptoms) {
      const allSymptoms = [
        ...(dept.symptoms.en || []),
        ...(dept.symptoms.kn || []),
        ...(dept.symptoms.hi || [])
      ].map(s => s.toLowerCase());
      if (allSymptoms.some(s => s.includes(query))) return true;
    }

    // Search in description
    if (dept.description) {
      const desc = [dept.description.en, dept.description.kn, dept.description.hi].filter(Boolean).map(s => s.toLowerCase());
      if (desc.some(d => d.includes(query))) return true;
    }

    // Search in room or landmark or building
    const room = (dept.roomNumber || '').toLowerCase();
    if (room.includes(query)) return true;

    if (dept.building) {
      const bldg = [dept.building.en, dept.building.kn, dept.building.hi].filter(Boolean).map(s => s.toLowerCase());
      if (bldg.some(b => b.includes(query))) return true;
    }

    return false;
  });

  renderDepartments(filteredDepartments);
}

// ================= RENDER DEPARTMENTS ================= //
function renderDepartments(departments) {
  if (!elements.departmentsGrid) return;
  const t = translations[currentLang] || translations.en;

  // Update counter
  if (elements.resultsCount) {
    elements.resultsCount.innerHTML = `
      <span>${departments.length}</span> ${currentLang === 'kn' ? 'ವಿಭಾಗಗಳು ಲಭ್ಯವಿದೆ' : currentLang === 'hi' ? 'विभाग उपलब्ध हैं' : 'departments found'}
      ${activeSymptom ? `<span class="active-filter-badge">Symptom: ${t.symptoms[activeSymptom] || activeSymptom}</span>` : ''}
    `;
  }

  if (departments.length === 0) {
    elements.departmentsGrid.innerHTML = `
      <div class="no-results-state">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-title">${escapeHtml(t.noResultsFound)}</div>
        <div class="no-results-desc">
          ${currentLang === 'kn' ? 'ದಯವಿಟ್ಟು ಹುಡುಕಾಟವನ್ನು ಬದಲಾಯಿಸಿ ಅಥವಾ ತುರ್ತು ಸಹಾಯಕ್ಕೆ 108 / 112 ಗೆ ಸಂಪರ್ಕಿಸಿ.'
            : currentLang === 'hi' ? 'कृपया खोज बदलें या सहायता हेतु 108 / 112 पर संपर्क करें।'
            : 'Try searching for common terms like fever, bone, tooth, eye, skin, or contact helpdesk.'}
        </div>
        <button class="search-submit-btn" onclick="resetAllFilters()">${escapeHtml(t.resetFilter)}</button>
      </div>
    `;
    return;
  }

  elements.departmentsGrid.innerHTML = departments.map(dept => {
    const name = dept.names[currentLang] || dept.names.en;
    const desc = dept.description[currentLang] || dept.description.en;
    const building = dept.building[currentLang] || dept.building.en;
    const floor = dept.floor[currentLang] || dept.floor.en;
    const landmark = dept.landmark[currentLang] || dept.landmark.en;
    const hours = dept.operatingHours ? (dept.operatingHours[currentLang] || dept.operatingHours.en) : 'Open during hospital hours';
    const directionsList = dept.directions ? (dept.directions[currentLang] || dept.directions.en || []) : [];

    // Symptoms tags (show current lang symptoms or fallback)
    const treatedSymptoms = dept.symptoms ? (dept.symptoms[currentLang] || dept.symptoms.en || []).slice(0, 5) : [];

    return `
      <div class="dept-card ${dept.isEmergency ? 'card-emergency' : ''}" id="dept-${dept.id}">
        <!-- Card Header -->
        <div class="dept-card-header">
          <div class="dept-icon-wrapper" style="background: ${dept.badgeColor || '#0284c7'}15; border-color: ${dept.badgeColor || '#0284c7'}40;">
            <span>${dept.icon || '🏥'}</span>
          </div>
          <div class="dept-header-text">
            <div class="dept-badges">
              ${dept.isEmergency ? `<span class="dept-badge badge-emergency">🚨 EMERGENCY (24x7)</span>` : ''}
              <span class="dept-badge badge-floor">${escapeHtml(floor)}</span>
              <span class="dept-badge badge-room">${escapeHtml(dept.roomNumber)}</span>
              <span class="dept-badge badge-sample">${escapeHtml(t.sampleDataBadge)}</span>
            </div>
            <h3 class="dept-name">${escapeHtml(name)}</h3>
          </div>
        </div>

        <!-- Card Body -->
        <div class="dept-card-body">
          <p class="dept-description">${escapeHtml(desc)}</p>

          <!-- Wayfinding Information Box -->
          <div class="wayfinding-box">
            <div class="wayfinding-item">
              <span class="wf-icon">🏢</span>
              <span class="wf-label">${t.buildingLabel}:</span>
              <span class="wf-value">${escapeHtml(building)}</span>
            </div>
            <div class="wayfinding-item">
              <span class="wf-icon">📍</span>
              <span class="wf-label">${t.landmarkLabel}:</span>
              <span class="wf-value highlight-landmark">${escapeHtml(landmark)}</span>
            </div>
            <div class="wayfinding-item">
              <span class="wf-icon">🕒</span>
              <span class="wf-label">${t.timingLabel}:</span>
              <span class="wf-value">${escapeHtml(hours)}</span>
            </div>
            <div class="wayfinding-item">
              <span class="wf-icon">📞</span>
              <span class="wf-label">${t.contactLabel}:</span>
              <span class="wf-value">${escapeHtml(dept.phone || '108 (Emergency)')}</span>
            </div>
          </div>

          <!-- Treated Symptoms Tags -->
          ${treatedSymptoms.length > 0 ? `
            <div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">
                ${t.symptomsTreated}:
              </div>
              <div class="dept-symptoms-list">
                ${treatedSymptoms.map(s => `<span class="symptom-tag">${escapeHtml(s)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Step-by-Step Route Box -->
          <div class="route-breadcrumb-container">
            <div class="route-header">
              <span>🚶</span>
              <span>${t.directionsLabel}</span>
            </div>
            <ol class="route-steps-list">
              ${directionsList.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
            </ol>
          </div>

          <!-- Doctors on Duty -->
          ${dept.doctors && dept.doctors.length > 0 ? `
            <div class="doctors-list">
              <strong style="color: var(--text-main);">${t.doctorsLabel}:</strong>
              ${dept.doctors.map(doc => `
                <div class="doctor-item">
                  <span>👨‍⚕️</span>
                  <span><strong>${escapeHtml(doc.name)}</strong> — ${escapeHtml(doc.role)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Card Footer Actions -->
        <div class="dept-card-footer">
          <button class="btn-card-action" onclick="speakDirections('${dept.id}')" title="Listen to spoken audio directions">
            ${t.voiceSpeech}
          </button>
          <button class="btn-card-action" onclick="printDirectionSlip('${dept.id}')" title="Print a slip for this department">
            ${t.printSlip}
          </button>
          <button class="btn-card-action btn-card-primary" onclick="openDeptQrModal('${dept.id}')" title="Show QR Code for this department">
            ${t.showQr}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Reset All Filters Helper
window.resetAllFilters = function() {
  activeSymptom = null;
  activeFloorFilter = 'all';
  if (elements.searchInput) elements.searchInput.value = '';
  elements.floorFilterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-floor') === 'all');
  });
  renderSymptomChips();
  applyFilters();
};

// ================= SPEECH / AUDIO DIRECTIONS ================= //
window.speakDirections = function(deptId) {
  if (!('speechSynthesis' in window)) {
    alert('Voice narration is not supported on this browser.');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const dept = departmentsData.find(d => d.id === deptId);
  if (!dept) return;

  const name = dept.names[currentLang] || dept.names.en;
  const building = dept.building[currentLang] || dept.building.en;
  const floor = dept.floor[currentLang] || dept.floor.en;
  const room = dept.roomNumber;
  const directions = dept.directions ? (dept.directions[currentLang] || dept.directions.en || []) : [];

  let narration = '';
  if (currentLang === 'kn') {
    narration = `${name}. ${building}, ${floor}, ${room}. `;
    narration += directions.join('. ');
  } else if (currentLang === 'hi') {
    narration = `${name}. ${building}, ${floor}, ${room}. `;
    narration += directions.join('. ');
  } else {
    narration = `Directions to ${name}. Located at ${building}, ${floor}, ${room}. `;
    narration += directions.join('. ');
  }

  const utterance = new SpeechSynthesisUtterance(narration);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (currentLang === 'kn') utterance.lang = 'kn-IN';
  else if (currentLang === 'hi') utterance.lang = 'hi-IN';
  else utterance.lang = 'en-IN';

  window.speechSynthesis.speak(utterance);
};

// ================= PRINT DIRECTION SLIP ================= //
window.printDirectionSlip = function(deptId) {
  const dept = departmentsData.find(d => d.id === deptId);
  if (!dept) return;

  const t = translations[currentLang] || translations.en;
  const name = dept.names[currentLang] || dept.names.en;
  const building = dept.building[currentLang] || dept.building.en;
  const floor = dept.floor[currentLang] || dept.floor.en;
  const landmark = dept.landmark[currentLang] || dept.landmark.en;
  const directions = dept.directions ? (dept.directions[currentLang] || dept.directions.en || []) : [];
  const hours = dept.operatingHours ? (dept.operatingHours[currentLang] || dept.operatingHours.en) : '';

  const slipHtml = `
    <div class="printable-slip">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-size: 1.4rem; margin: 0;">🏥 ${escapeHtml(t.hospitalName)}</h2>
        <p style="font-size: 0.9rem; margin: 4px 0 0; font-weight: bold;">
          ${escapeHtml(t.tagline)}
        </p>
        <p style="font-size: 0.75rem; color: #b45309; font-weight: bold; margin-top: 4px;">
          ⚠️ ${escapeHtml(t.academicNotice)}
        </p>
        <p style="font-size: 0.72rem; color: #555;">Slip Generated on ${new Date().toLocaleString()}</p>
      </div>

      <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
        <h3 style="font-size: 1.3rem; margin: 0 0 6px; color: #0284c7;">${escapeHtml(name)}</h3>
        <p style="font-size: 1rem; margin: 4px 0;"><strong>🏢 Building:</strong> ${escapeHtml(building)}</p>
        <p style="font-size: 1rem; margin: 4px 0;"><strong>🪜 Floor:</strong> ${escapeHtml(floor)} | <strong>🚪 Room:</strong> ${escapeHtml(dept.roomNumber)}</p>
        <p style="font-size: 0.95rem; margin: 4px 0;"><strong>📍 Landmark:</strong> ${escapeHtml(landmark)}</p>
        <p style="font-size: 0.85rem; margin: 4px 0;"><strong>🕒 Timings:</strong> ${escapeHtml(hours)}</p>
        <p style="font-size: 0.85rem; margin: 4px 0;"><strong>📞 Helpline:</strong> ${escapeHtml(dept.phone)}</p>
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 1rem; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
          🚶 Step-by-Step Walking Directions:
        </h4>
        <ol style="padding-left: 20px; font-size: 0.95rem; line-height: 1.5;">
          ${directions.map(step => `<li style="margin-bottom: 6px;">${escapeHtml(step)}</li>`).join('')}
        </ol>
      </div>

      <div style="text-align: center; border-top: 1px dashed #666; padding-top: 10px; font-size: 0.8rem; color: #555;">
        Emergency Ambulance: 108 | National Helpline: 112<br/>
        Hospital Road, Vijayapura (Bijapur) 586101, Karnataka
      </div>
    </div>
  `;

  elements.printContainer.innerHTML = slipHtml;
  window.print();
};

// ================= QR CODE MODALS & CLOUD DEPLOYMENT ================= //
function updateQrModalState() {
  const t = translations[currentLang] || translations.en;
  const publicUrl = getActivePublicUrl();
  const currentInput = (elements.qrUrlInput ? elements.qrUrlInput.value.trim() : '');
  const targetUrl = publicUrl || (currentInput && !isPrivateOrLocalUrl(currentInput) ? currentInput : (serverInfo.networkUrl || window.location.origin));

  if (elements.qrUrlInput && publicUrl) {
    elements.qrUrlInput.value = publicUrl;
  }

  if (publicUrl || (currentInput && !isPrivateOrLocalUrl(currentInput))) {
    if (elements.qrStatusBadge) {
      elements.qrStatusBadge.className = 'qr-status-indicator qr-status-ready';
      elements.qrStatusBadge.textContent = t.qrPublicStatusReady;
    }
    if (elements.qrExplainerText) {
      elements.qrExplainerText.innerHTML = `${t.qrPublicExplainerReady}<br/><strong>Live URL:</strong> <code>${escapeHtml(targetUrl)}</code>`;
    }
  } else {
    if (elements.qrStatusBadge) {
      elements.qrStatusBadge.className = 'qr-status-indicator qr-status-warning';
      elements.qrStatusBadge.textContent = t.qrPublicStatusWarning;
    }
    if (elements.qrExplainerText) {
      elements.qrExplainerText.innerHTML = t.qrPublicExplainerWarning;
    }
  }

  if (elements.qrImage) {
    elements.qrImage.src = `/api/qr?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`;
  }
}

// Open Hospital Main QR Station Modal
function openQrModal() {
  updateQrModalState();
  elements.qrModal.classList.add('active');
}

// Open Specific Department QR Modal
window.openDeptQrModal = function(deptId) {
  const dept = departmentsData.find(d => d.id === deptId);
  if (!dept) return;

  const t = translations[currentLang] || translations.en;
  const name = dept.names[currentLang] || dept.names.en;
  const publicUrl = getActivePublicUrl();
  const base = publicUrl || serverInfo.networkUrl || window.location.origin;
  const deptUrl = `${base}#dept-${dept.id}`;

  elements.deptQrTitle.textContent = name;
  elements.deptQrText.textContent = `${dept.building[currentLang] || dept.building.en} — ${dept.floor[currentLang] || dept.floor.en} (${dept.roomNumber})`;
  elements.deptQrImage.src = `/api/qr?url=${encodeURIComponent(deptUrl)}&t=${Date.now()}`;
  elements.deptQrModal.setAttribute('data-dept-url', deptUrl);
  elements.deptQrModal.classList.add('active');
};

// Print Hospital Entrance Signboard Poster
function printHospitalPoster() {
  const t = translations[currentLang] || translations.en;
  const publicUrl = getActivePublicUrl();
  const rawInput = elements.qrUrlInput ? elements.qrUrlInput.value.trim() : '';
  const targetUrl = publicUrl || (rawInput && !isPrivateOrLocalUrl(rawInput) ? rawInput : (serverInfo.networkUrl || window.location.origin));
  const isPublic = !isPrivateOrLocalUrl(targetUrl);

  if (!isPublic) {
    const proceed = confirm(
      "⚠️ Important Notice for DTSI Project:\n\n" +
      "You are printing with a local URL ('localhost' or private Wi-Fi). This QR code will NOT work on phones when your laptop is switched off.\n\n" +
      "For the final public entrance signboard, please deploy the project online first (free on Render.com) to obtain a public HTTPS URL.\n\n" +
      "Do you want to proceed and print a Preview Copy?"
    );
    if (!proceed) return;
  }

  const qrUrl = `/api/qr?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`;

  const posterHtml = `
    <div class="printable-poster">
      <div style="font-size: 40px; margin-bottom: 8px;">🏥</div>
      
      <div style="background: #ede9fe; color: #6d28d9; padding: 4px 14px; border-radius: 99px; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">
        DTSI Project | Student Innovation & Healthcare Wayfinding Prototype
      </div>

      <h1 style="font-size: 2.1rem; font-weight: 900; margin-bottom: 4px; color: #0284c7;">
        ${escapeHtml(translations.en.hospitalName)}
      </h1>
      <h2 style="font-size: 1.45rem; font-weight: 800; margin-bottom: 4px; color: #0f172a;">
        ${escapeHtml(translations.kn.hospitalName)}
      </h2>
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; color: #475569;">
        ${escapeHtml(translations.hi.hospitalName)}
      </h3>

      <div style="border: 4px solid #0f172a; border-radius: 16px; padding: 16px; background: #fff; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <img src="${qrUrl}" alt="Hospital Navigation QR Code" style="width: 300px; height: 300px; display: block;" />
      </div>

      <div style="max-width: 650px; margin: 0 auto; text-align: center;">
        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
          📱 SCAN THIS QR CODE WITH YOUR PHONE CAMERA
        </h3>
        <p style="font-size: 1.1rem; color: #0369a1; font-weight: 700; margin-bottom: 4px;">
          ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಸುಲಭವಾಗಿ ಆಸ್ಪತ್ರೆ ಮಾರ್ಗ ತಿಳಿಯಿರಿ
        </p>
        <p style="font-size: 1.05rem; color: #047857; font-weight: 600; margin-bottom: 12px;">
          अपने मोबाइल से स्कैन करें और सभी विभागों का रास्ता देखें
        </p>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-size: 0.9rem;">
          ${isPublic ? 
            `<span style="color: #15803d; font-weight: bold;">🟢 Permanent Public Cloud Link:</span> <strong>${escapeHtml(targetUrl)}</strong>` : 
            `<span style="color: #b45309; font-weight: bold;">⚠️ Local Testing Preview Copy:</span> <strong>${escapeHtml(targetUrl)}</strong><br/><small>(Deploy to Render/Railway for final permanent public QR code)</small>`
          }
        </div>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 0.78rem; color: #64748b;">
          ⚠️ <strong>Prototype Disclaimer:</strong> Sample demonstration wayfinding data for Government Hospital Vijayapura (DTSI Project). Department locations and room numbers are unverified demo layouts.<br/>
          Emergency Ambulance: <strong>108</strong> | National Emergency: <strong>112</strong> | Hospital Road, Vijayapura 586101
        </div>
      </div>
    </div>
  `;

  elements.printContainer.innerHTML = posterHtml;
  window.print();
}

// Download QR Code as PNG
function downloadQrCode() {
  const publicUrl = getActivePublicUrl();
  const rawInput = elements.qrUrlInput ? elements.qrUrlInput.value.trim() : '';
  const targetUrl = publicUrl || (rawInput && !isPrivateOrLocalUrl(rawInput) ? rawInput : (serverInfo.networkUrl || window.location.origin));
  const link = document.createElement('a');
  link.href = `/api/qr?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`;
  link.download = `Government-Hospital-Vijayapura-QR.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ================= EMERGENCY MODAL ================= //
function openEmergencyModal() {
  elements.emergencyModal.classList.add('active');
}

function focusEmergencyDepartment() {
  elements.emergencyModal.classList.remove('active');
  activeFloorFilter = 'emergency';
  elements.floorFilterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-floor') === 'emergency');
  });
  applyFilters();

  const emergencyCard = document.getElementById('dept-emergency');
  if (emergencyCard) {
    emergencyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    emergencyCard.classList.add('highlight-emergency');
  }
}

// ================= ADMIN / EDIT MODAL ================= //
function openAdminModal() {
  renderAdminList();
  elements.adminModal.classList.add('active');
}

function renderAdminList() {
  if (!elements.adminDeptsList) return;

  elements.adminDeptsList.innerHTML = departmentsData.map((d, index) => {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
        <div>
          <strong style="color: var(--text-main); font-size: 0.95rem;">${d.icon || '🏥'} ${escapeHtml(d.names.en)}</strong>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            ${escapeHtml(d.building.en)} — ${escapeHtml(d.floor.en)} (${escapeHtml(d.roomNumber)})
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn-card-action" style="padding: 4px 10px; font-size: 0.78rem;" onclick="promptEditDepartment(${index})">✏️ Edit</button>
        </div>
      </div>
    `;
  }).join('');
}

// Quick GUI Edit Prompt for Beginners
window.promptEditDepartment = async function(index) {
  const dept = departmentsData[index];
  const newName = prompt(`Edit English Department Name:`, dept.names.en);
  if (newName === null) return;

  const newRoom = prompt(`Edit Room Number:`, dept.roomNumber);
  if (newRoom === null) return;

  const newLandmark = prompt(`Edit Landmark (English):`, dept.landmark.en);
  if (newLandmark === null) return;

  dept.names.en = newName.trim() || dept.names.en;
  dept.roomNumber = newRoom.trim() || dept.roomNumber;
  dept.landmark.en = newLandmark.trim() || dept.landmark.en;

  try {
    const res = await fetch(`/api/departments/${dept.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dept)
    });
    if (res.ok) {
      alert('Department updated and saved to data/departments.json successfully!');
      await loadDepartments();
      renderAdminList();
    } else {
      alert('Failed to save update.');
    }
  } catch (err) {
    alert('Error saving changes: ' + err.message);
  }
};

// Reset to Sample Data
async function resetSampleData() {
  if (!confirm('Are you sure you want to reset all departments to original sample data?')) return;
  try {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    if (res.ok) {
      alert('Sample data reset successfully!');
      await loadDepartments();
      renderAdminList();
    } else {
      alert('Failed to reset sample data.');
    }
  } catch (err) {
    alert('Error resetting data: ' + err.message);
  }
}

// Add New Department Prompt
async function addNewDepartment() {
  const id = prompt('Enter a unique Department ID (e.g. oncology, ayurveda):');
  if (!id) return;

  const nameEn = prompt('Enter Department Name (English):');
  if (!nameEn) return;

  const buildingEn = prompt('Enter Building Name (e.g. Block A):', 'Block A - Main Hospital Building (Sample Layout)');
  const floorEn = prompt('Enter Floor (e.g. 1st Floor):', '1st Floor');
  const roomNumber = prompt('Enter Room Number (e.g. Room 115):', 'Room 115 (Sample Demo)');
  const landmarkEn = prompt('Enter Landmark (e.g. Near Elevator B):', '[Sample Layout] Near Elevator B');

  const newDept = {
    id: id.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    icon: '🏥',
    badgeColor: '#0284c7',
    isEmergency: false,
    isSampleData: true,
    verificationStatus: 'Unverified Demonstration Layout (DTSI Project)',
    names: {
      en: nameEn,
      kn: `${nameEn} ವಿಭಾಗ`,
      hi: `${nameEn} विभाग`
    },
    description: {
      en: `Consultation and patient treatment at ${nameEn}.`,
      kn: `${nameEn} ಚಿಕಿತ್ಸಾ ವಿಭಾಗ.`,
      hi: `${nameEn} परामर्श एवं उपचार विभाग।`
    },
    building: {
      en: buildingEn,
      kn: `${buildingEn} (ಮಾದರಿ ವಿನ್ಯಾಸ)`,
      hi: `${buildingEn} (नमूना लेआउट)`
    },
    floor: {
      en: floorEn,
      kn: `${floorEn}`,
      hi: `${floorEn}`
    },
    floorCode: '1',
    roomNumber: roomNumber,
    landmark: {
      en: landmarkEn,
      kn: `[ಮಾದರಿ ವಿನ್ಯಾಸ] ${landmarkEn}`,
      hi: `[नमूना लेआउट] ${landmarkEn}`
    },
    operatingHours: {
      en: 'Sample Timing: 9:00 AM - 4:00 PM',
      kn: 'ಮಾದರಿ ಸಮಯ: ಬೆಳಿಗ್ಗೆ 9:00 - ಸಂಜೆ 4:00',
      hi: 'नमूना समय: सुबह 9:00 - शाम 4:00'
    },
    phone: '108 (Emergency) / Ext: Sample',
    doctors: [
      { name: 'Duty Medical Officer (Sample)', role: 'Specialist Consultant' }
    ],
    symptoms: {
      en: [id.toLowerCase()],
      kn: [id.toLowerCase()],
      hi: [id.toLowerCase()]
    },
    directions: {
      en: [
        'Enter through Main Hospital Entrance.',
        `Head to ${buildingEn}.`,
        `Take lift or stairs to ${floorEn}.`,
        `Follow signage to ${roomNumber}.`
      ],
      kn: [
        'ಮುಖ್ಯ ಆಸ್ಪತ್ರೆ ದ್ವಾರದಿಂದ ಪ್ರವೇಶಿಸಿ.',
        'ಮಹಡಿಗೆ ಸಾಗಿ.',
        'ಕೊಠಡಿಯನ್ನು ತಲುಪಿ.'
      ],
      hi: [
        'मुख्य अस्पताल प्रवेश द्वार से आएं।',
        'सीढ़ियों या लिफ्ट से मंजिल पर जाएं।',
        'कमरे की ओर बढ़ें।'
      ]
    }
  };

  try {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDept)
    });
    if (res.ok) {
      alert('New department created and saved!');
      await loadDepartments();
      renderAdminList();
    } else {
      const data = await res.json();
      alert('Error creating department: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Failed to connect to server: ' + err.message);
  }
}

// ================= URL HASH HANDLING ================= //
function handleUrlHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#dept-')) {
    setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px #0284c7';
        setTimeout(() => { el.style.boxShadow = ''; }, 3000);
      }
    }, 400);
  }
}

// ================= EVENT LISTENERS ================= //
function setupEventListeners() {
  // Language button clicks
  elements.langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyLanguage(lang);
    });
  });

  // Search input live typing
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', () => {
      applyFilters();
    });
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
  }

  // Clear search button
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      activeSymptom = null;
      renderSymptomChips();
      applyFilters();
    });
  }

  // Search submit button
  if (elements.searchSubmitBtn) {
    elements.searchSubmitBtn.addEventListener('click', applyFilters);
  }

  // Floor filter buttons
  elements.floorFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.floorFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFloorFilter = btn.getAttribute('data-floor');
      applyFilters();
    });
  });

  // Emergency triggers
  if (elements.emergencyBannerBtn) elements.emergencyBannerBtn.addEventListener('click', openEmergencyModal);
  if (elements.emergencyHeaderBtn) elements.emergencyHeaderBtn.addEventListener('click', openEmergencyModal);
  if (elements.getCasualtyRouteBtn) elements.getCasualtyRouteBtn.addEventListener('click', focusEmergencyDepartment);

  // QR Station triggers
  if (elements.qrStationHeaderBtn) elements.qrStationHeaderBtn.addEventListener('click', openQrModal);
  if (elements.qrRegenerateBtn) {
    elements.qrRegenerateBtn.addEventListener('click', () => {
      const url = elements.qrUrlInput.value.trim();
      if (!url) return;

      if (isPrivateOrLocalUrl(url)) {
        alert(
          "⚠️ Notice regarding Localhost & Private IPs:\n\n" +
          "You entered a local URL ('localhost' or '192.168.x.x'). This will only work on devices connected to your exact home/lab Wi-Fi while your laptop is powered on.\n\n" +
          "For the permanent public QR code that works 24/7 on any phone, deploy your project online (free on Render.com) and enter your public HTTPS URL."
        );
      } else {
        localStorage.setItem('hospital_configured_public_url', url);
        alert("✅ Permanent Public HTTPS URL saved successfully! The QR code and entrance poster are now configured for cloud deployment.");
      }
      updateQrModalState();
    });
  }
  if (elements.qrDownloadBtn) elements.qrDownloadBtn.addEventListener('click', downloadQrCode);
  if (elements.qrPrintPosterBtn) elements.qrPrintPosterBtn.addEventListener('click', printHospitalPoster);

  // Admin triggers
  if (elements.manageDeptsBtn) elements.manageDeptsBtn.addEventListener('click', openAdminModal);
  if (elements.adminResetBtn) elements.adminResetBtn.addEventListener('click', resetSampleData);
  if (elements.adminAddDeptBtn) elements.adminAddDeptBtn.addEventListener('click', addNewDepartment);

  // Department QR modal copy button
  if (elements.deptQrCopyBtn) {
    elements.deptQrCopyBtn.addEventListener('click', () => {
      const url = elements.deptQrModal.getAttribute('data-dept-url');
      if (navigator.clipboard && url) {
        navigator.clipboard.writeText(url).then(() => {
          alert('Department navigation link copied to clipboard!');
        });
      }
    });
  }

  // Close modals on click of overlay or close button
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Escape key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

// Utility: Escape HTML to avoid XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
