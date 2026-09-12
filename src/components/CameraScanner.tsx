import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  ShoppingBag, 
  Sparkles, 
  Layers, 
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import type { Product } from '../types/grocery';
import { GROCERY_CATALOG } from '../data/groceryCatalog';
import { visionService } from '../services/visionService';
import { soundEffects } from '../services/soundEffects';

interface CameraScannerProps {
  isActive?: boolean;
  onProductDetected: (product: Product) => void;
  onOpenCart: () => void;
  cartCount: number;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  isActive = true,
  onProductDetected,
  onOpenCart,
  cartCount,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isSimulatedShelfOpen, setIsSimulatedShelfOpen] = useState<boolean>(false);
  const [lastDetectedId, setLastDetectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('Align Item');

  // Start camera stream safely
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Check for HTTPS secure context on mobile devices
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setCameraError('On mobile phones, camera access requires HTTPS. Please open using https:// in your browser.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. You can still use the sample grocery shelf!');
        return;
      }

      // Stop any existing tracks before creating a new one
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch {
          // Will play on user touch
        }
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      const errName = (err as Error)?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings.');
      } else {
        setCameraError('Camera could not start. You can tap "Open Quick-Scan Shelf" to test products instantly.');
      }
    }
  }, [facingMode]);

  // Initialize camera when active
  useEffect(() => {
    if (isActive) {
      if (!stream) {
        startCamera();
      } else if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isActive, startCamera, stream]);

  // Cleanup only on true unmount of app
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Live video detection loop for barcodes (only when tab is active)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isAnalyzing) return;

      const detected = await visionService.detectFromVideo(videoRef.current);
      if (detected && detected.id !== lastDetectedId) {
        setLastDetectedId(detected.id);
        soundEffects.playScanBeep();
        onProductDetected(detected);
        setTimeout(() => setLastDetectedId(null), 3000);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isActive, isAnalyzing, lastDetectedId, onProductDetected]);

  // Toggle flashlight (torch)
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch {
        // Torch not supported on front camera or standard webcams
      }
    }
  };

  // Flip camera front / back
  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Trigger snapshot AI capture via Gemini Vision
  const handleCaptureSnapshot = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setScanStatusMessage('Gemini AI Analyzing Item...');

    try {
      let recognized: Product | null = null;

      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          recognized = await visionService.identifyFromSnapshot(canvas);
        }
      } else {
        // If camera stream is unavailable, pick from catalog
        recognized = GROCERY_CATALOG[0];
      }

      if (recognized) {
        soundEffects.playScanBeep();
        setScanStatusMessage(`Identified: ${recognized.name}`);
        onProductDetected(recognized);
      } else {
        setScanStatusMessage('Could not identify item. Try again.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatusMessage('Scan error. Try again.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setScanStatusMessage('Align Item'), 3500);
    }
  };

  // Direct quick-scan item from sample shelf
  const handleQuickScan = (product: Product) => {
    soundEffects.playScanBeep();
    onProductDetected(product);
  };

  const [shelfCategory, setShelfCategory] = useState<string>('All');

  const filteredCatalog = GROCERY_CATALOG.filter(prod => {
    if (shelfCategory === 'All') return true;
    if (shelfCategory === 'Target & Walmart') return prod.storeAvailability && (prod.storeAvailability.includes('Walmart') || prod.storeAvailability.includes('Target'));
    if (shelfCategory === 'Tech') return prod.category === 'Electronics & Tech';
    if (shelfCategory === 'Household') return prod.category === 'Household & Cleaning';
    if (shelfCategory === 'Pharmacy') return prod.category === 'Personal Care & Pharmacy';
    if (shelfCategory === 'Home & Office') return prod.category === 'Home & Kitchen' || prod.category === 'Stationery & Office';
    if (shelfCategory === 'Groceries') return prod.isFood !== false && prod.category !== 'Electronics & Tech' && prod.category !== 'Household & Cleaning' && prod.category !== 'Personal Care & Pharmacy';
    return true;
  });

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden select-none">
      
      {/* Viewfinder Background (Live Camera Feed or Camera Prompt) */}
      <div className="relative flex-1 w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* Simulated camera view or permission prompt */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-black to-zinc-900 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
              <Camera className="w-10 h-10 text-ios-green animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Universal Store Scanner
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              {cameraError || 'Scan any item at Walmart, Target, supermarkets, or department stores.'}
            </p>

            <div className="flex flex-col space-y-2 w-full max-w-xs">
              <button
                onClick={startCamera}
                className="w-full py-2.5 px-4 rounded-xl bg-ios-blue text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Enable Camera Access</span>
              </button>

              <button
                onClick={() => setIsSimulatedShelfOpen(true)}
                className="w-full py-2 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs flex items-center justify-center space-x-1.5 hover:bg-zinc-700 active:scale-95 transition-all"
              >
                <Layers className="w-4 h-4 text-ios-green" />
                <span>Open Quick-Scan Mart Shelf</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Frame Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top AI Engine Indicator Badge */}
        <div className="absolute top-14 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 flex items-center space-x-1.5 text-[11px] font-semibold text-zinc-200 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-ios-purple animate-pulse" />
            <span>Universal AI Mart Scanner</span>
            <span className="w-1.5 h-1.5 rounded-full bg-ios-green" />
          </div>
        </div>

        {/* Scanning Reticle HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center px-8">
          
          {/* Target Box with Glowing Corners */}
          <div className="relative w-72 h-72 max-w-[85vw] max-h-[44vh] rounded-3xl flex items-center justify-center">
            
            {/* 4 Corner Markers */}
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl transition-colors duration-300 ${
              isAnalyzing ? 'border-ios-purple shadow-[0_0_16px_rgba(191,90,242,0.9)]' : 'border-ios-green shadow-[0_0_12px_rgba(48,209,88,0.8)]'
            }`} />
            <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl transition-colors duration-300 ${
              isAnalyzing ? 'border-ios-purple shadow-[0_0_16px_rgba(191,90,242,0.9)]' : 'border-ios-green shadow-[0_0_12px_rgba(48,209,88,0.8)]'
            }`} />
            <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl transition-colors duration-300 ${
              isAnalyzing ? 'border-ios-purple shadow-[0_0_16px_rgba(191,90,242,0.9)]' : 'border-ios-green shadow-[0_0_12px_rgba(48,209,88,0.8)]'
            }`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl transition-colors duration-300 ${
              isAnalyzing ? 'border-ios-purple shadow-[0_0_16px_rgba(191,90,242,0.9)]' : 'border-ios-green shadow-[0_0_12px_rgba(48,209,88,0.8)]'
            }`} />

            {/* Sweeping Laser Line */}
            <div className={`absolute left-3 right-3 h-0.5 rounded-full ${
              isAnalyzing 
                ? 'bg-gradient-to-r from-transparent via-ios-purple to-transparent animate-pulse h-1' 
                : 'bg-gradient-to-r from-transparent via-ios-green to-transparent scanner-laser'
            }`} />

            {/* Central Targeting Dot */}
            <div className="w-3 h-3 rounded-full bg-ios-green/40 border border-ios-green flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>

            {/* Floating Status Pill: "Align Item" */}
            <div className="absolute -bottom-10 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-medium text-zinc-200 flex items-center space-x-2 shadow-xl">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-ios-purple animate-ping' : 'bg-ios-green animate-pulse'}`} />
              <span>{scanStatusMessage}</span>
            </div>
          </div>

        </div>

        {/* Top Floating Action Controls (Torch, Flip Camera, Sample Shelf) */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center pointer-events-auto z-10">
          <button
            onClick={toggleTorch}
            className="w-10 h-10 rounded-full ios-glass flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Toggle Torch"
          >
            {torchOn ? <Zap className="w-5 h-5 text-ios-yellow" /> : <ZapOff className="w-5 h-5 text-zinc-400" />}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSimulatedShelfOpen(!isSimulatedShelfOpen)}
              className="px-3 py-1.5 rounded-full ios-glass text-xs font-semibold text-white flex items-center space-x-1.5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-ios-mint" />
              <span>Mart Shelf</span>
            </button>

            <button
              onClick={flipCamera}
              className="w-10 h-10 rounded-full ios-glass flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Flip Camera"
            >
              <FlipHorizontal className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>

        {/* Bottom Shutter / Instant AI Scan Trigger */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center pointer-events-auto z-10">
          <div className="flex items-center space-x-6">
            
            {/* Quick Cart Preview */}
            <button
              onClick={onOpenCart}
              className="w-12 h-12 rounded-full ios-glass flex flex-col items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all relative"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-ios-blue" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-ios-blue text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-black">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Giant Optical Shutter Button */}
            <button
              onClick={() => handleCaptureSnapshot()}
              disabled={isAnalyzing}
              className={`w-18 h-18 p-1.5 rounded-full border-4 border-white/80 hover:border-white active:scale-90 transition-all flex items-center justify-center shadow-2xl group ${
                isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Scan Product"
            >
              <div className="w-14 h-14 rounded-full bg-white group-hover:bg-zinc-200 transition-colors flex items-center justify-center shadow-lg">
                <Sparkles className={`w-6 h-6 ${isAnalyzing ? 'text-ios-purple animate-spin' : 'text-black'}`} />
              </div>
            </button>

            {/* Quick Shelf Opener */}
            <button
              onClick={() => setIsSimulatedShelfOpen(true)}
              className="w-12 h-12 rounded-full ios-glass flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
              aria-label="Open Sample Items"
            >
              <Layers className="w-5 h-5 text-ios-orange" />
            </button>

          </div>
        </div>

      </div>

      {/* Slide-Up "Universal Mart & Grocery Shelf" Drawer */}
      {isSimulatedShelfOpen && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-ios-card/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-4 shadow-2xl max-h-[70%] flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-ios-green" />
                <span>Supercenter & Mart Shelf Simulator</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Tap any product to simulate scanning Walmart, Target, or grocery items
              </p>
            </div>
            <button
              onClick={() => setIsSimulatedShelfOpen(false)}
              className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Department Filter Tabs */}
          <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-2 border-b border-white/5">
            {['All', 'Target & Walmart', 'Tech', 'Household', 'Pharmacy', 'Home & Office', 'Groceries'].map((cat) => (
              <button
                key={cat}
                onClick={() => setShelfCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  shelfCategory === cat
                    ? 'bg-ios-green text-black font-bold shadow'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto no-scrollbar grid grid-cols-2 gap-2 pt-2.5">
            {filteredCatalog.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  handleQuickScan(prod);
                  setIsSimulatedShelfOpen(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-ios-green/50 active:scale-95 transition-all text-left"
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-ios-blue font-medium truncate">{prod.brand}</p>
                  <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="text-xs font-mono font-bold text-ios-green">${prod.price.toFixed(2)}</span>
                    {prod.nutriScore ? (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">
                        {prod.nutriScore}
                      </span>
                    ) : (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-ios-blue/20 text-ios-blue font-bold truncate max-w-[60px]">
                        Mart
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
