# Patient Admission Management App

A web app for hospital staff to manage admitted patients — add, view, search, filter, edit, discharge and delete patient records.

Built for the DScribe (Unriddle Technologies) Software Engineer Intern — Round 1 task.

## Live Link

_Live link: to be added when deployed._

## Screenshots

_To be added when deployed._

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React.js (Vite), plain CSS |
| Backend | Python + Flask (REST API) |
| Database | SQLite (file-based, data persists after server restart) |

## Features

- Add a patient (name, age, gender, ward, department, doctor, admission date, status)
- View the list of all patients
- Filter patients by Ward, Department and Doctor (filters can be combined)
- Search patients by name
- Edit a patient
- Delete a patient (with a confirmation dialog)
- Mark a patient as Discharged
- Responsive design — works on mobile, tablet and desktop
- Validation on **both** frontend and backend:
  - Name: required, letters only
  - Age: required, between 0 and 120
  - Gender / Ward / Department / Doctor: required, must be a valid option
  - Admission Date: required, cannot be a future date
  - Backend rejects invalid data with a clear error message

## How to Run Locally

### 1. Backend (Flask API — port 5000)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API runs at http://localhost:5000 and creates `patients.db` automatically on first run.

### 2. Frontend (React — port 5173)

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/options` | Dropdown lists (genders, wards, departments, doctors) |
| GET | `/api/patients` | List patients — supports `?search=`, `?ward=`, `?department=`, `?doctor=` |
| GET | `/api/patients/<id>` | Get one patient |
| POST | `/api/patients` | Add a patient (validated) |
| PUT | `/api/patients/<id>` | Edit a patient (validated) |
| PATCH | `/api/patients/<id>/discharge` | Mark a patient as Discharged |
| DELETE | `/api/patients/<id>` | Delete a patient |

## Project Structure

```
backend/
  app.py            Flask API, validation and SQLite database code
  requirements.txt  Python dependencies (flask, flask-cors)
frontend/
  src/
    App.jsx                   Main page: list, search and filters
    api.js                    All backend API calls in one place
    validation.js             Frontend validation rules (same as backend)
    components/
      PatientForm.jsx         Add / Edit patient form
      PatientList.jsx         Patient table with action buttons
    index.css                 Styling (responsive)
```
