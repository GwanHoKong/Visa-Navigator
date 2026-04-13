"use client";
import { useState } from "react";
import Link from "next/link";
import stemData from "@/data/stem-opt-steps.json";

export default function StemOptPage() {
  const [checked, setChecked] = useState({});
  const total = stemData.steps.length;
  const done = Object.values(checked).filter(Boolean).length;
  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="page-container">
      <span className="page-badge stem">STEM Extension</span>
      <h1 className="page-title" style={{ color: "var(--purple)" }}>STEM OPT Extension Guide</h1>
      <p className="page-desc">Extend your work authorization by 24 months if you have a STEM degree! That&apos;s up to 36 months total with regular OPT. 🎓✨</p>

      {/* Progress */}
      <div className="progress-section">
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="progress-label">Your Progress</span>
            <span className="progress-count">{done} of {total} steps</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill purple" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Alert grid */}
      <div className="alert-grid">
        <div className="alert alert-purple" style={{ marginBottom: 0 }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <h4>Critical Deadline</h4>
            <p>Apply at least <strong>60 days before</strong> your current OPT expires. You can apply up to 90 days before.</p>
          </div>
        </div>
        <div className="alert alert-blue" style={{ marginBottom: 0 }}>
          <span className="alert-icon">🏢</span>
          <div>
            <h4>E-Verify Required</h4>
            <p>Your employer MUST be enrolled in E-Verify. Check with HR before starting the process.</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      {stemData.steps.map((step, i) => (
        <div className="step-card" key={i}>
          <div className="step-checkbox">
            <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} id={`stem-step-${i}`} />
          </div>
          <div className="step-icon purple">{step.icon}</div>
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
                  {step.tips.map((tip, j) => <li key={j}>{tip}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="next-steps" style={{ background: "var(--purple-light)", borderColor: "var(--purple-border)" }}>
        <h3>🎯 What&apos;s Next?</h3>
        <p>During your STEM OPT, start planning for long-term work authorization. The H-1B visa is the most common path.</p>
        <div className="next-steps-links">
          <Link href="/h1b">Explore H-1B Visa →</Link>
          <Link href="/predict">Check Sponsorship Risk →</Link>
        </div>
      </div>
    </div>
  );
}
