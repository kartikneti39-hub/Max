import React from 'react';
import { DeviceStatus } from '../types/jarvis';
import { deviceBridge } from '../services/deviceBridge';
import { soundFx } from '../services/audioSynth';
import {
  BatteryWarning,
  Wifi,
  Bluetooth,
  Sun,
  Zap,
  Activity,
  ShieldAlert,
  X,
  ExternalLink,
  Power,
  Sliders,
} from 'lucide-react';

interface BatterySaverModalProps {
  deviceStatus: DeviceStatus;
  isOpen: boolean;
  onClose: () => void;
  onToggleBatterySaver: (enable?: boolean) => void;
  onToggleBrightness: () => void;
  onToggleAnimations: () => void;
}

export const BatterySaverModal: React.FC<BatterySaverModalProps> = ({
  deviceStatus,
  isOpen,
  onClose,
  onToggleBatterySaver,
  onToggleBrightness,
  onToggleAnimations,
}) => {
  if (!isOpen) return null;

  const handleOpenWifi = () => {
    soundFx.playClick();
    deviceBridge.vibrate(35);
    deviceBridge.openWifiSettings();
  };

  const handleOpenBluetooth = () => {
    soundFx.playClick();
    deviceBridge.vibrate(35);
    deviceBridge.openBluetoothSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#070e1b] border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl shadow-amber-950/60 font-tech text-slate-200 space-y-4">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400">
              <BatteryWarning className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-hud font-bold text-amber-400 tracking-wider">
                  JARVIS BATTERY SAVER PROTOCOL
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : '<20%'}
                </span>
              </div>
              <p className="text-[11px] text-amber-400/80">
                Critical power threshold detected. Energy conservation active.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Energy Saving Measures Status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center gap-2">
            <Sun className={`w-4 h-4 ${deviceStatus.brightnessReduced ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <span className="text-[10px] text-slate-400 block">DISPLAY BRIGHTNESS</span>
              <span className="font-bold text-amber-300">
                {deviceStatus.brightnessReduced ? 'DIMMED (-35% OLED)' : '100% (NORMAL)'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center gap-2">
            <Activity className={`w-4 h-4 ${deviceStatus.animationsDisabled ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <span className="text-[10px] text-slate-400 block">GPU & ANIMATIONS</span>
              <span className="font-bold text-amber-300">
                {deviceStatus.animationsDisabled ? 'HALTED (ZERO DRAIN)' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Radio Power Management (Wi-Fi & Bluetooth) */}
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-300 font-hud text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>RECOMMENDED: DISABLE HIGH-DRAIN WIRELESS RADIOS</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Disabling background Wi-Fi network scanning and Bluetooth RF radios can extend your standby phone duration by up to 3 hours.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleOpenWifi}
              className="py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-tech flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Wifi className="w-4 h-4 text-amber-400" />
              <span>Turn Off Wi-Fi</span>
              <ExternalLink className="w-3 h-3 text-amber-400/70" />
            </button>

            <button
              onClick={handleOpenBluetooth}
              className="py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-tech flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Bluetooth className="w-4 h-4 text-amber-400" />
              <span>Turn Off Bluetooth</span>
              <ExternalLink className="w-3 h-3 text-amber-400/70" />
            </button>
          </div>
        </div>

        {/* Fine-grain Controls */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-300">Screen Dimming (-35%)</span>
            <button
              onClick={() => {
                soundFx.playClick();
                deviceBridge.vibrate(30);
                onToggleBrightness();
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                deviceStatus.brightnessReduced
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {deviceStatus.brightnessReduced ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-300">Disable UI Animations</span>
            <button
              onClick={() => {
                soundFx.playClick();
                deviceBridge.vibrate(30);
                onToggleAnimations();
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                deviceStatus.animationsDisabled
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {deviceStatus.animationsDisabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              soundFx.playClick();
              deviceBridge.vibrate(30);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-hud transition-all active:scale-95 shadow-lg shadow-amber-950"
          >
            KEEP BATTERY SAVER ACTIVE
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              deviceBridge.vibrate(30);
              onToggleBatterySaver(false);
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-tech transition-colors"
          >
            Disable (Normal)
          </button>
        </div>
      </div>
    </div>
  );
};
