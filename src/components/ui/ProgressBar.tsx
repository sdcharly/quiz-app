import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div
      className={cn('h-2 w-full rounded-full bg-gray-200', className, `progress-${progress}`)}
    />
  );
}