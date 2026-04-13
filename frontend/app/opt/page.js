"use client";
import { useState } from "react";
import Link from "next/link";
import optData from "@/data/opt-steps.json";

export default function OptPage() {
  const [checked, setChecked] = useState({});
  const total = optData.steps.length;
  const done = Object.values(checked).filter(Boolean).length;

  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="page-container">
      <span className="page-badge opt">Standard OPT</span>
      <h1 className="page-title">OPT Application Guide</h1>
      <p className="page-desc">Follow these steps to apply for Optional Practical Training (OPT) and work in the US for up to 12 months after graduation! 🎓</p>

      {/* Progress */}
      <div className="progress-section">
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="progress-label">Your Progress</span>
            <span className="progress-count">{done} of {total} steps</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill blue" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Key Timeline Reminder */}
      <div className="alert alert-blue">
        <span className="alert-icon">ℹ️</span>
        <div>
          <h4>Key Timeline Reminder</h4>
          <p>You can apply for OPT up to <strong>90 days before</strong> your program end date, but <strong>no later than 60 days after</strong> your program ends. The earlier you start, the better!</p>
        </div>
      </div>

      {/* Step Cards */}
      {optData.steps.map((step, i) => (
        <div className="step-card" key={i}>
          <div className="step-checkbox">
            <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} id={`opt-step-${i}`} />
          </div>
          <div className="step-icon blue">{step.icon}</div>
          <div className="step-content">
            <div className="step-header">
              <span className="step-label">Step {i + 1}</span>
              <span className="step-timing">⏱ {step.timing}</span>
            </div>
            <div className="step-title">{step.title}</div>
            <div className="step-desc">{step.description}</div>
            {step.tips && (
              <div className="step-tips">
                <h5>💡 Tips:</h5>
                <ul>
                  {step.tips.map((tip, j) => (
                    <li key={j}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Next Steps */}
      <div className="next-steps">
        <h3>📘 What Happens After OPT?</h3>
        <p>If you have a STEM degree, you may be eligible for a 24-month extension! You can also explore H-1B visa options for longer-term work authorization.</p>
        <div className="next-steps-links">
          <Link href="/stem-opt">Learn about STEM OPT Extension →</Link>
          <Link href="/h1b">Explore H-1B Visa →</Link>
        </div>
      </div>
    </div>
  );
}
