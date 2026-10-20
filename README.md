# 🏥 Government Hospital Vijayapura – Multilingual QR Code Navigation System
### 🎓 DTSI Project | Student Innovation & Healthcare Wayfinding Prototype

A complete, beginner-friendly web application designed for **Government Hospital Vijayapura (ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ವಿಜಯಪುರ / सरकारी अस्पताल विजयपुरा)**. Built with **HTML5, CSS3, JavaScript, Node.js, and Express**, it enables patients and visitors to navigate hospital departments, rooms, landmarks, and walking directions in **English**, **Kannada (ಕನ್ನಡ)**, and **Hindi (हिंदी)** by scanning a QR code at entrance gates, reception counters, and elevator lobbies.

---

> [!IMPORTANT]
> ### ⚠️ Academic Prototype & Demonstration Notice
> This project was developed as a **DTSI Student Project Prototype**. All department locations, room numbers, landmarks, and timings currently contained in `data/departments.json` are **sample demonstration data** and have **not been officially verified** by Government Hospital Vijayapura authorities. Prior to any physical hospital installation, all data must be validated with hospital management.

---

## 🌟 Key Features

1. **📱 Permanent Public QR Code Generator & Signboard Poster**:
   - Generates live QR codes opening the hospital navigation web app on any smartphone.
   - **Cloud-Ready**: Prepared for free online hosting so the QR code works 24/7 on patients' phones even when your laptop is turned off and VS Code is closed.
   - **Public URL Validation**: Automatically ensures the final printable poster uses a permanent public HTTPS URL and warns against printing `localhost` or private IP addresses.
   - **Printable Entrance Signboard**: 1-click printable hospital poster with the hospital name in English, Kannada, and Hindi.

2. **🌐 Trilingual Support (English, ಕನ್ನಡ, हिंदी)**:
   - Instant language switching without page reloads.
   - All UI elements, health symptoms, department names, floor information, and walking directions are available in all 3 languages.

3. **🔍 Health Problems & Symptoms Search**:
   - Quick-tap symptom chips:
     - 🌡️ **Fever & Cold** (ಜ್ವರ ಮತ್ತು ಶೀತ / बुखार एवं सर्दी)
     - 🦷 **Tooth Pain** (ಹಲ್ಲುನೋವು / दांत दर्द)
     - 🧴 **Skin Problems & Rash** (ಚರ್ಮ ರೋಗ / त्वचा रोग)
     - 👁️ **Eye Problems** (ಕಣ್ಣಿನ ಸಮಸ್ಯೆ / आँख की समस्या)
     - 🦴 **Bone & Joint Pain** (ಮೂಳೆ ಮತ್ತು ಕೀಲು ನೋವು / हड्डियों का दर्द)
     - ❤️ **Chest Pain & Heart** (ಎದೆ ನೋವು / सीने में दर्द)
     - 🤰 **Pregnancy & Maternity** (ಗರ್ಭಾವಸ್ಥೆ / गर्भावस्था)
     - 👶 **Child Health** (ಮಕ್ಕಳ ಆರೋಗ್ಯ / बाल स्वास्थ्य)
     - 👂 **Ear, Nose & Throat** (ಕಿವಿ, ಮೂಗು, ಗಂಟಲು / कान, नाक, गला)
     - 🚽 **Stomach Ache & Acidity** (ಹೊಟ್ಟೆ ನೋವು / पेट दर्द)
     - 🧠 **Mental Health & Headache** (ಮಾನಸಿಕ ಆರೋಗ್ಯ / सिरदर्द)
     - 💧 **Kidney & Urine Issues** (ಕಿಡ್ನಿ ಸಮಸ್ಯೆ / गुर्दा रोग)
     - 🔬 **Blood Test / Diagnostics Lab** (ರಕ್ತ ಪರೀಕ್ಷೆ / ब्लड टेस्ट)
   - Real-time search bar that matches symptom keywords across English, Kannada, and Hindi.

4. **📍 Complete Wayfinding Details for Every Department**:
   - Suggested Department & Specialists
   - Building Block (Sample Demonstration Layout)
   - Floor Number (Ground, 1st, 2nd, 3rd Floor, Basement)
   - Room Number clearly labeled with sample demonstration indicators
   - Step-by-Step Walking Directions (e.g. 1. Enter Lobby -> 2. Take Elevator to Floor -> 3. Follow Corridor)
   - **🔊 Audio Voice Navigation**: Spoken directions in English, Kannada, or Hindi using the browser's SpeechSynthesis API.
   - **🖨️ Printable Direction Slip**: Clean paper ticket for patients to carry.

5. **🚨 Emergency Guidance & SOS**:
   - 1-click directions to Casualty (Room 001 Sample Layout).
   - Direct helpline links: **108 (State Ambulance)** and **112 (National Emergency Helpline)**.
   - Red-flag checklist of urgent symptoms requiring immediate emergency care.

6. **📁 Zero Database or Paid APIs Required**:
   - All 15 sample departments are stored in `data/departments.json`.
   - Editable directly via the built-in "✏️ Manage" web interface or in Notepad.

---

## ☁️ Free Online Deployment Guide (For Permanent QR Code)

