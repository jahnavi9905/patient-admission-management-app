// The patient table. Each row shows one patient with Edit / Discharge /
// Delete buttons. Delete asks for confirmation first (window.confirm).
export default function PatientList({ patients, onEdit, onDischarge, onDelete }) {
  function handleDelete(patient) {
    const ok = window.confirm(
      `Are you sure you want to delete ${patient.name}? This cannot be undone.`
    );
    if (ok) onDelete(patient.id);
  }

  if (patients.length === 0) {
    return <p className="empty">No patients found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Age</th><th>Gender</th><th>Ward</th>
            <th>Department</th><th>Doctor</th><th>Admission Date</th>
            <th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.age}</td>
              <td>{p.gender}</td>
              <td>{p.ward}</td>
              <td>{p.department}</td>
              <td>{p.doctor}</td>
              <td>{p.admission_date}</td>
              <td>
                <span className={p.status === "Admitted" ? "badge admitted" : "badge discharged"}>
                  {p.status}
                </span>
              </td>
              <td className="actions">
                <button onClick={() => onEdit(p)}>Edit</button>
                {p.status === "Admitted" && (
                  <button onClick={() => onDischarge(p.id)}>Discharge</button>
                )}
                <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
