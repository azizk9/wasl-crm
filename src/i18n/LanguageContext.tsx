import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'ar' | 'en';

type LanguageState = {
  language: Language;
  direction: 'rtl' | 'ltr';
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (arabic: string) => string;
};

const translations: Record<string, string> = {
  'لوحة التحكم': 'Dashboard',
  'العملاء': 'Customers',
  'فرص البيع': 'Sales pipeline',
  'مركز المتابعات': 'Follow-ups',
  'المهام': 'Tasks',
  'المواعيد': 'Appointments',
  'التقارير': 'Reports',
  'الفريق': 'Team',
  'الإعدادات': 'Settings',
  'مساحة العمل': 'Workspace',
  'مساحة عملي': 'My workspace',
  'الخطة الأساسية': 'Basic plan',
  'مساحتك الحالية': 'Your current workspace',
  'إدارة الفريق': 'Manage team',
  'إعدادات الحساب': 'Account settings',
  'إضافة عميل': 'Add customer',
  'مشرف': 'Admin',
  'مبيعات': 'Sales',
  'مشرف عام': 'Administrator',
  'منسق مبيعات': 'Sales member',
  'الدور: مشرف عام': 'Role: Administrator',
  'الدور: منسق مبيعات': 'Role: Sales member',
  'الحساب': 'Account',
  'المساعدة': 'Help',
  'تسجيل الخروج': 'Sign out',
  'إغلاق': 'Close',
  'جارٍ تحميل البيانات...': 'Loading data...',
  'إعادة المحاولة': 'Try again',
  'إلغاء': 'Cancel',
  'حفظ البيانات': 'Save changes',
  'جارٍ الحفظ...': 'Saving...',
  'تأكيد': 'Confirm',
  'بحث...': 'Search...',
  'اختر...': 'Choose...',
  'المسؤول عن العميل': 'Assigned sales member',
  'عضو بدون اسم': 'Unnamed member',
  'عضو الفريق': 'Team member',
  'أنت': 'You',
};

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = window.localStorage.getItem('wasl-language');
    return saved === 'en' ? 'en' : 'ar';
  });
  const setLanguage = (next: Language) => setLanguageState(next);
  const toggleLanguage = () => setLanguageState(current => current === 'ar' ? 'en' : 'ar');
  useEffect(() => {
    window.localStorage.setItem('wasl-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  const value = useMemo(() => ({ language, direction: language === 'ar' ? 'rtl' as const : 'ltr' as const, setLanguage, toggleLanguage, t: (arabic: string) => language === 'ar' ? arabic : translations[arabic] ?? arabic }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider required');
  return value;
}
