import React from 'react';

interface ToastProps {
  message: string;
  show: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, show }) => (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 z-50 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {message}
    </div>
);

export default Toast;