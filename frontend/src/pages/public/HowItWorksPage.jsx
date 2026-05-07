export default function HowItWorksPage() {
  return (
    <div className="public-page">
      <h1>How it works</h1>
      <div className="stacked-cards">
        <section className="info-card">
          <h3>1. Donors register and complete profiles</h3>
          <p>Donors share blood group, city, area, and availability. Admins verify profiles before matching.</p>
        </section>
        <section className="info-card">
          <h3>2. Receivers submit blood requests</h3>
          <p>Patient attendants create requests with hospital details, urgency, required time, and hospital slip upload.</p>
        </section>
        <section className="info-card">
          <h3>3. Admins review and coordinate</h3>
          <p>Approved donors are matched to approved requests using practical MVP rules: blood group, city, availability, and donation recency.</p>
        </section>
      </div>
    </div>
  );
}

