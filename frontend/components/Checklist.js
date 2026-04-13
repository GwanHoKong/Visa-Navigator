/**
 * Checklist — Interactive checkbox progress tracker.
 * Used on: /opt, /stem-opt, /h1b
 */
"use client";

import { useState } from "react";

export default function Checklist({ items }) {
  const [checked, setChecked] = useState({});

  const toggle = (index) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!items || items.length === 0) {
    return <p>No checklist items available.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`checklist-${index}`}
            checked={!!checked[index]}
            onChange={() => toggle(index)}
            className="w-4 h-4"
          />
          <label htmlFor={`checklist-${index}`} className="cursor-pointer">
            {item}
          </label>
        </li>
      ))}
    </ul>
  );
}
