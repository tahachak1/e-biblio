import React from 'react';
import { cn } from '../lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

// Full page loader
export const PageLoader: React.FC<{ text?: string }> = ({ text = "Chargement..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader size="lg" text={text} />
  </div>
);

// Inline loader for buttons
export const ButtonLoader: React.FC = () => (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
);

// Skeleton loader for content
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse bg-gray-200 rounded",
      className
    )}
  />
);
