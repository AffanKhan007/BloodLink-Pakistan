import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import InstitutionVerificationForm from "../../components/InstitutionVerificationForm";
import { AlertMessage, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";

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

export default function InstitutionProfilePage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ ...initialForm, email: user?.email || "", phone: user?.phone || "", contact_person: user?.full_name || "" });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/institutions/me", { token }).catch(() => null), apiRequest("/cities").catch(() => [])])
      .then(([profile, cityData]) => {
        setCities(cityData);
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
    try {
      await apiRequest("/institutions/me", { method: "POST", token, body: form });
      setMessage("Institution profile saved.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) return <LoadingState label="Loading institution profile" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution profile"
          title="Organization details"
          description="Keep your institution identity, approval details, and public-facing donor information accurate."
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <InstitutionVerificationForm
          form={form}
          setForm={setForm}
          cities={cities}
          onSubmit={handleSubmit}
          submitLabel="Save institution profile"
        />
      </section>
    </div>
  );
}
