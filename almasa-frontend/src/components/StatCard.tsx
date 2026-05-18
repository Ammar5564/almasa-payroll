import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  titleEn?: string;
  value: string | number;
  icon: ReactNode;
  color?: 'navy' | 'gold' | 'green' | 'rose';
  subtitle?: string;
}

const colorMap = {
  navy: { bg: 'hsl(var(--navy))', light: 'hsl(221 83% 23% / 0.08)' },
  gold: { bg: 'hsl(var(--gold))', light: 'hsl(43 96% 56% / 0.1)' },
  green: { bg: 'hsl(142 76% 36%)', light: 'hsl(142 76% 36% / 0.08)' },
  rose: { bg: 'hsl(346 77% 49%)', light: 'hsl(346 77% 49% / 0.08)' },
};

export default function StatCard({ title, titleEn, value, icon, color = 'navy', subtitle }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-cairo">{title}</p>
          {titleEn && <p className="text-xs text-muted-foreground/60">{titleEn}</p>}
          <p className="text-3xl font-bold mt-2" style={{ color: colors.bg }}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: colors.light }}>
          <div style={{ color: colors.bg }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
