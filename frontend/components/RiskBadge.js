/**
 * RiskBadge — Displays risk level with color coding.
 * Used on: /predict
 *
 * Risk levels (from CLAUDE.md):
 *   Low Risk:    score >= 0.80  → Green
 *   Medium Risk: 0.50 <= score < 0.80 → Yellow
 *   High Risk:   score < 0.50  → Red
 */
export default function RiskBadge({ score, riskLevel }) {
  const colorMap = {
    low: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  const labelMap = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
  };

  const colors = colorMap[riskLevel] || colorMap.high;
  const label = labelMap[riskLevel] || "Unknown";

  return (
    <span className={`inline-block px-3 py-1 rounded-full border text-sm font-medium ${colors}`}>
      {label} — {(score * 100).toFixed(1)}%
    </span>
  );
}
