import type { TranslationSchema } from '../../config/content/locales';
import type { Achievement } from '../../types/achievements';

export interface RarityBadgeStyle {
  border: string;
  bg: string;
  iconBg: string;
  glow: string;
  text: string;
}

const LOCKED_STYLE: RarityBadgeStyle = {
  border: 'border-slate-800',
  bg: 'bg-slate-900/60',
  iconBg: 'bg-slate-800/80 text-slate-500',
  glow: '',
  text: 'text-slate-400',
};

const RARITY_STYLES: Record<Achievement['rarity'], RarityBadgeStyle> = {
  platinum: {
    border: 'border-fuchsia-500/60',
    bg: 'bg-gradient-to-br from-fuchsia-950/40 via-purple-900/20 to-slate-950',
    iconBg: 'bg-gradient-to-tr from-fuchsia-600 to-purple-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]',
    glow: 'shadow-[0_0_15px_rgba(217,70,239,0.2)]',
    text: 'text-fuchsia-300',
  },
  gold: {
    border: 'border-amber-400/60',
    bg: 'bg-gradient-to-br from-amber-950/40 via-yellow-900/20 to-slate-950',
    iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    text: 'text-amber-300',
  },
  silver: {
    border: 'border-cyan-400/60',
    bg: 'bg-gradient-to-br from-cyan-950/40 via-blue-900/20 to-slate-950',
    iconBg: 'bg-gradient-to-tr from-cyan-500 to-sky-300 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    text: 'text-cyan-300',
  },
  bronze: {
    border: 'border-orange-500/50',
    bg: 'bg-gradient-to-br from-orange-950/40 via-stone-900/20 to-slate-950',
    iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-[0_0_12px_rgba(234,88,12,0.4)]',
    glow: 'shadow-[0_0_12px_rgba(234,88,12,0.15)]',
    text: 'text-orange-300',
  },
};

export const getRarityBadgeStyle = (
  rarity: Achievement['rarity'],
  unlocked: boolean,
): RarityBadgeStyle => (unlocked ? RARITY_STYLES[rarity] ?? RARITY_STYLES.bronze : LOCKED_STYLE);

export const getRarityLabel = (rarity: Achievement['rarity'], t: TranslationSchema): string =>
  t.rarityStyles[rarity] ?? rarity;
