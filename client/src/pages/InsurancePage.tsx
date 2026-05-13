import "./InsurancePage.css";

const providers = [
  { name: "Aetna", desc: "In-network provider accepting most Aetna plans." },
  { name: "BlueCross BlueShield", desc: "In-network provider accepting BCBS plans." },
  { name: "Carolina Complete", desc: "Accepting Carolina Complete Health coverage." },
  { name: "Vaya Health", desc: "In-network with Vaya Health managed care." },
  { name: "Alliance Health", desc: "Accepting Alliance Health plans." },
];

export default function InsurancePage() {
  return (
    <div className="insurance-page">
      <div className="page-header">
        <div className="container">
          <h1>Insurance & Fees</h1>
          <p>We work to make mental health care accessible</p>
        </div>
      </div>

      <section className="container section">
        <h2 style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>Accepted Insurance</h2>
        <div className="providers-grid">
          {providers.map((p) => (
            <div key={p.name} className="card provider-card">
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section section">
        <div className="container">
          <div className="card" style={{ maxWidth: 700, margin: "0 auto" }}>
            <h3>Questions About Coverage?</h3>
            <p>
              We recommend contacting your insurance provider to verify your mental health benefits
              before your first appointment. Our team can also help you understand your coverage
              options.
            </p>
            <p style={{ marginTop: "var(--space-4)" }}>
              <strong>Contact us:</strong> admin@shorecrisismgmt.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
