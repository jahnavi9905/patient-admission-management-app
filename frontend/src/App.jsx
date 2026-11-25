import { useEffect, useState } from "react";
import PatientForm from "./components/PatientForm";
import PatientList from "./components/PatientList";
import {
  fetchOptions,
  fetchPatients,
  createPatient,
  updatePatient,
  dischargePatient,
  deletePatient,
} from "./api";

// Main page: holds the patient list, the search box and the three filters.
// Whenever search/filter values change, the list is re-fetched from the API.
export default function App() {
  const [options, setOptions] = useState(null);
  const [patients, setPatients] = useState([]);
  const [editingPatient, setEditingPatient] = useState(null);
  const [error, setError] = useState("");

  // Search + filter state
  const [search, setSearch] = useState("");
  const [ward, setWard] = useState("");
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");

  const filters = { search, ward, department, doctor };

  async function loadPatients() {
    try {
      setPatients(await fetchPatients(filters));
    } catch (err) {
      setError(err.message);
    }
  }

  // Load dropdown options once, when the page first opens
  useEffect(() => {
    fetchOptions().then(setOptions).catch((err) => setError(err.message));
  }, []);

  // Reload the list every time a filter or the search text changes
  useEffect(() => {
    if (options) loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ward, department, doctor, options]);

  async function handleSave(patientData, editingId) {
    if (editingId) {
      await updatePatient(editingId, patientData);
      setEditingPatient(null);
    } else {
      await createPatient(patientData);
    }
    loadPatients();
  }

  async function handleDischarge(id) {
    await dischargePatient(id);
    loadPatients();
  }

  async function handleDelete(id) {
    await deletePatient(id);
    if (editingPatient?.id === id) setEditingPatient(null);
    loadPatients();
  }

  function filterSelect(label, value, setValue, list) {
    return (
      <label className="field">
        <span>{label}</span>
        <select value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">All {label}s</option>
          {list.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
    );
  }

  if (!options) return <p className="loading">Loading… (is the backend running on port 5000?)</p>;

  return (
    <div className="page">
      <header>
        <h1>Patient Admission Management</h1>
        <p>Hospital staff tool to manage admitted patients.</p>
      </header>

      {error && <p className="error banner">{error}</p>}

      <PatientForm
        options={options}
        editingPatient={editingPatient}
        onSave={handleSave}
        onCancelEdit={() => setEditingPatient(null)}
      />

      <section className="card">
        <h2>Patients ({patients.length})</h2>

        <div className="filters">
          <label className="field">
            <span>Search by name</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a patient name…"
            />
          </label>
          {filterSelect("Ward", ward, setWard, options.wards)}
          {filterSelect("Department", department, setDepartment, options.departments)}
          {filterSelect("Doctor", doctor, setDoctor, options.doctors)}
        </div>

        <PatientList
          patients={patients}
          onEdit={setEditingPatient}
          onDischarge={handleDischarge}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
