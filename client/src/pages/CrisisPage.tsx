import "./CrisisPage.css";

const hotlines = [
  { name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988", desc: "Free, 24/7 support for people in distress. Available in English and Spanish." },
  { name: "Crisis Text Line", contact: "Text HOME to 741741", desc: "Free, 24/7 crisis counseling via text message." },
  { name: "National Domestic Violence Hotline", contact: "1-800-799-7233", desc: "24/7 support for victims and survivors of domestic violence." },
  { name: "SAMHSA National Helpline", contact: "1-800-662-4357", desc: "Free referral and information service for substance abuse and mental health." },
  { name: "Veterans Crisis Line", contact: "Call 988, then press 1", desc: "24/7 crisis support for veterans and their loved ones." },
  { name: "Trevor Project (LGBTQ+ Youth)", contact: "1-866-488-7386", desc: "Crisis intervention and suicide prevention for LGBTQ+ young people." },
];

export default function CrisisPage() {
  return (
    <div className="crisis-page">
      <div className="page-header crisis-header">
        <div className="container">
          <h1>Crisis Resources</h1>
          <p>If you or someone you know is in crisis, help is available now</p>
        </div>
      </div>

      <section className="container section">
        <div className="card emergency-card">
          <h2>In Immediate Danger?</h2>
          <p>If you or someone you know is in immediate danger, call <strong>911</strong> right away.</p>
          <a href="tel:911" className="btn btn-danger btn-lg" style={{ marginTop: "var(--space-4)" }}>
            Call 911
          </a>
        </div>
      </section>

      <section className="container section">
        <h2 style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>Crisis Hotlines</h2>
        <div className="hotlines-grid">
          {hotlines.map((h) => (
            <div key={h.name} className="card hotline-card">
              <h3>{h.name}</h3>
              <p className="hotline-contact">{h.contact}</p>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="card" style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h3>Shore Crisis Management is Here for You</h3>
          <p>Our team is available 24 hours a day. If you're experiencing a mental health crisis, reach out to us.</p>
          <p style={{ marginTop: "var(--space-3)" }}>
            <strong>Email:</strong> Shorecrisis35@gmail.com<br />
            <strong>Address:</strong> 227 W 4th St, Suite LL102, Charlotte, NC 28202
          </p>
        </div>
      </section>
    </div>
  );
}
