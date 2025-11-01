import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLanguageStore } from '../store/languageStore';

interface NetworkStatusIndicatorProps {
  position?: 'top' | 'bottom';
  showAlways?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ 
  position = 'top',
  showAlways = false
}) => {
  const { isOnline, isSlowConnection, wasOffline } = useNetworkStatus();
  const { t } = useLanguageStore();
  const [showReconnected, setShowReconnected] = useState(false);
  
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show reconnection message briefly when coming back online
  if (showReconnected) {
    return (
      <div className={`fixed ${position === 'top' ? 'top-20' : 'bottom-4'} left-4 right-4 z-50 flex justify-center`}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm bg-green-500/90 text-white border border-green-400/50 animate-pulse">
          <Wifi className="h-4 w-4" />
          <span>{t('network.restored') || 'Connection restored'}</span>
        </div>
      </div>
    );
  }

  if ((isOnline && !isSlowConnection) && !showAlways) {
    return null; // Don't show anything when connection is good
  }

  return (
    <div className={`fixed ${position === 'top' ? 'top-20' : 'bottom-4'} left-4 right-4 z-50 flex justify-center`}>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm ${
        !isOnline 
          ? 'bg-red-500/90 text-white border border-red-400/50' 
          : isSlowConnection
          ? 'bg-orange-500/90 text-white border border-orange-400/50'
          : 'bg-green-500/90 text-white border border-green-400/50'
      }`}>
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>{t('network.noConnection') || 'No internet connection'}</span>
          </>
        ) : isSlowConnection ? (
          <>
            <AlertTriangle className="h-4 w-4" />
            <span>{t('network.slow') || 'Slow connection detected'}</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>{t('network.connected') || 'Connected'}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;