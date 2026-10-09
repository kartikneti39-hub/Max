import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System prompt for Jarvis AI Core
const JARVIS_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the ultimate AI personal assistant running directly on the user's Android smartphone.
You are loyal, efficient, technologically brilliant, calm, and respectful (you address the user as "Sir" or "Boss" or by their name if provided).
You are fully fluent in English, Hindi, and Hinglish (natural mix of Hindi and English as commonly spoken in India).
Match the user's language: If they speak Hindi/Hinglish (e.g., "Papa ko call lagao", "WhatsApp pe message bhejo", "Flashlight on karo", "Mera schedule batao"), respond in smooth Hinglish/Hindi. If they speak English, respond in English.

Your primary objective is to manage the user's phone seamlessly:
1. CALL: When the user asks to call someone (e.g. "Papa ko call karo", "Call Rahul", "Call 9876543210"), extract recipient name and phone number.
2. SEND_MESSAGE: When user wants to send a text, SMS, or WhatsApp message (e.g. "Rahul ko WhatsApp karo ki main late ho jaunga", "Send SMS to Mom: I reached safely"), extract recipient, platform ('whatsapp' or 'sms'), and message text.
3. OPEN_APP: When user wants to open an application (e.g. "Open YouTube", "Camera kholo", "Spotify chalao", "WhatsApp open karo", "Settings kholo", "Maps kholo"), identify the app name.
4. SET_REMINDER: When user wants a reminder (e.g. "Remind me to drink water at 4 PM", "Kal subah 7 baje exercise ka reminder set karo"), extract title, time, date.
5. ADD_SCHEDULE: When user wants to schedule an event or task (e.g. "Schedule a meeting with client at 3 PM", "Gym session add karo sham 6 baje"), extract title, time, category.
6. CONTROL_SETTINGS: When user wants to change device hardware or phone settings (e.g. "Turn on flashlight / torch", "Flashlight band karo", "Battery saver on karo", "Power saver mode", "Low power mode", "Screen torch on karo", "Check battery", "Volume badhao"), extract the setting ('flashlight', 'battery_saver', 'screen_torch', 'brightness', etc.) and requested state ('on', 'off', 'toggle').
7. GET_BRIEFING: When user asks for a daily status report, morning briefing, or their schedule (e.g. "Mera aaj ka schedule kya hai?", "Jarvis status report", "Good morning Jarvis").
8. GENERAL_CONVERSATION: For any knowledge, query, question, or casual banter.

