import CityCombobox from "./CityCombobox";

const institutionTypes = ["Hospital", "Blood Bank", "NGO/Welfare Organization", "Blood Donor Society", "Educational Institution", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function groupsFromValue(value) {
  if (!value) return [];
  return value.split(",").map((group) => group.trim()).filter(Boolean);
}

export default function InstitutionVerificationForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  submitting = false,
  proofDocument,
  setProofDocument,
  showProfileFields = false,
  proofRequired = false,
}) {
  const selectedGroups = groupsFromValue(form.available_blood_groups);

  const toggleGroup = (group) => {
    const nextGroups = selectedGroups.includes(group)
      ? selectedGroups.filter((item) => item !== group)
      : [...selectedGroups, group];
    setForm((current) => ({ ...current, available_blood_groups: nextGroups.join(", ") }));
  };

  return (
    <form className="grid-form" onSubmit={onSubmit}>
      <label className="field-required">
        Institution name
        <input value={form.institution_name || ""} onChange={(event) => setForm((current) => ({ ...current, institution_name: event.target.value }))} required />
      </label>
      <label className="field-required">
        Institution type
        <select value={form.institution_type || "Hospital"} onChange={(event) => setForm((current) => ({ ...current, institution_type: event.target.value }))} required>
          {institutionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="field-required city-combo-wrap">
        City
        <CityCombobox value={form.city || ""} onChange={(city) => setForm((current) => ({ ...current, city }))} required />
      </label>
      <label className="field-required">
        Area
        <input value={form.area || ""} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} required />
      </label>
      <label className="field-required form-span">
        Full address
        <textarea rows="3" value={form.address || ""} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} required />
      </label>
      <label className="field-required">
        Contact person name
        <input value={form.contact_person || ""} onChange={(event) => setForm((current) => ({ ...current, contact_person: event.target.value }))} required />
      </label>
      <label className="field-required">
        Contact person designation
        <input value={form.contact_person_designation || ""} onChange={(event) => setForm((current) => ({ ...current, contact_person_designation: event.target.value }))} required />
      </label>
      <label className="field-required">
        Official email
        <input type="email" value={form.email || ""} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
      </label>
      <label className="field-required">
        Phone number
        <input value={form.phone || ""} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
      </label>
      <label>
        Website or social link <span className="optional-label">Optional</span>
        <input value={form.website_social_link || ""} onChange={(event) => setForm((current) => ({ ...current, website_social_link: event.target.value }))} />
      </label>
      <label className={proofRequired ? "field-required" : undefined}>
        Proof document {proofRequired ? null : <span className="optional-label">Optional</span>}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setProofDocument(event.target.files?.[0] || null)} required={proofRequired} />
        <span className="field-hint">
          {proofDocument ? proofDocument.name : form.proof_document_url ? "Existing proof document is on file." : "PDF, JPG, JPEG, or PNG."}
        </span>
      </label>

      {showProfileFields ? (
        <>
          <label>
            Operating hours <span className="optional-label">Optional</span>
            <input
              value={form.operating_hours || ""}
              onChange={(event) => setForm((current) => ({ ...current, operating_hours: event.target.value }))}
              placeholder='Example: "24/7" or "Mon-Fri, 9 AM - 6 PM"'
            />
          </label>
          <fieldset className="form-span checkbox-fieldset">
            <legend>Available blood groups</legend>
            <div className="checkbox-grid">
              {bloodGroups.map((group) => (
                <label key={group} className="checkbox-row">
                  <input type="checkbox" checked={selectedGroups.includes(group)} onChange={() => toggleGroup(group)} />
                  <span>{group}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="form-span">
            Additional info for donors and request creators <span className="optional-label">Optional</span>
            <textarea
              rows="4"
              value={form.notes || ""}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Share helpful coordination details such as donor group availability, preferred contact timing, or verification instructions."
            />
          </label>
        </>
      ) : null}

      <div className="form-span">
        <button className="button button-primary" disabled={submitting}>
          {submitting ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
