import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface FavoriteBrandsSkeletonProps {
  count?: number;
}

const FavoriteBrandsSkeleton: React.FC<FavoriteBrandsSkeletonProps> = ({ count = 8 }) => {
  return (
    <SkeletonTheme baseColor="#3a3a3a" highlightColor="#2a2a2a" duration={1.5}>
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-6 px-2">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="flex flex-col items-center w-24">
                <div className="relative w-18 h-18 rounded-full overflow-hidden mt-4 mb-4">
                  <Skeleton circle width={72} height={72} />
                </div>
                <div className="text-center w-full">
                  <Skeleton width={70} height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default FavoriteBrandsSkeleton;
