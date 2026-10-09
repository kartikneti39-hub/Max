import { AppShortcut, Contact } from '../types/jarvis';

// Pre-configured Android App Shortcuts with Deep Link schemes & Web Fallbacks
export const DEFAULT_APP_SHORTCUTS: AppShortcut[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Communication',
    iconName: 'MessageCircle',
    androidIntentUrl: 'whatsapp://',
    webFallbackUrl: 'https://web.whatsapp.com',
    color: '#25D366',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Media',
    iconName: 'Youtube',
    androidIntentUrl: 'vnd.youtube://',
    webFallbackUrl: 'https://youtube.com',
    color: '#FF0000',
  },
  {
    id: 'phone',
    name: 'Phone Dialer',
    category: 'System',
    iconName: 'Phone',
    androidIntentUrl: 'tel:',
    webFallbackUrl: 'tel:',
    color: '#3B82F6',
  },
  {
    id: 'messages',
    name: 'SMS Messages',
    category: 'Communication',
    iconName: 'Mail',
    androidIntentUrl: 'sms:',
    webFallbackUrl: 'sms:',
    color: '#10B981',
  },
  {
    id: 'camera',
    name: 'Camera',
    category: 'System',
    iconName: 'Camera',
    androidIntentUrl: 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end',
    webFallbackUrl: '#camera',
    color: '#EC4899',
  },
  {
    id: 'maps',
    name: 'Google Maps',
    category: 'Navigation',
    iconName: 'MapPin',
    androidIntentUrl: 'geo:0,0?q=',
    webFallbackUrl: 'https://maps.google.com',
    color: '#F59E0B',
  },
  {
    id: 'chrome',
    name: 'Chrome / Web',
    category: 'Browser',
    iconName: 'Globe',
    androidIntentUrl: 'googlechrome://',
    webFallbackUrl: 'https://google.com',
    color: '#6366F1',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Media',
    iconName: 'Music',
    androidIntentUrl: 'spotify://',
    webFallbackUrl: 'https://open.spotify.com',
    color: '#1DB954',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social',
    iconName: 'Instagram',
    androidIntentUrl: 'instagram://',
    webFallbackUrl: 'https://instagram.com',
    color: '#E1306C',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Communication',
    iconName: 'MailCheck',
    androidIntentUrl: 'googlegmail://',
    webFallbackUrl: 'https://mail.google.com',
    color: '#EA4335',
  },
  {
    id: 'settings',
    name: 'Device Settings',
    category: 'System',
    iconName: 'Settings',
    androidIntentUrl: 'intent:#Intent;action=android.settings.SETTINGS;end',
    webFallbackUrl: '#settings',
    color: '#8B5CF6',
  },
  {
    id: 'gallery',
    name: 'Photos / Gallery',
    category: 'Media',
    iconName: 'Image',
    androidIntentUrl: 'content://media/internal/images/media',
    webFallbackUrl: '#gallery',
    color: '#06B6D4',
  },
];

// Preloaded Contacts
export const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Papa',
    relationship: 'Father',
    phoneNumber: '+919876543210',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: '2',
    name: 'Mummy',
    relationship: 'Mother',
    phoneNumber: '+919876543211',
    avatarColor: 'bg-rose-600',
  },
  {
    id: '3',
    name: 'Rahul',
    relationship: 'Best Friend',
    phoneNumber: '+919876543212',
    avatarColor: 'bg-blue-600',
  },
  {
    id: '4',
    name: 'Priya',
    relationship: 'Colleague',
    phoneNumber: '+919876543213',
    avatarColor: 'bg-amber-600',
  },
  {
    id: '5',
    name: 'Boss / Office',
    relationship: 'Work',
    phoneNumber: '+919876543214',
    avatarColor: 'bg-purple-600',
  },
];

class AndroidDeviceBridge {
  private mediaStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private wakeLockSentinel: any = null;

  // Make a Phone Call via Native Android Dialer
  makeCall(phoneNumber: string): boolean {
    try {
      // Clean phone number
      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
      const telUrl = `tel:${cleanNumber}`;
      window.location.href = telUrl;
      return true;
    } catch (err) {
      console.error('Call launch error:', err);
      return false;
    }
  }

