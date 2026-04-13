"use client";
import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function TimelinePage() {
  const [gradDate, setGradDate] = useState("");
  const [visaType, setVisaType] = useState("opt");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!gradDate) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/timeline?graduation_date=${gradDate}&visa_type=${visaType}`);
      const data = await res.json();
      setResult(data);
    } catch {
      // Fallback: compute locally
      setResult(computeLocal(gradDate, visaType));
    }
    setLoading(false);
  };

  // Auto-calculate when inputs change
  const handleDateChange = (e) => {
    setGradDate(e.target.value);
    if (e.target.value) {
      setTimeout(() => {
        fetchTimeline(e.target.value, visaType);
      }, 100);
    } else {
      setResult(null);
    }
  };

  const handleVisaChange = (e) => {
    setVisaType(e.target.value);
    if (gradDate) {
      setTimeout(() => {
        fetchTimeline(gradDate, e.target.value);
      }, 100);
    }
  };

  const fetchTimeline = async (date, visa) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/timeline?graduation_date=${date}&visa_type=${visa}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(computeLocal(date, visa));
    }
    setLoading(false);
  };

  return (
    <>
      <div className="timeline-hero">
        <h1>Your Personal Timeline</h1>
        <p>Enter your graduation date to see important deadlines and plan ahead! 📅</p>
      </div>

      <div className="page-container" style={{ paddingTop: "1.5rem" }}>
        {/* Calculate Form */}
        <div className="form-card">
          <h3>Calculate Your Timeline</h3>
          <p>Tell us about your situation and we&apos;ll show you key dates to remember</p>
          <div className="form-row">
            <div>
              <label className="form-label">Graduation Date (or Program End Date)</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className={`form-input${!gradDate ? ' date-empty' : ''}`}
                  lang="en"
                  value={gradDate}
                  onChange={handleDateChange}
                />
                {!gradDate && <span className="date-placeholder">YYYY-MM-DD</span>}
              </div>
            </div>
            <div>
              <label className="form-label">Which visa are you planning?</label>
              <select className="form-select" value={visaType} onChange={handleVisaChange}>
                <option value="opt">OPT only</option>
                <option value="stem-opt">STEM OPT Extension</option>
                <option value="h1b">H-1B Visa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Risk Assessment Link */}
        <div className="risk-link-card">
          <div>
            <h4>🌐 Sponsorship Risk Assessment</h4>
            <p>Get personalized recommendations for improving your chances of H-1B sponsorship</p>
          </div>
          <Link href="/predict" className="btn btn-outline">Show Profile</Link>
        </div>

        {/* Results or Empty State */}
        {!result ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Enter your graduation date above to see your personalized timeline</p>
          </div>
        ) : (
          <TimelineResults result={result} visaType={visaType} gradDate={gradDate} />
        )}
      </div>
    </>
  );
}

function TimelineResults({ result, visaType, gradDate }) {
  const grad = new Date(gradDate);

  if (visaType === "opt") {
    return <OPTTimeline grad={grad} />;
  }
  if (visaType === "stem-opt") {
    return <STEMOPTTimeline grad={grad} />;
  }
  if (visaType === "h1b") {
    return <H1BTimeline grad={grad} />;
  }
  return null;
}


/* ===== OPT Timeline ===== */
function OPTTimeline({ grad }) {
  const dates = [
    { label: "Recommended Start Date", date: addDays(grad, -90), desc: "Start talking to your DSO and preparing documents", color: "green" },
    { label: "Earliest Application Date", date: addDays(grad, -90), desc: "You can apply up to 90 days before graduation", color: "purple" },
    { label: "Latest Application Date", date: addDays(grad, 60), desc: "Critical deadline! Must apply by this date", color: "red", warning: true },
  ];

  return (
    <>
      <div className="timeline-section">
        <div className="timeline-section-header">
          <span style={{ color: "var(--blue-primary)" }}>●</span> OPT Timeline
        </div>
        <div className="timeline-section-sub">Important dates for your OPT application</div>
        {dates.map((d, i) => (
          <div className={`date-card ${d.color}`} key={i}>
            <h4>{d.label}</h4>
            <div className="date-value">{formatDate(d.date)}</div>
            <p>{d.warning && "⚠️ "}{d.desc}</p>
          </div>
        ))}
      </div>

      <TipsSection tips={[
        "Set calendar reminders for all critical dates",
        "Start preparing documents earlier than deadlines",
        "Keep in regular contact with your DSO",
        "Always use certified mail with tracking for USCIS applications",
      ]} />
    </>
  );
}


/* ===== STEM OPT Timeline ===== */
function STEMOPTTimeline({ grad }) {
  // OPT starts around graduation (or shortly after)
  const optStart = new Date(grad);
  // OPT expires 12 months after start
  const optExpiry = addMonths(optStart, 12);
  // STEM OPT recommended application: 90 days before OPT expiry
  const stemRecommend = addDays(optExpiry, -90);
  // STEM OPT application deadline: before OPT expiry
  const stemDeadline = addDays(optExpiry, -1);
  // STEM OPT starts day after OPT expires
  const stemStart = new Date(optExpiry);
  // STEM OPT expires: OPT start + 36 months total (12 OPT + 24 STEM)
  const stemExpiry = addMonths(optStart, 36);
  // Self-evaluation at 12 months into STEM OPT
  const selfEval12 = addMonths(stemStart, 12);
  // Self-evaluation at 24 months (end of STEM OPT)
  const selfEval24 = addMonths(stemStart, 24);

  // H-1B lottery opportunities during STEM OPT (up to 3 chances, March each year)
  const lotteryChances = [];
  for (let year = stemStart.getFullYear(); year <= stemExpiry.getFullYear(); year++) {
    const marchDate = new Date(year, 2, 1); // March 1
    if (marchDate >= stemStart && marchDate <= stemExpiry) {
      lotteryChances.push(year);
    }
  }

  const section1 = [
    { label: "OPT Start Date", date: optStart, desc: "Your initial 12-month OPT period begins", color: "blue" },
    { label: "STEM OPT Application Recommended", date: stemRecommend, desc: "Start preparing your I-765 and I-983 Training Plan with your employer. Apply up to 90 days before OPT expiry.", color: "green" },
    { label: "STEM OPT Application Deadline", date: stemDeadline, desc: "Must file before your OPT expires. Your employer must be E-Verify enrolled.", color: "red", warning: true },
    { label: "OPT Expiration / STEM OPT Start", date: optExpiry, desc: "Your 12-month OPT ends and 24-month STEM OPT extension begins", color: "purple" },
  ];

  const section2 = [
    { label: "12-Month Self-Evaluation Due", date: selfEval12, desc: "You and your employer must complete the 12-month self-evaluation on Form I-983 and submit to your DSO.", color: "yellow", warning: true },
    { label: "24-Month Self-Evaluation Due", date: selfEval24, desc: "Final self-evaluation on Form I-983. Must be completed within 10 days of the end of STEM OPT.", color: "yellow", warning: true },
    { label: "STEM OPT Expiration", date: stemExpiry, desc: "Your total 36-month work authorization ends (12 months OPT + 24 months STEM OPT)", color: "red", warning: true },
  ];

  return (
    <>
      {/* Key dates */}
      <div className="timeline-section">
        <div className="timeline-section-header">
          <span style={{ color: "var(--purple)" }}>●</span> STEM OPT Timeline
        </div>
        <div className="timeline-section-sub">Key dates from OPT through STEM OPT extension (36 months total)</div>
        {section1.map((d, i) => (
          <div className={`date-card ${d.color}`} key={i}>
            <h4>{d.label}</h4>
            <div className="date-value">{formatDate(d.date)}</div>
            <p>{d.warning && "⚠️ "}{d.desc}</p>
          </div>
        ))}
      </div>

      {/* Self-Evaluations & Expiry */}
      <div className="timeline-section">
        <div className="timeline-section-header">
          <span style={{ color: "var(--yellow)" }}>●</span> Self-Evaluations & Expiry
        </div>
        <div className="timeline-section-sub">Required I-983 self-evaluations and expiration dates</div>
        {section2.map((d, i) => (
          <div className={`date-card ${d.color}`} key={i}>
            <h4>{d.label}</h4>
            <div className="date-value">{formatDate(d.date)}</div>
            <p>{d.warning && "⚠️ "}{d.desc}</p>
          </div>
        ))}
      </div>

      {/* H-1B Lottery Opportunities */}
      <div className="timeline-section">
        <div className="timeline-section-header">
          <span style={{ color: "var(--blue-primary)" }}>●</span> H-1B Lottery Opportunities ({lotteryChances.length} chances)
        </div>
        <div className="timeline-section-sub">You can participate in the H-1B lottery each year during your STEM OPT</div>
        {lotteryChances.map((year, i) => (
          <div className="date-card blue" key={i}>
            <h4>H-1B Lottery — {year} (Chance {i + 1} of {lotteryChances.length})</h4>
            <div className="date-value">{formatDate(new Date(year, 2, 1))} (Registration opens)</div>
            <p>Employer registers you for the H-1B lottery. Results typically announced late March. If selected, H-1B starts October 1, {year}.</p>
          </div>
        ))}
      </div>

      {/* Cap-Gap */}
      <div className="alert alert-purple">
        <span className="alert-icon">🔄</span>
        <div>
          <h4>Cap-Gap Automatic Extension</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
            If your employer files an H-1B petition while you&apos;re on OPT/STEM OPT, your work authorization is automatically extended through <strong>September 30</strong> of that year (or until the H-1B petition is denied/withdrawn). This &quot;cap-gap&quot; protection prevents gaps between your OPT/STEM OPT expiration and H-1B start date of October 1.
          </p>
        </div>
      </div>

      <TipsSection tips={[
        "Your employer MUST be enrolled in E-Verify to sponsor STEM OPT",
        "Report any employer change, name change, or address change to your DSO within 10 days",
        "You cannot be unemployed for more than 150 days total during your STEM OPT",
        "Keep your I-983 Training Plan updated — it must match your actual work",
        "Start H-1B conversations with your employer early — registration is in March each year",
      ]} />
    </>
  );
}


/* ===== H-1B Timeline ===== */
function H1BTimeline({ grad }) {
  const h1bYear = grad.getMonth() <= 5 ? grad.getFullYear() + 1 : grad.getFullYear() + 1;
  const dates = [
    { label: "H-1B Registration Period", date: new Date(h1bYear, 2, 1), desc: "Employer registers you for the H-1B lottery (typically early March)", color: "blue" },
    { label: "Lottery Results", date: new Date(h1bYear, 2, 28), desc: "USCIS announces lottery selections (typically late March)", color: "purple" },
    { label: "H-1B Start Date", date: new Date(h1bYear, 9, 1), desc: "If approved, you can begin working on H-1B status (October 1)", color: "green" },
  ];

  return (
    <>
      <div className="timeline-section">
        <div className="timeline-section-header">
          <span style={{ color: "var(--blue-primary)" }}>●</span> H-1B Timeline ({h1bYear} Cycle)
        </div>
        <div className="timeline-section-sub">Key dates for the H-1B lottery process</div>
        {dates.map((d, i) => (
          <div className={`date-card ${d.color}`} key={i}>
            <h4>{d.label}</h4>
            <div className="date-value">{formatDate(d.date)}</div>
            <p>{d.desc}</p>
          </div>
        ))}
      </div>

      <TipsSection tips={[
        "Discuss H-1B sponsorship with your employer early in the process",
        "Registration typically opens in early March — confirm with your employer by January",
        "If not selected, you can try again the following year (while on valid OPT/STEM OPT)",
        "Consider Premium Processing ($2,805) for faster adjudication if available",
      ]} />
    </>
  );
}


/* ===== Shared Tips Section ===== */
function TipsSection({ tips }) {
  return (
    <div className="alert alert-blue">
      <span className="alert-icon">ℹ️</span>
      <div>
        <h4>Pro Tips for Your Timeline</h4>
        <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
          {tips.map((tip, i) => (
            <li key={i} style={{ fontSize: "0.85rem", color: "var(--gray-600)", padding: "0.2rem 0" }}>✅ {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


/* ===== Utility Functions ===== */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function computeLocal(gradDate, visaType) {
  return { visa_type: visaType, graduation_date: gradDate, milestones: [], key_dates: [] };
}

