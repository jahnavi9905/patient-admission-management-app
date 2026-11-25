// Frontend validation - these are the SAME rules the backend enforces.
// Checking in the browser first gives the user instant feedback;
// the backend checks again so bad data can never reach the database.

export function validatePatient(form, options) {
  const errors = {};

  // Name: required, letters and spaces only
  if (!form.name.trim()) {
    errors.name = "Name is required.";
  } else if (!/^[A-Za-z ]+$/.test(form.name.trim())) {
    errors.name = "Name must contain letters only.";
  }

  // Age: required, whole number 0-120
  if (form.age === "" || form.age === null) {
    errors.age = "Age is required.";
  } else if (Number.isNaN(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 120) {
    errors.age = "Age must be between 0 and 120.";
  }

  // Select fields: required, must be one of the dropdown options
  if (!options.genders.includes(form.gender)) errors.gender = "Please select a gender.";
  if (!options.wards.includes(form.ward)) errors.ward = "Please select a ward.";
  if (!options.departments.includes(form.department)) errors.department = "Please select a department.";
  if (!options.doctors.includes(form.doctor)) errors.doctor = "Please select a doctor.";

  // Admission date: required, not in the future
  if (!form.admission_date) {
    errors.admission_date = "Admission Date is required.";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(form.admission_date + "T00:00:00");
    if (chosen > today) errors.admission_date = "Admission Date cannot be in the future.";
  }

  return errors;
}
