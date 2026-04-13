/**
 * Timeline — Renders a visual timeline of key visa dates and milestones.
 * Used on: /opt, /stem-opt, /h1b, /timeline
 */
export default function Timeline({ items }) {
  if (!items || items.length === 0) {
    return <p>No timeline data available.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
          <div>
            <p className="font-medium">{item.date}</p>
            <p className="text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
