import { FileText, Target, ShieldCheck } from 'lucide-react';
import { PageHeader, FormSection } from '@/components/UI';

type ScreenGuide = {
  title: string;
  goal: string;
  whenToUse: string[];
  outputs: string[];
};

const GUIDES: ScreenGuide[] = [
  {
    title: 'لوحة التحكم (Dashboard)',
    goal: 'استخراج تقارير Excel احترافية للموظفين والأقسام خلال فترة زمنية محددة.',
    whenToUse: [
      'عند طلب تقرير موظف بالتفاصيل (حضور/غياب/رواتب/قروض/جزاءات).',
      'عند طلب تقرير قسم مُلخّص للمقارنة والمتابعة.',
    ],
    outputs: [
      'معاينة على الشاشة + ملف XLSX قابل للتحميل.',
    ],
  },
  {
    title: 'إدارة الموظفين',
    goal: 'إضافة الموظفين/الأقسام/الفئات وتحديث بيانات الموظف (Edit) لتجهيز البيانات الأساسية.',
    whenToUse: [
      'عند بدء التشغيل أو إضافة موظف جديد.',
      'عند تعديل راتب/قسم/تأمين/وردية… إلخ.',
    ],
    outputs: [
      'إنشاء/تعديل بيانات الموظف.',
      'تجهيز بيانات الدوام (من خلال القسم/الموقع) لتطبيق خصومات الوقت تلقائياً.',
    ],
  },
  {
    title: 'الحضور والوقت',
    goal: 'تسجيل الحضور والانصراف والغياب وربطها بخصومات التأخير/الغياب وفق قواعد الشركة.',
    whenToUse: [
      'يومياً أو بنهاية اليوم لتسجيل حضور/انصراف الموظفين.',
      'عند وجود غياب بإذن/بدون إذن أو خصم يدوي مرتبط بالإجازات.',
    ],
    outputs: [
      'سجلات حضور/غياب تُستخدم تلقائياً في احتساب الرواتب.',
    ],
  },
  {
    title: 'الرواتب والقروض',
    goal: 'احتساب الراتب مع معاينة قبل التحميل + إدارة القروض (خصم الأقساط) وإصدار قسيمة راتب XLSX.',
    whenToUse: [
      'في نهاية الشهر لتنفيذ احتساب الرواتب.',
      'عند إضافة قرض/سلفة أو تسوية قرض.',
    ],
    outputs: [
      'نتائج احتساب + Preview Modal + قسيمة راتب XLSX.',
      'تحديث أرصدة القروض والأقساط المسجلة.',
    ],
  },
  {
    title: 'سجل الإجازات (Absence History)',
    goal: 'متابعة تاريخ الإجازات/الغيابات لكل الموظفين (من منظور إداري) مع إمكانية التصفية.',
    whenToUse: [
      'عند مراجعة سجل موظف أو التحقيق في غياب متكرر.',
      'عند تجهيز بيانات للمراجعة الإدارية.',
    ],
    outputs: [
      'قائمة سجلات الإجازات/الغيابات مع فلاتر.',
    ],
  },
  {
    title: 'نهاية الخدمة (Settlement)',
    goal: 'حساب مستحقات نهاية الخدمة (Preview/Confirm) وإصدار مستند قابل للطباعة.',
    whenToUse: [
      'عند إنهاء خدمة موظف أو إعداد مخالصة.',
    ],
    outputs: [
      'معاينة مستحقات + تأكيد + مستند HTML للطباعة/الأرشفة.',
    ],
  },
];

export default function CompanyPolicy() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="لايحة الشركة"
        subtitle="دليل سريع يساعد المحاسبين وموظفي HR على استخدام النظام"
      />

      <FormSection>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            نظرة عامة
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Target, title: 'الهدف', body: 'تقليل وقت التدريب وتوحيد خطوات العمل.' },
            { icon: ShieldCheck, title: 'الضبط والرقابة', body: 'كل الإدخالات تنعكس على التقارير والرواتب مع إمكانية المراجعة.' },
            { icon: FileText, title: 'المخرجات', body: 'تقارير XLSX + قسائم راتب + سجلات قابلة للتتبع.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-4 rounded-xl border border-border" style={{ background: 'hsl(var(--gold) / 0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: 'hsl(var(--gold-dark))' }} />
                <p className="font-cairo font-bold text-sm" style={{ color: 'hsl(var(--navy))' }}>{title}</p>
              </div>
              <p className="text-sm text-muted-foreground font-cairo">{body}</p>
            </div>
          ))}
        </div>
      </FormSection>

      {GUIDES.map((g) => (
        <FormSection key={g.title}>
          <div className="mb-2">
            <p className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>{g.title}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-border" style={{ background: 'hsl(var(--navy) / 0.03)' }}>
              <p className="text-xs text-muted-foreground font-cairo mb-1">الهدف</p>
              <p className="text-sm font-cairo font-semibold" style={{ color: 'hsl(var(--navy))' }}>{g.goal}</p>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground font-cairo mb-2">متى تُستخدم؟</p>
              <ul className="space-y-1">
                {g.whenToUse.map((x, i) => (
                  <li key={i} className="text-sm font-cairo text-muted-foreground">- {x}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground font-cairo mb-2">المخرجات</p>
              <ul className="space-y-1">
                {g.outputs.map((x, i) => (
                  <li key={i} className="text-sm font-cairo text-muted-foreground">- {x}</li>
                ))}
              </ul>
            </div>
          </div>
        </FormSection>
      ))}
    </div>
  );
}

