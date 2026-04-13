/**
 * CompanyList — Displays recommended companies table.
 * Used on: /predict
 */
export default function CompanyList({ companies }) {
  if (!companies || companies.length === 0) {
    return <p className="text-gray-500">No matching companies found. Try adjusting your criteria.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3">Company</th>
            <th className="text-left p-3">Approval Rate</th>
            <th className="text-left p-3">Total Cases</th>
            <th className="text-left p-3">State</th>
            <th className="text-left p-3">Years Active</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium">{company.name}</td>
              <td className="p-3">{(company.approval_rate * 100).toFixed(1)}%</td>
              <td className="p-3">{company.total_cases}</td>
              <td className="p-3">{company.primary_state}</td>
              <td className="p-3">{company.years_active}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
