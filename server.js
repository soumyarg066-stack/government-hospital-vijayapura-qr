const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'departments.json');
const BACKUP_FILE = path.join(__dirname, 'data', 'departments.backup.json');

// Ensure backup exists for reset functionality
try {
  if (!fs.existsSync(BACKUP_FILE) && fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  }
} catch (e) {
  console.warn('Could not create departments backup:', e.message);
}

// Middleware
app.set('trust proxy', 1); // Enable proxy support for cloud hosts (Render, Railway, etc.)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Determine if an address is localhost or private IP
function isPrivateOrLocal(host) {
  if (!host) return true;
  const h = host.toLowerCase().split(':')[0];
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h.startsWith('192.168.') ||
    h.startsWith('10.') ||
    h.startsWith('172.16.') ||
    h.startsWith('172.17.') ||
    h.startsWith('172.18.') ||
    h.startsWith('172.19.') ||
    h.startsWith('172.20.') ||
    h.startsWith('172.21.') ||
    h.startsWith('172.22.') ||
    h.startsWith('172.23.') ||
    h.startsWith('172.24.') ||
    h.startsWith('172.25.') ||
    h.startsWith('172.26.') ||
    h.startsWith('172.27.') ||
    h.startsWith('172.28.') ||
    h.startsWith('172.29.') ||
    h.startsWith('172.30.') ||
    h.startsWith('172.31.')
  );
}

// Helper: Detect configured public deployment URL
function getPublicUrl(req) {
  // 1. Explicit environment variable set by user or host
  if (process.env.PUBLIC_URL && !isPrivateOrLocal(process.env.PUBLIC_URL.replace(/^https?:\/\//, ''))) {
    return process.env.PUBLIC_URL.replace(/\/$/, '');
  }
  // 2. Render.com automatic external URL
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }
  // 3. Railway automatic URL
  if (process.env.RAILWAY_STATIC_URL) {
    const raw = process.env.RAILWAY_STATIC_URL;
    return (raw.startsWith('http') ? raw : `https://${raw}`).replace(/\/$/, '');
  }
  // 4. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  // 5. Incoming request from public domain (in production cloud environment)
  if (req) {
    const host = req.get('host');
    if (host && !isPrivateOrLocal(host)) {
      return `${req.protocol}://${host}`;
    }
  }
  return null;
}

// Helper: Get local network IP addresses (for local Wi-Fi testing)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // IPv4 and non-internal
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`
        });
      }
    }
  }
  return addresses;
}

// Helper: Read departments data
function readDepartments() {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading departments.json:', error.message);
    return [];
  }
}

// Helper: Write departments data
function writeDepartments(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ======================== API ROUTES ======================== //

// 1. Hospital System Info & Mobile URLs
app.get('/api/info', (req, res) => {
  const localIps = getLocalIpAddresses();
  const primaryIpUrl = localIps.length > 0 ? localIps[0].url : `http://localhost:${PORT}`;
  const departments = readDepartments();
  const publicUrl = getPublicUrl(req);
  const isDeployed = Boolean(publicUrl);

  res.json({
    status: 'online',
    isPubliclyDeployed: isDeployed,
    publicUrl: publicUrl || null,
    projectTitle: {
      en: 'Government Hospital Vijayapura – Multilingual QR Code Navigation System',
      kn: 'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ವಿಜಯಪುರ – ಬಹುಭಾಷಾ ಕ್ಯೂಆರ್ ಕೋಡ್ ಮಾರ್ಗದರ್ಶನ ವ್ಯವಸ್ಥೆ',
      hi: 'सरकारी अस्पताल विजयपुरा – बहुभाषी क्यूआर कोड नेविगेशन प्रणाली'
    },
    hospitalName: {
      en: 'Government Hospital Vijayapura',
      kn: 'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ವಿಜಯಪುರ',
      hi: 'सरकारी अस्पताल विजयपुरा'
    },
    tagline: {
      en: 'Multilingual QR Code Navigation System (DTSI Project)',
      kn: 'ಬಹುಭಾಷಾ ಕ್ಯೂಆರ್ ಕೋಡ್ ಮಾರ್ಗದರ್ಶನ ವ್ಯವಸ್ಥೆ (ಡಿಟಿಎಸ್‌ಐ ಪ್ರಾಜೆಕ್ಟ್)',
      hi: 'बहुभाषी क्यूआर कोड नेविगेशन प्रणाली (डीटीएसआई प्रोजेक्ट)'
    },
    academicBadge: 'DTSI Project | Student Innovation & Healthcare Wayfinding Prototype',
    isSampleData: true,
    sampleDataNotice: {
      en: '⚠️ Academic Prototype Notice (DTSI Project): Department locations, rooms, landmarks, and timings shown are sample demonstration data for Government Hospital Vijayapura and are not officially verified.',
      kn: '⚠️ ಪ್ರಾಜೆಕ್ಟ್ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಸೂಚನೆ (ಡಿಟಿಎಸ್‌ಐ): ಇಲ್ಲಿ ತೋರಿಸಲಾದ ಕೊಠಡಿ ಸಂಖ್ಯೆಗಳು, ಮಹಡಿಗಳು ಮತ್ತು ವಿವರಗಳು ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ವಿಜಯಪುರದ ಮಾದರಿ ಮಾಹಿತಿಯಾಗಿದ್ದು, ಅಧಿಕೃತವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ.',
      hi: '⚠️ प्रोजेक्ट प्रोटोटाइप सूचना (डीटीएसआई): दिखाए गए कमरे के नंबर, स्थान और समय सरकारी अस्पताल विजयपुरा के लिए नमूना प्रदर्शन डेटा हैं तथा आधिकारिक रूप से सत्यापित नहीं हैं।'
    },
    emergencyContact: '108 (State Ambulance) / 112 (National Emergency)',
    localUrl: `http://localhost:${PORT}`,
    networkUrl: primaryIpUrl,
    allNetworkUrls: localIps,
    totalDepartments: departments.length,
    timestamp: new Date().toISOString()
  });
});

