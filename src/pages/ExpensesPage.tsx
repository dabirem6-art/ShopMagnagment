import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  TrendingDown, 
  Calendar, 
  Trash2, 
  X,
  CreditCard,
  Tag,
  FileText,
  Filter,
  PieChart as PieChartIcon,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Expense } from '../types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Date Range State
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  const [form, setForm] = useState({
    description: '',
    amount: 0,
    category: 'Général',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'Général',
    'Loyer',
    'Électricité',
    'Salaires',
    'Transport',
    'Marketing',
    'Fournitures',
    'Maintenance',
    'Autre'
  ];

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      setExpenses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        ...form,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setForm({
        description: '',
        amount: 0,
        category: 'Général',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
      await deleteDoc(doc(db, 'expenses', id));
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
                         e.category.toLowerCase().includes(search.toLowerCase());
    const matchesDate = e.date >= startDate && e.date <= endDate;
    return matchesSearch && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Summary by category logic
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      summary[e.category] = (summary[e.category] || 0) + e.amount;
    });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Date Range & Actions Header */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-blue transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 px-3">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                />
              </div>
              <div className="text-slate-300 font-bold">/</div>
              <div className="flex items-center gap-2 px-3">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/30"
          >
            <Plus size={20} />
            Nouvelle Dépense
          </button>
        </div>

        {/* Quick Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
          <div className="md:col-span-1 bg-red-50 p-6 rounded-3xl flex flex-col justify-center border border-red-100">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Période</p>
            <p className="text-2xl font-black text-red-700">{totalExpenses.toLocaleString()} F CFA</p>
          </div>
          
          <div className="md:col-span-3 flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {categorySummary.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold italic py-4">Aucune donnée pour cette période</p>
            ) : (
              categorySummary.slice(0, 5).map(([category, amount]) => (
                <div key={category} className="flex-shrink-0 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm min-w-[160px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{category}</span>
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  </div>
                  <p className="text-sm font-black text-slate-700">{amount.toLocaleString()} F</p>
                  <div className="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-400/30 transition-all duration-1000" 
                      style={{ width: `${(amount / totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            {categorySummary.length > 5 && (
              <div className="flex-shrink-0 flex items-center gap-2 px-4 text-slate-400 text-xs font-bold">
                +{categorySummary.length - 5} autres
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} className="text-brand-blue" />
            Liste des Dépenses
          </h3>
          <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">
            {filteredExpenses.length} Résultat(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">Chargement...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Search size={24} />
                      </div>
                      <p className="text-slate-400 text-sm font-bold">Aucune dépense trouvée pour cette période</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={expense.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                        <Calendar size={14} className="text-slate-300" />
                        {new Date(expense.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-800 text-sm">{expense.description}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-[0.1em]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="font-black text-red-500">-{expense.amount.toLocaleString()} F CFA</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Report Sidebar/Section (Optional detailed breakdown) */}
      {categorySummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChartIcon size={14} className="text-brand-orange" />
              Répartition par Catégorie
            </h3>
            <div className="space-y-4">
              {categorySummary.map(([category, amount]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">{category}</span>
                    <span className="text-slate-900">{((amount / totalExpenses) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(amount / totalExpenses) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-right text-slate-400 font-black">{amount.toLocaleString()} F CFA</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-blue p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-110 transition-transform duration-500">
              <TrendingDown size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Note de gestion</h3>
              <p className="text-lg font-bold mb-6 leading-relaxed">
                {totalExpenses > 0 
                  ? `Vous avez dépensé un total de ${totalExpenses.toLocaleString()} F CFA durant cette période. La catégorie "${categorySummary[0][0]}" représente le plus gros poste de dépense.`
                  : "Aucune dépense enregistrée pour la période sélectionnée."}
              </p>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
              >
                Exporter le rapport
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nouvelle Dépense</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
                      placeholder="Ex: Facture électricité SONABEL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (F CFA)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="number"
                        required
                        value={form.amount}
                        onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})}
                        className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        required
                        value={form.category}
                        onChange={e => setForm({...form, category: e.target.value})}
                        className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium appearance-none"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="date"
                        required
                        value={form.date}
                        onChange={e => setForm({...form, date: e.target.value})}
                        className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
