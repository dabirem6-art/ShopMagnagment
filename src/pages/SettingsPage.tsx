import React, { useState } from 'react';
import { 
  CreditCard, 
  MessageCircle, 
  Smartphone, 
  ShieldCheck, 
  Info,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const { profile } = useAuth();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/22667645023', '_blank');
  };

  const getTrialDaysRemaining = () => {
    if (!profile?.trialEndDate) return 0;
    const end = new Date(profile.trialEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getTrialDaysRemaining();
  const isPremium = profile?.subscriptionStatus === 'premium';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Subscription Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${isPremium ? 'bg-orange-100 text-brand-orange' : 'bg-blue-100 text-brand-blue'}`}>
              {isPremium ? <Crown size={32} /> : <Clock size={32} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Votre Statut</p>
              <h2 className="text-2xl font-black text-slate-800">
                {isPremium ? 'Version Premium' : 'Essai Gratuit'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {isPremium ? 'Licence active à vie / annuelle' : `${daysRemaining} jours d'essai restants`}
              </p>
            </div>
          </div>
          {!isPremium && (
            <div className="hidden sm:block">
              <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-orange transition-all duration-1000" 
                  style={{ width: `${(daysRemaining / 7) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-brand-blue rounded-[2rem] p-8 text-white flex flex-col justify-center">
          <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Tarif Premium</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">15.000</span>
            <span className="text-xs font-bold text-white/60">F CFA</span>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-brand-orange" size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Activation Premium</h2>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-brand-orange font-black text-xl">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Dépôt Mobile Money</h3>
                <p className="text-xs text-slate-500">Envoyez 15.000 F CFA sur l'un des numéros.</p>
              </div>
            </div>

            <div className="space-y-3">
              <PaymentLine 
                label="Orange Money" 
                number="+226 67 64 50 23" 
                color="bg-[#FF6600]" 
                onCopy={() => copyToClipboard('67645023', 'orange')}
                copied={copied === 'orange'}
              />
              <PaymentLine 
                label="Moov Money" 
                number="+226 61 47 99 91" 
                color="bg-[#005CA9]" 
                onCopy={() => copyToClipboard('61479991', 'moov')}
                copied={copied === 'moov'}
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Validation Express</h3>
                <p className="text-xs text-slate-500">Envoyez la capture d'écran sur WhatsApp.</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <FeatureItem text="Utilisation illimitée" />
              <FeatureItem text="Sans publicité" />
              <FeatureItem text="Sauvegarde cloud automatique" />
              <FeatureItem text="Assistance 24h/7j" />
            </div>

            <button 
              onClick={openWhatsApp}
              className="w-full py-4 bg-brand-orange text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
            >
              Envoyer la preuve
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3">
            <MessageCircle className="text-emerald-500" size={24} />
            Support Technique
          </h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Besoin d'aide ou d'une formation ? Contactez-nous directement sur WhatsApp pour une réponse rapide.
          </p>
          <button 
            onClick={openWhatsApp}
            className="w-full flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:bg-emerald-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                <Smartphone size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-emerald-900">WhatsApp Direct</p>
                <p className="text-xs text-emerald-600">+226 67 64 50 23</p>
              </div>
            </div>
            <ExternalLink size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3">
              <Smartphone className="text-brand-orange" size={24} />
              Installation Android
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Utilisez ShopManager comme une application native sur votre téléphone :
            </p>
            <ol className="space-y-3 text-sm text-slate-600 font-bold mb-6">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px]">1</span>
                Ouvrez le menu du navigateur (3 points en haut)
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px]">2</span>
                Cliquez sur "Installer l'application" ou "Ajouter à l'écran d'accueil"
              </li>
            </ol>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-brand-orange text-[10px] font-black uppercase tracking-widest text-center">
              Simple • Rapide • Accès direct
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3">
              <Info className="text-blue-500" size={24} />
              À propos
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Développeur</span>
                <span className="text-slate-800 font-black italic">DABIRE Dar Moïse</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Date de création</span>
                <span className="text-slate-800 font-bold">10 Mai 2026</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Version</span>
                <span className="text-slate-800 font-bold">Pro 2.0.4</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ShopManager Pro © 2026</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function PaymentLine({ label, number, color, onCopy, copied }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white font-black text-[10px]`}>
          {label.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-bold text-slate-800">{number}</p>
        </div>
      </div>
      <button 
        onClick={onCopy}
        className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 hover:text-brand-orange border border-slate-100'}`}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
        <Check size={12} strokeWidth={4} />
      </div>
      <span className="text-sm font-bold text-slate-600">{text}</span>
    </div>
  );
}
