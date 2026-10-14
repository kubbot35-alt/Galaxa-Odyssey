export interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'combat' | 'survival' | 'progression' | 'mastery';
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewardCredits: number;
  maxProgress: number;
  iconName: 'trophy' | 'skull' | 'zap' | 'shield' | 'target' | 'star' | 'flame' | 'users' | 'crosshair' | 'award';
}

export interface AchievementProgress {
  unlocked: boolean;
  unlockedAt?: number;
  currentProgress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_wave',
    title: 'First Wave Defeated',
    subtitle: 'Vanguard Repelled',
    description: 'Survive the initial alien wave and advance to Wave 2.',
    category: 'progression',
    rarity: 'bronze',
    rewardCredits: 50,
    maxProgress: 1,
    iconName: 'target',
  },
  {
    id: 'triple_threat',
    title: 'Triple Threat',
    subtitle: '3-Way Volley Unlocked',
    description: 'Collect a Triple Shot power token and engage wide-angle fan cannons.',
    category: 'combat',
    rarity: 'silver',
    rewardCredits: 120,
    maxProgress: 1,
    iconName: 'crosshair',
  },
  {
    id: 'laser_master',
    title: 'Laser Overcharge',
    subtitle: 'Coherent Cutting Beam',
    description: 'Collect a Laser Beam power token and incinerate enemies with continuous beam fire.',
    category: 'combat',
    rarity: 'gold',
    rewardCredits: 200,
    maxProgress: 1,
    iconName: 'zap',
  },
  {
    id: 'elite_hunter',
    title: 'Elite Hunter',
    subtitle: 'High-Value Targets',
    description: 'Intercept and neutralize 5 Elite alien fighters.',
    category: 'combat',
    rarity: 'silver',
    rewardCredits: 100,
    maxProgress: 5,
    iconName: 'crosshair',
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    subtitle: 'Fleet Commander Nightmare',
    description: 'Neutralize 20 Elite dive-bombers or survive to Wave 8.',
    category: 'combat',
    rarity: 'platinum',
    rewardCredits: 300,
    maxProgress: 20,
    iconName: 'skull',
  },
  {
    id: 'bomb_defuser',
    title: 'Bomb Defuser',
    subtitle: 'Planetary Defense',
    description: 'Shoot down and detonate 5 falling red bombs mid-air before impact.',
    category: 'survival',
    rarity: 'silver',
    rewardCredits: 120,
    maxProgress: 5,
    iconName: 'flame',
  },
  {
    id: 'power_surge',
    title: 'Power Surge',
    subtitle: 'Battlefield Scavenger',
    description: 'Retrieve 4 tactical power-up drops (Shield/Extra Life/Weapon tokens).',
    category: 'progression',
    rarity: 'bronze',
    rewardCredits: 80,
    maxProgress: 4,
    iconName: 'zap',
  },
  {
    id: 'interstellar_ace',
    title: 'Interstellar Ace',
    subtitle: 'Deep Space Veteran',
    description: 'Survive the alien onslaught and reach Wave 5.',
    category: 'progression',
    rarity: 'gold',
    rewardCredits: 200,
    maxProgress: 5,
    iconName: 'star',
  },
  {
    id: 'high_roller',
    title: 'Point Tycoon',
    subtitle: 'Scoreboard Dominator',
    description: 'Accumulate a mission score of 3,000 points or more in a single run.',
    category: 'mastery',
    rarity: 'gold',
    rewardCredits: 250,
    maxProgress: 3000,
    iconName: 'award',
  },
  {
    id: 'full_arsenal',
    title: 'Maximum Firepower',
    subtitle: 'Triple Spread Plasma',
    description: 'Deploy Gun Level 3 with triple synchronized plasma cannons.',
    category: 'combat',
    rarity: 'silver',
    rewardCredits: 150,
    maxProgress: 3,
    iconName: 'flame',
  },
  {
    id: 'indomitable',
    title: 'Flawless Pilot',
    subtitle: 'Pristine Defenses',
    description: 'Clear an entire enemy wave without suffering any hull damage.',
    category: 'survival',
    rarity: 'gold',
    rewardCredits: 200,
    maxProgress: 1,
    iconName: 'shield',
  },
  {
    id: 'coop_commander',
    title: 'Dual Command',
    subtitle: 'Wingman Protocol',
    description: 'Launch a 2-Player Co-op mission with allied starship.',
    category: 'mastery',
    rarity: 'bronze',
    rewardCredits: 100,
    maxProgress: 1,
    iconName: 'users',
  },
  {
    id: 'void_conqueror',
    title: 'Void Conqueror',
    subtitle: 'Hazard Hardened',
    description: 'Clear a wave on HARD difficulty against aggressive enemy fire.',
    category: 'mastery',
    rarity: 'platinum',
    rewardCredits: 350,
    maxProgress: 1,
    iconName: 'trophy',
  },
  {
    id: 'ascendant_fleet',
    title: 'Ascendant Fleet',
    subtitle: 'Infinite Resilience',
    description: 'Acquire Double Lives or Infinite Lives from the Ship Upgrades Hangar.',
    category: 'progression',
    rarity: 'platinum',
    rewardCredits: 500,
    maxProgress: 1,
    iconName: 'award',
  },
];