Always reply with precise JSON matching the response schema. Keep spokenResponse concise, crisp, and futuristic (1-2 sentences max so speech is prompt and snappy).`;

// Jarvis action response schema
const JARVIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    spokenResponse: {
      type: Type.STRING,
      description: 'The verbal response Jarvis will speak aloud to the user (concise, polite, futuristic tone in Hinglish/Hindi or English matching the user prompt).',
    },
    uiNotification: {
      type: Type.STRING,
      description: 'Short headline for HUD ticker notification (e.g., "DIALING PAPA...", "REMINDER SET", "APP LAUNCH: YOUTUBE").',
    },
    actionType: {
      type: Type.STRING,
      description: 'The classified action type: CALL, SEND_MESSAGE, OPEN_APP, SET_REMINDER, ADD_SCHEDULE, CONTROL_SETTINGS, GET_BRIEFING, GENERAL_CONVERSATION',
    },
    callDetails: {
      type: Type.OBJECT,
      properties: {
        recipientName: { type: Type.STRING },
        phoneNumber: { type: Type.STRING },
      },
    },
    messageDetails: {
      type: Type.OBJECT,
      properties: {
        recipientName: { type: Type.STRING },
        phoneNumber: { type: Type.STRING },
        platform: { type: Type.STRING, description: 'whatsapp or sms' },
        messageText: { type: Type.STRING },
      },
    },
    appDetails: {
      type: Type.OBJECT,
      properties: {
        appName: { type: Type.STRING },
      },
    },
    reminderDetails: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        time: { type: Type.STRING },
        date: { type: Type.STRING },
      },
    },
    scheduleDetails: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        time: { type: Type.STRING },
        category: { type: Type.STRING, description: 'work, personal, fitness, or call' },
      },
    },
    settingsDetails: {
      type: Type.OBJECT,
      properties: {
        setting: { type: Type.STRING, description: 'flashlight, screen_torch, vibrate, battery, theme, brightness' },
        state: { type: Type.STRING, description: 'on, off, toggle, check' },
      },
    },
  },
  required: ['spokenResponse', 'actionType', 'uiNotification'],
};

// Local fallback logic in case of transient model unavailability (e.g. 503 / network limits)
function localFallbackJarvis(query: string, context: any) {
  const q = query.toLowerCase().trim();
  const contacts: Array<{ name: string; phone: string; relation?: string }> = context?.contacts || [];

  // 1. Call detection
  if (q.includes('call') || q.includes('phone') || q.includes('lagao') || q.includes('dial')) {
    const matched = contacts.find((c) => q.includes(c.name.toLowerCase()));
    if (matched) {
      return {
        spokenResponse: `Ji Sir, ${matched.name} ko call mila raha hu.`,
        uiNotification: `CALLING ${matched.name.toUpperCase()}...`,
        actionType: 'CALL',
        callDetails: { recipientName: matched.name, phoneNumber: matched.phone },
      };
    }
    // Generic number or name extraction
    const words = q.split(' ');
    const callIdx = words.findIndex((w) => w === 'call' || w === 'phone');
    const target = callIdx >= 0 && words[callIdx + 1] ? words[callIdx + 1] : 'contact';
    return {
      spokenResponse: `Dialing ${target} now, Sir.`,
      uiNotification: `DIALING ${target.toUpperCase()}...`,
      actionType: 'CALL',
      callDetails: { recipientName: target },
    };
  }

  // 2. WhatsApp / SMS Messaging detection
  if (q.includes('whatsapp') || q.includes('message') || q.includes('sms') || q.includes('bhejo')) {
    const isWhatsApp = q.includes('whatsapp');
    const matched = contacts.find((c) => q.includes(c.name.toLowerCase()));
    const name = matched ? matched.name : 'Contact';
    const phone = matched ? matched.phone : '';
    return {
      spokenResponse: `Opening ${isWhatsApp ? 'WhatsApp' : 'SMS'} to message ${name}, Sir.`,
      uiNotification: `MESSAGE: ${name.toUpperCase()}`,
      actionType: 'SEND_MESSAGE',
      messageDetails: {
        recipientName: name,
        phoneNumber: phone,
        platform: isWhatsApp ? 'whatsapp' : 'sms',
        messageText: '',
      },
    };
  }

  // 3. Open App detection
  if (q.includes('open') || q.includes('kholo') || q.includes('launch') || q.includes('chalao')) {
    const knownApps = ['youtube', 'camera', 'whatsapp', 'maps', 'chrome', 'spotify', 'instagram', 'settings', 'gallery', 'gmail'];
    const foundApp = knownApps.find((a) => q.includes(a));
    const appName = foundApp || 'App';
    return {
      spokenResponse: `Launching ${appName} right away, Sir.`,
      uiNotification: `LAUNCH: ${appName.toUpperCase()}`,
      actionType: 'OPEN_APP',
      appDetails: { appName },
    };
  }

  // 4. Flashlight / Torch detection
  if (q.includes('flashlight') || q.includes('torch') || q.includes('light')) {
    const turnOff = q.includes('off') || q.includes('band');
    return {
      spokenResponse: turnOff ? 'Flashlight turned off, Sir.' : 'Flashlight engaged, Sir.',
      uiNotification: turnOff ? 'TORCH DISENGAGED' : 'TORCH ENGAGED',
      actionType: 'CONTROL_SETTINGS',
      settingsDetails: { setting: 'flashlight', state: turnOff ? 'off' : 'on' },
    };
  }

  // 4b. Battery Saver detection
  if (q.includes('battery saver') || q.includes('power saver') || q.includes('power save') || q.includes('battery bachao') || q.includes('low power')) {
    const turnOff = q.includes('off') || q.includes('band') || q.includes('disable');
    return {
      spokenResponse: turnOff
        ? 'Battery Saver protocol deactivated, Sir. Restoring full display and rendering performance.'
        : 'Battery Saver protocol initiated, Sir. Dimming screen, stopping animations, and standing by for radio controls.',
      uiNotification: turnOff ? 'BATTERY SAVER: OFF' : 'BATTERY SAVER: ACTIVE',
      actionType: 'CONTROL_SETTINGS',
      settingsDetails: { setting: 'battery_saver', state: turnOff ? 'off' : 'on' },
    };
  }

  // 5. Daily Briefing / Schedule
  if (q.includes('schedule') || q.includes('briefing') || q.includes('aaj ka') || q.includes('routine')) {
    return {
      spokenResponse: `Sir, your daily itinerary is loaded on screen. Battery is currently at ${context?.batteryLevel ?? 100} percent.`,
      uiNotification: 'DAILY BRIEFING PROTOCOL',
      actionType: 'GET_BRIEFING',
    };
  }

  // 6. Reminder
  if (q.includes('remind') || q.includes('reminder') || q.includes('yaad')) {
    return {
      spokenResponse: 'Understood Sir, setting this reminder in your schedule.',
      uiNotification: 'REMINDER PROTOCOL',
      actionType: 'SET_REMINDER',
      reminderDetails: { title: query, time: '08:00 PM' },
    };
  }

  // 7. General conversational fallback
  return {
    spokenResponse: `At your service, Sir. Ready to manage your phone, dial contacts, or launch apps.`,
    uiNotification: 'JARVIS STANDBY',
    actionType: 'GENERAL_CONVERSATION',
  };
}

// API: Process user voice or text command
app.post('/api/jarvis/process', async (req, res) => {
  const { query, context } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const contextPrompt = `
