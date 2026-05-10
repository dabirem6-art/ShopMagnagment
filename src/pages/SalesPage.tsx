import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  increment,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, SaleItem, Customer } from '../types';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Search, 
  UserPlus,
  CreditCard,
  Banknote,
  Printer,
  ChevronRight,
  Package,
  Edit,
  History,
  X,
  CreditCard as CreditCardIcon,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function SalesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [processing, setProcessing] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSales();
    }
  }, [activeTab]);

  const fetchSales = async () => {
    setLoading(true);
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.sellPrice 
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const generatePDF = (saleId: string, items: SaleItem[], finalTotal: number) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text('SHOPMANAGER PRO', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Reçu de vente - ' + saleId, 105, 30, { align: 'center' });
    doc.text('Date: ' + new Date().toLocaleString(), 105, 35, { align: 'center' });
    
    // Table
    const tableData = items.map(item => [
      item.name,
      item.quantity,
      item.price.toLocaleString(),
      (item.price * item.quantity).toLocaleString()
    ]);
    
    (doc as any).autoTable({
      startY: 45,
      head: [['Article', 'Qté', 'Prix Unitaire', 'Total']],
      body: tableData,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total: ${finalTotal.toLocaleString()} FCFA`, 190, finalY, { align: 'right' });
    
    doc.save(`recu_${saleId}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      // 1. Create sale record
      const saleData = {
        items: cart,
        total,
        discount,
        paymentMethod,
        status: 'completed',
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      };
      const saleRef = await addDoc(collection(db, 'sales'), saleData);

      // 2. Update product stocks
      for (const item of cart) {
        const productRef = doc(db, 'products', item.productId);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // 3. Generate Receipt
      generatePDF(saleRef.id, cart, total);

      // 4. Success state
      setCart([]);
      setDiscount(0);
      alert('Vente terminée avec succès ! Le reçu a été généré.');
    } catch (err: any) {
      console.error(err);
      alert('Erreur: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveEditedSale = async (updatedSale: any) => {
    setProcessing(true);
    try {
      // 1. Calculate stock changes
      // Map original items
      const originalItemsMap = new Map(editingSale.items.map((item: any) => [item.productId, item.quantity]));
      // Map new items
      const newItemsMap = new Map(updatedSale.items.map((item: any) => [item.productId, item.quantity]));

      // Products to update
      const allProductIds = new Set([...originalItemsMap.keys(), ...newItemsMap.keys()]);

      for (const productId of Array.from(allProductIds)) {
        const oldQty = (originalItemsMap.get(productId as string) || 0) as number;
        const newQty = (newItemsMap.get(productId as string) || 0) as number;
        const diff = oldQty - newQty; // If newQty < oldQty, diff is positive (stock back in)

        if (diff !== 0) {
          const productRef = doc(db, 'products', productId as string);
          await updateDoc(productRef, {
            stock: increment(diff)
          });
        }
      }

      // 2. Update sale in Firestore
      const saleRef = doc(db, 'sales', editingSale.id);
      await updateDoc(saleRef, {
        items: updatedSale.items,
        total: updatedSale.total,
        discount: updatedSale.discount,
        paymentMethod: updatedSale.paymentMethod,
        updatedAt: serverTimestamp()
      });

      setEditingSale(null);
      fetchSales(); // Refresh history
      alert('Vente mise à jour avec succès !');
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors de la mise à jour: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      {/* Tabs / Toggle */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit self-center sm:self-start">
        <button 
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'pos' ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShoppingCart size={18} />
          Point de Vente
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History size={18} />
          Historique
        </button>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
          {/* Product Selection */}
          <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Rechercher par nom ou code-barres..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-orange transition-all outline-none"
              />
            </div>
    
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="group relative bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-orange transition-all text-left flex flex-col h-full disabled:opacity-50"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3 overflow-hidden group-hover:scale-105 transition-transform">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={32} />
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{product.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">{product.sku}</p>
                    <div className="mt-auto flex justify-between items-center">
                      <p className="font-bold text-brand-orange">{product.sellPrice.toLocaleString()} FCFA</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${product.stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {product.stock}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
    
          {/* Cart / Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-brand-orange" size={24} />
                Panier ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h3>
              <button 
                onClick={() => setCart([])}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
              >
                Vider
              </button>
            </div>
    
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div 
                    key={item.productId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl relative group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.price.toLocaleString()} FCFA</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:text-brand-orange hover:border-brand-orange transition-all shadow-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
    
                    <p className="text-sm font-bold text-slate-800 min-w-[80px] text-right">
                      {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
    
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="text-sm font-semibold">Le panier est vide</p>
                </div>
              )}
            </div>
    
            {/* Footer / Total */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-center text-slate-500 text-sm">
                <span>Soustotal</span>
                <span className="font-bold text-slate-700">{subtotal.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Réduction</label>
                  <input 
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
    
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-black text-brand-orange text-2xl">{total.toLocaleString()} FCFA</span>
              </div>
    
              <div className="grid grid-cols-3 gap-2">
                <PaymentButton 
                  active={paymentMethod === 'cash'} 
                  onClick={() => setPaymentMethod('cash')}
                  label="Espèces" 
                  icon={Banknote} 
                />
                <PaymentButton 
                  active={paymentMethod === 'card'} 
                  onClick={() => setPaymentMethod('card')}
                  label="Carte" 
                  icon={CreditCard} 
                />
                <PaymentButton 
                  active={paymentMethod === 'credit'} 
                  onClick={() => setPaymentMethod('credit')}
                  label="Dette" 
                  icon={UserPlus} 
                />
              </div>
    
              <button 
                disabled={cart.length === 0 || processing}
                onClick={handleCheckout}
                className="w-full py-4 bg-brand-orange text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
              >
                {processing ? 'Chargement...' : 'VALIDER LA VENTE'}
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Dernières Ventes</h3>
            <button onClick={fetchSales} className="p-2 hover:bg-slate-50 rounded-full">
              <History size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Ref</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Paiement</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">#{sale.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400">{sale.createdAt?.toDate().toLocaleString('fr-FR')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {sale.items.map((item: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-slate-800">{sale.total?.toLocaleString()} FCFA</p>
                      {sale.discount > 0 && <p className="text-[9px] text-red-400">-{sale.discount.toLocaleString()} remise</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-600' :
                        sale.paymentMethod === 'card' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingSale(sale)}
                          className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => generatePDF(sale.id, sale.items, sale.total)}
                          className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      <AnimatePresence>
        {editingSale && (
          <EditSaleModal 
            sale={editingSale} 
            onClose={() => setEditingSale(null)} 
            onSave={handleSaveEditedSale}
            processing={processing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditSaleModal({ sale, onClose, onSave, processing }: any) {
  const [items, setItems] = useState<SaleItem[]>(sale.items);
  const [discount, setDiscount] = useState(sale.discount);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const updateQty = (productId: string, delta: number) => {
    setItems(items.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Modifier la Vente</h3>
            <p className="text-xs text-slate-400 font-bold">Ref: #{sale.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles de la vente</h4>
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.price.toLocaleString()} FCFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.productId, -1)} className="p-1 hover:bg-white rounded border border-slate-200">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, 1)} className="p-1 hover:bg-white rounded border border-slate-200">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Réduction (FCFA)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-orange transition-all font-bold"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Méthode de paiement</label>
              <div className="relative">
                <CreditCardIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-orange transition-all font-bold appearance-none"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                  <option value="credit">Dette (Crédit)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Nouveau Total</p>
            <p className="text-2xl font-black text-brand-orange">{total.toLocaleString()} FCFA</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
            >
              Annuler
            </button>
            <button 
              onClick={() => onSave({ items, discount, paymentMethod, total })}
              disabled={processing || items.length === 0}
              className="px-8 py-3 bg-brand-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PaymentButton({ active, onClick, label, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all ${
        active ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-500 hover:border-brand-orange'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}
