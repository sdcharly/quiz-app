import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset transition-colors',
            'placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
            error
              ? 'ring-red-300 focus:ring-red-500'
              : 'ring-gray-300 focus:ring-blue-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';