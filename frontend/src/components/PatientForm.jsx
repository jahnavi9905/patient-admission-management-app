import { useState } from "react";
import { validatePatient } from "../validation";

// One form used for BOTH adding a new patient and editing an existing one.
// When `editingPatient` is set, the form is pre-filled and submits an update.
const EMPTY_FORM = {
  name: "",
  age: "",
  gender: "",
  ward: "",
  department: "",
  doctor: "",
  admission_date: "",
  status: "Admitted",
};

export default function PatientForm({ options, editingPatient, onSave, onCancelEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // When the user clicks "Edit" on a patient, fill the form with their data.
  // We track the id we last loaded so re-renders do not overwrite typing.
  const [loadedId, setLoadedId] = useState(null);
  if (editingPatient && editingPatient.id !== loadedId) {
    setLoadedId(editingPatient.id);
    setForm({ ...editingPatient, age: String(editingPatient.age) });
    setErrors({});
    setServerError("");
  }
  if (!editingPatient && loadedId !== null) {
    setLoadedId(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    // 1. Validate in the browser first
    const found = validatePatient(form, options);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // 2. Send to the backend (it validates again before saving)
    try {
      await onSave({ ...form, age: Number(form.age) }, editingPatient?.id);
      setForm(EMPTY_FORM);
    } catch (err) {
      setServerError(err.message);
    }
  }

  function renderSelect(name, label, list) {
    return (
      <label className="field">
        <span>{label} *</span>
        <select name={name} value={form[name]} onChange={handleChange}>
          <option value="">-- Select {label} --</option>
          {list.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        {errors[name] && <small className="error">{errors[name]}</small>}
      </label>
    );
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editingPatient ? "Edit Patient" : "Add New Patient"}</h2>

      <label className="field">
        <span>Name *</span>
        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ramesh Kumar" />
        {errors.name && <small className="error">{errors.name}</small>}
      </label>

      <label className="field">
        <span>Age *</span>
        <input name="age" type="number" min="0" max="120" value={form.age} onChange={handleChange} placeholder="e.g. 45" />
        {errors.age && <small className="error">{errors.age}</small>}
      </label>

      {renderSelect("gender", "Gender", options.genders)}
      {renderSelect("ward", "Ward", options.wards)}
      {renderSelect("department", "Department", options.departments)}
      {renderSelect("doctor", "Doctor", options.doctors)}

      <label className="field">
        <span>Admission Date *</span>
        <input name="admission_date" type="date" value={form.admission_date} onChange={handleChange} />
        {errors.admission_date && <small className="error">{errors.admission_date}</small>}
      </label>

      {serverError && <p className="error banner">{serverError}</p>}

      <div className="form-buttons">
        <button type="submit" className="primary">
          {editingPatient ? "Update Patient" : "Add Patient"}
        </button>
        {editingPatient && (
          <button type="button" onClick={onCancelEdit}>Cancel Edit</button>
        )}
      </div>
    </form>
  );
}
