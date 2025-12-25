
import React, { useState, useMemo } from 'react';
import { Plus, Building2, CreditCard, Banknote, Trash2, PieChart, ArrowDownToLine, Wallet } from 'lucide-react';
import { Transaction, PaymentMethod, BankSummary } from '../types';

interface FinanceSectionProps {
  transactions: Transaction[];
  onUpdate: React.Dispatch<React.SetStateAction<Transaction[]>>;
  isShared: boolean;
}

const FinanceSection: React.FC<FinanceSectionProps> = ({ transactions, onUpdate, isShared }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newBank, setNewBank] = useState('メイン銀行');
  const [newMethod, setNewMethod] = useState<PaymentMethod>('bank_transfer');

  const addTransaction = () => {
    if (!newItem.trim() || !newAmount) return;
    const newTr: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      item: newItem,
      amount: parseInt(newAmount),
      bankName: newBank,
      method: newMethod,
      isShared,
      date: new Date().toISOString(),
    };
    onUpdate(prev => [...prev, newTr]);
    setNewItem('');
    setNewAmount('');
    setIsAdding(false);
  };

  const deleteTransaction = (id: string) => {
    onUpdate(prev => prev.filter(t => t.id !== id));
  };

  // Summarize by Bank
  const summaries = useMemo(() => {
    const map = new Map<string, BankSummary>();
    transactions.forEach(t => {
      const current = map.get(t.bankName) || { bankName: t.bankName, totalAmount: 0, transactionCount: 0 };
      current.totalAmount += t.amount;
      current.transactionCount += 1;
      map.set(t.bankName, current);
    });
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [transactions]);

  const totalExpense = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300 pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">家計簿管理</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 active:scale-95 transition-all"
        >
          {isAdding ? <Plus className="rotate-45" size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">合計支出</p>
          <p className="text-xl font-black">¥{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">登録口座数</p>
          <p className="text-xl font-black">{summaries.length}</p>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl mb-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">品目</label>
            <input 
              type="text" 
              placeholder="家賃、食費、光熱費など"
              className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
              <input 
                type="number" 
                placeholder="0"
                className="w-full bg-slate-50 border-none rounded-xl p-3 pl-8 focus:ring-2 focus:ring-green-500 outline-none font-bold"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">支払い先口座</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none appearance-none"
              value={newBank}
              onChange={(e) => setNewBank(e.target.value)}
            >
              <option value="メイン銀行">メイン銀行</option>
              <option value="サブ銀行">サブ銀行</option>
              <option value="貯金用口座">貯金用口座</option>
              <option value="クレジットカード">クレジットカード</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">支払い方法</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setNewMethod('bank_transfer')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${newMethod === 'bank_transfer' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-slate-50 text-slate-400 border-2 border-transparent'}`}
              >
                <ArrowDownToLine size={16} /> 銀行振込
              </button>
              <button 
                onClick={() => setNewMethod('direct_payment')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${newMethod === 'direct_payment' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-slate-50 text-slate-400 border-2 border-transparent'}`}
              >
                <CreditCard size={16} /> 直接支払い
              </button>
            </div>
          </div>
          <button 
            onClick={addTransaction}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-green-700"
          >
            記録を保存する
          </button>
        </div>
      )}

      {/* Bank Summary Section */}
      <section className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">口座別サマリー</h3>
        <div className="space-y-3">
          {summaries.map(s => (
            <div key={s.bankName} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Building2 size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">{s.bankName}</p>
                <p className="text-[10px] text-slate-400">{s.transactionCount}件の取引</p>
              </div>
              <p className="font-black text-slate-800">¥{s.totalAmount.toLocaleString()}</p>
            </div>
          ))}
          {summaries.length === 0 && <p className="text-center py-4 text-slate-400 text-sm">取引履歴がありません</p>}
        </div>
      </section>

      {/* Recent History */}
      <section>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">最近の取引</h3>
        <div className="space-y-2">
          {transactions.slice().reverse().map(tr => (
            <div key={tr.id} className="group bg-white p-3 rounded-xl border border-slate-50 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${tr.method === 'bank_transfer' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {tr.method === 'bank_transfer' ? <Banknote size={16} /> : <CreditCard size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">{tr.item}</p>
                <p className="text-[10px] text-slate-400">{tr.bankName}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-rose-500 text-sm">¥{tr.amount.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400">{new Date(tr.date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => deleteTransaction(tr.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FinanceSection;
