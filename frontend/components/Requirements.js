/**
 * Requirements — Displays visa requirements section.
 * Used on: /opt, /stem-opt, /h1b
 */
export default function Requirements({ title, items }) {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-semibold mb-3">{title || "Requirements"}</h3>
      <ul className="list-disc list-inside space-y-1">
        {items?.map((item, index) => (
          <li key={index} className="text-gray-700">{item}</li>
        ))}
      </ul>
    </section>
  );
}
