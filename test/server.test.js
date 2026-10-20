// Automated Test Suite for Hospital QR Navigation Server
// Government Hospital Vijayapura – Multilingual QR Code Navigation System (DTSI Project)

const http = require('http');

const PORT = 3999;
process.env.PORT = PORT;

// Start server on test port
const { app, server } = require('../server.js');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const text = buffer.toString('utf8');
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          text,
          buffer
        });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n🧪 Running Government Hospital Vijayapura Navigation Automated Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Wait 500ms for server to bind
    await new Promise(r => setTimeout(r, 600));

    // Test 1: Info API & Project Title
    const infoRes = await makeRequest('/api/info');
    assert(infoRes.statusCode === 200, 'GET /api/info returns 200 OK');
    const info = JSON.parse(infoRes.text);
    assert(info.status === 'online', 'Info status is online');
    assert(info.hospitalName.en === 'Government Hospital Vijayapura', 'Hospital name is Government Hospital Vijayapura');
    assert(info.hospitalName.kn === 'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ವಿಜಯಪುರ', 'Kannada hospital name is present');
    assert(info.hospitalName.hi === 'सरकारी अस्पताल विजयपुरा', 'Hindi hospital name is present');
    assert(info.projectTitle.en.includes('Government Hospital Vijayapura – Multilingual QR Code Navigation System'), 'Project title is prominently set');
    assert(info.isSampleData === true, 'Data is explicitly flagged as sample demonstration data');
    assert(info.totalDepartments === 15, `Has exactly 15 sample departments (found: ${info.totalDepartments})`);

    // Test 2: Departments API
    const deptRes = await makeRequest('/api/departments');
    assert(deptRes.statusCode === 200, 'GET /api/departments returns 200 OK');
    const depts = JSON.parse(deptRes.text);
    assert(Array.isArray(depts) && depts.length === 15, `Departments is an array with 15 items (found: ${depts.length})`);

    // Test 3: Department Structure Validation & Sample Labels
    const sample = depts.find(d => d.id === 'emergency');
    assert(sample && sample.isEmergency === true, 'Emergency department exists with isEmergency=true');
    assert(sample.names.en && sample.names.kn && sample.names.hi, 'Department has English, Kannada, and Hindi names');
    assert(sample.building.en && sample.floor.en && sample.roomNumber && sample.landmark.en, 'Department has building, floor, roomNumber, landmark');
    assert(sample.roomNumber.includes('(Sample Demo)'), 'Room numbers are clearly labeled as sample demonstration layouts');
    assert(Array.isArray(sample.directions.en) && sample.directions.en.length > 0, 'Department has step-by-step directions');

    // Test 4: Key Symptoms Verification
    const dermatology = depts.find(d => d.id === 'dermatology');
    const dental = depts.find(d => d.id === 'dental');
    const ophthalmology = depts.find(d => d.id === 'ophthalmology');
    const orthopaedics = depts.find(d => d.id === 'orthopaedics');
    const generalMedicine = depts.find(d => d.id === 'general_medicine');

    assert(dermatology && dermatology.symptoms.en.some(s => s.includes('skin')), 'Dermatology handles skin problems');
    assert(dental && dental.symptoms.en.some(s => s.includes('tooth')), 'Dental handles tooth pain');
    assert(ophthalmology && ophthalmology.symptoms.en.some(s => s.includes('eye')), 'Ophthalmology handles eye problems');
    assert(orthopaedics && orthopaedics.symptoms.en.some(s => s.includes('bone')), 'Orthopaedics handles bone pain');
    assert(generalMedicine && generalMedicine.symptoms.en.some(s => s.includes('fever')), 'General Medicine handles fever');

    // Test 5: QR Code Generation Endpoint
    const qrRes = await makeRequest('/api/qr?url=https://govt-hospital-vijayapura.onrender.com');
    assert(qrRes.statusCode === 200, 'GET /api/qr returns 200 OK');
    assert(qrRes.headers['content-type'] === 'image/png', 'QR code returns image/png Content-Type');
    assert(qrRes.buffer.length > 500, `QR code PNG image has valid size (${qrRes.buffer.length} bytes)`);

    // Test 6: Public URL vs Localhost Validation (Requirement 6)
    const publicCheckRes = await makeRequest('/api/qr?url=https://govt-hospital-vijayapura.onrender.com&format=json');
    const publicData = JSON.parse(publicCheckRes.text);
    assert(publicData.isPublic === true, 'Public HTTPS domain is identified as public');

    const privateCheckRes = await makeRequest('/api/qr?url=http://localhost:3000&requirePublic=true');
    assert(privateCheckRes.statusCode === 400, 'Localhost URL rejected when requirePublic=true');

    // Test 7: Search in English
    const searchResEn = await makeRequest('/api/search?q=tooth');
    const searchResultsEn = JSON.parse(searchResEn.text);
    assert(searchResultsEn.some(d => d.id === 'dental'), 'Search for "tooth" finds Dental department');

    // Test 8: Multilingual Search in Kannada (ಹಲ್ಲುನೋವು)
    const searchResKn = await makeRequest(`/api/search?q=${encodeURIComponent('ಹಲ್ಲುನೋವು')}`);
    const searchResultsKn = JSON.parse(searchResKn.text);
    assert(searchResultsKn.some(d => d.id === 'dental'), 'Search in Kannada for "ಹಲ್ಲುನೋವು" finds Dental department');

    // Test 9: Multilingual Search in Hindi (बुखार)
    const searchResHi = await makeRequest(`/api/search?q=${encodeURIComponent('बुखार')}`);
    const searchResultsHi = JSON.parse(searchResHi.text);
    assert(searchResultsHi.some(d => d.id === 'general_medicine'), 'Search in Hindi for "बुखार" finds General Medicine department');

    // Test 10: Static HTML Webpage & Title
    const htmlRes = await makeRequest('/');
    assert(htmlRes.statusCode === 200, 'GET / returns 200 OK');
    assert(htmlRes.text.includes('Government Hospital Vijayapura'), 'Serves index.html with Government Hospital Vijayapura branding');
    assert(htmlRes.text.includes('DTSI Project Prototype'), 'Serves index.html with DTSI project badge');

    console.log(`\n========================================`);
    console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 All automated tests passed successfully!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