Current System Context:
- Current Local Time: ${context?.time || new Date().toLocaleTimeString()}
- Date: ${context?.date || new Date().toDateString()}
- Battery Level: ${context?.batteryLevel ?? 'Unknown'}
- Charging: ${context?.isCharging ? 'Yes' : 'No'}
- User Stored Contacts: ${JSON.stringify(context?.contacts || [])}
- Active Reminders: ${JSON.stringify(context?.reminders || [])}
- Today's Schedule: ${JSON.stringify(context?.schedule || [])}

User Voice / Text Command: "${query}"
`;

  // First try gemini-3.8-flash
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: JARVIS_SCHEMA,
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err38: any) {
    console.warn('gemini-3.8-flash unavailable, attempting secondary model:', err38.message);

    // Fallback model attempt: gemini-flash-latest
    try {
      const response2 = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: contextPrompt,
        config: {
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: JARVIS_SCHEMA,
          temperature: 0.3,
        },
      });

      const parsed2 = JSON.parse(response2.text || '{}');
      return res.json({ success: true, data: parsed2 });
    } catch (errFlash: any) {
      console.warn('All Gemini models encountered spikes; invoking local neural fallback:', errFlash.message);

      // Local rule engine: guarantees 100% zero-fail execution for the user
      const fallbackResult = localFallbackJarvis(query, context);
      return res.json({ success: true, data: fallbackResult, fallback: true });
    }
  }
});

// API: Generate Jarvis Speech Audio via Gemini TTS
app.post('/api/jarvis/tts', async (req, res) => {
  try {
    const { text, voice = 'Puck' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Calm, crisp, intelligent AI assistant with British or polished accent',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio generated' });
    }

    return res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('Gemini TTS error:', err);
    // Return friendly error so frontend seamlessly falls back to browser SpeechSynthesis
    return res.status(500).json({ success: false, fallback: true, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'JARVIS ONLINE', version: '4.2.0', platform: 'Android' });
});

// Mounting Vite in development or serving static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !fs.existsSync(path.resolve(__dirname, 'dist'))) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.url.startsWith('/api')) return next();
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JARVIS CORE] Server listening on port ${PORT}`);
  });
}

startServer();
