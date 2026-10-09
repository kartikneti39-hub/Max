import React, { useState, useEffect, useRef } from 'react';
import {
  JarvisMode,
  HudTab,
  Contact,
  Reminder,
  ScheduleItem,
  AppShortcut,
  DeviceStatus,
  ChatMessage,
  JarvisActionResponse,
} from './types/jarvis';
import { ArcReactor } from './components/ArcReactor';
import { PhoneControlPanel } from './components/PhoneControlPanel';
import { SchedulePanel } from './components/SchedulePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AndroidSetupModal } from './components/AndroidSetupModal';
import { ActiveCallModal } from './components/ActiveCallModal';
import { MessageComposerModal } from './components/MessageComposerModal';
import { BatterySaverModal } from './components/BatterySaverModal';
import { INITIAL_CONTACTS, DEFAULT_APP_SHORTCUTS, deviceBridge } from './services/deviceBridge';
import { speechEngine } from './services/speechEngine';
import { soundFx } from './services/audioSynth';
import {
  Mic,
  MicOff,
  Phone,
  Calendar,
  Settings,
  HelpCircle,
  Activity,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  WifiOff,
  Send,
  Volume2,
  VolumeX,
  Smartphone,
  Download,
  Terminal,
  Sun,
  X,
} from 'lucide-react';

