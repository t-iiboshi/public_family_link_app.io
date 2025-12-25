
import React, { useState } from 'react';
import { Plus, Trash2, FileText, Search, Pencil, X } from 'lucide-react';
import { Memo } from '../types';

interface MemoSectionProps {
  memos: Memo[];
  onUpdate: (val: any) => void;
  onDelete: (id: string, isShared: boolean) => void;
  isShared: boolean;
}

const MemoSection: React.FC<MemoSectionProps> = ({ memos, onUpdate, onDelete, isShared }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [search, setSearch] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

  const startEditing = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setNewTitle(memo.title);
    setNewContent(memo.content);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setEditingMemoId(null);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const addMemo = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    
    if (editingMemoId) {
      onUpdate((prev: Memo[]) => prev.map(m => m.id === editingMemoId ? {
        ...m,
        title: newTitle,
        content: newContent,
        updatedAt: new Date().toISOString(),
      } : m));
    } else {
      const newMemo: Memo = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTitle,
        content: newContent,
        isShared,
        updatedAt: new Date().toISOString(),
      };
      onUpdate((prev: Memo[]) => [...prev, newMemo]);
    }
    cancelEdit();
  };

  const filteredMemos = memos.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">メモ・共有情報</h2>
        <button 
          onClick={() => isAdding ? cancelEdit() : setIsAdding(true)}
          className={`${isAdding ? 'bg-slate-400' : 'bg-sky-600'} text-white p-2.5 rounded-full shadow-lg hover:opacity-90 active:scale-90 transition-all`}
        >
          {isAdding ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="メモを検索..."
          className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-3xl border border-sky-50 shadow-2xl mb-8 space-y-4 animate-in fade-in zoom-in duration-300">
          <input 
            type="text" 
            placeholder="タイトル"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black focus:ring-2 focus:ring-sky-500 outline-none text-base"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea 
            placeholder="内容を入力..."
            rows={5}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none no-scrollbar"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button 
            onClick={addMemo}
            className="w-full bg-sky-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-sky-700 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            {editingMemoId ? '更新を保存' : 'メモを保存'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 pb-10">
        {filteredMemos.slice().reverse().map(memo => (
          <div 
            key={memo.id} 
            onClick={() => startEditing(memo)}
            className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative hover:shadow-md transition-all cursor-pointer overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-sky-500" />
                <h3 className="font-black text-slate-800 text-base leading-none tracking-tight">{memo.title}</h3>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(memo.id, memo.isShared); }}
                className="text-slate-200 hover:text-rose-500 transition-colors p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 font-bold line-clamp-3 leading-relaxed opacity-80">{memo.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoSection;