// 2. Get All Departments
app.get('/api/departments', (req, res) => {
  const departments = readDepartments();
  res.json(departments);
});

// 3. Get Single Department by ID
app.get('/api/departments/:id', (req, res) => {
  const departments = readDepartments();
  const dept = departments.find(d => d.id === req.params.id);
  if (!dept) {
    return res.status(404).json({ error: 'Department not found' });
  }
  res.json(dept);
});

// 4. Create New Department (Editable feature)
app.post('/api/departments', (req, res) => {
  try {
    const departments = readDepartments();
    const newDept = req.body;

    if (!newDept.id || !newDept.names || !newDept.names.en) {
      return res.status(400).json({ error: 'Department ID and English name are required.' });
    }

    // Check if ID already exists
    if (departments.some(d => d.id === newDept.id)) {
      return res.status(409).json({ error: 'Department with this ID already exists.' });
    }

    departments.push(newDept);
    writeDepartments(departments);
    res.status(201).json({ message: 'Department created successfully', department: newDept });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department', details: error.message });
  }
});

// 5. Update Department (Editable feature)
app.put('/api/departments/:id', (req, res) => {
  try {
    const departments = readDepartments();
    const index = departments.findIndex(d => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Department not found' });
    }

    departments[index] = { ...departments[index], ...req.body, id: req.params.id };
    writeDepartments(departments);
    res.json({ message: 'Department updated successfully', department: departments[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department', details: error.message });
  }
});

// 6. Delete Department
app.delete('/api/departments/:id', (req, res) => {
  try {
    const departments = readDepartments();
    const filtered = departments.filter(d => d.id !== req.params.id);

    if (filtered.length === departments.length) {
      return res.status(404).json({ error: 'Department not found' });
    }

    writeDepartments(filtered);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department', details: error.message });
  }
});

// 7. Reset sample departments data to original
app.post('/api/reset-data', (req, res) => {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      fs.copyFileSync(BACKUP_FILE, DATA_FILE);
      const data = readDepartments();
      return res.json({ message: 'Sample departments data reset to default successfully', count: data.length });
    }
    res.status(404).json({ error: 'Backup data file not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset data', details: error.message });
  }
});

// 8. Generate QR Code Endpoint
// Supports returning as PNG image buffer or as JSON dataURL
app.get('/api/qr', async (req, res) => {
  try {
    const publicUrl = getPublicUrl(req);
    const localIps = getLocalIpAddresses();
    const defaultHost = publicUrl || (localIps.length > 0 ? localIps[0].url : `http://localhost:${PORT}`);
    const text = (req.query.url || req.query.text || defaultHost).trim();
    const format = req.query.format || 'image'; // 'image' or 'json'

    const cleanHost = text.replace(/^https?:\/\//, '').split('/')[0];
    const isPublic = !isPrivateOrLocal(cleanHost);

    // If caller explicitly requested a validated public QR code but URL is private/localhost:
    if (req.query.requirePublic === 'true' && !isPublic) {
      return res.status(400).json({
        error: 'Public URL Required',
        message: 'Final permanent public QR code cannot use localhost or a private IP address. Deploy to Render/Railway or configure PUBLIC_URL.',
        currentUrl: text
      });
    }

    if (format === 'json') {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 340,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      return res.json({
        url: text,
        isPublic,
        dataUrl,
        deploymentStatus: isPublic ? 'public_ready' : 'local_preview_only'
      });
    }

    // Direct PNG image output
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60');
    QRCode.toFileStream(res, text, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code', details: error.message });
  }
});

// 9. Symptom & Department Search Endpoint
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const lang = req.query.lang || 'en';
  const departments = readDepartments();

  if (!query) {
    return res.json(departments);
  }

  const results = departments.filter(dept => {
    // 1. Search in English, Kannada, Hindi names
    const names = [dept.names.en, dept.names.kn, dept.names.hi].filter(Boolean).map(s => s.toLowerCase());
    if (names.some(n => n.includes(query))) return true;

    // 2. Search in symptoms (across en, kn, hi)
    if (dept.symptoms) {
      const allSymptoms = [
        ...(dept.symptoms.en || []),
        ...(dept.symptoms.kn || []),
        ...(dept.symptoms.hi || [])
      ].map(s => s.toLowerCase());
      if (allSymptoms.some(s => s.includes(query))) return true;
    }

    // 3. Search in description
    if (dept.description) {
      const descriptions = [dept.description.en, dept.description.kn, dept.description.hi].filter(Boolean).map(s => s.toLowerCase());
      if (descriptions.some(d => d.includes(query))) return true;
    }

    // 4. Search in landmark or building or room number
    const room = (dept.roomNumber || '').toLowerCase();
    if (room.includes(query)) return true;

    if (dept.building) {
      const buildings = [dept.building.en, dept.building.kn, dept.building.hi].filter(Boolean).map(s => s.toLowerCase());
      if (buildings.some(b => b.includes(query))) return true;
    }

    return false;
  });

  res.json(results);
});

// Fallback to index.html for SPA navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
let server = null;
if (require.main === module || !process.env.NO_AUTO_START) {
  server = app.listen(PORT, '0.0.0.0', () => {
    const localIps = getLocalIpAddresses();
    const publicUrl = getPublicUrl();
    console.log('\n========================================================================');
    console.log(' 🏥  GOVERNMENT HOSPITAL VIJAYAPURA – MULTILINGUAL QR NAVIGATION        ');
    console.log(' 🎓  DTSI Project | Student Innovation & Healthcare Wayfinding Prototype');
    console.log('========================================================================');
    console.log(` ✅ Local Computer:       http://localhost:${PORT}`);
    if (publicUrl) {
      console.log(` 🌐 Public Cloud URL:    ${publicUrl}`);
      console.log(` 📱 Final Public QR:     Ready for 24/7 scanning on any phone!`);
    } else {
      if (localIps.length > 0) {
        console.log(` 📱 Local Wi-Fi (Demo):   ${localIps[0].url}`);
      }
      console.log(` ⚠️  Public URL Notice:   Deploy to Render/Railway to get permanent HTTPS QR.`);
    }
    console.log(` 🌐 Languages Supported:  English | ಕನ್ನಡ | हिंदी`);
    console.log('========================================================================\n');
  });
}

module.exports = { app, server };

