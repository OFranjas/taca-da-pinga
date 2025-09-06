import React from 'react';

export default function AddButton({ onClick, label }) {
  return (
    <button
      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
