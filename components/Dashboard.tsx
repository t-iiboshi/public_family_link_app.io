
import React, { useState } from 'react';
import { ChevronRight, FileText, CheckCircle2, User, Users, Copy, Settings2, ArrowRight } from 'lucide-react';
import { Task, Memo, AppMode } from '../types';

interface DashboardProps {
  familyId: string;
  onUpdateFamilyId: (id: string) => void;
  personalTasks: Task[];
  sharedTasks: Task[];
  personalMemos: Memo[];
  sharedMemos: Memo[];
  onNavigate: (tab: 'home' | 'tasks' | 'memos' | 'finance', mode?: AppMode) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  familyId,
  onUpdateFamilyId,
  personalTasks, 
  sharedTasks, 
  personalMemos, 
  sharedMemos, 
  onNavigate 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [newFamilyId, setNewFamilyId] = useState('');

  const getPending = (list: Task[]) => list.filter(t => !t.completed).slice(0, 3);
  const getLatest = (list: Memo[]) => list.length > 0 ? list[list.length - 1] : null;

  const copyId = () => {
    navigator.clipboard.writeText(familyId);
    alert('家族IDをコピーしました。家族に送ってください！');
  };

  const sections = [
    {
      title: '自分用 (個人)',
      icon: <User size={20} className="text-indigo-600" />,
      tasks: getPending(personalTasks),
      memo: getLatest(personalMemos),
      mode: 'personal' as AppMode,
      themeColor: 'indigo'
    },
    {
      title: '家族共有',
      icon: <Users size={20} className="text-orange-600" />,
      tasks: getPending(sharedTasks),
      memo: getLatest(sharedMemos),
      mode: 'shared' as AppMode,
      themeColor: 'orange'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* Family Connection Settings */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Users size={80} />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-slate-400">家族連携設定</h2>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Settings2 size={16} />
          </button>
        </div>

        {!showSettings ? (
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-[10px] text-slate-400 mb-1 font-bold">現在の家族ID</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-tighter text-indigo-400">{familyId}</span>
                <button onClick={copyId} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:scale-110 transition-transform">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              このIDを家族のデバイスで入力すると、タスクやメモをリアルタイムで共有できます。
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in duration-200">
            <div>
              <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase">別の家族グループに参加</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="IDを入力..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-black tracking-widest"
                  value={newFamilyId}
                  onChange={(e) => setNewFamilyId(e.target.value.toUpperCase())}
                />
                <button 
                  onClick={() => { onUpdateFamilyId(newFamilyId); setShowSettings(false); }}
                  className="bg-indigo-500 p-2 rounded-xl hover:bg-indigo-600 transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-[10px] text-slate-500 hover:text-white transition-colors"
            >
              キャンセル
            </button>
          </div>
        )}
      </section>

      {sections.map((section) => (
        <section key={section.title} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            {section.icon}
            <h2 className={`font-black text-lg text-slate-800`}>
              {section.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2 text-slate-600">
                  <CheckCircle2 size={16} />
                  タスク
                </h3>
                <button 
                  onClick={() => onNavigate('tasks', section.mode)} 
                  className="text-indigo-600 text-xs font-bold flex items-center"
                >
                  一覧 <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {section.tasks.length > 0 ? (
                  section.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                      <div className={`w-1 h-5 rounded-full ${section.mode === 'shared' ? 'bg-orange-400' : 'bg-indigo-400'}`} />
                      <p className="font-bold text-[11px] text-slate-800 line-clamp-1">{task.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-[10px] py-2 text-center italic">タスクはありません</p>
                )}
              </div>
            </div>

            <div className={`rounded-2xl p-5 border shadow-sm ${section.mode === 'shared' ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-sm flex items-center gap-2 ${section.mode === 'shared' ? 'text-orange-900' : 'text-indigo-900'}`}>
                  <FileText size={16} />
                  最新のメモ
                </h3>
                <button 
                  onClick={() => onNavigate('memos', section.mode)} 
                  className="text-slate-600 text-xs font-bold"
                >
                  一覧
                </button>
              </div>
              {section.memo ? (
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                  <p className="font-bold text-[11px] mb-1 text-slate-800 truncate">{section.memo.title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{section.memo.content}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-[10px] text-center italic">メモはまだありません</p>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default Dashboard;
