# 🏥 AI HealthVerse

> **Next-Generation Intelligent Healthcare Platform & Clinical Decision Support System (CDSS)**

AI HealthVerse is an advanced, AI-powered digital healthcare ecosystem designed to bridge the gap between patients and medical professionals. Powered by **FastAPI**, **React 19**, **Google Gemini Vision**, **DeepSeek-R1**, and **PostgreSQL**, AI HealthVerse provides real-time intelligent medical consultations, automated OCR lab report parsing, clinical decision support for physicians, and seamless hospital appointment scheduling.

---

## 🌟 Key Features

### 🤖 AI-Powered Clinical Consultation
- **Intelligent Symptom Triage**: Real-time conversational intake analyzing patient symptoms.
- **Dual-Engine AI**: DeepSeek-R1 for deep reasoning with Google Gemini 3.6 Flash fallback for speed & reliability.
- **Automated Summary & Speciality Matching**: Recommends appropriate medical specialists and urgency levels (Emergency, Urgent, Routine).

### 📄 Multimodal Medical Report Analysis (OCR)
- **Document & Image Parsing**: Processes lab PDFs and medical images using PyMuPDF, Tesseract OCR, and Gemini Multimodal Vision.
- **Lab Value Extraction**: Extracts key lab biomarkers, normal/abnormal ranges, and medical flags.
- **Patient-Friendly Explanations**: Converts complex clinical terminology into clear, actionable health insights.

### 🩺 Doctor CDSS (Clinical Decision Support System)
- **Differential Diagnoses**: Assists physicians by generating prioritized differential diagnostic considerations.
- **Treatment & Interaction Checks**: Highlights potential drug-drug interactions, treatment guidelines, and diagnostic workups.
- **Patient History Synthesis**: Aggregates consultation notes and past lab reports into a concise physician dashboard.

### 🏥 Multi-Speciality Hospital Directory & Appointment Booking
- **Super-Speciality Network**: Integrated network of top hospitals and specialist physicians.
- **Dynamic Slot Reservation**: Real-time availability checking and instant appointment booking backed by PostgreSQL.
- **Patient Appointment Manager**: View, filter, and track upcoming and past medical consultations.

### 📊 Patient Health Dashboard & Tracker
- **Health Metrics Tracking**: Interactive charts powered by Recharts (Vitals, Blood Pressure, Glucose, Cholesterol).
- **Medication Reminders**: Daily medication schedule tracking, dosage alerts, and adherence logging.
- **Health History Log**: Complete timeline of past consultations, uploaded reports, and diagnostic records.

### 🔐 Enterprise Security & Access Control
- **Role-Based Access Control (RBAC)**: Dedicated interfaces and permission levels for Patients and Healthcare Providers.
- **Secure Authentication**: JWT token-based authentication with bcrypt password hashing.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) / SQLite (SQLAlchemy 2.0 ORM) |
| **AI / Multimodal** | Google Gemini Generative AI SDK, DeepSeek-R1 API |
| **OCR & Processing** | PyMuPDF (fitz), Tesseract OCR, Pillow |
| **Frontend Framework** | [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/) |
| **UI & Visualizations** | Custom CSS Design System, Recharts, Lucide Icons, Canvas Confetti |
| **Auth & Security** | PyJWT, Passlib, Bcrypt |

---

## 📂 Project Structure

```text
aihealthverse/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & middleware
│   ├── config.py                   # Environment settings & Pydantic configuration
│   ├── requirements.txt            # Python dependencies
│   ├── test_system_integration.py  # System-wide integration test suite
│   ├── benchmark_speed.py          # LLM & OCR performance benchmarking script
│   ├── routers/                    # API Endpoints
│   │   ├── auth.py                 # User authentication & registration
│   │   ├── consultation.py         # AI consultation & triage routes
│   │   ├── reports.py              # Report upload & OCR extraction routes
│   │   └── appointments.py         # Hospital directory & appointment booking
│   ├── services/                   # Core Business Logic
│   │   ├── llm_service.py          # Gemini & DeepSeek AI integrations
│   │   └── rag_engine.py           # Retrieval-augmented generation engine
│   └── database/                   # Database Layer
│       ├── database.py             # Engine & Session creation
│       ├── models.py               # SQLAlchemy models (User, Hospital, Doctor, etc.)
│       └── seed_data.py            # Initial seed data generator
└── frontend/
    ├── index.html                  # HTML entrypoint
    ├── vite.config.js              # Vite bundler configuration
    ├── package.json                # Frontend dependencies & scripts
    └── src/
        ├── App.jsx                 # Main layout & routing router
        ├── main.jsx                # Application root mounting
        ├── context/                # Global Auth & App context state
        ├── views/                  # UI Views & Dashboards
        │   ├── ConsultationView.jsx        # AI Consultation Chat interface
        │   ├── ReportUploadView.jsx        # Multimodal OCR scanner view
        │   ├── DoctorCDSSView.jsx          # Doctor CDSS interface
        │   ├── PatientDashboardView.jsx    # Patient main dashboard
        │   ├── AppointmentBookingView.jsx  # Doctor & Hospital booking
        │   └── HealthOverviewDashboardView.jsx # Health metrics & analytics
        └── components/             # Reusable UI components
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Python**: `3.10` or higher
- **Node.js**: `18.0` or higher (`npm` included)
- **Tesseract OCR** (Optional, for fallback OCR processing): [Tesseract Installation Guide](https://tesseract-ocr.github.io/)

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/aihealthverse
   GOOGLE_API_KEY=your_gemini_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   JWT_SECRET=your_super_secret_jwt_key
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=10080
   APP_NAME=AI HealthVerse Backend
   DEBUG=True
   ```
   *(Note: SQLite `sqlite:///./aihealthverse.db` can be used as fallback for local development if PostgreSQL is not active).*

5. **Start the Backend Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API documentation will be available at:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node modules**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Verification

The repository includes comprehensive automated test suites and benchmark utilities.

### System Integration Testing
To run the full end-to-end integration test (Database schema creation, Seeding, Appointment booking, Gemini OCR, and LLM Consultation):
```bash
cd backend
python test_system_integration.py
```

### Performance Benchmarking
To test AI response latency and OCR processing times:
```bash
cd backend
python benchmark_speed.py
```

---

## 🛰️ Key API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new patient or doctor account |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| `POST` | `/api/consultation/chat` | Send symptom query to AI Consultation Engine |
| `POST` | `/api/reports/upload` | Upload PDF/image lab report for OCR analysis |
| `GET` | `/api/appointments/hospitals` | List all super-speciality hospitals & doctors |
| `POST` | `/api/appointments/book` | Book an appointment with a specialist doctor |
| `GET` | `/health` | Check backend & AI services health status |

---

## ⚡ How to Run Backend & Frontend (Quick Reference)

### 1️⃣ Start Backend Server (Terminal 1)
```bash
# Step 1: Navigate to backend folder
cd backend

# Step 2: Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Step 3: Install dependencies (if not already installed)
pip install -r requirements.txt

# Step 4: Run the FastAPI backend server
uvicorn main:app --reload --port 8000
```
> 📍 **Backend Server API**: [http://localhost:8000](http://localhost:8000)  
> 📑 **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2️⃣ Start Frontend Server (Terminal 2)
```bash
# Step 1: Navigate to frontend folder
cd frontend

# Step 2: Install Node modules (if not already installed)
npm install

# Step 3: Launch Vite development server
npm run dev
```
> 📍 **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

