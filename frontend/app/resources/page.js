"use client";

export default function ResourcesPage() {
  return (
    <>
      <div className="timeline-hero">
        <h1 style={{ color: "var(--navy)" }}>Resources & Support</h1>
        <p>Everything you need to navigate your visa journey — official links, tools, and tips from students who&apos;ve been there 📖</p>
      </div>

      <div className="page-container" style={{ paddingTop: "1.5rem" }}>

        {/* ===== Official Government Resources ===== */}
        <section className="resources-section">
          <div className="resources-section-header">
            <span className="resources-section-icon blue">🏛️</span>
            <div>
              <h2>Official Government Resources</h2>
              <p>Direct links to official USCIS and government websites</p>
            </div>
          </div>

          <div className="resources-grid">
            <ResourceCard
              badge="USCIS"
              badgeColor="blue"
              icon="📋"
              title="OPT Information"
              desc="Complete guide to Optional Practical Training for F-1 students — eligibility, application process, and requirements."
              url="https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students"
            />
            <ResourceCard
              badge="USCIS"
              badgeColor="purple"
              icon="🔬"
              title="STEM OPT Extension"
              desc="24-month STEM OPT extension details — eligibility requirements, I-983 training plan, and E-Verify employer requirements."
              url="https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-extension-for-stem-students-stem-opt"
            />
            <ResourceCard
              badge="USCIS"
              badgeColor="blue"
              icon="💼"
              title="H-1B Specialty Occupations"
              desc="H-1B visa program overview — cap information, lottery process, employer petition requirements, and processing times."
              url="https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations"
            />
            <ResourceCard
              badge="ICE"
              badgeColor="green"
              icon="📄"
              title="STEM Designated Degree Program List"
              desc="Official list of STEM-designated degree programs eligible for the 24-month STEM OPT extension (2024 edition)."
              url="https://www.ice.gov/doclib/sevis/pdf/stemList2024.pdf"
            />
          </div>
        </section>

        {/* ===== Useful Tools ===== */}
        <section className="resources-section">
          <div className="resources-section-header">
            <span className="resources-section-icon yellow">🛠️</span>
            <div>
              <h2>Useful Tools</h2>
              <p>Online tools for tracking and managing your immigration status</p>
            </div>
          </div>

          <div className="resources-grid cols-3">
            <ToolCard
              icon="🔍"
              title="USCIS Case Status"
              desc="Track your case status online using your receipt number."
              url="https://egov.uscis.gov/"
              btnLabel="Check Status →"
            />
            <ToolCard
              icon="🎓"
              title="SEVP Portal"
              desc="Manage your OPT reporting requirements and employment updates."
              url="https://sevp.ice.gov/opt/#/login"
              btnLabel="Open Portal →"
            />
            <ToolCard
              icon="✅"
              title="E-Verify"
              desc="Verify if your employer is enrolled in the E-Verify program."
              url="https://www.e-verify.gov/"
              btnLabel="Verify Now →"
            />
          </div>
        </section>

        {/* ===== Important Contacts ===== */}
        <section className="resources-section">
          <div className="resources-section-header">
            <span className="resources-section-icon green">📞</span>
            <div>
              <h2>Important Contacts</h2>
              <p>Key phone numbers and emails for immigration support</p>
            </div>
          </div>

          <div className="contacts-grid">
            <div className="contact-card">
              <div className="contact-icon-wrap blue">📞</div>
              <div>
                <h4>USCIS Contact Center</h4>
                <p className="contact-value">1-800-375-5283</p>
                <p className="contact-desc">Available Mon-Fri, 8am-8pm ET. For general immigration inquiries and case status.</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-icon-wrap green">📧</div>
              <div>
                <h4>SEVP Response Center</h4>
                <p className="contact-value">703-603-3400</p>
                <p className="contact-email">sevp@ice.dhs.gov</p>
                <p className="contact-desc">For SEVIS and OPT related questions. Response within 3-5 business days.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Pro Tips ===== */}
        <section className="resources-section">
          <div className="resources-section-header">
            <span className="resources-section-icon purple">💡</span>
            <div>
              <h2>Pro Tips from Students Who&apos;ve Been There</h2>
              <p>Practical advice from international students who successfully navigated the process</p>
            </div>
          </div>

          <div className="tips-grid">
            <TipCard
              icon="📁"
              title="Keep Copies of Everything"
              desc="Make digital and physical copies of all immigration documents, receipts, and correspondence. Store them in a secure cloud folder."
              color="blue"
            />
            <TipCard
              icon="📮"
              title="Use Certified Mail"
              desc="Always send USCIS applications via USPS Certified Mail with tracking. This gives you proof of delivery and a receipt number."
              color="green"
            />
            <TipCard
              icon="🤝"
              title="Stay in Touch with Your DSO"
              desc="Maintain regular contact with your Designated School Official. They are your most valuable resource for immigration guidance."
              color="purple"
            />
            <TipCard
              icon="👥"
              title="Join Student Groups"
              desc="Connect with other international students through organizations, LinkedIn groups, and school communities for support and tips."
              color="yellow"
            />
            <TipCard
              icon="📋"
              title="Plan for the Unexpected"
              desc="Build buffer time into your timeline. Processing delays, RFEs, and document issues are common. Start everything early."
              color="red"
            />
            <TipCard
              icon="⚖️"
              title="Consider Immigration Attorney"
              desc="For complex cases or if you receive an RFE, consult a qualified immigration attorney. Many offer free initial consultations."
              color="blue"
            />
          </div>
        </section>

      </div>
    </>
  );
}


/* === Sub-Components === */

function ResourceCard({ badge, badgeColor, icon, title, desc, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="resource-card">
      <div className="resource-card-top">
        <span className={`resource-badge ${badgeColor}`}>{badge}</span>
      </div>
      <div className="resource-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="resource-link">Visit Site →</span>
    </a>
  );
}

function ToolCard({ icon, title, desc, url, btnLabel }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="tool-card">
      <div className="tool-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="tool-btn">{btnLabel}</span>
    </a>
  );
}

function TipCard({ icon, title, desc, color }) {
  return (
    <div className={`tip-card ${color}`}>
      <div className="tip-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
