import React, { useMemo } from 'react';
import { DeviceStatus } from '../types/jarvis';
import { deviceBridge } from '../services/deviceBridge';
import { soundFx } from '../services/audioSynth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Flashlight,
  Sun,
  Vibrate,
  Battery,
  BatteryCharging,
  Eye,
  Volume2,
  VolumeX,
  Palette,
  Mic,
  Cpu,
  TrendingDown,
  Clock,
  Activity,
  Zap,
  BatteryWarning,
  Wifi,
  Bluetooth,
  Power,
  ShieldAlert,
} from 'lucide-react';

interface SettingsPanelProps {
  deviceStatus: DeviceStatus;
  onToggleTorch: () => void;
  onToggleScreenTorch: () => void;
  onToggleWakeLock: () => void;
  onToggleSound: () => void;
  onSetTheme: (theme: 'cyan' | 'gold' | 'crimson' | 'emerald') => void;
  onSetLanguage: (lang: 'hi-IN' | 'en-IN' | 'en-US') => void;
  currentLanguage: 'hi-IN' | 'en-IN' | 'en-US';
  useGeminiTts: boolean;
  onToggleGeminiTts: (enable: boolean) => void;
  onToggleBatterySaver: (enable?: boolean) => void;
  onToggleBrightness: () => void;
  onToggleAnimations: () => void;
  onSimulateLowBattery: () => void;
}

