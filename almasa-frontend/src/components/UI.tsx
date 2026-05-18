import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props { children: ReactNode; className?: string; }
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="section-title font-cairo mb-1">{children}</h2>
  );
}

export function FormSection({ children, className = '' }: Props) {
  return <div className={`form-section ${className}`}>{children}</div>;
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-cairo">{message}</p>
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
      <span className="text-sm font-cairo">{message}</span>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm font-cairo">جاري التحميل...</span>
    </div>
  );
}

export function PageHeader({ title, titleEn, subtitle }: { title: string; titleEn?: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <SectionTitle>{title}</SectionTitle>
        {titleEn && <span className="text-muted-foreground text-sm font-medium">/ {titleEn}</span>}
      </div>
      {subtitle && <p className="text-muted-foreground text-sm mt-1 font-cairo">{subtitle}</p>}
    </div>
  );
}
