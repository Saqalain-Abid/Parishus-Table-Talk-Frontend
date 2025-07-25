import React from 'react';

interface PopoverModalProps {
  type?: 'info' | 'warning' | 'success';
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}


export const PopoverModal: React.FC<PopoverModalProps> = ({
  type = 'info',
  message,
  primaryAction,
  secondaryAction,
}) => {
  return (
    <div className="max-w-sm w-full bg-white p-6 rounded-xl shadow-xl text-center space-y-4">

      <p className="text-gray-600 text-sm">{message}</p>
<div className='flex gap-2'>
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="w-full bg-green-200 hover:bg-green-300 text-green-800 font-medium py-2 rounded-md transition"
        >
          {primaryAction.label}
        </button>
      )}

      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="w-full text-sm text-gray-500 hover:text-black transition"
        >
          {secondaryAction.label}
        </button>
      )}
</div>
    </div>
  );
};
