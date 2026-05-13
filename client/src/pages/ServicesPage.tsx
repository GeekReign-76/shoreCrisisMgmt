import "./ServicesPage.css";

const services = [
  { title: "Individual Therapy", desc: "One-on-one therapy sessions tailored to your unique needs, helping you develop coping strategies, process emotions, and work toward your personal goals." },
  { title: "Child & Adolescent Therapy", desc: "Specialized therapeutic support designed for young people ages 13 and up, addressing the unique challenges of growing up in today's world." },
  { title: "Psychiatric Evaluation", desc: "Comprehensive psychiatric assessments to understand your mental health needs and create an effective, personalized treatment plan." },
  { title: "Psychological Testing", desc: "Evidence-based psychological testing and assessment for accurate diagnosis, including cognitive, personality, and behavioral evaluations." },
  { title: "Crisis Intervention", desc: "Immediate, compassionate support during mental health emergencies. Available 24 hours a day — because crises don't wait for business hours." },
];

const specialties = [
  "Anxiety", "Depression", "Trauma / PTSD", "Grief & Loss",
  "Stress Management", "Bipolar Disorder", "Anger Management",
  "Life Transitions", "Addiction / Recovery", "LGBTQ+ Issues", "Sleep Issues",
];

const ageGroups = [
  { group: "Adolescents", range: "13–17" },
  { group: "Young Adults", range: "18–25" },
  { group: "Adults", range: "26–64" },
  { group: "Seniors", range: "65+" },
];

export default function ServicesPage() {
  return (
    <div className="services-page">
      <div className="page-header">
        <div className="container">
          <h1>Our Services</h1>
          <p>Comprehensive mental health care tailored to your needs</p>
        </div>
      </div>

      <section className="container section">
        <div className="services-list">
          {services.map((s) => (
            <div key={s.title} className="card service-detail-card">
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="specialties-section section">
        <div className="container">
          <h2>Areas of Specialty</h2>
          <div className="specialties-grid">
            {specialties.map((s) => (
              <div key={s} className="specialty-tag">{s}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>Who We Serve</h2>
        <div className="age-grid">
          {ageGroups.map((a) => (
            <div key={a.group} className="card age-card">
              <h3>{a.group}</h3>
              <p>Ages {a.range}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
