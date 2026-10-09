import React, { useState } from 'react';
import { MessageCircle, Mail, Send, X, Smartphone } from 'lucide-react';
import { deviceBridge } from '../services/deviceBridge';
import { soundFx } from '../services/audioSynth';

interface MessageComposerModalProps {
  initialRecipient: string;
  initialPhoneNumber: string;
  initialMessage?: string;
  initialPlatform?: 'whatsapp' | 'sms';
  onClose: () => void;
}

export const MessageComposerModal: React.FC<MessageComposerModalProps> = ({
  initialRecipient,
  initialPhoneNumber,
  initialMessage = '',
  initialPlatform = 'whatsapp',
  onClose,
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [phone, setPhone] = useState(initialPhoneNumber);
  const [message, setMessage] = useState(initialMessage);
  const [platform, setPlatform] = useState<'whatsapp' | 'sms'>(initialPlatform);

  const handleSend = () => {
    if (!phone && !message) return;
    soundFx.playActionSound();
    deviceBridge.vibrate(80);

    if (platform === 'whatsapp') {
      deviceBridge.sendWhatsAppMessage(phone, message);
    } else {
      deviceBridge.sendSMS(phone, message);
    }
    onClose();
  };

  const quickMessages = [
    'Main thodi der me call karta hu.',
    'I reached safely, Sir.',
    'Kal subah meeting confirm hai?',
    'Please check your WhatsApp when free.',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#071324] border border-cyan-500/50 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-hud font-bold text-cyan-200">
                COMPOSE MESSAGE
              </h3>
              <p className="text-[11px] font-tech text-cyan-500">
                Jarvis automated Android dispatch protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPlatform('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-tech font-bold flex items-center justify-center gap-2 transition-all ${
              platform === 'whatsapp'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" /> WHATSAPP
          </button>
          <button
            type="button"
            onClick={() => setPlatform('sms')}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-tech font-bold flex items-center justify-center gap-2 transition-all ${
              platform === 'sms'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Mail className="w-4 h-4 text-cyan-400" /> SMS TEXT
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-tech text-cyan-400">Recipient Name / Contact</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. Papa, Rahul, Mummy"
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-tech text-cyan-400">Phone Number (with Country Code)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91..."
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-tech text-cyan-400">Message Content</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message or dictation from Jarvis..."
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickMessages.map((qm, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMessage(qm)}
                className="text-[10px] font-tech px-2 py-1 bg-slate-900 border border-cyan-900/60 text-cyan-400/80 hover:text-cyan-200 hover:border-cyan-500/40 rounded transition-colors"
              >
                + {qm}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-tech text-xs"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!phone}
            className={`flex-1 py-2.5 rounded-xl font-hud text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              platform === 'whatsapp'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 active:scale-95'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
            {platform === 'whatsapp' ? 'DISPATCH ON WHATSAPP' : 'SEND VIA SMS'}
          </button>
        </div>
      </div>
    </div>
  );
};
