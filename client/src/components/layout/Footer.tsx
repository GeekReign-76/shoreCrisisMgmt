import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="Shore Crisis Management" className="footer-logo" />
          <p className="footer-tagline">Helping You Weather the Waves of Life</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Services</h4>
            <Link to="/services">Our Services</Link>
            <Link to="/insurance">Insurance</Link>
            <Link to="/booking">Book Appointment</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/crisis">Crisis Resources</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <p>227 W 4th St, Suite LL102</p>
            <p>Charlotte, NC 28202</p>
            <p>Shorecrisis35@gmail.com</p>
            <p>Available 24 Hours</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Shore Crisis Management. All rights reserved.</p>
      </div>
    </footer>
  );
}
