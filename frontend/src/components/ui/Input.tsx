'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  label,
  error,
  helpText,
  type = 'text',
  ...props
}, ref) => {
  const baseStyles = 'block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm';
  const errorStyles = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-slate-500">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 