import React from 'react';
import { SkeletonTheme as ReactSkeletonTheme } from 'react-loading-skeleton';

interface SkeletonThemeProps {
  children: React.ReactNode;
}

const SkeletonTheme: React.FC<SkeletonThemeProps> = ({ children }) => {
  return (
    <ReactSkeletonTheme 
      baseColor="#2A2A2A" 
      highlightColor="#3A3A3A"
      borderRadius="0.5rem"
      duration={1.5}
    >
      {children}
    </ReactSkeletonTheme>
  );
};

export default SkeletonTheme;