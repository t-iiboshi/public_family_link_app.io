
import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  FileText, 
  Wallet, 
  Users, 
  User, 
  TrendingUp,
  Calendar,
  Cloud,
  CloudOff,
  Bell,
  BellOff,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Task, Memo, Transaction, AppMode } from './types.ts';
import TodoSection from './components/TodoSection.tsx';
import MemoSection from './components/MemoSection.tsx';
import FinanceSection from './components/FinanceSection.tsx';
import Dashboard from './components/Dashboard.tsx';
import { db, syncToCloud, removeFromCloud, requestNotificationPermission } from './firebase.ts';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';

// aistudio オブジェクトの型定義
// すべての宣言で同じ修飾子（readonlyなど）を持つように修正
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'memos' | 'finance'>('home');
  const [mode, setMode] = useState<AppMode>('personal');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationEnabled, setNotificationEnabled] = useState(Notification.permission === 'granted');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const [familyId, setFamilyId] = useState<string>(() => {
    const saved = localStorage.getItem('familylink_family_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('familylink_family_id', newId);
    return newId;
  });

  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('familylink_tasks') || '[]'));
  const [memos, setMemos] = useState<Memo[]>(() => JSON.parse(localStorage.getItem('familylink_memos') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('familylink_transactions') || '[]'));

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // キー選択ダイアログを表示した後は、成功したとみなしてアプリを進行させる
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    if (!db || !familyId) return;

    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('familyId', '==', familyId)), (snapshot) => {
      const cloudTasks = snapshot.docs.map(doc => doc.data() as Task);
      setTasks(prev => {
        const personal = prev.filter(t => !t.isShared);
        const combined = [...personal];
        cloudTasks.forEach(ct => {
          const index = combined.findIndex(t => t.id === ct.id);
          if (index > -1) combined[index] = ct;
          else combined.push(ct);
        });
        return combined.filter(t => !t.isShared || cloudTasks.some(ct => ct.id === t.id));
      });
    });

    const unsubMemos = onSnapshot(query(collection(db, 'memos'), where('familyId', '==', familyId)), (snapshot) => {
      const cloudMemos = snapshot.docs.map(doc => doc.data() as Memo);
      setMemos(prev => {
        const personal = prev.filter(m => !m.isShared);
        const combined = [...personal];
        cloudMemos.forEach(cm => {
          const index = combined.findIndex(m => m.id === cm.id);
          if (index > -1) combined[index] = cm;
          else combined.push(cm);
        });
        return combined.filter(m => !m.isShared || cloudMemos.some(cm => cm.id === m.id));
      });
    });

    return () => { unsubTasks(); unsubMemos(); };
  }, [familyId]);

  useEffect(() => {
    localStorage.setItem('familylink_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('familylink_memos', JSON.stringify(memos));
  }, [memos]);

  const handleDeleteTask = useCallback(async (id: string, isShared: boolean) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (isShared && isOnline) {
      await removeFromCloud('tasks', id);
    }
  }, [isOnline]);

  const handleUpdateTasks = useCallback(async (newTasksOrFn: any) => {
    setTasks(prev => {
      const next = typeof newTasksOrFn === 'function' ? newTasksOrFn(prev) : newTasksOrFn;
      if (isOnline && familyId) {
        const sharedChanged = next.filter((t: Task) => t.isShared);
        sharedChanged.forEach((t: Task) => syncToCloud('tasks', t, familyId));
      }
      return next;
    });
  }, [isOnline, familyId]);

  const handleUpdateMemos = useCallback(async (newMemosOrFn: any) => {
    setMemos(prev => {
      const next = typeof newMemosOrFn === 'function' ? newMemosOrFn(prev) : newMemosOrFn;
      if (isOnline && familyId) {
        next.filter((m: Memo) => m.isShared).forEach((m: Memo) => syncToCloud('memos', m, familyId));
      }
      return next;
    });
  }, [isOnline, familyId]);

  const handleDeleteMemo = useCallback(async (id: string, isShared: boolean) => {
    setMemos(prev => prev.filter(m => m.id !== id));
    if (isShared && isOnline) {
      await removeFromCloud('memos', id);
    }
  }, [isOnline]);

  const handleUpdateFamilyId = (newId: string) => {
    if (!newId) return;
    if (confirm(`家族IDを "${newId}" に変更しますか？`)) {
      setFamilyId(newId);
      localStorage.setItem('familylink_family_id', newId);
      setTasks(prev => prev.filter(t => !t.isShared));
      setMemos(prev => prev.filter(m => !m.isShared));
    }
  };

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token && db) {
      setNotificationEnabled(true);
      await setDoc(doc(db, 'device_tokens', token.substring(0, 20)), {
        token,
        updatedAt: new Date().toISOString(),
        familyId,
        platform: 'web_pwa'
      });
      alert('通知設定が完了しました！');
    }
  };

  if (hasApiKey === null) return <div className="h-screen bg-slate-50" />;

  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-indigo-600 text-white px-8 justify-center items-center text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-xl">
          <Sparkles size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tighter">FamilyLinkへ<br/>ようこそ</h1>
        <p className="text-indigo-100 text-sm mb-12 font-medium leading-relaxed">
          AIアシスタント機能（タスク分解など）を利用するために、Gemini APIキーの設定が必要です。
        </p>
        <div className="w-full space-y-4">
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-95 transition-all"
          >
            利用を開始する <ArrowRight size={18} />
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            className="block text-[10px] text-indigo-200 font-bold hover:text-white transition-colors"
          >
            APIキーと課金設定についてのドキュメント
          </a>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('ja-JP', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden select-none">
      <header className="flex-shrink-0 bg-indigo-600 text-white px-5 pt-10 pb-3 shadow-lg z-30 transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className="text-lg font-black tracking-tight">FamilyLink</h1>
              {isOnline ? <Cloud size={12} className="text-indigo-200" /> : <CloudOff size={12} className="text-rose-300" />}
            </div>
            <p className="text-[9px] opacity-70 font-bold flex items-center gap-1 uppercase tracking-tighter">
              <Calendar size={9} /> {todayStr}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleEnableNotifications}
              className={`p-2 rounded-full transition-all ${notificationEnabled ? 'bg-indigo-500/50 text-indigo-100' : 'bg-rose-500 shadow-md animate-bounce'}`}
            >
              {notificationEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
            {activeTab !== 'home' && (
              <button 
                onClick={() => setMode(mode === 'personal' ? 'shared' : 'personal')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${
                  mode === 'shared' ? 'bg-orange-500' : 'bg-white/20'
                }`}
              >
                {mode === 'shared' ? <Users size={12} /> : <User size={12} />}
                {mode === 'shared' ? '共有' : '自分'}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          <div className="flex-shrink-0 bg-white/10 rounded-xl p-2 min-w-[95px] border border-white/10 backdrop-blur-md">
            <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mb-1">未完了</p>
            <p className="text-base font-black leading-none">{tasks.filter(t => (mode === 'shared' ? t.isShared : !t.isShared) && !t.completed).length}</p>
          </div>
          <div className="flex-shrink-0 bg-white/10 rounded-xl p-2 min-w-[95px] border border-white/10 backdrop-blur-md">
            <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mb-1">家族ID</p>
            <p className="text-base font-black leading-none">{familyId}</p>
          </div>
          <div className="flex-shrink-0 bg-white/10 rounded-xl p-2 min-w-[95px] border border-white/10 backdrop-blur-md">
            <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mb-1">AI設定</p>
            <p className="text-base font-black leading-none flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" /> OK
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 scroll-smooth relative no-scrollbar">
        {activeTab === 'home' && (
          <Dashboard 
            familyId={familyId}
            onUpdateFamilyId={handleUpdateFamilyId}
            personalTasks={tasks.filter(t => !t.isShared)}
            sharedTasks={tasks.filter(t => t.isShared)}
            personalMemos={memos.filter(m => !m.isShared)}
            sharedMemos={memos.filter(m => m.isShared)}
            onNavigate={(tab, m) => { if (m) setMode(m); setActiveTab(tab); }}
          />
        )}
        {activeTab === 'tasks' && (
          <TodoSection 
            tasks={tasks.filter(t => (mode === 'shared' ? t.isShared : !t.isShared))} 
            onUpdate={handleUpdateTasks} 
            onDelete={handleDeleteTask}
            isShared={mode === 'shared'} 
          />
        )}
        {activeTab === 'memos' && (
          <MemoSection 
            memos={memos.filter(m => (mode === 'shared' ? m.isShared : !m.isShared))} 
            onUpdate={handleUpdateMemos} 
            onDelete={handleDeleteMemo}
            isShared={mode === 'shared'} 
          />
        )}
        {activeTab === 'finance' && (
          <FinanceSection 
            transactions={transactions.filter(tr => (mode === 'shared' ? tr.isShared : !tr.isShared))} 
            onUpdate={setTransactions} 
            isShared={mode === 'shared'} 
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center pt-3 pb-8 px-4 z-40 max-w-md mx-auto shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] pb-safe">
        {[
          { id: 'home', icon: TrendingUp, label: 'ホーム' },
          { id: 'tasks', icon: CheckCircle2, label: 'タスク' },
          { id: 'memos', icon: FileText, label: 'メモ' },
          { id: 'finance', icon: Wallet, label: '家計簿' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === tab.id ? 'text-indigo-600 scale-105' : 'text-slate-300'}`}
          >
            <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className={`text-[10px] font-black tracking-tighter`}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
