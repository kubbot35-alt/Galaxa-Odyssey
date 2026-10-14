import React, { useState, useMemo } from 'react';
import { GameEngine } from '../game/GameEngine';
import { ACHIEVEMENTS, Achievement } from '../types/achievements';
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
  Lock,
  CheckCircle2,
  X,
  Coins,
  Sparkles,
} from 'lucide-react';

interface AchievementsOverlayProps {
  engine: GameEngine;
  onClose: () => void;
}

export const AchievementsOverlay: React.FC<AchievementsOverlayProps> = ({ engine, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [inspectBadge, setInspectBadge] = useState<Achievement | null>(null);

  const unlockedCount = engine.getUnlockedCount();
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  // Total credits earned from achievements
  const totalCreditsEarned = useMemo(() => {
    return ACHIEVEMENTS.reduce((sum, ach) => {
      return engine.isAchievementUnlocked(ach.id) ? sum + ach.rewardCredits : sum;
    }, 0);
  }, [engine]);

  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => {
      const isUnlocked = engine.isAchievementUnlocked(ach.id);
      if (selectedFilter === 'unlocked') return isUnlocked;
      if (selectedFilter === 'in_progress') return !isUnlocked;
      return true;
    });
  }, [selectedFilter, engine]);

  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className={className} />;
      case 'skull':
        return <Skull className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'shield':
        return <Shield className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'users':
        return <Users className={className} />;
      case 'crosshair':
        return <Crosshair className={className} />;
      case 'award':
        return <Award className={className} />;
      default:
        return <Target className={className} />;
    }
  };

  const getRarityBadgeStyle = (rarity: Achievement['rarity'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        border: 'border-slate-800',
        bg: 'bg-slate-900/60',
        iconBg: 'bg-slate-800/80 text-slate-500',
        glow: '',
        text: 'text-slate-400',
      };
    }
    switch (rarity) {
      case 'platinum':
        return {
          border: 'border-fuchsia-500/60',
          bg: 'bg-gradient-to-br from-fuchsia-950/40 via-purple-900/20 to-slate-950',
          iconBg: 'bg-gradient-to-tr from-fuchsia-600 to-purple-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]',
          glow: 'shadow-[0_0_15px_rgba(217,70,239,0.2)]',
          text: 'text-fuchsia-300',
        };
      case 'gold':
        return {
          border: 'border-amber-400/60',
          bg: 'bg-gradient-to-br from-amber-950/40 via-yellow-900/20 to-slate-950',
          iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
          text: 'text-amber-300',
        };
      case 'silver':
        return {
          border: 'border-cyan-400/60',
          bg: 'bg-gradient-to-br from-cyan-950/40 via-blue-900/20 to-slate-950',
          iconBg: 'bg-gradient-to-tr from-cyan-500 to-sky-300 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
          glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]',
          text: 'text-cyan-300',
        };
      default: // bronze
        return {
          border: 'border-orange-500/50',
          bg: 'bg-gradient-to-br from-orange-950/40 via-stone-900/20 to-slate-950',
          iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-[0_0_12px_rgba(234,88,12,0.4)]',
          glow: 'shadow-[0_0_12px_rgba(234,88,12,0.15)]',
          text: 'text-orange-300',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[760px] max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(55,245,255,0.4)]">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-cyan-400 font-mono">
                  ACHIEVEMENT BADGES
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300">
                  {unlockedCount}/{totalCount}
                </span>
              </div>
              <p className="text-xs text-slate-400">Tactical flight honors & combat commendations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Close [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress & Stats Bar */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between items-center mb-1 text-slate-400 font-mono">
              <span>OVERALL PROGRESS</span>
              <span className="text-cyan-300 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <Coins size={14} className="text-amber-400" />
              <span>
                Earned: <strong className="text-amber-300">+{totalCreditsEarned}</strong> credits
              </span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('unlocked')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedFilter === 'unlocked'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('in_progress')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedFilter === 'in_progress'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Locked ({totalCount - unlockedCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Click badge to inspect
          </span>
        </div>

        {/* Badges Grid View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 max-h-[50vh] sm:max-h-[55vh]">
          {filteredAchievements.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No badges matching this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAchievements.map((ach) => {
                const unlocked = engine.isAchievementUnlocked(ach.id);
                const progress = engine.getProgress(ach.id);
                const style = getRarityBadgeStyle(ach.rarity, unlocked);
                const isSelected = inspectBadge?.id === ach.id;

                return (
                  <div
                    key={ach.id}
                    onClick={() => setInspectBadge(ach)}
                    className={`relative p-3 rounded-xl border transition cursor-pointer select-none ${style.border} ${style.bg} ${style.glow} ${
                      isSelected ? 'ring-2 ring-cyan-400' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Visual Badge Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}
                      >
                        {unlocked ? (
                          getIcon(ach.iconName, 'w-6 h-6')
                        ) : (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-sm font-bold truncate ${unlocked ? 'text-white' : 'text-slate-300'}`}>
                            {ach.title}
                          </h4>
                          {unlocked && (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                          {ach.description}
                        </p>

                        {/* Progress or status */}
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                          <span className={`uppercase font-bold ${style.text}`}>
                            {ach.rarity}
                          </span>

                          <span className="text-amber-300 flex items-center gap-1">
                            +{ach.rewardCredits} CR
                          </span>
                        </div>

                        {!unlocked && ach.maxProgress > 1 && (
                          <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.round((progress / ach.maxProgress) * 100))}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspect Detail Card if Selected */}
        {inspectBadge && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  getRarityBadgeStyle(inspectBadge.rarity, engine.isAchievementUnlocked(inspectBadge.id)).iconBg
                }`}
              >
                {getIcon(inspectBadge.iconName, 'w-5 h-5')}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{inspectBadge.title}</span>
                  <span className="text-[10px] uppercase font-mono text-cyan-400">
                    [{inspectBadge.subtitle}]
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] truncate">{inspectBadge.description}</p>
              </div>
            </div>

            <div className="shrink-0 text-right font-mono">
              <span
                className={`text-[11px] font-bold ${
                  engine.isAchievementUnlocked(inspectBadge.id) ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {engine.isAchievementUnlocked(inspectBadge.id) ? 'COMMISSIONED' : 'IN PROGRESS'}
              </span>
              <div className="text-[10px] text-amber-300">+{inspectBadge.rewardCredits} Credits</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Press ESC or click outside to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-cyan-950/70 border border-cyan-500/40 rounded text-cyan-300 hover:bg-cyan-900/80 transition"
          >
            RETURN TO HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
