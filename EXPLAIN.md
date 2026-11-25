# How This App Works — A Walkthrough for Jahnavi

Read this before Round 2. The goal: you should be able to explain every
part of this app in simple words, and make a small change live if asked.

## The big picture (say this first in Round 2)

> "It is a Patient Admission Management app with two parts. The frontend
> is React — that is what the user sees in the browser. The backend is a
> Python Flask API — that is where the data is checked and saved. The
> frontend never talks to the database directly; it sends HTTP requests
> to the backend, and the backend reads/writes a SQLite database file,
> so the data stays saved even after the server restarts."

Data flow for one example — adding a patient:

1. User fills the form in React and clicks **Add Patient**.
2. React checks the values first (`validation.js`) — instant feedback.
3. React sends a `POST` request with the data as JSON to the Flask backend (`api.js`).
4. Flask checks the values **again** (`validate_patient` in `app.py`).
   If anything is wrong, it replies with an error message and saves nothing.
5. If valid, Flask inserts a row into the SQLite table and replies with the saved patient.
6. React re-loads the patient list, so the new patient appears in the table.

## Backend — `backend/app.py` (Flask, the part that is new for you)

Flask basics in one line: a **route** is a function that runs when a
request arrives at a URL. `@app.get("/api/patients")` means "when a GET
request comes to /api/patients, run the function below it."

The file top to bottom:

- **Imports + `CORS(app)`** — CORS allows the React site (port 5173) to
  call the API (port 5000). Browsers block cross-port calls without it.
- **`OPTIONS` dictionary** — the ONE place where the dropdown lists live
  (genders, wards, departments, doctors). The frontend downloads these
  from `GET /api/options`, so there is no second copy to keep in sync.
  *Easy live change: add a ward or a doctor here and it appears in the UI.*
- **`get_db()` / `init_db()`** — open the SQLite file `patients.db` and
  create the `patients` table if it does not exist. SQLite is just a
  file — no database server to install. That file is why data survives
  a restart.
- **`validate_patient(data)`** — checks every rule and returns the FIRST
  error message it finds, or `None` if the data is good:
  name required + letters only (checked with a regular expression),
  age required + 0–120, the four select fields must be one of the
  `OPTIONS` values, admission date required + not in the future.
- **Routes:**
  - `GET /api/patients` — list. It reads optional query parameters
    (`?search=`, `?ward=`, `?department=`, `?doctor=`) and adds a
    `WHERE` condition for each one given, so filters combine.
  - `GET /api/patients/<id>` — one patient; 404 if the id does not exist.
  - `POST /api/patients` — validate, then `INSERT`. Returns 201 (created).
  - `PUT /api/patients/<id>` — validate, then `UPDATE` all fields.
  - `PATCH /api/patients/<id>/discharge` — only changes `status` to
    "Discharged". PATCH is used because it is a partial update.
  - `DELETE /api/patients/<id>` — removes the row; 404 if not found.
- **Status codes to remember:** 200 = OK, 201 = created, 400 = bad data
  (validation failed), 404 = patient not found.
- SQL uses `?` placeholders (e.g. `WHERE id = ?`) instead of putting
  values directly into the query string — this prevents SQL injection.

## Frontend — `frontend/src/`

- **`main.jsx`** — the entry point. It renders `<App />` into the page.
- **`App.jsx`** — the main page. It holds the state (the patient list,
  the search text, the three filter values, and which patient is being
  edited). Every time the search or a filter changes, a `useEffect`
  re-fetches the list from the backend with those filters. It also holds
  the handlers: save (add or update), discharge, delete — each one calls
  the API, then reloads the list.
- **`api.js`** — every `fetch` call to the backend in one file, so the
  rest of the app just calls functions like `createPatient(patient)`.
  If the backend address changes, only `API_URL` at the top changes.
  If the backend replies with an error, this file throws it as a message
  the UI can show.
- **`validation.js`** — the same rules as the backend, in JavaScript.
  Why twice? Frontend validation = fast feedback for the user.
  Backend validation = real protection, because anyone can call the API
  directly and skip the browser. *This "why both" answer is likely to
  be asked — remember it.*
- **`components/PatientForm.jsx`** — ONE form used for both Add and Edit.
  If a patient is being edited, the form pre-fills with their data and
  the button says "Update Patient". On submit it validates first, then
  calls `onSave`. Errors appear in red under each field.
- **`components/PatientList.jsx`** — the table. One row per patient,
  with Edit / Discharge / Delete buttons. Discharge only shows for
  Admitted patients. Delete first shows a confirmation popup
  (`window.confirm`) — deleting only happens if the user clicks OK.
- **`index.css`** — plain CSS. The form and filters use a grid that fits
  as many columns as the screen allows (`auto-fit, minmax(220px, 1fr)`),
  so on a phone everything stacks into one column. The table sits in a
  box with horizontal scrolling on small screens. That is what makes it
  responsive — no framework needed.

## Small changes you can confidently make live in Round 2

Practice these once before the call:

1. **Add a new doctor** — add a name to `OPTIONS["doctors"]` in
   `backend/app.py`, restart the backend. It appears in the form
   dropdown and the Doctor filter automatically.
2. **Add a new ward** — same idea, `OPTIONS["wards"]`.
3. **Change the age limit** — change `120` in `validate_patient`
   (backend) and in `frontend/src/validation.js`.
4. **Change a colour** — e.g. the header colour `#1F4E79` in `index.css`.

## Questions they may ask — short answers

- **Why SQLite?** Simple, file-based, no server setup, and it persists
  after restart, which the task required. For a bigger hospital system
  you would move to MySQL/PostgreSQL — the SQL would barely change.
- **Why Flask?** Small and readable — a route is just one function, good
  for a CRUD API like this.
- **What if two people edit the same patient?** Last save wins in this
  simple version; a production version would add record locking/versioning.
- **How would you add login?** Add a users table, hash passwords, check
  credentials on the backend and protect the routes — the task said
  login was not required, so it was left out on purpose.
