import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import InstitutionVerificationForm from "../../components/InstitutionVerificationForm";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
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
  available_blood_groups: "",
  notes: "",
};

export default function InstitutionRejectedPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    Promise.all([apiRequest("/institutions/me", { token }).catch(() => null), apiRequest("/cities").catch(() => [])])
      .then(([profileData, cityData]) => {
        setCities(cityData);
        setProfile(profileData);
        if (profileData) {
          setForm({ ...initialForm, ...profileData });
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
      await apiRequest("/institutions/me/resubmit", { method: "POST", token, body: form });
      setMessage("Institution details resubmitted for admin review.");
      navigate("/institution/verification-pending", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading institution review details" />;
  if (!profile) return <EmptyState title="Institution details unavailable" description="Your verification submission could not be loaded." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution verification"
          title="Institution review rejected"
          description={profile.rejection_reason || "Your institution submission needs corrections before it can be approved."}
          actions={<StatusBadge value="rejected" />}
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      </section>
      <section className="content-card">
        <SectionIntro
          eyebrow="Correct details"
          title="Resubmit for Review"
          description="Update the submitted verification details below and resubmit the institution for admin review."
        />
        <InstitutionVerificationForm
          form={form}
          setForm={setForm}
          cities={cities}
          onSubmit={handleSubmit}
          submitLabel="Resubmit for Review"
          submitting={submitting}
        />
      </section>
    </div>
  );
}
