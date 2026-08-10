import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import InstitutionVerificationForm from "../../components/InstitutionVerificationForm";
import { AlertMessage, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

const initialForm = {
  institution_name: "",
  institution_type: "",
  city: "",
  area: "",
  contact_person: "",
  contact_person_designation: "",
  email: "",
  phone: "",
  address: "",
  website_social_link: "",
  proof_document_url: "",
  operating_hours: "",
  available_blood_groups: "",
  notes: "",
};

export default function InstitutionProfilePage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ ...initialForm, email: user?.email || "", phone: user?.phone || "", contact_person: user?.full_name || "" });
  const [proofDocument, setProofDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/institutions/me", { token }).catch(() => null)
      .then((profile) => {
        if (profile) {
          setForm({ ...initialForm, ...profile });
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (!["id", "user_id", "status", "rejection_reason", "created_at", "updated_at", "approved_at", "approved_by_user_id", "status_changed_by_user_id"].includes(key)) {
          formData.append(key, value || "");
        }
      });
      if (proofDocument) {
        formData.append("proof_document", proofDocument);
      }
      const updated = await apiRequest("/institutions/me", { method: "POST", token, body: formData, isFormData: true });
      setForm({ ...initialForm, ...updated });
      setProofDocument(null);
      setMessage(updated.status === "pending" ? "Proof document uploaded. Your institution is pending admin re-review." : "Institution profile saved.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading institution profile" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution profile"
          title="Organization details"
          description="Manage verification and public details."
          actions={<StatusBadge value={form.status || "approved"} />}
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <InstitutionVerificationForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitLabel="Save institution profile"
          submitting={submitting}
          proofDocument={proofDocument}
          setProofDocument={setProofDocument}
          showProfileFields
        />
      </section>
    </div>
  );
}
