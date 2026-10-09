import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, Smartphone } from 'lucide-react';
import { deviceBridge } from '../services/deviceBridge';
import { soundFx } from '../services/audioSynth';

interface ActiveCallModalProps {
  contactName: string;
  phoneNumber: string;
  onEndCall: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  contactName,
  phoneNumber,
  onEndCall,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLaunchNativeDialer = () => {
    soundFx.playActionSound();
    deviceBridge.makeCall(phoneNumber);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040812]/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 sm:p-8 animate-in fade-in duration-300">
      {/* Top Security Header */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-tech text-cyan-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>STARK SECURE ENCRYPTED CELLULAR LINK</span>
      </div>

      {/* Recipient Details & Animated Avatar */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className="relative">
          {/* Pulsing Calling Rings */}
          <div className="absolute -inset-4 rounded-full border border-cyan-400/30 animate-ping opacity-30" />
          <div className="absolute -inset-8 rounded-full border border-cyan-400/20 animate-pulse opacity-20" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-3xl font-bold text-white shadow-2xl border-2 border-cyan-300">
            {contactName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-hud font-bold text-slate-100">
            {contactName}
          </h2>
          <p className="text-sm font-tech text-cyan-400 tracking-wider">
            {phoneNumber}
          </p>
          <p className="text-sm font-tech text-emerald-400 font-semibold pt-1">
            CALL IN PROGRESS • {formatDuration(seconds)}
          </p>
        </div>

        {/* Audio Wave Simulation */}
        <div className="flex items-center gap-1.5 h-8 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                height: `${Math.floor(Math.random() * 24) + 6}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="w-full max-w-xs space-y-4">
        {/* Native Dial Trigger Button */}
        <button
          onClick={handleLaunchNativeDialer}
          className="w-full py-2.5 px-4 rounded-xl bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 text-xs font-hud font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
          OPEN NATIVE ANDROID DIALER
        </button>

        {/* In-Call Controls Row */}
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              soundFx.playClick();
              setIsMuted(!isMuted);
            }}
            className={`p-4 rounded-full border transition-all ${
              isMuted
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:border-cyan-400'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={() => {
              soundFx.playActionSound();
              onEndCall();
            }}
            className="p-5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-950 active:scale-95 transition-all"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setSpeakerOn(!speakerOn);
            }}
            className={`p-4 rounded-full border transition-all ${
              speakerOn
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900 border-cyan-500/30 text-slate-500'
            }`}
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
