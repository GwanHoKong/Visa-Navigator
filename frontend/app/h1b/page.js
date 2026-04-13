"use client";
import { useState } from "react";
import h1bData from "@/data/h1b-full.json";

export default function H1bPage() {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <div className="page-container">
      <span className="page-badge h1b">H-1B Visa</span>
      <h1 className="page-title">H-1B Visa Guide</h1>
      <p className="page-desc">The H-1B is a specialty occupation visa that allows you to work in the US for up to 6 years. Understanding the process and timeline is key! 🎯</p>

      {/* Highlight cards */}
      <div className="highlight-row">
        <div className="highlight-card">
          <div className="hl-icon">📅</div>
          <div className="hl-value">6 Years</div>
          <div className="hl-label">Initial Duration (3+3)</div>
        </div>
        <div className="highlight-card">
          <div className="hl-icon">👥</div>
          <div className="hl-value">Lottery</div>
          <div className="hl-label">Cap-Subject Selection</div>
        </div>
        <div className="highlight-card">
          <div className="hl-icon">🏢</div>
          <div className="hl-value">Employer</div>
          <div className="hl-label">Sponsored Required</div>
        </div>
      </div>

      {/* Yellow alert */}
      <div className="alert alert-yellow">
        <span className="alert-icon">⚠️</span>
        <div>
          <h4>H-1B Cap &amp; Lottery System</h4>
          <p>The H-1B has an annual cap of 85,000 visas (65,000 regular + 20,000 for US Master&apos;s degrees). Due to high demand, USCIS conducts a random lottery to select applications.</p>
          <p style={{ marginTop: "0.5rem" }}><strong>Success rates vary yearly (typically 25-45%)</strong>, so plan accordingly and consider applying multiple years if needed!</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "timeline" ? "active" : ""}`} onClick={() => setActiveTab("timeline")}>Timeline</button>
        <button className={`tab ${activeTab === "process" ? "active" : ""}`} onClick={() => setActiveTab("process")}>Process</button>
        <button className={`tab ${activeTab === "requirements" ? "active" : ""}`} onClick={() => setActiveTab("requirements")}>Requirements</button>
      </div>

      {/* Tab content */}
      {activeTab === "timeline" && <TimelineTab data={h1bData.timeline} />}
      {activeTab === "process" && <ProcessTab data={h1bData.process} />}
      {activeTab === "requirements" && <RequirementsTab data={h1bData.requirements} />}

      {/* OPT Gap Bridge */}
      <div className="alert alert-blue" style={{ marginTop: "2rem" }}>
        <span className="alert-icon">ℹ️</span>
        <div>
          <h4>{activeTab === "timeline" ? "OPT Gap Bridge" : activeTab === "requirements" ? "Master's Degree Advantage" : "Cap-Exempt H-1B Employers"}</h4>
          <p>{activeTab === "timeline"
            ? "If your OPT expires before October 1, you may qualify for 'Cap-Gap' extension - automatic OPT extension until Oct 1 if your H-1B is pending or approved. Ask your DSO!"
            : activeTab === "requirements"
            ? "If you have a US Master's degree or higher, you get entered in the Master's cap lottery first (20,000 visas), then in the regular cap if not selected. This gives you better odds!"
            : "Some employers are exempt from the H-1B cap and lottery! These include higher education institutions, nonprofit research organizations, and government research organizations."
          }</p>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ data }) {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.25rem" }}>H-1B Timeline (Typical Year)</h3>
      <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "1.5rem" }}>Key dates and milestones for the H-1B process</p>
      <div className="timeline-vertical">
        {data.map((item, i) => (
          <div className="timeline-item" key={i}>
            <div className={`timeline-dot ${item.color}`} />
            <div className="timeline-date">{item.date}</div>
            <div className="timeline-title">{item.title}</div>
            <div className="timeline-desc">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessTab({ data }) {
  return (
    <div>
      {data.map((step, i) => (
        <div className="step-card" key={i}>
          <div className="step-icon blue">{step.icon}</div>
          <div className="step-content">
            <span className="step-label">Step {i + 1}</span>
            <div className="step-title">{step.title}</div>
            <div className="step-desc">{step.description}</div>
            {step.points && (
              <div className="step-tips">
                <h5>💡 Key Points:</h5>
                <ul>
                  {step.points.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RequirementsTab({ data }) {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "1.25rem" }}>H-1B Eligibility Requirements</h3>
      {data.map((section, i) => (
        <div key={i} style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ color: "var(--purple)" }}>●</span> {section.title}
          </h4>
          <ul style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
            {section.items.map((item, j) => (
              <li key={j} style={{ fontSize: "0.85rem", color: "var(--gray-600)", padding: "0.2rem 0" }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
