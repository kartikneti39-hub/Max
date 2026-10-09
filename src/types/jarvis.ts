export type JarvisMode = 'idle' | 'listening' | 'processing' | 'speaking' | 'action';

export type HudTab = 'core' | 'phone' | 'schedule' | 'settings' | 'guide';

export interface Contact {
  id: string;
  name: string;
  relationship?: string;
  phoneNumber: string;
  avatarColor?: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // e.g., "14:30" or "8:00 PM"
  date?: string; // e.g., "2026-09-29"
  completed: boolean;
  alertTriggered?: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  category: 'work' | 'personal' | 'fitness' | 'call';
  completed: boolean;
}

export interface AppShortcut {
  id: string;
  name: string;
  category: string;
  iconName: string;
  androidIntentUrl: string;
  webFallbackUrl: string;
  color: string;
}

export interface JarvisActionResponse {
  spokenResponse: string;
  uiNotification: string;
  actionType:
    | 'CALL'
    | 'SEND_MESSAGE'
    | 'OPEN_APP'
    | 'SET_REMINDER'
    | 'ADD_SCHEDULE'
    | 'CONTROL_SETTINGS'
    | 'GET_BRIEFING'
    | 'GENERAL_CONVERSATION';
  callDetails?: {
    recipientName?: string;
    phoneNumber?: string;
  };
  messageDetails?: {
    recipientName?: string;
    phoneNumber?: string;
    platform?: 'whatsapp' | 'sms';
    messageText?: string;
  };
  appDetails?: {
    appName?: string;
  };
  reminderDetails?: {
    title?: string;
    time?: string;
    date?: string;
  };
  scheduleDetails?: {
    title?: string;
    time?: string;
    category?: 'work' | 'personal' | 'fitness' | 'call';
  };
  settingsDetails?: {
    setting?: string;
    state?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  actionTag?: string;
}

export interface DeviceStatus {
  batteryLevel: number | null;
  isCharging: boolean | null;
  isOnline: boolean;
  networkType: string;
  torchActive: boolean;
  screenTorchActive: boolean;
  wakeLockActive: boolean;
  soundEnabled: boolean;
  theme: 'cyan' | 'gold' | 'crimson' | 'emerald';
  batterySaverActive: boolean;
  brightnessReduced: boolean;
  animationsDisabled: boolean;
}
