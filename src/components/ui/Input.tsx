import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset transition-colors',
              'placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
              icon ? 'pl-10' : 'pl-4',
              error
                ? 'ring-red-300 focus:ring-red-500'
                : 'ring-gray-300 focus:ring-blue-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';