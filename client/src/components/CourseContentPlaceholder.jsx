import React from 'react';
import { ChevronDown, PlayCircle } from 'lucide-react'; // Assuming you use lucide-react for icons

// Utility component to create a placeholder line
const PlaceholderLine = ({ width = 'w-full' }) => (
  <div className={`h-4 bg-gray-200 rounded animate-pulse ${width}`}></div>
);

// Component for a single video placeholder
const VideoPlaceholder = () => (
  <div className="flex items-center space-x-3 p-2 border-l-2 border-transparent">
    <PlayCircle className="w-5 h-5 text-gray-400" />
    <PlaceholderLine width="w-3/4" />
    <PlaceholderLine width="w-1/6" />
  </div>
);

// Component for a single module (Accordion) placeholder
const ModulePlaceholder = ({ moduleNumber }) => {
  // Simulate an accordion header
  const header = (
    <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-4 w-full">
        <ChevronDown className="w-5 h-5 text-gray-400" />
        <PlaceholderLine width="w-2/3" />
      </div>
    </div>
  );

  // Simulate the module content (videos)
  const content = (
    <div className="p-4 space-y-2">
      <VideoPlaceholder />
      <VideoPlaceholder />
      <VideoPlaceholder />
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      {header}
      {/* For simplicity, we show the content of the first module placeholder expanded */}
      {moduleNumber === 1 ? content : null} 
    </div>
  );
};

// Main Course Content Placeholder component
const CourseContentPlaceholder = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        <PlaceholderLine width="w-1/3" />
      </h2>
      <div className="mt-4 space-y-3">
        {/* Render a few modules to mimic the course outline */}
        <ModulePlaceholder moduleNumber={1} />
        <ModulePlaceholder moduleNumber={2} />
        <ModulePlaceholder moduleNumber={3} />
      </div>
    </div>
  );
};

export default CourseContentPlaceholder;