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
  Rocket,
  Heart,
  Medal,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  skull: Skull,
  zap: Zap,
  shield: Shield,
  flame: Flame,
  star: Star,
  users: Users,
  crosshair: Crosshair,
  award: Award,
  rocket: Rocket,
  sparkles: Sparkles,
  heart: Heart,
  medal: Medal,
};

interface AchievementIconProps {
  iconName: string;
  className?: string;
}

export const AchievementIcon: React.FC<AchievementIconProps> = ({ iconName, className }) => {
  const Icon = ICONS[iconName] ?? Target;
  return <Icon className={className} />;
};
