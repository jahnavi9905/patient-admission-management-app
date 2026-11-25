// All calls to the Flask backend live in this one file.
// "/api" is a relative path: it works when the frontend is served by the
// Flask backend itself (deployed app), and in local development Vite
// proxies /api to http://localhost:5000 (see vite.config.js).
const API_URL = "/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Backend validation errors come back as { "error": "message" }
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

export function fetchOptions() {
  return fetch(`${API_URL}/options`).then(handleResponse);
}

export function fetchPatients({ search, ward, department, doctor }) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (ward) params.set("ward", ward);
  if (department) params.set("department", department);
  if (doctor) params.set("doctor", doctor);
  return fetch(`${API_URL}/patients?${params.toString()}`).then(handleResponse);
}

export function createPatient(patient) {
  return fetch(`${API_URL}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  }).then(handleResponse);
}

export function updatePatient(id, patient) {
  return fetch(`${API_URL}/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  }).then(handleResponse);
}

export function dischargePatient(id) {
  return fetch(`${API_URL}/patients/${id}/discharge`, {
    method: "PATCH",
  }).then(handleResponse);
}

export function deletePatient(id) {
  return fetch(`${API_URL}/patients/${id}`, {
    method: "DELETE",
  }).then(handleResponse);
}
