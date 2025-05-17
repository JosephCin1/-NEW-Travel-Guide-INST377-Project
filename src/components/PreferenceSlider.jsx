import React, { useState } from "react";

const labels = [
  "outdoor",
  "activity_intensity",
  "cultural",
  "social",
  "budget",
  "local_flavor",
  "touristy",
  "indoor",
  "eventful",
  "romantic",
];

export default function PreferenceSlider() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(
    Array(labels.length).fill(null) // null means no value selected yet
  );

  // Check if all values are valid (1-10)
  const allValid = values.every((val) => val >= 1 && val <= 10);

  function handleChange(index, newValue) {
    const newValues = [...values];
    newValues[index] = Number(newValue);
    setValues(newValues);
  }

  function handleSubmit() {
    if (!allValid) return;
    console.log("Submitted values:", values);
    setOpen(false);
  }

  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Sliders Modal</button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setOpen(false)} // close on backdrop click
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 8,
              width: 400,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
          >
            <h2>Set values</h2>

            {labels.map((label, i) => (
              <div key={label} style={{ marginBottom: 15 }}>
                <label htmlFor={`slider-${i}`} style={{ display: "block", marginBottom: 4 }}>
                  {label}: {values[i] ?? "-"}
                </label>
                <input
                  id={`slider-${i}`}
                  type="range"
                  min="1"
                  max="10"
                  value={values[i] ?? 1}
                  onChange={(e) => handleChange(i, e.target.value)}
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allValid}
              style={{
                marginTop: 10,
                padding: "8px 16px",
                cursor: allValid ? "pointer" : "not-allowed",
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
