const records = [
  {
    title: "Enquiry",
    description: "Sets the scope for the quote.",
    fields: [
      ["Assembly", "Part number or short description"],
      ["Drawing", "Reference and revision"],
      ["Order", "First quantity and delivery date"],
    ],
  },
  {
    title: "Build record",
    description: "Ties the order to the agreed revision.",
    fields: [
      ["Order", "Customer purchase order reference"],
      ["Revision", "Drawing revision released for the build"],
      ["Batch", "First build or repeat order reference"],
    ],
  },
  {
    title: "Delivery record",
    description: "Tells receiving inspection what was supplied.",
    fields: [
      ["Delivery", "Part number, quantity and revision"],
      ["Traceability", "Serial numbers or batch reference"],
      ["Evidence", "Acceptance records agreed for the order"],
    ],
  },
];

export function ProcessRecords() {
  return (
    <div className="records" role="group" aria-labelledby="records-label">
      <p className="records-label" id="records-label">Example records</p>
      {records.map(({ title, description, fields }, index) => (
        <details key={title} name="process-records" open={index === 0}>
          <summary>{title}</summary>
          <div className="record-content">
            <p>{description}</p>
            <dl>
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      ))}
    </div>
  );
}
