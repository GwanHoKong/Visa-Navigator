"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function PredictPage() {
  const [industries, setIndustries] = useState([]);
  const [form, setForm] = useState({
    major: "", stem: "yes", industry: "", gpa: "3.0",
    experience: "0", internships: "1", state: "", employer: "",
  });
  const [result, setResult] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfile, setShowProfile] = useState(true);

  // Load industries on mount
  useEffect(() => {
    fetch(`${API}/industries`)
      .then((r) => r.json())
      .then((d) => setIndustries(d.industries || []))
      .catch((err) => {
        console.error("Failed to load industries:", err);
        setIndustries([
          { code: "54", label: "Professional, Scientific, and Technical Services" },
          { code: "51", label: "Information" },
          { code: "52", label: "Finance and Insurance" },
          { code: "62", label: "Health Care and Social Assistance" },
          { code: "61", label: "Educational Services" },
          { code: "33", label: "Manufacturing (Metal, Machinery, Electronics)" },
        ]);
      });
  }, []);

  // Debounced API call when industry + state are both selected
  const fetchPrediction = useCallback(async (currentForm) => {
    if (!currentForm.industry || !currentForm.state) return;
    setLoading(true);
    setError(null);

    try {
      // Call /api/predict
      const body = { industry: currentForm.industry, state: currentForm.state };
      if (currentForm.employer.trim()) body.employer_name = currentForm.employer.trim();

      console.log("[Predict] Calling /api/predict with:", body);
      const predRes = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!predRes.ok) {
        const errData = await predRes.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${predRes.status}`);
      }

      const predData = await predRes.json();
      console.log("[Predict] Response:", predData);
      setResult(predData);

      // Call /api/companies
      const compUrl = `${API}/companies?industry=${currentForm.industry}${currentForm.state ? `&state=${currentForm.state}` : ""}&limit=10`;
      console.log("[Companies] Calling:", compUrl);
      const compRes = await fetch(compUrl);

      if (compRes.ok) {
        const compData = await compRes.json();
        console.log("[Companies] Response:", compData);
        setCompanies(compData);
      } else {
        console.warn("[Companies] Failed:", compRes.status);
        setCompanies(null);
      }
    } catch (err) {
      console.error("[Predict] Error:", err);
      setError(err.message || "Failed to connect to API. Is the backend running on port 8000?");
      setResult(null);
      setCompanies(null);
    }
    setLoading(false);
  }, []);

  // Auto-call API when industry, state, or employer changes
  useEffect(() => {
    if (!form.industry || !form.state) return;
    const timer = setTimeout(() => fetchPrediction(form), 400);
    return () => clearTimeout(timer);
  }, [form.industry, form.state, form.employer, fetchPrediction]);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <div className="timeline-hero">
        <h1 style={{ color: "var(--navy)" }}>Sponsorship Risk Assessment</h1>
        <p>Get data-driven insights based on historical H-1B approval data</p>
      </div>

      <div className="page-container" style={{ paddingTop: "1.5rem" }}>
        {/* Profile Form */}
        <div className="form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>🌐 Sponsorship Risk Assessment</h3>
            <button className="btn btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }} onClick={() => setShowProfile(!showProfile)}>
              {showProfile ? "Hide Profile" : "Show Profile"}
            </button>
          </div>
          <p style={{ marginBottom: "1rem" }}>Get personalized recommendations for improving your chances of H-1B sponsorship</p>

          {showProfile && (
            <>
              <div className="predict-form-grid">
                <div>
                  <label className="form-label">Major / Field of Study</label>
                  <input className="form-input" placeholder="e.g. Computer Science" value={form.major} onChange={update("major")} />
                </div>
                <div>
                  <label className="form-label">STEM Eligible?</label>
                  <select className="form-select" value={form.stem} onChange={update("stem")}>
                    <option value="yes">Yes - STEM degree</option>
                    <option value="no">No - Non-STEM</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Industry *</label>
                  <select className="form-select" value={form.industry} onChange={update("industry")}>
                    <option value="">Select industry...</option>
                    {industries.map((ind) => (
                      <option key={ind.code} value={ind.code}>{ind.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Current GPA</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="4.0" value={form.gpa} onChange={update("gpa")} />
                </div>
                <div>
                  <label className="form-label">Work Experience (years)</label>
                  <select className="form-select" value={form.experience} onChange={update("experience")}>
                    <option value="0">Less than 1 year</option>
                    <option value="1">1-2 years</option>
                    <option value="2">2-3 years</option>
                    <option value="3+">3+ years</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Internship Experience</label>
                  <select className="form-select" value={form.internships} onChange={update("internships")}>
                    <option value="0">No internships</option>
                    <option value="1">1 internship</option>
                    <option value="2">2 internships</option>
                    <option value="3+">3+ internships</option>
                  </select>
                </div>
              </div>

              <div className="predict-form-grid">
                <div>
                  <label className="form-label">State *</label>
                  <select className="form-select" value={form.state} onChange={update("state")}>
                    <option value="">Select state...</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Employer (optional)</label>
                  <input className="form-input" placeholder="e.g. Google LLC" value={form.employer} onChange={update("employer")} />
                </div>
              </div>

              {/* Transparency notice */}
              <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "var(--blue-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--blue-border)" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--gray-600)", margin: 0 }}>
                  ℹ️ <strong>What our model analyzes:</strong> Industry, State, and Employer historical approval data from USCIS.
                  Personal factors (Major, GPA, Experience, Internships) are shown for your reference but do <strong>not</strong> affect the data-driven risk score below.
                  The risk assessment is based purely on historical H-1B approval records.
                </p>
              </div>

              {!form.industry || !form.state ? (
                <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem", color: "var(--gray-400)" }}>
                  Select both Industry and State to see your risk assessment
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--gray-500)" }}>
            ⏳ Analyzing...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-yellow" style={{ marginBottom: "1.5rem" }}>
            <span className="alert-icon">⚠️</span>
            <div>
              <h4>Connection Error</h4>
              <p>{error}</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>Make sure the backend is running: <code>python -m uvicorn main:app --port 8000</code></p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Top Disclaimer */}
            <div className="disclaimer" style={{ marginBottom: "1.5rem", marginTop: 0 }}>
              <p>
                <strong>Data Source Disclaimer:</strong> This analysis is based on FY2021-FY2026 USCIS public H-1B employer data and the H1B Sponsorship Analytics modeling pipeline.
                It does not guarantee individual approval outcomes. Always consult a qualified immigration attorney for personalized advice.
              </p>
            </div>

            {/* Model summary */}
            <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem" }}>
                H-1B Sponsorship Model Result
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginBottom: "1.25rem" }}>
                Dual-track model: expected approval-rate regression plus High-risk screening.
              </p>

              <div className="predict-form-grid">
                <MetricTile
                  label="Expected Approval Rate"
                  value={`${((result.expected_approval_rate ?? result.probability) * 100).toFixed(1)}%`}
                  tone={(result.expected_approval_rate ?? result.probability) >= 0.95 ? "green" : "blue"}
                  sublabel="XGBoost regression estimate"
                />
                <MetricTile
                  label="High-risk Probability"
                  value={`${(result.high_risk_probability * 100).toFixed(1)}%`}
                  tone={result.risk_level === "high" ? "red" : result.risk_level === "medium" ? "yellow" : "green"}
                  sublabel={`${result.risk_level?.toUpperCase()} screening tier`}
                />
                <MetricTile
                  label="Industry Risk Tier"
                  value={result.industry_risk_tier || "Unknown"}
                  tone={result.industry_risk_tier === "High" ? "red" : result.industry_risk_tier === "Medium" ? "yellow" : "green"}
                  sublabel={result.industry_label}
                />
              </div>

              {result.model_summary && (
                <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "1rem" }}>
                  Source: {result.model_summary.source_project}. Trained on FY{result.model_summary.train_years?.join(", FY")}; validated on FY{result.model_summary.validation_year}.
                </p>
              )}
            </div>

            {/* Three-bar breakdown */}
            <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                📊 H-1B Approval Rate Breakdown
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginBottom: "1.25rem" }}>
                Based on historical USCIS data. Each bar shows the approval rate for your selected parameters.
              </p>

              {/* Industry Rate */}
              <RateBar
                label="Industry Approval Rate"
                rate={result.industry_rate}
                avgRate={result.national_avg}
                avgLabel="National avg"
                sublabel={`${result.industry_label} (${result.industry_total?.toLocaleString()} cases)`}
              />

              {/* State Rate */}
              <RateBar
                label="State Approval Rate"
                rate={result.state_rate}
                avgRate={result.state_national_avg || result.national_avg}
                avgLabel="All-state avg"
                sublabel={`${result.state_code} (${result.state_total?.toLocaleString()} cases)`}
              />

              {/* Percentile */}
              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--blue-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--blue-border)" }}>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--navy)", margin: 0 }}>
                  📍 Your combination is in the <strong>top {Math.max(1, Math.round(100 - result.percentile))}%</strong> of all employer-industry combinations in our database.
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", margin: "0.25rem 0 0" }}>
                  Percentile based on employer approval-rate distribution in the USCIS dataset
                </p>
              </div>

              {/* Low confidence warning */}
              {result.low_confidence && (
                <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--yellow-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--yellow-border)" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--gray-700)", margin: 0 }}>
                    ⚠️ <strong>Low confidence:</strong> Limited data available for this combination. Results may be less reliable.
                  </p>
                </div>
              )}

              {/* Explanation bullets */}
              {result.explanation && result.explanation.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: "0.35rem" }}>Details:</h4>
                  <ul className="explanation-list">
                    {result.explanation.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem", borderLeft: "4px solid var(--blue-primary)" }}>
              <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                👥 Recommended Extracurriculars & Activities
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "1rem" }}>Strengthen your profile with these activities</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(form.stem === "yes" ? ACTIVITY_TIPS_STEM : ACTIVITY_TIPS_NON_STEM).map((tip, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "var(--gray-700)", padding: "0.35rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--green)" }}>✅</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Companies */}
            {companies && companies.companies && companies.companies.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem", borderLeft: "4px solid var(--blue-primary)" }}>
                <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  🏢 Companies with Lower Sponsorship Risk
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "0.5rem" }}>
                  Top employers with strong H-1B track records ({companies.total_matching} matched, sorted by composite score)
                </p>
                {companies.relaxed && companies.message && (
                  <div style={{ padding: "0.5rem 0.75rem", background: "var(--yellow-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--yellow-border)", marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "0.78rem", color: "var(--gray-700)", margin: 0 }}>ℹ️ {companies.message}</p>
                  </div>
                )}
                <div style={{ overflowX: "auto" }}>
                  <table className="companies-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Company</th>
                        <th>Approval Rate</th>
                        <th>Total Cases</th>
                        <th>Years</th>
                        <th>State</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.companies.map((c, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--gray-400)" }}>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td style={{ color: c.approval_rate >= 0.95 ? "var(--green)" : "var(--gray-700)" }}>{(c.approval_rate * 100).toFixed(1)}%</td>
                          <td>{c.total_cases.toLocaleString()}</td>
                          <td>{c.years_active}</td>
                          <td>
                            {c.primary_state}
                            {c.source === "other_states" && <span style={{ display: "inline-block", marginLeft: "0.35rem", fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "var(--yellow-light)", color: "var(--yellow)", borderRadius: "4px", fontWeight: 600 }}>Other</span>}
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>{c.score.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.75rem" }}>
                  Industry avg: {(companies.industry_avg * 100).toFixed(1)}% | National avg: {(companies.national_avg * 100).toFixed(1)}%
                  | Score = approval_rate x 0.6 + case_volume x 0.3 + years_active x 0.1
                </p>
              </div>
            )}

            {/* No companies message */}
            {companies && companies.companies && companies.companies.length === 0 && companies.message && (
              <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem", borderLeft: "4px solid var(--yellow)" }}>
                <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>🏢 Company Recommendations</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>{companies.message}</p>
              </div>
            )}

            {/* Strategic Tips */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderLeft: "4px solid var(--yellow)" }}>
              <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                💡 Strategic Tips for Your Journey
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(form.stem === "yes" ? STRATEGIC_TIPS_STEM : STRATEGIC_TIPS_NON_STEM).map((tip, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "var(--gray-700)", padding: "0.35rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--green)" }}>✅</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}


/* === Rate Bar Component === */
function RateBar({ label, rate, avgRate, avgLabel, sublabel }) {
  const pct = (rate * 100).toFixed(1);
  const avgPct = (avgRate * 100).toFixed(1);
  const diff = rate - avgRate;
  const isAbove = diff >= 0;
  const barColor = rate >= 0.93 ? "var(--green)" : rate >= 0.85 ? "var(--blue-primary)" : rate >= 0.75 ? "var(--yellow)" : "var(--red)";

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--navy)" }}>{label}</span>
        <span style={{ fontSize: "0.82rem", color: "var(--gray-600)" }}>
          <strong style={{ color: barColor }}>{pct}%</strong>
          <span style={{ color: "var(--gray-400)", margin: "0 0.35rem" }}>|</span>
          {avgLabel}: {avgPct}%
          <span style={{ marginLeft: "0.35rem", fontSize: "0.75rem", color: isAbove ? "var(--green)" : "var(--red)" }}>
            ({isAbove ? "+" : ""}{(diff * 100).toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="risk-bar">
        <div className="risk-bar-fill" style={{ width: `${Math.min(rate * 100, 100)}%`, background: barColor, transition: "width 0.5s ease" }} />
      </div>
      {sublabel && <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.2rem" }}>{sublabel}</p>}
    </div>
  );
}


/* === Metric Tile Component === */
function MetricTile({ label, value, tone, sublabel }) {
  const colorMap = {
    green: "var(--green)",
    blue: "var(--blue-primary)",
    yellow: "var(--yellow)",
    red: "var(--red)",
  };
  const color = colorMap[tone] || "var(--blue-primary)";

  return (
    <div style={{ border: "1px solid var(--blue-border)", borderRadius: "var(--radius-sm)", padding: "1rem", background: "var(--white)" }}>
      <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", margin: "0 0 0.35rem", fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: "1.6rem", color, margin: 0, fontWeight: 800 }}>{value}</p>
      {sublabel && <p style={{ fontSize: "0.74rem", color: "var(--gray-400)", margin: "0.25rem 0 0" }}>{sublabel}</p>}
    </div>
  );
}


const ACTIVITY_TIPS_STEM = [
  "Join IEEE or ACM student chapters",
  "Participate in hackathons and coding competitions",
  "Contribute to open-source projects on GitHub",
  "Network at industry conferences and career fairs",
  "Build a strong LinkedIn profile with projects and achievements",
];

const ACTIVITY_TIPS_NON_STEM = [
  "Join professional associations in your field",
  "Attend industry networking events and workshops",
  "Seek leadership roles in student organizations",
  "Network at industry conferences and career fairs",
  "Build a strong LinkedIn profile with projects and achievements",
];

const STRATEGIC_TIPS_STEM = [
  "Always ask about visa sponsorship early in the interview process",
  "Target companies with proven H-1B sponsorship history",
  "STEM OPT gives you up to 3 chances at the H-1B lottery — plan accordingly",
];

const STRATEGIC_TIPS_NON_STEM = [
  "Always ask about visa sponsorship early in the interview process",
  "Target companies with proven H-1B sponsorship history",
  "Consider applying to a master's program in a STEM field for extended OPT eligibility",
];

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
