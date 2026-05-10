import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Package, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentPage: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const { profile } = useAuth();
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // We listen to all products and filter locally for simplicity and reactivity
    // or we could use a query if the collection is very large
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      const lowStock = allProducts.filter(p => p.stock <= p.minStock);
      setLowStockProducts(lowStock);
    });
    return () => unsubscribe();
  }, []);

  const getTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Tableau de bord';
      case 'products': return 'Gestion des produits';
      case 'sales': return 'Point de vente';
      case 'customers': return 'Gestion clients';
      case 'expenses': return 'Gestion des dépenses';
      case 'settings': return 'Paramètres & Support';
      default: return 'ShopManager Pro';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-slate-800">
          Bonjour, {profile?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-xs text-slate-500 font-medium">Gérez votre activité en toute simplicité.</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-full pl-6 pr-12 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-blue transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 transition-all rounded-xl ${showNotifications ? 'bg-slate-100 text-brand-orange' : 'text-slate-400 hover:text-brand-orange hover:bg-slate-50'}`}
            >
              <Bell size={20} />
              {lowStockProducts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] text-white font-black rounded-full ring-2 ring-white flex items-center justify-center">
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-30 overflow-hidden"
                  >
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
                      <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                        {lowStockProducts.length} Alertes
                      </span>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto p-2">
                      {lowStockProducts.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                            <Bell size={24} />
                          </div>
                          <p className="text-xs text-slate-500 font-bold">Aucune alerte pour le moment</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {lowStockProducts.map(product => (
                            <div key={product.id} className="p-4 bg-white hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                              <div className="flex gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex-shrink-0 flex items-center justify-center">
                                  <AlertTriangle size={18} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-800 line-clamp-1">{product.name}</h4>
                                  <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">
                                    Stock Critique: {product.stock} restants
                                  </p>
                                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                    Seuil minimum réglé à {product.minStock}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {lowStockProducts.length > 0 && (
                      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button className="w-full py-3 text-brand-blue text-[10px] font-black uppercase tracking-widest hover:underline">
                          Voir tout l&#39;inventaire
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
            <div className="w-10 h-10 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center text-brand-orange font-bold text-sm shadow-sm ring-2 ring-brand-orange/5">
              {profile?.displayName?.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{profile?.displayName}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{profile?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
