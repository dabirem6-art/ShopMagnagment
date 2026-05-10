import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  TrendingUp,
  Settings,
  Bell,
  CreditCard
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { profile } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'sales', label: 'Ventes', icon: ShoppingCart },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'expenses', label: 'Dépenses', icon: CreditCard },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-blue text-white flex flex-col h-full hidden md:flex shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-500/40">
          <ShoppingCart size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">ShopManager<span className="text-brand-orange">.</span></h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activePage === item.id
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} className={activePage === item.id ? 'text-brand-orange' : ''} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto space-y-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] text-white/50 mb-1 uppercase tracking-widest font-bold">Système Pro</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connecté</span>
          </div>
        </div>

        <div className="px-4 text-center">
          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">Design & Dev</p>
          <p className="text-[10px] text-white/50 font-bold italic mt-1">DABIRE Dar Moïse</p>
          <p className="text-[8px] text-white/20 mt-1 uppercase font-bold">10 Mai 2026</p>
        </div>
        
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
