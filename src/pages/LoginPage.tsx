import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { ShoppingBag, Mail, Lock, Chrome, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError('Erreur de connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-blue p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-orange/30 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-orange rounded-[2rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl shadow-orange-500/40">
            <ShoppingBag size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">ShopManager<span className="text-brand-orange">.</span></h1>
          <p className="text-white/60 text-sm font-medium">Gérez votre commerce comme un pro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-white/50 uppercase tracking-widest ml-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:bg-white/10 focus:border-brand-orange transition-all"
                  placeholder="Jean Dupont"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black text-white/50 uppercase tracking-widest ml-1">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:bg-white/10 focus:border-brand-orange transition-all"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-black text-white/50 uppercase tracking-widest">Mot de passe</label>
              {isLogin && (
                <button type="button" className="text-[10px] font-black text-brand-orange uppercase tracking-wider hover:opacity-80 transition-opacity">Oublié ?</button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:bg-white/10 focus:border-brand-orange transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-2xl border border-red-400/20 text-center">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-6 bg-brand-orange hover:bg-orange-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-orange-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : (isLogin ? 'SE CONNECTER' : "CRÉER UN COMPTE")}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-brand-blue/50 backdrop-blur-xl px-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Ou</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/5 transition-all mb-8"
        >
          <Chrome size={20} className="text-brand-orange" />
          <span>Continuer avec Google</span>
        </button>

        <p className="text-center text-sm font-medium text-white/40">
          {isLogin ? "Nouveau ici ?" : "Déjà utilisateur ?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-white font-bold hover:text-brand-orange transition-colors"
          >
            {isLogin ? "Créez un compte" : "Connectez-vous"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
