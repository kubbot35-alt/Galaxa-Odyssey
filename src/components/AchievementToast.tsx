import React from 'react';
import {
  Trophy,
  Award,
  Skull,
  Zap,
  Shield,
  Flame,
  Star,
  Users,
  Crosshair,
  Target,
  Sparkles,
  X,
} from 'lucide-react';

interface ToastData {
  id: string;
  title: string;
  subtitle: string;
  rewardCredits: number;
  iconName: string;
}

interface AchievementToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const getIcon = (iconName: string) => {
    const cls = 'w-6 h-6 text-yellow-300';
    switch (iconName) {
      case 'trophy':
        return <Trophy className={cls} />;
      case 'skull':
        return <Skull className={cls} />;
      case 'zap':
        return <Zap className={cls} />;
      case 'shield':
        return <Shield className={cls} />;
      case 'flame':
        return <Flame className={cls} />;
      case 'star':
        return <Star className={cls} />;
      case 'users':
        return <Users className={cls} />;
      case 'crosshair':
        return <Crosshair className={cls} />;
      case 'award':
        return <Award className={cls} />;
      default:
        return <Target className={cls} />;
    }
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.45)] backdrop-blur-md">
        {/* Glow Badge Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.6)]">
          {getIcon(toast.iconName)}
        </div>

        {/* Text Details */}
        <div className="pr-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-black tracking-widest text-amber-400 flex items-center gap-1">
              <Sparkles size={11} /> BADGE UNLOCKED
            </span>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
              +{toast.rewardCredits} CR
            </span>
          </div>
          <h4 className="text-sm font-black text-white font-mono tracking-wide leading-tight">
            {toast.title}
          </h4>
          <p className="text-[11px] text-slate-300 font-sans">{toast.subtitle}</p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
