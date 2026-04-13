import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🌐 Your guide to working in the US after graduation</div>
        <h1>Navigate Your Work Journey<br />with Confidence</h1>
        <p>We know the visa process can feel overwhelming. Let&apos;s break it down into simple, actionable steps so you can focus on launching your career! 🚀</p>
      </section>

      {/* Choose Your Path */}
      <div className="container" style={{ textAlign: "center", padding: "2rem 1.5rem 0.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem" }}>Choose Your Path</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "0.9rem" }}>Explore different visa options to find the best fit for your situation</p>
      </div>

      {/* Visa Cards */}
      <div className="visa-cards">
        <Link href="/opt" className="card-link">
          <div className="visa-card">
            <div className="visa-card-icon blue">📋</div>
            <h3>OPT (Optional Practical Training)</h3>
            <p>Work for up to 12 months after graduation in your field of study</p>
            <ul className="visa-card-features">
              <li>12 months of work authorization</li>
              <li>Available to all F-1 students</li>
              <li>Apply 90 days before graduation</li>
            </ul>
            <span className="btn btn-primary">Learn More →</span>
          </div>
        </Link>

        <Link href="/stem-opt" className="card-link">
          <div className="visa-card">
            <div className="visa-card-icon yellow">⭐</div>
            <h3>STEM OPT Extension</h3>
            <p>Extend your OPT by 24 months if you have a STEM degree</p>
            <ul className="visa-card-features">
              <li>24-month extension</li>
              <li>STEM degree required</li>
              <li>E-Verify employer needed</li>
            </ul>
            <span className="btn btn-primary">Learn More →</span>
          </div>
        </Link>

        <Link href="/h1b" className="card-link">
          <div className="visa-card">
            <div className="visa-card-icon purple">🏛</div>
            <h3>H-1B Visa</h3>
            <p>Long-term work visa for specialty occupations</p>
            <ul className="visa-card-features">
              <li>Up to 6 years initially</li>
              <li>Employer sponsored</li>
              <li>Lottery-based selection</li>
            </ul>
            <span className="btn btn-primary">Learn More →</span>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">🗂</div>
          <div className="stat-value">3</div>
          <div className="stat-label">Visa Options</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱</div>
          <div className="stat-value" style={{ color: "var(--blue-primary)" }}>36</div>
          <div className="stat-label">Max Months (OPT + STEM)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value" style={{ fontSize: "1.25rem" }}>You Got This!</div>
          <div className="stat-label">We&apos;re here to help</div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-card">
          <div className="cta-icon">👥</div>
          <h2>Ready to Get Started?</h2>
          <p>Check out our interactive timeline to see when you need to take action, or dive into a specific visa guide to understand the detailed steps.</p>
          <Link href="/timeline" className="btn btn-primary">View Your Timeline →</Link>
        </div>
      </div>
    </>
  );
}
