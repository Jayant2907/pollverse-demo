import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-black ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
);

export default Toggle;