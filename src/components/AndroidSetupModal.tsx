import React from 'react';
import {
  Smartphone,
  Download,
  Mic,
  ShieldAlert,
  Zap,
  CheckCircle,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AndroidSetupModalProps {
  onClose: () => void;
  deferredPrompt: any;
  onInstallApp: () => void;
  isInstalled: boolean;
}

export const AndroidSetupModal: React.FC<AndroidSetupModalProps> = ({
  onClose,
  deferredPrompt,
  onInstallApp,
  isInstalled,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#060e1c] border border-cyan-500/50 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-hud font-bold text-cyan-300">
                ANDROID PHONE CONTROL PROTOCOL
              </h2>
              <p className="text-[11px] font-tech text-cyan-500">
                Setup guide for seamless 100% Android integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors text-sm font-tech"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Step 1: Install to Home Screen as Native Android App */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-hud font-bold text-cyan-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">1</span>
              INSTALL AS NATIVE ANDROID APP (PWA)
            </span>
            {isInstalled ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-tech bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                INSTALLED
              </span>
            ) : null}
          </div>
          <p className="text-xs font-tech text-slate-300 leading-relaxed">
            Install Jarvis to your Android phone home screen. It will open in full-screen standalone mode without any browser URL bars, exactly like a native APK.
          </p>
          <div className="pt-1">
            {deferredPrompt ? (
              <button
                onClick={onInstallApp}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-hud font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> INSTALL JARVIS ON THIS PHONE
              </button>
            ) : (
              <div className="p-2 rounded bg-black/40 border border-cyan-900 text-[11px] font-tech text-cyan-400">
                📌 In Chrome on your phone: Tap Chrome menu <span className="font-bold">⋮ (3 dots)</span> &gt; Tap <span className="font-bold">"Add to Home screen"</span> or <span className="font-bold">"Install App"</span>.
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Voice & Microphone Permission */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="text-xs font-hud font-bold text-cyan-200">
              MICROPHONE PERMISSION (SEAMLESS SPEECH)
            </span>
          </div>
          <p className="text-xs font-tech text-slate-300 leading-relaxed">
            When you tap the Arc Reactor or say a command, Chrome will prompt for microphone access. Select <span className="text-cyan-300 font-bold">"While using the app" / "Always allow"</span> so Jarvis can immediately listen without permission popups.
          </p>
        </div>

        {/* Step 3: Native Calling & Messaging */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="text-xs font-hud font-bold text-cyan-200">
              NATIVE PHONE CALLS & WHATSAPP
            </span>
          </div>
          <p className="text-xs font-tech text-slate-300 leading-relaxed">
            Jarvis communicates directly with Android via <span className="text-cyan-300">tel:</span> and <span className="text-cyan-300">whatsapp://</span> system protocols.
            Speaking <span className="text-cyan-300">"Papa ko call lagao"</span> or <span className="text-cyan-300">"WhatsApp pe Rohan ko message bhejo"</span> automatically opens your phone dialer or pre-fills WhatsApp with recipient and message!
          </p>
        </div>

        {/* Step 4: Advanced Android Automation (Tasker / MacroDroid / Termux) */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="text-xs font-hud font-bold text-amber-300">
              OPTIONAL: SYSTEM AUTOMATION (TASKER / MACRODROID)
            </span>
          </div>
          <p className="text-xs font-tech text-slate-300 leading-relaxed">
            For hardware-level controls like toggling native WiFi, Bluetooth, or unlocking the phone, you can link Jarvis shortcuts with Android automation apps like <span className="text-cyan-300">MacroDroid</span> or <span className="text-cyan-300">Tasker</span> using intent triggers or Webhooks.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-hud font-bold rounded-xl transition-all"
        >
          CONFIRM & RETURN TO JARVIS HUD
        </button>
      </div>
    </div>
  );
};
