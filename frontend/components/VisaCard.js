/**
 * VisaCard — Displays a visa type summary card on the home page.
 * Used on: / (Home)
 */
export default function VisaCard({ title, description, href }) {
  return (
    <a href={href} className="block p-6 border rounded-lg hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </a>
  );
}
