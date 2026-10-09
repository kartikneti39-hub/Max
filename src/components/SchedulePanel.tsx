import React, { useState } from 'react';
import { Reminder, ScheduleItem } from '../types/jarvis';
import { soundFx } from '../services/audioSynth';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Bell,
  Volume2,
  Briefcase,
  User,
  Dumbbell,
  Phone,
} from 'lucide-react';

interface SchedulePanelProps {
  reminders: Reminder[];
  schedule: ScheduleItem[];
  onAddReminder: (reminder: Reminder) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddScheduleItem: (item: ScheduleItem) => void;
  onToggleScheduleItem: (id: string) => void;
  onDeleteScheduleItem: (id: string) => void;
  onRequestBriefing: () => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  reminders,
  schedule,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onAddScheduleItem,
  onToggleScheduleItem,
  onDeleteScheduleItem,
  onRequestBriefing,
}) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'schedule'>('reminders');
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleCat, setNewScheduleCat] = useState<'work' | 'personal' | 'fitness' | 'call'>('work');

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderTime) return;
    onAddReminder({
      id: Date.now().toString(),
      title: newReminderTitle,
      time: newReminderTime,
      completed: false,
    });
    setNewReminderTitle('');
    setNewReminderTime('');
    setShowAddReminderModal(false);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTitle || !newScheduleTime) return;
    onAddScheduleItem({
      id: Date.now().toString(),
      title: newScheduleTitle,
      time: newScheduleTime,
      category: newScheduleCat,
      completed: false,
    });
    setNewScheduleTitle('');
    setNewScheduleTime('');
    setShowAddScheduleModal(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-blue-400" />;
      case 'personal':
        return <User className="w-3.5 h-3.5 text-amber-400" />;
      case 'fitness':
        return <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />;
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3.5">
      {/* Daily Briefing Banner Button */}
      <button
        onClick={onRequestBriefing}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-900/60 via-blue-900/40 to-cyan-900/60 border border-cyan-400/40 hover:border-cyan-300 flex items-center justify-between text-left group shadow-lg shadow-cyan-950 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-hud font-bold text-cyan-200">
              JARVIS DAILY BRIEFING PROTOCOL
            </h4>
            <p className="text-[11px] font-tech text-cyan-400/80">
              Click to hear your daily tasks, battery & reminders summary
            </p>
          </div>
        </div>
        <Volume2 className="w-5 h-5 text-cyan-400 group-hover:text-cyan-200 transition-colors" />
      </button>

      {/* Tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-cyan-500/20 backdrop-blur-md">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('reminders');
          }}
          className={`flex-1 py-2 text-xs font-hud font-bold tracking-wider rounded-lg transition-all ${
            activeTab === 'reminders'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          ⏰ REMINDERS ({reminders.filter((r) => !r.completed).length})
        </button>
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('schedule');
          }}
          className={`flex-1 py-2 text-xs font-hud font-bold tracking-wider rounded-lg transition-all ${
            activeTab === 'schedule'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          📅 TODAY'S TIMELINE ({schedule.length})
        </button>
      </div>

      {/* TAB 1: REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-tech text-cyan-400/80">
              Voice command: "Remind me to drink water at 4 PM" or "Kal subah 7 baje reminder lagao"
            </span>
            <button
              onClick={() => setShowAddReminderModal(true)}
              className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs font-tech flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {reminders.length === 0 ? (
              <div className="p-8 text-center text-cyan-700 font-tech text-sm">
                No active reminders, Sir. All quiet.
              </div>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    r.completed
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through'
                      : 'bg-slate-900/70 border-cyan-500/30 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleReminder(r.id)}
                      className="text-cyan-400 hover:text-cyan-200"
                    >
                      {r.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-cyan-500" />
                      )}
                    </button>
                    <div>
                      <h4 className="text-sm font-semibold">{r.title}</h4>
                      <p className="text-xs font-tech text-cyan-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {r.time}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteReminder(r.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-tech text-cyan-400/80">
              Voice command: "Schedule gym at 6 PM" or "Mera aaj ka schedule batao"
            </span>
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs font-tech flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {schedule.length === 0 ? (
              <div className="p-8 text-center text-cyan-700 font-tech text-sm">
                No items on your itinerary today, Sir.
              </div>
            ) : (
              schedule.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    item.completed
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through'
                      : 'bg-slate-900/70 border-cyan-500/30 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleScheduleItem(item.id)}
                      className="text-cyan-400 hover:text-cyan-200"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-cyan-500" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-slate-800 border border-slate-700">
                          {getCategoryIcon(item.category)}
                        </span>
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                      </div>
                      <p className="text-xs font-tech text-cyan-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteScheduleItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD REMINDER */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071220] border border-cyan-500/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-hud font-bold text-cyan-300">SET NEW REMINDER</h3>
            <form onSubmit={handleCreateReminder} className="space-y-3">
              <div>
                <label className="text-xs font-tech text-cyan-400">Reminder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Take medicine, Call client, Pay bill"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-cyan-400">Trigger Time</label>
                <input
                  type="time"
                  required
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-tech text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech text-xs font-bold"
                >
                  SET REMINDER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEDULE */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071220] border border-cyan-500/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-hud font-bold text-cyan-300">ADD DAILY SCHEDULE ITEM</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div>
                <label className="text-xs font-tech text-cyan-400">Event / Task</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Sync, Workout, Doctor Visit"
                  value={newScheduleTitle}
                  onChange={(e) => setNewScheduleTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-cyan-400">Time</label>
                <input
                  type="time"
                  required
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-cyan-400">Category</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['work', 'personal', 'fitness', 'call'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewScheduleCat(cat)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-tech capitalize flex items-center justify-center gap-1.5 border ${
                        newScheduleCat === cat
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-tech text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech text-xs font-bold"
                >
                  SCHEDULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