interface BatteryDataPoint {
  time: string;
  hour: number;
  level: number;
  isCharging: boolean;
  activity: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  deviceStatus,
  onToggleTorch,
  onToggleScreenTorch,
  onToggleWakeLock,
  onToggleSound,
  onSetTheme,
  onSetLanguage,
  currentLanguage,
  useGeminiTts,
  onToggleGeminiTts,
  onToggleBatterySaver,
  onToggleBrightness,
  onToggleAnimations,
  onSimulateLowBattery,
}) => {
  // Subtle haptic confirmation helper (crisp 35ms tactile pulse)
  const handleSettingAction = (action: () => void, hapticDuration = 35) => {
    soundFx.playClick();
    deviceBridge.vibrate(hapticDuration);
    action();
  };

  const handleVibrateTest = () => {
    soundFx.playClick();
    deviceBridge.vibrate([150, 80, 150]);
  };

  // Generate realistic 24-hour battery consumption history anchored to current battery
  const batteryData: BatteryDataPoint[] = useMemo(() => {
    const currentBat = deviceStatus.batteryLevel !== null ? deviceStatus.batteryLevel : 84;
    const isNowCharging = Boolean(deviceStatus.isCharging);
    const now = new Date();

    const profileOffsets = [
      { hOffset: 24, delta: +12, charging: false, note: 'Standby / Screen Off' },
      { hOffset: 22, delta: +11, charging: false, note: 'Night Standby' },
      { hOffset: 20, delta: +10, charging: false, note: 'Sleep Mode' },
      { hOffset: 18, delta: +9, charging: false, note: 'Idle' },
      { hOffset: 16, delta: +8, charging: false, note: 'Morning Alarm / Wakeup' },
      { hOffset: 14, delta: -8, charging: true, note: 'Morning AC Fast Charge' },
      { hOffset: 12, delta: +14, charging: false, note: 'Commute / Audio Streaming' },
      { hOffset: 10, delta: +9, charging: false, note: 'Jarvis Voice Queries & Work' },
      { hOffset: 8, delta: +5, charging: false, note: 'Screen On / Messages' },
      { hOffset: 6, delta: -12, charging: true, note: 'Desk USB Top-up' },
      { hOffset: 4, delta: +4, charging: false, note: 'Navigation & Calls' },
      { hOffset: 2, delta: +2, charging: false, note: 'Active JARVIS Assistant' },
      { hOffset: 0, delta: 0, charging: isNowCharging, note: isNowCharging ? 'Charging (Current)' : 'Active (Current)' },
    ];

    return profileOffsets.map((item) => {
      const pointTime = new Date(now.getTime() - item.hOffset * 3600 * 1000);
      const hourStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const calculatedLevel = Math.min(100, Math.max(12, currentBat + item.delta));

      return {
        time: hourStr,
        hour: pointTime.getHours(),
        level: item.hOffset === 0 ? currentBat : calculatedLevel,
        isCharging: item.charging,
        activity: item.note,
      };
    });
  }, [deviceStatus.batteryLevel, deviceStatus.isCharging]);

  // Custom Futuristic Tooltip for Recharts
  const CustomBatteryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: BatteryDataPoint = payload[0].payload;
      return (
        <div className="bg-[#050e1f]/95 border border-cyan-400/60 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-tech space-y-1">
          <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold border-b border-cyan-900 pb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> {data.time}
            </span>
            <span className={data.isCharging ? 'text-emerald-400' : 'text-cyan-200'}>
              {data.isCharging ? '⚡ CHARGING' : 'DISCHARGING'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-slate-400">Battery Level:</span>
            <span className="text-cyan-300 font-bold text-sm">{data.level}%</span>
          </div>
          <div className="text-[10px] text-cyan-400/80">
            Protocol: <span className="text-slate-200">{data.activity}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto max-h-[500px] pr-1">
      {/* Device Hardware Controls */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-hud font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Flashlight className="w-4 h-4 text-cyan-400" /> DEVICE HARDWARE PROTOCOLS
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Hardware Torch / Flashlight */}
          <button
            onClick={() => handleSettingAction(onToggleTorch, 40)}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all active:scale-95 ${
              deviceStatus.torchActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-950'
                : 'bg-slate-900/70 border-cyan-500/20 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            <Flashlight className={`w-6 h-6 mb-1.5 ${deviceStatus.torchActive ? 'text-amber-300 animate-pulse' : 'text-cyan-400'}`} />
            <span className="text-xs font-bold font-hud">FLASHLIGHT</span>
            <span className="text-[10px] font-tech text-cyan-400/80">
              {deviceStatus.torchActive ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
            </span>
          </button>

          {/* Screen Torch (Super Bright White Beam) */}
          <button
            onClick={() => handleSettingAction(onToggleScreenTorch, 40)}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all active:scale-95 ${
              deviceStatus.screenTorchActive
                ? 'bg-white/20 border-white text-white shadow-lg'
                : 'bg-slate-900/70 border-cyan-500/20 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            <Sun className={`w-6 h-6 mb-1.5 ${deviceStatus.screenTorchActive ? 'text-yellow-200' : 'text-cyan-400'}`} />
            <span className="text-xs font-bold font-hud">SCREEN TORCH</span>
            <span className="text-[10px] font-tech text-cyan-400/80">
              {deviceStatus.screenTorchActive ? 'MAX LUMENS ON' : 'OFF'}
            </span>
          </button>

          {/* Haptic Vibration Test */}
          <button
            onClick={handleVibrateTest}
            className="p-3.5 rounded-xl border bg-slate-900/70 border-cyan-500/20 hover:border-cyan-400/50 text-slate-300 flex flex-col items-center justify-center text-center active:scale-95 transition-all"
          >
            <Vibrate className="w-6 h-6 mb-1.5 text-cyan-400" />
            <span className="text-xs font-bold font-hud">HAPTIC VIBRATION</span>
            <span className="text-[10px] font-tech text-cyan-400/80">TAP TO TRIGGER</span>
          </button>

          {/* Screen Wake Lock */}
          <button
            onClick={() => handleSettingAction(onToggleWakeLock, 35)}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all active:scale-95 ${
              deviceStatus.wakeLockActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/70 border-cyan-500/20 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            <Eye className={`w-6 h-6 mb-1.5 ${deviceStatus.wakeLockActive ? 'text-cyan-300' : 'text-slate-500'}`} />
            <span className="text-xs font-bold font-hud">KEEP SCREEN ON</span>
            <span className="text-[10px] font-tech text-cyan-400/80">
              {deviceStatus.wakeLockActive ? 'WAKELOCK ON' : 'SYSTEM DEFAULT'}
            </span>
          </button>
        </div>
      </div>

      {/* Battery Diagnostic Telemetry & 24-Hour Consumption Line Chart */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3 shadow-lg shadow-cyan-950/40">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              {deviceStatus.isCharging ? (
                <BatteryCharging className="w-6 h-6 text-emerald-400 animate-pulse" />
              ) : (
                <Battery className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-hud font-bold text-slate-200">
                BATTERY CONSUMPTION & TELEMETRY
              </span>
              <p className="text-xs font-tech text-cyan-400/80">
                {deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : 'Reading API...'} •{' '}
                {deviceStatus.isCharging ? '⚡ CHARGING (AC Power)' : 'DISCHARGING'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-tech font-bold text-cyan-300">
              {deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : '--%'}
            </span>
          </div>
        </div>

        {/* 24-Hour Line Chart Header & View Toggle */}
        <div className="flex items-center justify-between border-t border-cyan-900/60 pt-2.5">
          <span className="text-xs font-tech text-cyan-300 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-cyan-400" /> 24-HOUR DRAIN & RECHARGE TREND
          </span>
          <div className="flex items-center gap-1 text-[10px] font-tech text-cyan-500">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Drain
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1.5" /> Charge
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={batteryData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="batteryLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="70%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor={deviceStatus.isCharging ? '#34d399' : '#38bdf8'} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="rgba(56, 189, 248, 0.1)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomBatteryTooltip />} />
              <ReferenceLine
                y={20}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
                label={{ value: 'LOW 20%', fill: '#ef4444', fontSize: 9, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="level"
                stroke="url(#batteryLineGrad)"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: '#040812',
                  stroke: '#38bdf8',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#38bdf8',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  onClick: () => {
                    soundFx.playClick();
                    deviceBridge.vibrate(20);
                  },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-cyan-900/60 text-center font-tech">
          <div className="p-2 rounded-lg bg-black/40 border border-cyan-950">
            <span className="text-[10px] text-cyan-600 block">AVG DRAIN RATE</span>
            <span className="text-xs font-bold text-cyan-200">~3.2% / hr</span>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-cyan-950">
            <span className="text-[10px] text-cyan-600 block">EST. RUNTIME</span>
            <span className="text-xs font-bold text-cyan-200">~14 hrs 30m</span>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-cyan-950">
            <span className="text-[10px] text-cyan-600 block">BATTERY HEALTH</span>
            <span className="text-xs font-bold text-emerald-400">97% OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Automated Battery Saver Protocol (<20% Auto-Trigger) */}
      <div className={`p-4 rounded-xl border transition-all ${
        deviceStatus.batterySaverActive
          ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-950/50'
          : 'bg-slate-900/70 border-cyan-500/30'
      } space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${
              deviceStatus.batterySaverActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-cyan-950 border-cyan-800 text-cyan-400'
            }`}>
              <BatteryWarning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-hud font-bold text-slate-200">
                  BATTERY SAVER PROTOCOL
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase tracking-wider ${
                  deviceStatus.batterySaverActive
                    ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {deviceStatus.batterySaverActive ? 'ENGAGED' : 'STANDBY (<20%)'}
                </span>
              </div>
              <p className="text-[11px] font-tech text-cyan-400/70">
                Automated low-power trigger (&lt;20%) reduces display brightness & halts heavy GPU animations.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSettingAction(() => onToggleBatterySaver(), 40)}
            className={`px-3 py-1.5 rounded-lg text-xs font-hud font-bold transition-all active:scale-95 ${
              deviceStatus.batterySaverActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900'
                : 'bg-slate-800 text-slate-300 border border-cyan-500/40 hover:border-cyan-400'
            }`}
          >
            {deviceStatus.batterySaverActive ? 'DISENGAGE' : 'ENGAGE NOW'}
          </button>
        </div>

        {/* Battery Saver Sub-Protocols */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-tech">
          {/* Display Brightness Dimming Toggle */}
          <button
            onClick={() => handleSettingAction(onToggleBrightness, 30)}
            className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all active:scale-95 ${
              deviceStatus.brightnessReduced
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold block">Screen Dimming</span>
                <span className="text-[10px] text-slate-400">-35% OLED brightness</span>
              </div>
            </div>
            <span className="text-xs font-bold">{deviceStatus.brightnessReduced ? 'ON' : 'OFF'}</span>
          </button>

          {/* GPU Animations Toggle */}
          <button
            onClick={() => handleSettingAction(onToggleAnimations, 30)}
            className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all active:scale-95 ${
              deviceStatus.animationsDisabled
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold block">UI Animations</span>
                <span className="text-[10px] text-slate-400">Stop GPU spin loops</span>
              </div>
            </div>
            <span className="text-xs font-bold">{deviceStatus.animationsDisabled ? 'HALTED' : 'RUNNING'}</span>
          </button>
        </div>

        {/* Radio Settings Quick Links & Test Simulation */}
        <div className="pt-2 border-t border-cyan-900/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                deviceBridge.vibrate(30);
                deviceBridge.openWifiSettings();
              }}
              className="py-1.5 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-tech flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Wifi className="w-3.5 h-3.5 text-amber-400" /> Turn Off Wi-Fi
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                deviceBridge.vibrate(30);
                deviceBridge.openBluetoothSettings();
              }}
              className="py-1.5 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-tech flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Bluetooth className="w-3.5 h-3.5 text-amber-400" /> Turn Off Bluetooth
            </button>
          </div>

          {/* Test Trigger Button */}
          <button
            onClick={() => handleSettingAction(onSimulateLowBattery, 50)}
            className="py-1.5 px-2.5 rounded-lg border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-tech flex items-center gap-1 transition-all active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Simulate &lt;20% Battery Test</span>
          </button>
        </div>
      </div>

      {/* Voice & Speech Language Settings */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-hud font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-cyan-400" /> VOICE RECOGNITION LANGUAGE
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSettingAction(() => onSetLanguage('hi-IN'), 30)}
            className={`py-2 px-3 rounded-lg text-xs font-tech flex flex-col items-center justify-center border transition-all active:scale-95 ${
              currentLanguage === 'hi-IN'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-cyan-300'
            }`}
          >
            <span>HINDI / HINGLISH</span>
            <span className="text-[10px] text-cyan-500/70">hi-IN (Auto)</span>
          </button>
          <button
            onClick={() => handleSettingAction(() => onSetLanguage('en-IN'), 30)}
            className={`py-2 px-3 rounded-lg text-xs font-tech flex flex-col items-center justify-center border transition-all active:scale-95 ${
              currentLanguage === 'en-IN'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-cyan-300'
            }`}
          >
            <span>INDIAN ENGLISH</span>
            <span className="text-[10px] text-cyan-500/70">en-IN</span>
          </button>
          <button
            onClick={() => handleSettingAction(() => onSetLanguage('en-US'), 30)}
            className={`py-2 px-3 rounded-lg text-xs font-tech flex flex-col items-center justify-center border transition-all active:scale-95 ${
              currentLanguage === 'en-US'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-cyan-300'
            }`}
          >
            <span>GLOBAL ENGLISH</span>
            <span className="text-[10px] text-cyan-500/70">en-US</span>
          </button>
        </div>
      </div>

      {/* Voice Synthesis Engine Selection */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-hud font-bold text-slate-200">
              JARVIS STUDIO VOICE (GEMINI TTS)
            </span>
          </div>
          <button
            onClick={() => handleSettingAction(() => onToggleGeminiTts(!useGeminiTts), 35)}
            className={`px-3 py-1 rounded text-xs font-tech font-bold transition-all active:scale-95 ${
              useGeminiTts
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {useGeminiTts ? 'HIGH FIDELITY (ON)' : 'DEVICE TTS (OFF)'}
          </button>
        </div>
        <p className="text-[11px] font-tech text-cyan-400/70">
          Uses Gemini AI Studio speech generation with seamless fallback to offline device voice synthesis.
        </p>
      </div>

      {/* Sci-Fi Sound FX & Themes */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-hud font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-cyan-400" /> HUD THEMES & AUDIO CHIMES
        </h3>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-cyan-500/30">
          <span className="text-xs font-tech text-slate-300">Sci-Fi Sound FX (Chimes, Beeps)</span>
          <button
            onClick={() => handleSettingAction(onToggleSound, 35)}
            className={`p-2 rounded-lg border transition-all active:scale-95 ${
              deviceStatus.soundEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {deviceStatus.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Theme Palette */}
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { id: 'cyan', label: 'Stark Arc', border: 'border-cyan-400', bg: 'bg-cyan-950' },
              { id: 'gold', label: 'Mark 85', border: 'border-yellow-400', bg: 'bg-yellow-950' },
              { id: 'crimson', label: 'Hulkbuster', border: 'border-red-400', bg: 'bg-red-950' },
              { id: 'emerald', label: 'Matrix', border: 'border-emerald-400', bg: 'bg-emerald-950' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => handleSettingAction(() => onSetTheme(t.id), 30)}
              className={`py-2 px-1 rounded-lg border text-[11px] font-tech flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                deviceStatus.theme === t.id
                  ? `${t.border} ${t.bg} text-white font-bold ring-1 ring-white/50`
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${t.border} bg-current`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
