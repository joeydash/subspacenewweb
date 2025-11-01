import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Gift, Sparkles } from 'lucide-react';

interface ScratchCardProps {
  gift: {
    id: string;
    value: number;
    win_text: string;
    win_image?: string;
    type: string;
    coins_required?: number;
  };
  onScratchComplete: (giftId: string) => void;
  isScratching: boolean;
  userCoins: number;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ gift, onScratchComplete, isScratching, userCoins }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const SCRATCH_THRESHOLD = 60; // Percentage of area that needs to be scratched
  const coinsRequired = gift.coins_required || 10; // Default 10 coins required
  const hasEnoughCoins = userCoins >= coinsRequired;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Create scratch surface
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.5, '#E5E5E5');
    gradient.addColorStop(1, '#A8A8A8');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Add scratch texture
    ctx.fillStyle = '#999';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch to reveal', canvas.offsetWidth / 2, canvas.offsetHeight / 2 - 10);
    ctx.fillText('your reward!', canvas.offsetWidth / 2, canvas.offsetHeight / 2 + 10);

    // Add sparkle effects
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.offsetWidth;
      const y = Math.random() * canvas.offsetHeight;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const calculateScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    return (transparentPixels / (pixels.length / 4)) * 100;
  }, []);

  const scratch = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isScratched || isScratching || !hasEnoughCoins) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    const percentage = calculateScratchPercentage();
    setScratchPercentage(percentage);

    if (percentage >= SCRATCH_THRESHOLD && !isScratched) {
      setIsScratched(true);
      setShowReward(true);
      
      // Complete the scratch reveal with animation
      setTimeout(() => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        
        // Call the completion handler after a short delay
        setTimeout(() => {
          onScratchComplete(gift.id);
        }, 1000);
      }, 500);
    }
  }, [isScratched, isScratching, hasEnoughCoins, calculateScratchPercentage, gift.id, onScratchComplete]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasEnoughCoins) return;
    setIsDrawing(true);
    scratch(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && hasEnoughCoins) {
      scratch(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!hasEnoughCoins) return;
    setIsDrawing(true);
    scratch(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawing && hasEnoughCoins) {
      scratch(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const getGiftTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'coins':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'trophy':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'star':
        return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      default:
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getGiftTypeColor(gift.type)} border rounded-xl p-6 relative overflow-hidden group ${
      !hasEnoughCoins ? 'opacity-60' : ''
    }`}>
      {/* Coin requirement strip */}
      <div className="absolute top-0 left-0 right-0 bg-black backdrop-blur-sm text-white text-center py-2 z-10">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
          </svg>
          <span>{coinsRequired} coins required</span>
        </div>
      </div>

      {/* Background reward content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <div className={`transition-all duration-1000 ${showReward ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          {gift.win_image && (
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg overflow-hidden bg-white/10">
              <img
                src={gift.win_image}
                alt="Gift"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2 flex items-center justify-center gap-3">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <img src="/coin.svg" alt="Coin" className="w-8 h-8" />
              <span>{gift.value}</span>
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">{gift.win_text}</h3>
            <div className="text-sm text-green-400 font-medium">
              Congratulations! 🎉
            </div>
          </div>
        </div>
      </div>

      {/* Scratch canvas overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full touch-none mt-10 ${
          isScratched || !hasEnoughCoins ? 'pointer-events-none' : 'cursor-pointer'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          touchAction: 'none',
          opacity: isScratched ? 0 : 1,
          transition: 'opacity 0.5s ease-out'
        }}
      />

      {/* Scratch progress indicator */}
      {scratchPercentage > 0 && scratchPercentage < SCRATCH_THRESHOLD && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(scratchPercentage)}%
        </div>
      )}

      {/* Loading overlay when processing */}
      {isScratching && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-400"></div>
            <span className="text-white font-medium">Processing reward...</span>
          </div>
        </div>
      )}

      {/* Placeholder content for sizing */}
      <div className="opacity-0 pointer-events-none">
        <div className="flex items-center justify-between mb-4">
          <Gift className="h-6 w-6" />
          <div className="text-xs px-2 py-1 rounded-full">Scratch Card</div>
        </div>
        <div className="w-16 h-16 mx-auto mb-4"></div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <img src="/coin.svg" alt="Coin" className="w-6 h-6" />
            <span>{gift.value}</span>
          </div>
          <div className="text-sm">Scratch to reveal</div>
        </div>
      </div>
    </div>
  );
};

export default ScratchCard;