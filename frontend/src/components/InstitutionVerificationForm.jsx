export default function InstitutionVerificationForm({
  form,
  setForm,
  cities,
  onSubmit,
  submitLabel,
  submitting = false,
}) {
  return (
    <form className="grid-form" onSubmit={onSubmit}>
      {Object.entries({
        institution_name: "Institution name",
        institution_type: "Institution type",
        city: "City",
        area: "Area",
        contact_person: "Contact person",
        contact_person_designation: "Contact person designation",
        email: "Email",
        phone: "Phone",
        address: "Address",
        website_social_link: "Website or social link",
        proof_document_url: "Proof document link",
        available_blood_groups: "Available blood groups",
        notes: "Notes",
      }).map(([field, label]) => (
        <label key={field} className={field === "address" || field === "notes" ? "form-span" : undefined}>
          {label}
          {field === "city" ? (
            <select value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} required>
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          ) : field === "address" || field === "notes" ? (
            <textarea rows="3" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
          ) : (
            <input
              value={form[field] || ""}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
              required={field !== "area" && field !== "available_blood_groups" && field !== "website_social_link" && field !== "proof_document_url"}
            />
          )}
        </label>
      ))}
      <div className="form-span">
        <button className="button button-primary" disabled={submitting}>
          {submitting ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
