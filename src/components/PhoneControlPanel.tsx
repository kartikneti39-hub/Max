import React, { useState } from 'react';
import { AppShortcut, Contact } from '../types/jarvis';
import { deviceBridge } from '../services/deviceBridge';
import { soundFx } from '../services/audioSynth';
import {
  Phone,
  MessageCircle,
  Mail,
  Camera,
  MapPin,
  Globe,
  Music,
  Instagram,
  Settings,
  Image,
  Youtube,
  Search,
  Plus,
  UserPlus,
  Trash2,
  ExternalLink,
  PhoneCall,
  Send,
} from 'lucide-react';

interface PhoneControlPanelProps {
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onInitiateCall: (contact: Contact | { name: string; phoneNumber: string }) => void;
  onOpenMessageModal: (contact?: Contact) => void;
  apps: AppShortcut[];
  onAddCustomApp: (app: AppShortcut) => void;
}

export const PhoneControlPanel: React.FC<PhoneControlPanelProps> = ({
  contacts,
  onAddContact,
  onDeleteContact,
  onInitiateCall,
  onOpenMessageModal,
  apps,
  onAddCustomApp,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'apps' | 'contacts' | 'dialer'>('apps');
  const [appSearch, setAppSearch] = useState('');
  const [dialNumber, setDialNumber] = useState('');

  // Add Contact Modal State
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('');

  // Add App Modal State
  const [showAddApp, setShowAddApp] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppIntent, setNewAppIntent] = useState('');

  const renderIcon = (name: string, className: string = 'w-6 h-6') => {
    switch (name) {
      case 'MessageCircle':
        return <MessageCircle className={className} />;
      case 'Youtube':
        return <Youtube className={className} />;
      case 'Phone':
        return <Phone className={className} />;
      case 'Mail':
        return <Mail className={className} />;
      case 'Camera':
        return <Camera className={className} />;
      case 'MapPin':
        return <MapPin className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Music':
        return <Music className={className} />;
      case 'Instagram':
        return <Instagram className={className} />;
      case 'Settings':
        return <Settings className={className} />;
      case 'Image':
        return <Image className={className} />;
      default:
        return <ExternalLink className={className} />;
    }
  };

  const handleLaunchApp = (app: AppShortcut) => {
    soundFx.playActionSound();
    deviceBridge.vibrate(80);
    deviceBridge.openAppShortcut(app);
  };

  const handleDialClick = (digit: string) => {
    soundFx.playClick();
    deviceBridge.vibrate(30);
    setDialNumber((prev) => prev + digit);
  };

  const handleDialCall = () => {
    if (!dialNumber) return;
    soundFx.playActionSound();
    onInitiateCall({ name: dialNumber, phoneNumber: dialNumber });
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onAddContact({
      id: Date.now().toString(),
      name: newContactName,
      phoneNumber: newContactPhone,
      relationship: newContactRel || 'Contact',
      avatarColor: randomColor,
    });
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRel('');
    setShowAddContact(false);
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppIntent) return;
    onAddCustomApp({
      id: newAppName.toLowerCase().replace(/\s+/g, '-'),
      name: newAppName,
      category: 'Custom',
      iconName: 'ExternalLink',
      androidIntentUrl: newAppIntent,
      webFallbackUrl: newAppIntent.startsWith('http') ? newAppIntent : `https://google.com/search?q=${encodeURIComponent(newAppName)}`,
      color: '#38bdf8',
    });
    setNewAppName('');
    setNewAppIntent('');
    setShowAddApp(false);
  };

  const filteredApps = apps.filter((a) =>
    a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.category.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sub Navigation Bar */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-cyan-500/20 backdrop-blur-md">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveSubTab('apps');
          }}
          className={`flex-1 py-2 text-xs font-hud font-bold tracking-wider rounded-lg transition-all ${
            activeSubTab === 'apps'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-950'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          📱 APPS LAUNCHER
        </button>
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveSubTab('contacts');
          }}
          className={`flex-1 py-2 text-xs font-hud font-bold tracking-wider rounded-lg transition-all ${
            activeSubTab === 'contacts'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-950'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          👥 CONTACTS & DIAL
        </button>
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveSubTab('dialer');
          }}
          className={`flex-1 py-2 text-xs font-hud font-bold tracking-wider rounded-lg transition-all ${
            activeSubTab === 'dialer'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-950'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          🔢 DIALPAD
        </button>
      </div>

      {/* TAB 1: APPS LAUNCHER */}
      {activeSubTab === 'apps' && (
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Search & Add App header */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-500/60" />
              <input
                type="text"
                placeholder="Search phone apps..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 placeholder-cyan-700 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={() => setShowAddApp(true)}
              className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs font-tech flex items-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" /> Add App
            </button>
          </div>

          {/* Quick Voice Command Hint */}
          <div className="text-[11px] font-tech text-cyan-400/70 bg-cyan-950/30 px-3 py-1.5 rounded border border-cyan-900/60 flex items-center justify-between">
            <span>Voice command: "Open YouTube", "Camera kholo", "Launch WhatsApp"</span>
            <span className="text-cyan-400 font-bold">{filteredApps.length} APPS</span>
          </div>

          {/* App Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 overflow-y-auto max-h-[380px] pr-1">
            {filteredApps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleLaunchApp(app)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-400/70 transition-all active:scale-95 group text-center"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${app.color}25`, color: app.color, border: `1px solid ${app.color}50` }}
                >
                  {renderIcon(app.iconName, 'w-6 h-6')}
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate w-full">
                  {app.name}
                </span>
                <span className="text-[9px] font-tech text-cyan-500/60 uppercase">
                  {app.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS & DIRECT ACTIONS */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-tech text-cyan-300 tracking-wider">
              STORED PHONE CONTACTS ({contacts.length})
            </span>
            <button
              onClick={() => setShowAddContact(true)}
              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg text-cyan-300 text-xs font-tech flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>

          <div className="text-[11px] font-tech text-cyan-400/70 bg-cyan-950/30 px-3 py-1.5 rounded border border-cyan-900/60">
            Voice command: "Call Papa", "Mummy ko WhatsApp message bhejo", "Rahul ko call lagao"
          </div>

          {/* Contact List */}
          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${contact.avatarColor || 'bg-cyan-600'}`}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {contact.name}
                      {contact.relationship && (
                        <span className="text-[10px] font-tech px-1.5 py-0.2 bg-cyan-950/70 border border-cyan-800 text-cyan-400 rounded">
                          {contact.relationship}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs font-tech text-cyan-500/80">{contact.phoneNumber}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Native Call button */}
                  <button
                    onClick={() => {
                      soundFx.playActionSound();
                      onInitiateCall(contact);
                    }}
                    title="Call Contact"
                    className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  {/* Send Message button */}
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onOpenMessageModal(contact);
                    }}
                    title="Send WhatsApp or SMS"
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    title="Delete Contact"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DIALPAD */}
      {activeSubTab === 'dialer' && (
        <div className="flex flex-col items-center space-y-3">
          {/* Display screen */}
          <div className="w-full py-3 px-4 bg-black/60 rounded-xl border border-cyan-500/40 text-center relative">
            <span className="text-xl sm:text-2xl font-tech tracking-wider text-cyan-300">
              {dialNumber || 'ENTER NUMBER'}
            </span>
            {dialNumber && (
              <button
                onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                className="absolute right-3 top-3 text-cyan-500/70 hover:text-cyan-300 text-xs font-tech px-2 py-1 rounded bg-slate-800"
              >
                DEL
              </button>
            )}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
              <button
                key={key}
                onClick={() => handleDialClick(key)}
                className="h-12 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-cyan-500/30 text-lg font-tech font-bold text-cyan-200 active:scale-95 transition-all flex flex-col items-center justify-center"
              >
                <span>{key}</span>
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 w-full max-w-[280px] pt-1">
            <button
              onClick={handleDialCall}
              disabled={!dialNumber}
              className={`flex-1 py-3 rounded-xl font-hud font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                dialNumber
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <PhoneCall className="w-4 h-4" /> CALL
            </button>
            <button
              onClick={() => onOpenMessageModal({ id: 'temp', name: dialNumber, phoneNumber: dialNumber })}
              disabled={!dialNumber}
              className={`px-4 py-3 rounded-xl font-hud font-bold text-sm flex items-center justify-center transition-all ${
                dialNumber
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONTACT */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071220] border border-cyan-500/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-hud font-bold text-cyan-300">ADD NEW CONTACT</h3>
            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="text-xs font-tech text-cyan-400">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Papa, Rohit Sharma"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-cyan-400">Phone Number (with +91)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +919876543210"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-cyan-400">Tag / Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Friend, Family, Work"
                  value={newContactRel}
                  onChange={(e) => setNewContactRel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-tech text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech text-xs font-bold"
                >
                  SAVE CONTACT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM APP */}
      {showAddApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071220] border border-cyan-500/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-hud font-bold text-cyan-300">ADD CUSTOM APP SHORTCUT</h3>
            <form onSubmit={handleCreateApp} className="space-y-3">
              <div>
                <label className="text-xs font-tech text-cyan-400">App Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Twitter, Swiggy"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-cyan-400">Deep Link / URL Scheme</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://netflix.com or netflix://"
                  value={newAppIntent}
                  onChange={(e) => setNewAppIntent(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddApp(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-tech text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech text-xs font-bold"
                >
                  ADD SHORTCUT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
