import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Plus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';
import { Product } from '../types';

const mockChartData = [
  { name: 'Lun', sales: 4000, profit: 2400 },
  { name: 'Mar', sales: 3000, profit: 1398 },
  { name: 'Mer', sales: 2000, profit: 9800 },
  { name: 'Jeu', sales: 2780, profit: 3908 },
  { name: 'Ven', sales: 1890, profit: 4800 },
  { name: 'Sam', sales: 2390, profit: 3800 },
  { name: 'Dim', sales: 3490, profit: 4300 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    dailyRevenue: 0,
    totalSales: 0,
    customersCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Other stats - placeholders for now as per original
    setStats({
      dailyRevenue: 1254300,
      totalSales: 52,
      customersCount: 124,
    });

    // Real-time Low Stock Products
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      const lowStock = allProducts.filter(p => p.stock <= p.minStock);
      // Sort by most critical (lowest percentage of minStock)
      const sorted = lowStock.sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock));
      setLowStockProducts(sorted);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CA du jour" 
          value={`${stats.dailyRevenue.toLocaleString('fr-FR')} FCFA`} 
          trend="+12.5%" 
          trendUp={true}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard 
          title="Ventes (24h)" 
          value={stats.totalSales.toString()} 
          trend="+4" 
          trendUp={true}
          icon={ShoppingBag}
          color="orange"
        />
        <StatCard 
          title="Nouveaux Clients" 
          value={stats.customersCount.toString()} 
          trend="+12%" 
          trendUp={true}
          icon={Users}
          color="indigo"
        />
        <StatCard 
          title="Alertes Stock" 
          value={lowStockProducts.length.toString()} 
          trend={lowStockProducts.length > 0 ? "CRITIQUE" : "OK"} 
          trendUp={lowStockProducts.length === 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Analyses des ventes</h3>
              <p className="text-sm text-slate-500">Performances hebdomadaires</p>
            </div>
            <select className="bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 uppercase rounded-xl px-4 py-2 focus:ring-brand-blue outline-none cursor-pointer">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a237e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1a237e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#1a237e" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action / Alerts Sidebar */}
        <div className="space-y-6">
          <div className="bg-brand-orange p-8 rounded-[2rem] text-white shadow-xl shadow-orange-500/30">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Plus size={24} />
            </div>
            <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Nouvelle Vente</h3>
            <p className="text-xl font-bold mb-6 italic">Enregistrez un nouvel encaissement</p>
            <button className="w-full bg-white text-brand-orange py-3 rounded-2xl font-black text-sm uppercase hover:bg-slate-50 transition-all shadow-sm">
              Point de vente (POS)
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Alertes Stock
                {lowStockProducts.length > 0 && (
                  <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[10px] font-black">
                    {lowStockProducts.length}
                  </span>
                )}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${lowStockProducts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {lowStockProducts.length > 0 ? 'Critique' : 'Optimale'}
              </span>
            </div>
            
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl text-center">
                  <Package className="text-slate-300 mx-auto mb-2" size={32} />
                  <p className="text-xs text-slate-500 font-bold">Tout votre stock est à jour !</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map(product => (
                  <LowStockItem 
                    key={product.id}
                    name={product.name} 
                    stock={product.stock} 
                    min={product.minStock} 
                  />
                ))
              )}
            </div>

            <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all">
              Gérer l'inventaire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-800',
    orange: 'bg-orange-50 text-brand-orange',
    indigo: 'bg-indigo-50 text-indigo-800',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</h4>
        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

function LowStockItem({ name, stock, min }: any) {
  const percent = Math.round((stock / min) * 100);
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700 truncate mr-2">{name}</span>
        <span className="text-xs font-bold text-red-500">{stock} restants</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-red-500" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
