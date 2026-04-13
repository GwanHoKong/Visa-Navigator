/**
 * PredictionForm — Input form for H1B prediction.
 * Used on: /predict
 *
 * Fields (from CLAUDE.md):
 *   - Industry:  Dropdown (from /api/industries) → model input
 *   - State:     Dropdown (U.S. states) → model input
 *   - Employer:  Text with autocomplete (optional) → model input
 *   - Major:     Text input → UI-only
 *   - GPA:       Number input → UI-only
 *   - Job Role:  Text input → UI-only
 */
"use client";

import { useState } from "react";

export default function PredictionForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    industry: "",
    state: "",
    employer_name: "",
    major: "",
    gpa: "",
    job_role: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {/* Model input fields */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium">Industry</label>
        <select id="industry" name="industry" value={formData.industry} onChange={handleChange} className="w-full border rounded p-2">
          <option value="">Select industry...</option>
          {/* TODO: Populate from /api/industries */}
        </select>
      </div>

      <div>
        <label htmlFor="state" className="block text-sm font-medium">State</label>
        <select id="state" name="state" value={formData.state} onChange={handleChange} className="w-full border rounded p-2">
          <option value="">Select state...</option>
          {/* TODO: Populate with U.S. states */}
        </select>
      </div>

      <div>
        <label htmlFor="employer_name" className="block text-sm font-medium">Employer (optional)</label>
        <input type="text" id="employer_name" name="employer_name" value={formData.employer_name} onChange={handleChange} placeholder="e.g. GOOGLE LLC" className="w-full border rounded p-2" />
      </div>

      {/* UI-only fields */}
      <div>
        <label htmlFor="major" className="block text-sm font-medium">Major</label>
        <input type="text" id="major" name="major" value={formData.major} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <div>
        <label htmlFor="gpa" className="block text-sm font-medium">GPA</label>
        <input type="number" id="gpa" name="gpa" step="0.01" min="0" max="4.0" value={formData.gpa} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <div>
        <label htmlFor="job_role" className="block text-sm font-medium">Job Role</label>
        <input type="text" id="job_role" name="job_role" value={formData.job_role} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
        Get Prediction
      </button>
    </form>
  );
}