  // Send WhatsApp message via Intent / Deep Link
  sendWhatsAppMessage(phoneNumber: string, message: string): boolean {
    try {
      let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber; // default country code for India
      }
      const encodedMsg = encodeURIComponent(message);
      const url = cleanNumber
        ? `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;
      window.open(url, '_blank');
      return true;
    } catch (err) {
      console.error('WhatsApp launch error:', err);
      return false;
    }
  }

  // Send SMS via Native Android Messaging Intent
  sendSMS(phoneNumber: string, message: string): boolean {
    try {
      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
      const encodedMsg = encodeURIComponent(message);
      // Android supports sms:number?body=text
      const smsUrl = `sms:${cleanNumber}?body=${encodedMsg}`;
      window.location.href = smsUrl;
      return true;
    } catch (err) {
      console.error('SMS launch error:', err);
      return false;
    }
  }

  // Launch App by Name or Shortcut
  launchApp(appName: string, customShortcuts?: AppShortcut[]): { success: boolean; app?: AppShortcut } {
    const shortcuts = customShortcuts || DEFAULT_APP_SHORTCUTS;
    const normalized = appName.toLowerCase().trim();

    const matched = shortcuts.find(
      (a) =>
        a.name.toLowerCase().includes(normalized) ||
        a.id.toLowerCase().includes(normalized) ||
        normalized.includes(a.name.toLowerCase()) ||
        normalized.includes(a.id.toLowerCase())
    );

    if (matched) {
      this.openAppShortcut(matched);
      return { success: true, app: matched };
    }

    // Generic search/open fallback
    window.open(`https://www.google.com/search?q=${encodeURIComponent(appName + ' app')}`, '_blank');
    return { success: true };
  }

  openAppShortcut(app: AppShortcut) {
    try {
      // First try opening Android Intent URL
      if (app.androidIntentUrl.startsWith('tel:') || app.androidIntentUrl.startsWith('sms:')) {
        window.location.href = app.androidIntentUrl;
      } else {
        window.open(app.androidIntentUrl, '_blank');
      }
    } catch {
      window.open(app.webFallbackUrl, '_blank');
    }
  }

  // Toggle Physical Hardware Flashlight / Torch
  async toggleTorch(forceState?: boolean): Promise<{ success: boolean; active: boolean; error?: string }> {
    try {
      if (this.videoTrack) {
        // If already running
        const capabilities: any = this.videoTrack.getCapabilities ? this.videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          const newState = forceState !== undefined ? forceState : !((this.videoTrack.getConstraints() as any)?.advanced?.[0]?.torch);
          await (this.videoTrack as any).applyConstraints({
            advanced: [{ torch: newState }],
          });
          if (!newState) {
            this.videoTrack.stop();
            this.videoTrack = null;
            this.mediaStream = null;
          }
          return { success: true, active: newState };
        }
      }

      if (forceState === false) {
        if (this.videoTrack) {
          this.videoTrack.stop();
          this.videoTrack = null;
          this.mediaStream = null;
        }
        return { success: true, active: false };
      }

      // Request camera stream with back camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      });

      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};

      if (capabilities.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: true }],
        });
        this.mediaStream = stream;
        this.videoTrack = track;
        return { success: true, active: true };
      } else {
        // Device camera doesn't expose torch via web API; fallback to screen torch
        track.stop();
        return { success: false, active: false, error: 'Hardware torch constraint unavailable. Use Screen Torch.' };
      }
    } catch (err: any) {
      console.warn('Torch control error (falling back to screen torch):', err.message);
      return { success: false, active: false, error: err.message };
    }
  }

  // Trigger Device Vibration / Haptic Feedback
  vibrate(pattern: number | number[] = [100, 50, 100]) {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
        return true;
      }
    } catch (err) {
      console.warn('Vibration not supported', err);
    }
    return false;
  }

  // Keep Screen Awake (Wake Lock)
  async toggleWakeLock(enable: boolean): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        if (enable && !this.wakeLockSentinel) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          return true;
        } else if (!enable && this.wakeLockSentinel) {
          await this.wakeLockSentinel.release();
          this.wakeLockSentinel = null;
          return false;
        }
      }
    } catch (err) {
      console.warn('WakeLock error:', err);
    }
    return false;
  }

  // Read Battery Information
  async getBatteryInfo(): Promise<{ level: number; charging: boolean } | null> {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        };
      }
    } catch (err) {
      console.warn('Battery API unavailable', err);
    }
    return null;
  }

  // Open Android Native System Settings for Wireless Radios
  openIntentUrl(intentUrl: string, fallbackUrl?: string) {
    try {
      window.location.href = intentUrl;
    } catch {
      if (fallbackUrl) {
        window.open(fallbackUrl, '_blank');
      }
    }
  }

  openWifiSettings() {
    this.openIntentUrl('intent:#Intent;action=android.settings.WIFI_SETTINGS;end');
  }

  openBluetoothSettings() {
    this.openIntentUrl('intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;end');
  }

  openWirelessSettings() {
    this.openIntentUrl('intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end');
  }

  openBatterySaverSettings() {
    this.openIntentUrl('intent:#Intent;action=android.settings.BATTERY_SAVER_SETTINGS;end');
  }
}

export const deviceBridge = new AndroidDeviceBridge();
