import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { speechAssistant } from '../services/speechService';
import { soundEffects } from '../services/soundEffects';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (rawText: string) => void;
  lastAssistantFeedback?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onCommand,
  lastAssistantFeedback,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sampleCommands = [
    'Add Tide Pods',
    'Add Apple Charger',
    'Add CeraVe Lotion',
    'Add almond milk',
    'Find cheaper alternatives',
    'What is my total spending?',
  ];

  useEffect(() => {
    if (isOpen) {
      startListeningSession();
    } else {
      speechAssistant.stopListening();
      setIsListening(false);
      setTranscript('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const startListeningSession = () => {
    setErrorMessage(null);
    setTranscript('');
    soundEffects.playVoiceStart();

    if (!speechAssistant.isSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. You can tap the sample commands below to test!');
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechAssistant.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 0) {
          setIsListening(false);
          onCommand(text);
        }
      },
      (error) => {
        setIsListening(false);
        setErrorMessage(error === 'not-allowed' 
          ? 'Microphone permission denied. Tap any sample command below to test hands-free actions!' 
          : `Speech input error: ${error}`
        );
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleStop = () => {
    speechAssistant.stopListening();
    setIsListening(false);
  };

  const handleSelectSample = (cmd: string) => {
    speechAssistant.stopListening();
    setIsListening(false);
    setTranscript(cmd);
    onCommand(cmd);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-ios-card border-t sm:border border-white/10 rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl flex flex-col space-y-5 animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-ios-blue animate-ping" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              SmartCart Voice Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Central Orb & Wave Animation */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <button
            onClick={isListening ? handleStop : startListeningSession}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-tr from-ios-blue to-purple-500 shadow-[0_0_35px_rgba(10,132,255,0.7)] scale-105'
                : 'bg-zinc-800 border-2 border-white/20 hover:border-ios-blue'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 text-white animate-pulse" />
            ) : (
              <MicOff className="w-10 h-10 text-zinc-400" />
            )}

            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-ios-blue/50 animate-ping opacity-75" />
            )}
          </button>

          {/* Sound Wave Equalizer Bars */}
          {isListening && (
            <div className="flex items-center space-x-1.5 h-8">
              {[40, 70, 90, 60, 100, 50, 80, 45, 95].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-ios-blue to-ios-purple rounded-full sound-wave-bar"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Spoken Text / Status Feedback */}
          <div className="text-center px-4 min-h-[44px]">
            {transcript ? (
              <p className="text-base font-semibold text-white italic">
                "{transcript}"
              </p>
            ) : isListening ? (
              <p className="text-xs text-zinc-400">
                Listening for your command... Try saying "Add almond milk"
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                Tap microphone to speak or tap a suggestion below
              </p>
            )}

            {lastAssistantFeedback && !isListening && (
              <div className="mt-3 p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-ios-mint flex items-center justify-center space-x-1.5">
                <Volume2 className="w-4 h-4 flex-shrink-0" />
                <span>{lastAssistantFeedback}</span>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-ios-orange mt-2">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-xs font-semibold text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-ios-purple" />
            <span>Suggested Voice Commands:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sampleCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleSelectSample(cmd)}
                className="p-2.5 rounded-xl bg-zinc-900/90 border border-white/5 hover:border-ios-blue/40 text-left text-xs text-zinc-200 hover:text-white flex items-center justify-between active:scale-95 transition-all group"
              >
                <span className="truncate pr-1">"{cmd}"</span>
                <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-ios-blue flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
