import { SparklesIcon } from '@heroicons/react/24/outline';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-pulse"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <SparklesIcon className="w-6 h-6 text-green-600 animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;