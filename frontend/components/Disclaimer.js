/**
 * Disclaimer — Mandatory disclaimer text for prediction page.
 * Used on: /predict (must always be visible)
 */
export default function Disclaimer() {
  return (
    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-sm text-amber-800">
        <strong>Disclaimer:</strong> This estimate is based on historical post-lottery
        H1B petition data and does not guarantee outcomes.
      </p>
    </div>
  );
}
