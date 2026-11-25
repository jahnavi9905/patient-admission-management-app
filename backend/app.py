"""
Patient Admission Management App - Backend
==========================================
Flask + SQLite REST API.

Run it:
    python app.py
Then the API is available at http://localhost:5000

Data is stored in a SQLite file (patients.db) in this same folder,
so patient records stay saved even after the server is restarted.
"""

import os
import re
import sqlite3
from datetime import date
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the React frontend (different port) to call this API

DATABASE = "patients.db"

# ---------------------------------------------------------------------------
# Dropdown options - THE single place where the select lists are defined.
# The frontend fetches these from GET /api/options, so to change a ward,
# department or doctor you only edit this one dictionary.
# ---------------------------------------------------------------------------
OPTIONS = {
    "genders": ["Male", "Female", "Other"],
    "wards": ["General Ward", "ICU", "Private Ward", "Emergency Ward", "Pediatric Ward"],
    "departments": ["General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Neurology", "Surgery"],
    "doctors": ["Dr. Ananya Sharma", "Dr. Rohan Mehta", "Dr. Priya Nair", "Dr. Arjun Reddy", "Dr. Kavya Iyer", "Dr. Vikram Singh"],
    "statuses": ["Admitted", "Discharged"],
}


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    """Open a connection to the SQLite database file."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # rows behave like dictionaries
    return conn


def init_db():
    """Create the patients table if it does not exist yet."""
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS patients (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT NOT NULL,
            age            INTEGER NOT NULL,
            gender         TEXT NOT NULL,
            ward           TEXT NOT NULL,
            department     TEXT NOT NULL,
            doctor         TEXT NOT NULL,
            admission_date TEXT NOT NULL,
            status         TEXT NOT NULL DEFAULT 'Admitted'
        )
        """
    )
    conn.commit()
    conn.close()


# Create the table at startup as well, so the app also works when it is
# run by a production server (e.g. gunicorn) instead of `python app.py`.
init_db()


def row_to_patient(row):
    """Convert a database row into a plain dictionary for JSON output."""
    return {
        "id": row["id"],
        "name": row["name"],
        "age": row["age"],
        "gender": row["gender"],
        "ward": row["ward"],
        "department": row["department"],
        "doctor": row["doctor"],
        "admission_date": row["admission_date"],
        "status": row["status"],
    }


# ---------------------------------------------------------------------------
# Validation - the SAME rules are also checked in the frontend.
# Returns an error message string, or None when the data is valid.
# ---------------------------------------------------------------------------
def validate_patient(data):
    # Name: required, letters and spaces only
    name = (data.get("name") or "").strip()
    if not name:
        return "Name is required."
    if not re.fullmatch(r"[A-Za-z ]+", name):
        return "Name must contain letters only."

    # Age: required, a whole number between 0 and 120
    age = data.get("age")
    if age is None or age == "":
        return "Age is required."
    try:
        age = int(age)
    except (TypeError, ValueError):
        return "Age must be a number."
    if age < 0 or age > 120:
        return "Age must be between 0 and 120."

    # Select fields: required, and must be one of the allowed options
    if data.get("gender") not in OPTIONS["genders"]:
        return "Gender is required - please select a valid gender."
    if data.get("ward") not in OPTIONS["wards"]:
        return "Ward is required - please select a valid ward."
    if data.get("department") not in OPTIONS["departments"]:
        return "Department is required - please select a valid department."
    if data.get("doctor") not in OPTIONS["doctors"]:
        return "Doctor is required - please select a valid doctor."

    # Admission date: required, valid date, not in the future
    admission_date = (data.get("admission_date") or "").strip()
    if not admission_date:
        return "Admission Date is required."
    try:
        parsed = date.fromisoformat(admission_date)
    except ValueError:
        return "Admission Date must be a valid date."
    if parsed > date.today():
        return "Admission Date cannot be in the future."

    # Status: optional when creating (defaults to Admitted), must be valid
    status = data.get("status", "Admitted")
    if status not in OPTIONS["statuses"]:
        return "Status must be 'Admitted' or 'Discharged'."

    return None


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
@app.get("/api/options")
def get_options():
    """Send the dropdown lists to the frontend."""
    return jsonify(OPTIONS)


@app.get("/api/patients")
def list_patients():
    """
    List patients. Optional query parameters:
      search     - filter by patient name (partial, case-insensitive)
      ward       - exact ward
      department - exact department
      doctor     - exact doctor
    """
    search = request.args.get("search", "").strip()
    ward = request.args.get("ward", "").strip()
    department = request.args.get("department", "").strip()
    doctor = request.args.get("doctor", "").strip()

    query = "SELECT * FROM patients WHERE 1=1"
    params = []
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")
    if ward:
        query += " AND ward = ?"
        params.append(ward)
    if department:
        query += " AND department = ?"
        params.append(department)
    if doctor:
        query += " AND doctor = ?"
        params.append(doctor)
    query += " ORDER BY id DESC"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([row_to_patient(r) for r in rows])


@app.get("/api/patients/<int:patient_id>")
def get_patient(patient_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    if row is None:
        return jsonify({"error": "Patient not found."}), 404
    return jsonify(row_to_patient(row))


@app.post("/api/patients")
def create_patient():
    data = request.get_json(silent=True) or {}
    error = validate_patient(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO patients (name, age, gender, ward, department, doctor, admission_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data["name"].strip(),
            int(data["age"]),
            data["gender"],
            data["ward"],
            data["department"],
            data["doctor"],
            data["admission_date"],
            data.get("status", "Admitted"),
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    return jsonify(row_to_patient(row)), 201


@app.put("/api/patients/<int:patient_id>")
def update_patient(patient_id):
    data = request.get_json(silent=True) or {}
    error = validate_patient(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db()
    existing = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Patient not found."}), 404
    conn.execute(
        """UPDATE patients SET name = ?, age = ?, gender = ?, ward = ?, department = ?,
           doctor = ?, admission_date = ?, status = ? WHERE id = ?""",
        (
            data["name"].strip(),
            int(data["age"]),
            data["gender"],
            data["ward"],
            data["department"],
            data["doctor"],
            data["admission_date"],
            data.get("status", existing["status"]),
            patient_id,
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    return jsonify(row_to_patient(row))


@app.patch("/api/patients/<int:patient_id>/discharge")
def discharge_patient(patient_id):
    """Mark one patient as Discharged (status change only)."""
    conn = get_db()
    existing = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Patient not found."}), 404
    conn.execute("UPDATE patients SET status = 'Discharged' WHERE id = ?", (patient_id,))
    conn.commit()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    return jsonify(row_to_patient(row))


@app.delete("/api/patients/<int:patient_id>")
def delete_patient(patient_id):
    conn = get_db()
    existing = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Patient not found."}), 404
    conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Patient deleted successfully."})


# ---------------------------------------------------------------------------
# Frontend hosting (used when the app is deployed as a single service)
# When the React build exists at ../frontend/dist, Flask serves it at / and
# the API stays under /api. Locally, when there is no build, / just returns
# a small status message and the React dev server runs separately.
# ---------------------------------------------------------------------------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


@app.get("/")
def home():
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"message": "Patient Admission Management API is running."})


@app.get("/<path:path>")
def serve_frontend(path):
    """Serve the built frontend's static files; unknown paths get index.html."""
    if path.startswith("api/"):
        return jsonify({"error": "Not found."}), 404
    file_path = os.path.join(FRONTEND_DIST, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(FRONTEND_DIST, path)
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"error": "Not found."}), 404


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
