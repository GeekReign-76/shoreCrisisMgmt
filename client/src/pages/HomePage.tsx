import { Link } from "react-router-dom";
import "./HomePage.css";

const services = [
  { title: "Individual Therapy", desc: "One-on-one sessions tailored to your unique needs and goals." },
  { title: "Child & Adolescent", desc: "Specialized support for young people navigating mental health challenges." },
  { title: "Psychiatric Evaluation", desc: "Comprehensive assessments to guide your treatment plan." },
  { title: "Psychological Testing", desc: "Evidence-based testing for accurate diagnosis and targeted care." },
  { title: "Crisis Intervention", desc: "Immediate support when you need it most — available 24 hours." },
];

export default function HomePage() {
  return (
    <div className="home">
      {/* Crisis Banner */}
      <div className="crisis-banner">
        If you or someone you know is in immediate danger, call <strong>911</strong> or the{" "}
        <strong>988 Suicide & Crisis Lifeline</strong> (call/text 988)
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content container">
          <img src="/logo.png" alt="Shore Crisis Management" className="hero-logo" />
          <h1>Shore Crisis Management</h1>
          <p className="hero-tagline">Helping You Weather the Waves of Life</p>
          <p className="hero-desc">
            We are here to help you through life's most challenging moments.
            Everyone deserves compassionate, professional mental health support — and we're ready when you are.
          </p>
          <div className="hero-actions">
            <Link to="/booking" className="btn btn-accent btn-lg">Book a Consultation</Link>
            <Link to="/contact" className="btn btn-outline btn-lg" style={{ borderColor: "white", color: "white" }}>Contact Us</Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section container">
        <div className="about-card card">
          <h2>Our Mission</h2>
          <p>
            Founded by Tyrin Miller, Shore Crisis Management was born from a simple belief:
            <em> "I've always felt like my purpose was to be able to help others in need."</em>
          </p>
          <p>
            We specialize in helping individuals navigate mental health crises with dignity,
            professionalism, and genuine care. Our team brings expertise across a wide range
            of specialties to meet you exactly where you are.
          </p>
          <div className="about-details">
            <div>
              <strong>Tyrin Miller, CEO</strong>
              <span>LPC, LCSW, PhD, PsyD, LMFT</span>
            </div>
            <div>
              <strong>Location</strong>
              <span>227 W 4th St, Suite LL102, Charlotte, NC 28202</span>
            </div>
            <div>
              <strong>Availability</strong>
              <span>24 Hours — We're Here When You Need Us</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="section container">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">
          Comprehensive mental health care for adolescents, adults, and seniors.
        </p>
        <div className="services-grid">
          {services.map((s) => (
            <div key={s.title} className="card service-card">
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "var(--space-8)" }}>
          <Link to="/services" className="btn btn-primary">View All Services</Link>
        </div>
      </section>

      {/* Insurance */}
      <section className="section insurance-section">
        <div className="container">
          <h2 className="section-title">Insurance Accepted</h2>
          <div className="insurance-list">
            {["Aetna", "BlueCross BlueShield", "Carolina Complete", "Vaya Health", "Alliance"].map((ins) => (
              <div key={ins} className="card insurance-card">{ins}</div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
            <Link to="/insurance" className="btn btn-outline">View Details</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container" style={{ textAlign: "center" }}>
          <h2>Ready to Take the First Step?</h2>
          <p>You don't have to navigate this alone. We're here to help.</p>
          <div className="hero-actions" style={{ justifyContent: "center", marginTop: "var(--space-6)" }}>
            <Link to="/booking" className="btn btn-accent btn-lg">Book a Consultation</Link>
            <a href="tel:+17040000000" className="btn btn-outline btn-lg">Call Us</a>
          </div>
        </div>
      </section>
    </div>
  );
}
