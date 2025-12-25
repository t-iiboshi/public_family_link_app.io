
import React, { useState } from 'react';
import { Plus, Trash2, Bell, Clock, RefreshCw, CheckCircle2, Repeat, Pencil, X, Sparkles, Loader2 } from 'lucide-react';
import { Task, RecurrenceType } from '../types.ts';
import { GoogleGenAI } from "@google/genai";

interface TodoSectionProps {
  tasks: Task[];
  onUpdate: (val: any) => void;
  onDelete: (id: string, isShared: boolean) => void;
  isShared: boolean;
}

const TodoSection: React.FC<TodoSectionProps> = ({ tasks, onUpdate, onDelete, isShared }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'todo' | 'reminder'>('todo');
  const [newDate, setNewDate] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTitle(task.title);
    setNewType(task.type);
    setNewDate(task.dueDate || '');
    setRecurrenceType(task.recurrence?.type || 'none');
    if (task.recurrence?.dayOfWeek !== undefined) setDayOfWeek(task.recurrence.dayOfWeek);
    if (task.recurrence?.dayOfMonth !== undefined) setDayOfMonth(task.recurrence.dayOfMonth);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setNewTitle('');
    setNewDate('');
    setRecurrenceType('none');
    setIsAdding(false);
  };

  const addTask = (titleOverride?: string) => {
    const title = titleOverride || newTitle;
    if (!title.trim()) return;

    if (editingTaskId && !titleOverride) {
      onUpdate((prev: Task[]) => prev.map(t => t.id === editingTaskId ? {
        ...t,
        title: title,
        type: newType,
        dueDate: newType === 'reminder' ? newDate : undefined,
        recurrence: newType === 'reminder' && recurrenceType !== 'none' ? {
          type: recurrenceType,
          dayOfWeek: recurrenceType === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : undefined,
        } : undefined,
      } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: title,
        completed: false,
        isShared,
        type: newType,
        dueDate: newType === 'reminder' ? newDate : undefined,
        recurrence: newType === 'reminder' && recurrenceType !== 'none' ? {
          type: recurrenceType,
          dayOfWeek: recurrenceType === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : undefined,
        } : undefined,
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      };
      onUpdate((prev: Task[]) => [...prev, newTask]);
    }
    if (!titleOverride) cancelEdit();
  };

  const handleAiBreakdown = async () => {
    if (!newTitle.trim()) return;
    setIsAiLoading(true);
    try {
      // API呼び出しの直前に新しいGoogleGenAIインスタンスを作成する
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `タスク「${newTitle}」を家族で分担できるように、具体的で短い3〜5個のサブタスクに分解して、日本語で箇条書きで出力してください。余計な説明は不要です。`,
      });
      const text = response.text || "";
      const suggestedTasks = text.split('\n').map(s => s.replace(/^[・\-\d\.\s]+/, '').trim()).filter(s => s.length > 0);
      
      suggestedTasks.forEach(taskTitle => {
        addTask(taskTitle);
      });
      setNewTitle('');
      setIsAdding(false);
    } catch (e: any) {
      console.error(e);
      // 有効なキーがない場合、またはキーが無効な場合は、キー選択を促す
      if (e.message?.includes("Requested entity was not found.") && window.aistudio) {
        await window.aistudio.openSelectKey();
      } else {
        alert('AIアシスタントに接続できませんでした。');
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    onUpdate((prev: Task[]) => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const snoozeTask = (id: string) => {
    onUpdate((prev: Task[]) => prev.map(t => {
      if (t.id === id && t.dueDate) {
        const current = new Date(t.dueDate);
        current.setMinutes(current.getMinutes() + 15);
        return { ...t, dueDate: current.toISOString(), snoozeCount: t.snoozeCount + 1 };
      }
      return t;
    }));
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">タスク・リマインダー</h2>
        <button 
          onClick={() => isAdding ? cancelEdit() : setIsAdding(true)}
          className={`${isAdding ? 'bg-slate-400' : 'bg-indigo-600'} text-white p-2.5 rounded-full shadow-lg hover:opacity-90 active:scale-90 transition-all`}
        >
          {isAdding ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-3xl shadow-2xl border border-indigo-50 mb-8 space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-black text-xs text-indigo-600 uppercase tracking-widest">{editingTaskId ? 'タスクを編集' : '新しいタスク'}</h3>
            <button 
              onClick={handleAiBreakdown}
              disabled={isAiLoading || !newTitle.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            >
              {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AIで分解
            </button>
          </div>
          <input 
            type="text" 
            placeholder="何をしますか？"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-base"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="flex gap-4">
            <button 
              onClick={() => setNewType('todo')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newType === 'todo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
            >
              Todo
            </button>
            <button 
              onClick={() => setNewType('reminder')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newType === 'reminder' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
            >
              リマインダー
            </button>
          </div>
          {newType === 'reminder' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">通知日時</label>
                <input 
                  type="datetime-local"
                  className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <button 
            onClick={() => addTask()}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            {editingTaskId ? '更新を保存' : 'タスクを追加'}
          </button>
        </div>
      )}

      <div className="space-y-3.5 pb-10">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className={`group flex items-start gap-4 p-4 rounded-3xl border transition-all ${
              task.completed ? 'bg-slate-50 border-transparent grayscale' : 'bg-white border-slate-100 shadow-sm'
            }`}
          >
            <button 
              onClick={() => toggleTask(task.id)}
              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
              }`}
            >
              {task.completed && <CheckCircle2 className="text-white" size={14} />}
            </button>
            
            <div className="flex-1 min-w-0" onClick={() => startEditing(task)}>
              <p className={`font-bold text-slate-800 text-sm leading-snug ${task.completed ? 'line-through text-slate-400' : ''}`}>
                {task.title}
              </p>
              {task.type === 'reminder' && task.dueDate && !task.completed && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-black px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 flex items-center gap-1 uppercase tracking-tighter">
                    <Clock size={10} />
                    {new Date(task.dueDate).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); snoozeTask(task.id); }}
                    className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 border border-indigo-100 uppercase tracking-tighter"
                  >
                    Snooze
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id, task.isShared); }}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoSection;