> [!WARNING]
> ### Why You Must Deploy Online Before Printing the Final QR Code
> When you run the project on your laptop, the address is `http://localhost:3000` or a private Wi-Fi IP like `http://192.168.1.x:3000`.
> - **`localhost` NEVER works on mobile phones.**
> - **Private Wi-Fi IPs only work while your laptop is ON and connected to the exact same Wi-Fi.** The moment you close your laptop, turn off VS Code, or step outside, the QR code **stops working completely**.
> 
> To generate a permanent QR code that works **24/7 on any phone worldwide**, follow the simple free deployment steps below.

---

### Step-by-Step Deployment on Render.com (100% Free)

[Render.com](https://render.com) is a free cloud hosting provider that natively supports Node.js and Express applications.

#### Step 1: Upload Your Code to GitHub
1. Open [github.com](https://github.com) and sign in (or create a free account).
2. Click **New Repository**, name it `government-hospital-vijayapura-qr`, choose **Public**, and click **Create repository**.
3. In your project folder on Windows 11, open PowerShell and push your code:
   ```powershell
   git init
   git add .
   git commit -m "Government Hospital Vijayapura QR Navigation DTSI Project"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/government-hospital-vijayapura-qr.git
   git push -u origin main
   ```
   *(Alternatively, you can drag and drop your files directly into the GitHub web interface or use GitHub Desktop).*

#### Step 2: Deploy on Render.com
1. Go to [render.com](https://render.com) and click **Sign Up** (sign in with your GitHub account).
2. On your Render dashboard, click **New +** and select **Web Service**.
3. Select your repository `government-hospital-vijayapura-qr` and click **Connect**.
4. Configure these simple settings:
   - **Name**: `govt-hospital-vijayapura-qr`
   - **Region**: Singapore (or nearest to India)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.

#### Step 3: Get Your Permanent Public HTTPS URL
1. Render will build and deploy the project in approximately 1 to 2 minutes.
2. Once complete, Render displays your permanent public HTTPS URL at the top of the dashboard, for example:
   ```
   https://govt-hospital-vijayapura-qr.onrender.com
   ```
3. Open this link in any browser on your computer or phone — the website is now live online 24/7!

#### Step 4: Generate & Print the Final Permanent QR Code
1. Open your live website (e.g. `https://govt-hospital-vijayapura-qr.onrender.com`).
2. Click **"📱 QR Station"** in the top navigation bar.
3. The system will automatically detect the public HTTPS domain and display:
   ```
   🟢 Final Permanent Public QR Code Active
   ```
4. Click **"🖨️ Print Hospital Entrance Signboard"** or **"⬇️ Download QR Code (PNG)"**.
5. This QR code will now work on any smartphone at any time, even when your computer is completely turned off and VS Code is closed!

---

## 💻 Running the Project Locally (Windows 11)

### 1. Open Terminal in the Project Folder
1. Open Windows File Explorer and navigate to:
   `C:\Users\Admin\Desktop\hospital-qr-navigation`
2. Right-click inside an empty space and choose **"Open in Terminal"** (or open PowerShell).

### 2. Install Dependencies
```powershell
npm install
```

### 3. Start the Server
```powershell
npm start
```
You will see:
```text
========================================================================
 🏥  GOVERNMENT HOSPITAL VIJAYAPURA – MULTILINGUAL QR NAVIGATION        
 🎓  DTSI Project | Student Innovation & Healthcare Wayfinding Prototype
========================================================================
 ✅ Local Computer:       http://localhost:3000
 ⚠️  Public URL Notice:   Deploy to Render/Railway to get permanent HTTPS QR.
 🌐 Languages Supported:  English | ಕನ್ನಡ | हिंदी
========================================================================
```

### 4. Open in Your Browser
Open your browser and visit:
```
http://localhost:3000
```

---

## 🧪 Running Automated Tests

To verify that all 15 sample departments, trilingual translations, emergency endpoints, symptom search, and QR code security checks are functioning correctly:

```powershell
npm test
```
Result:
```text
Test Summary: 31 Passed, 0 Failed
🎉 All automated tests passed successfully!
```

---

## 📂 Project Structure

```
hospital-qr-navigation/
│
├── data/
│   ├── departments.json         # 15 sample hospital departments with EN/KN/HI
│   └── departments.backup.json  # Backup for 1-click restore functionality
│
├── public/
│   ├── css/
│   │   └── style.css            # Responsive hospital styling & print layouts
│   ├── js/
│   │   ├── i18n.js              # English, Kannada, and Hindi translation dictionary
│   │   └── app.js               # Search, symptom chips, audio, cloud QR, modals
│   └── index.html               # Main responsive single-page web application
│
├── test/
│   └── server.test.js           # Automated verification test suite (31 tests)
│
├── render.yaml                  # 1-click deployment configuration for Render.com
├── .gitignore                   # Excludes node_modules from git commits
├── server.js                    # Express backend & QR code engine
├── package.json                 # Project dependencies and deployment scripts
└── README.md                    # Complete documentation and deployment guide
```

---

## 🏛️ Academic DTSI Project Notes

- **Institution / Target Facility**: Government Hospital Vijayapura (District Hospital), Karnataka.
- **Languages Implemented**: English, Kannada (ಕನ್ನಡ), Hindi (हिंदी).
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+), Node.js, Express, QRCode.
- **Zero Paid Dependencies**: Runs without databases, paid map APIs, or third-party tracking.
- **Safety Precaution**: All room numbers and landmarks are labeled as sample demonstration layouts for academic review.

Developed for **Government Hospital Vijayapura DTSI Innovation Project**.
