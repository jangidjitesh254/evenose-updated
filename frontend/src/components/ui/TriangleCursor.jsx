// TriangleIcon.jsx
export default function TriangleIcon() {
  return (
    <div
      className="inline-block"
      style={{
        width: 0,
        height: 0,
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        borderLeft: "10px solid #f97316", // orange-500
      }}
    />
  );
}
