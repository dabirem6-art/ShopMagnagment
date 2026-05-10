import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import { 
  Edit,
  Tag,
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package,
  Image as ImageIcon,
  X,
  Upload,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    });

    onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un produit..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-blue transition-all outline-none shadow-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Tag size={18} className="text-brand-blue" />
            Catégories
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-brand-orange text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30"
          >
            <Plus size={20} />
            Nouveau Produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prix Unitaire</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                        {product.imageUrl ? (
                          <div className="relative w-full h-full">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            {product.images && product.images.length > 1 && (
                              <div className="absolute top-0 right-0 bg-brand-blue text-[8px] text-white px-1 font-bold">
                                +{product.images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.sku || 'Pas de SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold uppercase">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Général'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <p className={`font-bold ${product.stock <= product.minStock ? 'text-red-500' : 'text-slate-800'}`}>
                        {product.stock}
                      </p>
                      {product.stock <= product.minStock && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                      {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{product.sellPrice.toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-slate-400">Achat: {product.buyPrice.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Supprimer ce produit ?')) {
                            await deleteDoc(doc(db, 'products', product.id));
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Package size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Aucun produit trouvé</h3>
              <p className="text-slate-500">Commencez par ajouter votre premier produit.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryManager 
            onClose={() => setIsCategoryModalOpen(false)} 
            categories={categories}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <ProductModal 
            onClose={() => setIsModalOpen(false)} 
            product={editingProduct} 
            categories={categories}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryManager({ onClose, categories }: any) {
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await addDoc(collection(db, 'categories'), {
      name: newCategory.trim(),
      createdAt: serverTimestamp()
    });
    setNewCategory('');
  };

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) return;
    await updateDoc(doc(db, 'categories', id), {
      name: editValue.trim()
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gérer les Catégories</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nouvelle catégorie..."
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue transition-all font-bold text-sm"
            />
            <button className="p-3 bg-brand-blue text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
            {categories.map((cat: any) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                {editingId === cat.id ? (
                  <div className="flex-1 flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-1 bg-white border border-brand-blue rounded-xl outline-none font-bold text-sm"
                    />
                    <button 
                      onClick={() => handleUpdate(cat.id)}
                      className="p-1 px-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <>
                    <Tag size={16} className="text-slate-400" />
                    <span className="flex-1 font-bold text-slate-700 text-sm">{cat.name}</span>
                    <button 
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditValue(cat.name);
                      }}
                      className="p-2 text-slate-400 hover:text-brand-blue opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProductModal({ onClose, product, categories }: any) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, preview: string}[]>([]);
  
  const [form, setForm] = useState(product || {
    name: '',
    categoryId: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
    sku: '',
    imageUrl: '',
    images: [],
    expiryDate: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files as FileList).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeExistingImage = (index: number) => {
    const updatedImages = [...(form.images || [])];
    updatedImages.splice(index, 1);
    
    // If the main imageUrl was this one, update it to the next available one or empty
    let newImageUrl = form.imageUrl;
    if (form.imageUrl === form.images?.[index]) {
      newImageUrl = updatedImages.length > 0 ? updatedImages[0] : '';
    }

    setForm({
      ...form,
      images: updatedImages,
      imageUrl: newImageUrl
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      // Upload new files
      for (const item of selectedFiles) {
        const fileRef = ref(storage, `products/${Date.now()}_${item.file.name}`);
        const snapshot = await uploadBytes(fileRef, item.file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }

      const allImages = [...(form.images || []), ...uploadedUrls];
      const mainImageUrl = allImages.length > 0 ? allImages[0] : '';

      const data = {
        ...form,
        imageUrl: mainImageUrl,
        images: allImages,
        updatedAt: serverTimestamp(),
        createdAt: product ? product.createdAt : serverTimestamp()
      };

      if (product) {
        await updateDoc(doc(db, 'products', product.id), data);
      } else {
        await addDoc(collection(db, 'products'), data);
      }
      
      // Cleanup previews
      selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
      
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Une erreur est survenue lors de l'enregistrement du produit.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{product ? 'Modifier le produit' : 'Nouveau Produit'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">Photos du produit</label>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Existing Images */}
              {form.images?.map((url: string, index: number) => (
                <div key={`existing-${index}`} className="relative h-24 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden group">
                  <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  {form.imageUrl === url && (
                    <div className="absolute bottom-0 left-0 right-0 bg-brand-blue/80 text-[8px] text-white font-black uppercase tracking-widest py-1 text-center">
                      Principale
                    </div>
                  )}
                </div>
              ))}

              {/* New Selected Files */}
              {selectedFiles.map((item, index) => (
                <div key={`new-${index}`} className="relative h-24 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden group">
                  <img src={item.preview} alt={`New ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] text-white font-black uppercase">Nouveau</span>
                  </div>
                </div>
              ))}

              {/* Upload area if less than 6 images */}
              {( (form.images?.length || 0) + selectedFiles.length < 6) && (
                <div className="relative h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center transition-all hover:border-brand-blue hover:bg-blue-50/50 cursor-pointer">
                  <Upload className="text-slate-300 mb-1" size={20} />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ajouter</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du produit</label>
              <input 
                required
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
                placeholder="Ex: Sac de ciment"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
              <select 
                required
                value={form.categoryId}
                onChange={e => setForm({...form, categoryId: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              >
                <option value="">Sélectionner</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Code-barres</label>
              <input 
                value={form.sku}
                onChange={e => setForm({...form, sku: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
                placeholder="PROD-001"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix d'achat</label>
              <input 
                type="number"
                required
                value={form.buyPrice}
                onChange={e => setForm({...form, buyPrice: parseFloat(e.target.value) || 0})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix de vente</label>
              <input 
                type="number"
                required
                value={form.sellPrice}
                onChange={e => setForm({...form, sellPrice: parseFloat(e.target.value) || 0})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock initial</label>
              <input 
                type="number"
                required
                value={form.stock}
                onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alerte stock min.</label>
              <input 
                type="number"
                required
                value={form.minStock}
                onChange={e => setForm({...form, minStock: parseInt(e.target.value) || 0})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date d'échéance</label>
              <input 
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({...form, expiryDate: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={uploading}
              className="flex-1 py-4 bg-brand-orange text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading && <Loader2 className="animate-spin" size={18} />}
              {uploading ? 'Envoi...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