// Personalized time-based greeting based on device hour
export const getTimeGreeting = (): 'Good Morning' | 'Good Afternoon' | 'Good Evening' => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good Morning';
  } else if (hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

export default function App() {
  // Navigation & Core States
  const [hudTab, setHudTab] = useState<HudTab>('core');
  const [mode, setMode] = useState<JarvisMode>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [typedCommand, setTypedCommand] = useState<string>('');
  const [notificationTicker, setNotificationTicker] = useState<string>(
    () => `${getTimeGreeting().toUpperCase()}, SIR • PROTOCOL ONLINE`
  );

  const hasSpokenWelcomeRef = useRef(false);

  const speakWelcomeGreeting = () => {
    if (hasSpokenWelcomeRef.current) return;
    hasSpokenWelcomeRef.current = true;
    soundFx.playBootSound();
    const greeting = getTimeGreeting();
    const welcomeSpeech = `${greeting}, Sir. Jarvis is online, and all systems are fully operational.`;
    speechEngine.speak(
      welcomeSpeech,
      () => setMode('speaking'),
      () => setMode('idle')
    );
  };

  // Stored Data (with localStorage persistence)
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('jarvis_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('jarvis_reminders');
    return saved
      ? JSON.parse(saved)
      : [
          { id: '1', title: 'Take Multivitamins', time: '10:00 AM', completed: false },
          { id: '2', title: 'Client Project Review', time: '03:30 PM', completed: false },
          { id: '3', title: 'Evening Workout', time: '07:00 PM', completed: false },
        ];
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('jarvis_schedule');
    return saved
      ? JSON.parse(saved)
      : [
          { id: '1', title: 'Morning Briefing & Tech Sync', time: '09:30 AM', category: 'work', completed: true },
          { id: '2', title: 'Call with Vendor regarding logistics', time: '02:00 PM', category: 'call', completed: false },
          { id: '3', title: 'Cardio & Strength Training', time: '06:30 PM', category: 'fitness', completed: false },
        ];
  });

  const [apps, setApps] = useState<AppShortcut[]>(() => {
    const saved = localStorage.getItem('jarvis_apps');
    return saved ? JSON.parse(saved) : DEFAULT_APP_SHORTCUTS;
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const greeting = getTimeGreeting();
    return [
      {
        id: 'init',
        sender: 'jarvis',
        text: `${greeting}, Sir. Jarvis is fully initialized on your Android device. All phone controls, messaging, dialer, and schedule modules are operational.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Hardware & Device Status
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    batteryLevel: null,
    isCharging: null,
    isOnline: navigator.onLine,
    networkType: '4G/LTE',
    torchActive: false,
    screenTorchActive: false,
    wakeLockActive: false,
    soundEnabled: true,
    theme: 'cyan',
    batterySaverActive: false,
    brightnessReduced: false,
    animationsDisabled: false,
  });

  // Modals & Interactive Overlays
  const [activeCall, setActiveCall] = useState<{ name: string; phoneNumber: string } | null>(null);
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    recipient: string;
    phone: string;
    message?: string;
    platform?: 'whatsapp' | 'sms';
  }>({ open: false, recipient: '', phone: '' });

  const [showBatterySaverModal, setShowBatterySaverModal] = useState(false);
  const batterySaverTriggeredRef = useRef(false);

  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Voice settings
  const [currentLanguage, setCurrentLanguage] = useState<'hi-IN' | 'en-IN' | 'en-US'>('hi-IN');
  const [useGeminiTts, setUseGeminiTts] = useState<boolean>(true);

  // Time ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persist items
  useEffect(() => {
    localStorage.setItem('jarvis_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('jarvis_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('jarvis_apps', JSON.stringify(apps));
  }, [apps]);

  // Battery Saver Protocol Handlers
  const triggerAutoBatterySaver = (level: number) => {
    batterySaverTriggeredRef.current = true;
    soundFx.playAlarmChime();
    deviceBridge.vibrate([120, 60, 120, 60, 200]);
    setNotificationTicker(`CRITICAL POWER WARNING (${level}%): BATTERY SAVER ACTIVE`);
    setDeviceStatus((prev) => ({
      ...prev,
      batterySaverActive: true,
      brightnessReduced: true,
      animationsDisabled: true,
    }));
    setShowBatterySaverModal(true);
    speechEngine.speak(
      `Sir, critical power warning. Battery is at ${level} percent. Initiating Battery Saver protocol to conserve power.`
    );
  };

  const handleSimulateLowBattery = () => {
    batterySaverTriggeredRef.current = false;
    setDeviceStatus((prev) => ({
      ...prev,
      batteryLevel: 18,
      isCharging: false,
    }));
    triggerAutoBatterySaver(18);
  };

  const handleToggleBatterySaver = (enable?: boolean) => {
    setDeviceStatus((prev) => {
      const nextState = enable !== undefined ? enable : !prev.batterySaverActive;
      if (nextState) {
        soundFx.playClick();
        deviceBridge.vibrate([80, 40, 80]);
        setShowBatterySaverModal(true);
        setNotificationTicker('BATTERY SAVER PROTOCOL: ENGAGED');
      } else {
        soundFx.playClick();
        deviceBridge.vibrate(30);
        setNotificationTicker('BATTERY SAVER PROTOCOL: DISENGAGED');
      }
      return {
        ...prev,
        batterySaverActive: nextState,
        brightnessReduced: nextState,
        animationsDisabled: nextState,
      };
    });
  };

  const handleToggleBrightness = () => {
    setDeviceStatus((prev) => ({
      ...prev,
      brightnessReduced: !prev.brightnessReduced,
    }));
  };

  const handleToggleAnimations = () => {
    setDeviceStatus((prev) => ({
      ...prev,
      animationsDisabled: !prev.animationsDisabled,
    }));
  };

  // Clock ticker & battery detection
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Initial Battery inspection & real-time event listeners
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          const level = Math.round(battery.level * 100);
          const charging = battery.charging;
          setDeviceStatus((prev) => ({
            ...prev,
            batteryLevel: level,
            isCharging: charging,
          }));

          // Automated Battery Saver check when battery falls below 20% and not charging
          if (level <= 20 && !charging && !batterySaverTriggeredRef.current) {
            triggerAutoBatterySaver(level);
          }
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch((e: any) => console.warn('Battery API error:', e));
    } else {
      deviceBridge.getBatteryInfo().then((info) => {
        if (info) {
          setDeviceStatus((prev) => ({
            ...prev,
            batteryLevel: info.level,
            isCharging: info.charging,
          }));
          if (info.level <= 20 && !info.charging && !batterySaverTriggeredRef.current) {
            triggerAutoBatterySaver(info.level);
          }
        }
      });
    }

    // PWA Install prompt listener
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Play boot sound and speak personalized welcome greeting on first user interaction
    const handleInitialTouch = () => {
      speakWelcomeGreeting();
      window.removeEventListener('click', handleInitialTouch);
      window.removeEventListener('touchstart', handleInitialTouch);
    };
    window.addEventListener('click', handleInitialTouch);
    window.addEventListener('touchstart', handleInitialTouch);

    // Also attempt immediate welcome greeting after brief initialization delay
    const initialWelcomeTimer = setTimeout(() => {
      speakWelcomeGreeting();
    }, 800);

    return () => {
      clearInterval(timer);
      clearTimeout(initialWelcomeTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('click', handleInitialTouch);
      window.removeEventListener('touchstart', handleInitialTouch);
    };
  }, []);

  // Reminder alert checker
  useEffect(() => {
    const alertInterval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      reminders.forEach((r) => {
        if (!r.completed && !r.alertTriggered) {
          // Compare times
          const [timePart, modifier] = r.time.split(' ');
          if (timePart) {
            let [hoursStr, minutesStr] = timePart.split(':');
            let hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            if (hours === currentHours && minutes === currentMinutes) {
              // Trigger reminder alarm
              soundFx.playAlarmChime();
              deviceBridge.vibrate([200, 100, 200, 100, 200]);
              setNotificationTicker(`REMINDER ALERT: ${r.title.toUpperCase()}`);
              speechEngine.speak(`Sir, reminder alert for: ${r.title}`);
              setReminders((prev) =>
                prev.map((item) => (item.id === r.id ? { ...item, alertTriggered: true } : item))
              );
            }
          }
        }
      });
    }, 15000);

    return () => clearInterval(alertInterval);
  }, [reminders]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, liveTranscript]);

  // Handle PWA Install click
  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      setShowAndroidGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Execute Jarvis Actions
  const executeJarvisAction = (actionData: JarvisActionResponse) => {
    setNotificationTicker(actionData.uiNotification || 'PROTOCOL EXECUTED');
    soundFx.playActionSound();

    switch (actionData.actionType) {
      case 'CALL': {
        const recipient = actionData.callDetails?.recipientName || 'Contact';
        let phone = actionData.callDetails?.phoneNumber;
        // Search contacts if phone not directly provided
        if (!phone) {
          const matched = contacts.find(
            (c) =>
              c.name.toLowerCase().includes(recipient.toLowerCase()) ||
              recipient.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matched) {
            phone = matched.phoneNumber;
          }
        }

        if (phone) {
          deviceBridge.vibrate(100);
          setActiveCall({ name: recipient, phoneNumber: phone });
        } else {
          // Open Phone Tab
          setHudTab('phone');
        }
        break;
      }

      case 'SEND_MESSAGE': {
        const recipient = actionData.messageDetails?.recipientName || 'Contact';
        let phone = actionData.messageDetails?.phoneNumber;
        if (!phone) {
          const matched = contacts.find(
            (c) =>
              c.name.toLowerCase().includes(recipient.toLowerCase()) ||
              recipient.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matched) {
            phone = matched.phoneNumber;
          }
        }

        setMessageModal({
          open: true,
          recipient,
          phone: phone || '',
          message: actionData.messageDetails?.messageText || '',
          platform: actionData.messageDetails?.platform || 'whatsapp',
        });
        break;
      }

      case 'OPEN_APP': {
        const appName = actionData.appDetails?.appName || '';
        if (appName) {
          deviceBridge.launchApp(appName, apps);
        } else {
          setHudTab('phone');
        }
        break;
      }

      case 'SET_REMINDER': {
        if (actionData.reminderDetails?.title) {
          const newRem: Reminder = {
            id: Date.now().toString(),
            title: actionData.reminderDetails.title,
            time: actionData.reminderDetails.time || '12:00 PM',
            completed: false,
          };
          setReminders((prev) => [newRem, ...prev]);
        }
        break;
      }

      case 'ADD_SCHEDULE': {
        if (actionData.scheduleDetails?.title) {
          const newSched: ScheduleItem = {
            id: Date.now().toString(),
            title: actionData.scheduleDetails.title,
            time: actionData.scheduleDetails.time || '10:00 AM',
            category: actionData.scheduleDetails.category || 'work',
            completed: false,
          };
          setSchedule((prev) => [...prev, newSched]);
        }
        break;
      }

      case 'CONTROL_SETTINGS': {
        const setting = actionData.settingsDetails?.setting;
        const state = actionData.settingsDetails?.state;

        if (setting === 'flashlight') {
          handleToggleTorch();
        } else if (setting === 'screen_torch') {
          handleToggleScreenTorch();
        } else if (setting === 'vibrate') {
          deviceBridge.vibrate([150, 100, 150]);
        } else if (setting === 'battery') {
          setHudTab('settings');
        } else if (setting === 'battery_saver') {
          const enable = state === 'off' ? false : true;
          handleToggleBatterySaver(enable);
        }
        break;
      }

      case 'GET_BRIEFING': {
        setHudTab('schedule');
        break;
      }

      default:
        break;
    }
  };

  // Main Query Pipeline (Voice or Text)
  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Add user message to log
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setLiveTranscript('');
    setTypedCommand('');
    setMode('processing');

    try {
      const response = await fetch('/api/jarvis/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          context: {
            time: currentTime.toLocaleTimeString(),
            date: currentTime.toDateString(),
            batteryLevel: deviceStatus.batteryLevel,
            isCharging: deviceStatus.isCharging,
            contacts: contacts.map((c) => ({ name: c.name, phone: c.phoneNumber, relation: c.relationship })),
            reminders: reminders.filter((r) => !r.completed),
            schedule: schedule,
          },
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const jarvisResponse: JarvisActionResponse = result.data;

        // Add Jarvis message to chat log
        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'jarvis',
          text: jarvisResponse.spokenResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTag: jarvisResponse.actionType,
        };
        setChatHistory((prev) => [...prev, jarvisMsg]);

        // Speak aloud
        setMode('speaking');
        await speechEngine.speak(
          jarvisResponse.spokenResponse,
          () => setMode('speaking'),
          () => setMode('idle')
        );

        // Execute device action
        executeJarvisAction(jarvisResponse);
      } else {
        throw new Error(result.error || 'Diagnostic computation failed');
      }
    } catch (err: any) {
      console.error('Jarvis processing error:', err);
      const fallbackText = 'At your service, Sir. Unable to connect to neural core. What is your command?';
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'jarvis',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speechEngine.speak(fallbackText, undefined, () => setMode('idle'));
    }
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    if (mode === 'listening') {
      speechEngine.stopListening();
      setMode('idle');
    } else {
      deviceBridge.vibrate(50);
      speechEngine.startListening(
        (transcript, isFinal) => {
          setLiveTranscript(transcript);
          if (isFinal) {
            processQuery(transcript);
          }
        },
        (isListening) => {
          setMode(isListening ? 'listening' : 'idle');
        },
        (err) => {
          setNotificationTicker(`MIC FAULT: ${err}`);
          setMode('idle');
        }
      );
    }
  };

  // Hardware Toggles
  const handleToggleTorch = async () => {
    soundFx.playClick();
    const result = await deviceBridge.toggleTorch();
    setDeviceStatus((prev) => ({ ...prev, torchActive: result.active }));
    if (!result.success && !result.active) {
      // Auto fallback to screen torch
      handleToggleScreenTorch();
    }
  };

  const handleToggleScreenTorch = () => {
    soundFx.playClick();
    setDeviceStatus((prev) => ({ ...prev, screenTorchActive: !prev.screenTorchActive }));
  };

  const handleToggleWakeLock = async () => {
    soundFx.playClick();
    const active = await deviceBridge.toggleWakeLock(!deviceStatus.wakeLockActive);
    setDeviceStatus((prev) => ({ ...prev, wakeLockActive: active }));
  };

  const handleToggleSound = () => {
    soundFx.enabled = !deviceStatus.soundEnabled;
    setDeviceStatus((prev) => ({ ...prev, soundEnabled: soundFx.enabled }));
  };

  const handleSetLanguage = (lang: 'hi-IN' | 'en-IN' | 'en-US') => {
    setCurrentLanguage(lang);
    speechEngine.setLanguage(lang);
  };

  // Quick Daily Briefing Protocol
  const handleTriggerBriefing = () => {
    processQuery('Jarvis, give me my daily briefing and status report');
  };

  // Suggested Voice Commands in Hinglish & English
  const suggestedCommands = [
    'Papa ko call lagao',
    'Battery saver on karo',
    'Mummy ko WhatsApp message bhejo',
    'Mera aaj ka schedule batao',
    'Open YouTube',
    'Flashlight on karo',
    'Take medicine reminder set karo 8 PM',
  ];

  return (
    <div
      className={`min-h-screen bg-[#040812] text-cyan-400 font-sans flex flex-col justify-between relative overflow-hidden select-none pb-16 sm:pb-0 ${
        deviceStatus.batterySaverActive || deviceStatus.animationsDisabled ? 'battery-saver-active' : ''
      } ${deviceStatus.brightnessReduced ? 'dim-screen' : ''}`}
    >
      {/* Sci-fi Scanlines & Background Grid */}
      <div className="absolute inset-0 scanlines opacity-40 z-0 pointer-events-none" />
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 70%), linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        }}
      />

      {/* Screen Torch Full-screen Lantern Overlay */}
      {deviceStatus.screenTorchActive && (
        <div className="fixed inset-0 z-50 bg-white text-black flex flex-col items-center justify-between p-8 animate-in fade-in duration-200">
          <div className="text-center font-hud font-bold text-slate-800 text-sm tracking-widest pt-4">
            SCREEN TORCH • MAXIMUM LUMENS ACTIVE
          </div>
          <div className="w-48 h-48 rounded-full bg-white shadow-[0_0_150px_100px_rgba(255,255,255,1)]" />
          <button
            onClick={handleToggleScreenTorch}
            className="py-3 px-8 rounded-full bg-black text-white font-hud font-bold text-sm tracking-wider shadow-2xl active:scale-95"
          >
            TURN OFF TORCH
          </button>
        </div>
      )}

      {/* TOP HUD STATUS & TELEMETRY BAR */}
      <header className="relative z-10 w-full px-3 py-2 bg-[#050e1f]/90 border-b border-cyan-500/20 backdrop-blur-md flex items-center justify-between text-xs font-tech">
        {/* Left: Jarvis Branding & Live Pulse */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-hud font-bold text-sm tracking-widest text-cyan-200">
            J.A.R.V.I.S.
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-400">
            v4.2 ANDROID CORE
          </span>
        </div>

        {/* Center: Live Notification Ticker */}
        <div className="hidden md:flex items-center gap-2 max-w-sm truncate text-cyan-300 font-semibold tracking-wider">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="truncate">{notificationTicker}</span>
        </div>

        {/* Right: Device Telemetry & Quick Action Icons */}
        <div className="flex items-center gap-3">
          {/* Battery Status Badge (Tappable for Battery Saver Protocol) */}
          <button
            onClick={() => setShowBatterySaverModal(true)}
            title="Battery Saver Telemetry"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all active:scale-95 ${
              deviceStatus.batterySaverActive
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300'
                : (deviceStatus.batteryLevel !== null && deviceStatus.batteryLevel <= 20)
                ? 'bg-red-500/20 border border-red-500/60 text-red-300'
                : 'text-slate-300 hover:text-cyan-200'
            }`}
          >
            {deviceStatus.isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : deviceStatus.batterySaverActive || (deviceStatus.batteryLevel !== null && deviceStatus.batteryLevel <= 20) ? (
              <BatteryWarning className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-cyan-400" />
            )}
            <span className="font-tech text-xs">
              {deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : '100%'}
            </span>
          </button>

          {/* Time */}
          <span className="font-tech text-cyan-300 text-xs hidden xs:inline">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          {/* Install PWA Prompt Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallPWA}
              title="Install as Android App"
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            title="Toggle Sound Effects"
            className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/20 text-cyan-400 hover:text-cyan-200 transition-all"
          >
            {deviceStatus.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </header>

      {/* Battery Saver Alert Ticker Banner */}
      {deviceStatus.batterySaverActive && (
        <div className="relative z-20 w-full px-3 py-1.5 bg-amber-950/90 border-b border-amber-500/60 backdrop-blur-md flex items-center justify-between text-xs font-tech text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <BatteryWarning className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-hud font-bold text-[11px] sm:text-xs">
              BATTERY SAVER ACTIVE ({deviceStatus.batteryLevel !== null ? `${deviceStatus.batteryLevel}%` : '<20%'})
            </span>
            <span className="hidden sm:inline text-amber-400/80 text-[11px]">
              • Screen Dimmed (-35%) • UI Animations Halted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowBatterySaverModal(true);
              }}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-[10px] font-bold active:scale-95"
            >
              Turn Off Radios
            </button>
            <button
              onClick={() => handleToggleBatterySaver(false)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[10px] active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto p-3 sm:p-5 overflow-hidden">
        {/* VIEW 1: CORE HUD (Arc Reactor, Live Voice, Chat Feed) */}
        {hudTab === 'core' && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Top Central Arc Reactor */}
            <ArcReactor
              mode={mode}
              onToggleMic={handleToggleMic}
              statusText={liveTranscript ? `"${liveTranscript}"` : undefined}
              theme={deviceStatus.theme}
            />

            {/* Quick Action Suggestion Chips in Hinglish/English */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
              {suggestedCommands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => {
                    soundFx.playClick();
                    processQuery(cmd);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950/80 border border-cyan-500/30 hover:border-cyan-400 text-xs font-tech text-cyan-300/90 transition-all active:scale-95 flex items-center gap-1"
                >
                  <span className="text-cyan-400">⚡</span> {cmd}
                </button>
              ))}
            </div>

            {/* Jarvis Conversation Stream (Last 3 messages) */}
            <div className="flex-1 max-h-48 overflow-y-auto space-y-2 p-3 bg-slate-950/60 rounded-xl border border-cyan-500/20 backdrop-blur-sm">
              {chatHistory.slice(-4).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-tech text-cyan-500/80 mb-0.5">
                    <span>{msg.sender === 'user' ? 'YOU' : 'JARVIS'}</span>
                    <span>• {msg.timestamp}</span>
                    {msg.actionTag && (
                      <span className="px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-800">
                        {msg.actionTag}
                      </span>
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-xl text-xs font-sans max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600/30 border border-cyan-400/50 text-cyan-100 rounded-tr-none'
                        : 'bg-slate-900/80 border border-cyan-500/30 text-slate-200 rounded-tl-none shadow-md shadow-cyan-950'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Text / Voice Command Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                processQuery(typedCommand);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask or command Jarvis (e.g. 'Call Papa', 'Open Camera')..."
                  value={typedCommand}
                  onChange={(e) => setTypedCommand(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-cyan-500/40 rounded-xl text-xs sm:text-sm text-cyan-200 placeholder-cyan-700/80 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Submit Typed Command */}
              <button
                type="submit"
                disabled={!typedCommand.trim()}
                className={`p-2.5 rounded-xl border transition-all ${
                  typedCommand.trim()
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 active:scale-95'
                    : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>

              {/* Push-to-Talk Mic Shortcut */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                  mode === 'listening'
                    ? 'bg-red-500/30 border-red-400 text-red-300 animate-pulse'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/60 text-cyan-300'
                }`}
              >
                {mode === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: PHONE CONTROL (Apps, Contacts, Dialer) */}
        {hudTab === 'phone' && (
          <PhoneControlPanel
            contacts={contacts}
            onAddContact={(c) => setContacts((prev) => [c, ...prev])}
            onDeleteContact={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
            onInitiateCall={(contact) => {
              setActiveCall({ name: contact.name, phoneNumber: contact.phoneNumber });
            }}
            onOpenMessageModal={(contact) => {
              setMessageModal({
                open: true,
                recipient: contact ? contact.name : '',
                phone: contact ? contact.phoneNumber : '',
              });
            }}
            apps={apps}
            onAddCustomApp={(app) => setApps((prev) => [...prev, app])}
          />
        )}

        {/* VIEW 3: SCHEDULE & REMINDERS */}
        {hudTab === 'schedule' && (
          <SchedulePanel
            reminders={reminders}
            schedule={schedule}
            onAddReminder={(r) => setReminders((prev) => [r, ...prev])}
            onToggleReminder={(id) =>
              setReminders((prev) =>
                prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
              )
            }
            onDeleteReminder={(id) => setReminders((prev) => prev.filter((r) => r.id !== id))}
            onAddScheduleItem={(s) => setSchedule((prev) => [...prev, s])}
            onToggleScheduleItem={(id) =>
              setSchedule((prev) =>
                prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
              )
            }
            onDeleteScheduleItem={(id) => setSchedule((prev) => prev.filter((s) => s.id !== id))}
            onRequestBriefing={handleTriggerBriefing}
          />
        )}

        {/* VIEW 4: SETTINGS & HARDWARE */}
        {hudTab === 'settings' && (
          <SettingsPanel
            deviceStatus={deviceStatus}
            onToggleTorch={handleToggleTorch}
            onToggleScreenTorch={handleToggleScreenTorch}
            onToggleWakeLock={handleToggleWakeLock}
            onToggleSound={handleToggleSound}
            onSetTheme={(t) => setDeviceStatus((prev) => ({ ...prev, theme: t }))}
            onSetLanguage={handleSetLanguage}
            currentLanguage={currentLanguage}
            useGeminiTts={useGeminiTts}
            onToggleGeminiTts={(enable) => {
              setUseGeminiTts(enable);
              speechEngine.useGeminiTts = enable;
            }}
            onToggleBatterySaver={handleToggleBatterySaver}
            onToggleBrightness={handleToggleBrightness}
            onToggleAnimations={handleToggleAnimations}
            onSimulateLowBattery={handleSimulateLowBattery}
          />
        )}

        {/* VIEW 5: ANDROID SETUP GUIDE */}
        {hudTab === 'guide' && (
          <div className="flex-1 flex flex-col">
            <AndroidSetupModal
              onClose={() => setHudTab('core')}
              deferredPrompt={deferredPrompt}
              onInstallApp={handleInstallPWA}
              isInstalled={isInstalled}
            />
          </div>
        )}
      </main>

      {/* BOTTOM MOBILE HUD NAVIGATION BAR */}
      <nav className="relative z-20 w-full bg-[#050d1a]/95 border-t border-cyan-500/30 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => {
            soundFx.playClick();
            setHudTab('core');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            hudTab === 'core'
              ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/50 shadow-md shadow-cyan-950 font-bold'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-tech uppercase tracking-wider">CORE HUD</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setHudTab('phone');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            hudTab === 'phone'
              ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/50 shadow-md shadow-cyan-950 font-bold'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Phone className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-tech uppercase tracking-wider">PHONE & APPS</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setHudTab('schedule');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            hudTab === 'schedule'
              ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/50 shadow-md shadow-cyan-950 font-bold'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-tech uppercase tracking-wider">SCHEDULE</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setHudTab('settings');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            hudTab === 'settings'
              ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/50 shadow-md shadow-cyan-950 font-bold'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-tech uppercase tracking-wider">SETTINGS</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setShowAndroidGuide(true);
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-cyan-300 transition-all"
        >
          <Smartphone className="w-5 h-5 mb-0.5 text-cyan-400" />
          <span className="text-[10px] font-tech uppercase tracking-wider">GUIDE</span>
        </button>
      </nav>

      {/* OVERLAY MODAL: ACTIVE PHONE CALL */}
      {activeCall && (
        <ActiveCallModal
          contactName={activeCall.name}
          phoneNumber={activeCall.phoneNumber}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* OVERLAY MODAL: MESSAGE COMPOSER */}
      {messageModal.open && (
        <MessageComposerModal
          initialRecipient={messageModal.recipient}
          initialPhoneNumber={messageModal.phone}
          initialMessage={messageModal.message}
          initialPlatform={messageModal.platform}
          onClose={() => setMessageModal({ open: false, recipient: '', phone: '' })}
        />
      )}

      {/* OVERLAY MODAL: ANDROID SETUP GUIDE */}
      {showAndroidGuide && (
        <AndroidSetupModal
          onClose={() => setShowAndroidGuide(false)}
          deferredPrompt={deferredPrompt}
          onInstallApp={handleInstallPWA}
          isInstalled={isInstalled}
        />
      )}

      {/* OVERLAY MODAL: BATTERY SAVER PROTOCOL */}
      <BatterySaverModal
        deviceStatus={deviceStatus}
        isOpen={showBatterySaverModal}
        onClose={() => setShowBatterySaverModal(false)}
        onToggleBatterySaver={handleToggleBatterySaver}
        onToggleBrightness={handleToggleBrightness}
        onToggleAnimations={handleToggleAnimations}
      />
    </div>
  );
}
