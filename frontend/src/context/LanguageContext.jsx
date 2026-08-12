import { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  en: {
    direction: "ltr",
    switchLanguage: "Arabic",
    brandSubtitle: "Breast Cancer AI Platform",
    commandCenter: "AI healthcare command center",
    appTitle: "Bahia AI Breast Cancer Prediction",
    notifications: "Notifications",
    toggleTheme: "Toggle theme",
    signOut: "Sign out",
    clinician: "Clinician",
    nav: {
      dashboard: "Dashboard",
      datasets: "Datasets",
      training: "Training",
      prediction: "Prediction",
      evaluation: "Evaluation",
      history: "History",
      admin: "Admin"
    },
    auth: {
      welcome: "Welcome back",
      welcomeSubtitle: "Sign in to continue to the prediction platform.",
      registerTitle: "Create account",
      registerSubtitle: "Choose your role and create a secure workspace.",
      name: "Full name",
      email: "Email address",
      password: "Password",
      confirm: "Confirm password",
      remember: "Remember me",
      login: "Login",
      register: "Register",
      newHere: "New here?",
      createAccount: "Create an account",
      alreadyRegistered: "Already registered?",
      heroTitle: "Bahia AI for faster breast cancer insight.",
      heroText: "Train, compare, explain, and deploy breast cancer prediction models from one professional dashboard.",
      subtitle: "Breast cancer intelligence"
    }
  },
  ar: {
    direction: "rtl",
    switchLanguage: "English",
    brandSubtitle: "منصة ذكاء اصطناعي لسرطان الثدي",
    commandCenter: "مركز تحكم الرعاية الصحية بالذكاء الاصطناعي",
    appTitle: "بهية AI للتنبؤ بسرطان الثدي",
    notifications: "الإشعارات",
    toggleTheme: "تغيير الوضع",
    signOut: "تسجيل الخروج",
    clinician: "الطبيب",
    nav: {
      dashboard: "لوحة التحكم",
      datasets: "البيانات",
      training: "التدريب",
      prediction: "التنبؤ",
      evaluation: "التقييم",
      history: "السجل",
      admin: "الإدارة"
    },
    auth: {
      welcome: "مرحباً بعودتك",
      welcomeSubtitle: "سجل الدخول للمتابعة إلى منصة التنبؤ.",
      registerTitle: "إنشاء حساب",
      registerSubtitle: "اختر الدور وأنشئ مساحة عمل آمنة.",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirm: "تأكيد كلمة المرور",
      remember: "تذكرني",
      login: "تسجيل الدخول",
      register: "إنشاء الحساب",
      newHere: "مستخدم جديد؟",
      createAccount: "إنشاء حساب",
      alreadyRegistered: "لديك حساب بالفعل؟",
      heroTitle: "بهية AI لرؤية أسرع في سرطان الثدي.",
      heroText: "درّب النماذج وقارنها وفسّر النتائج من لوحة احترافية واحدة.",
      subtitle: "ذكاء اصطناعي لسرطان الثدي"
    }
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const t = translations[language] || translations.en;

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = t.direction;
  }, [language, t.direction]);

  const value = useMemo(
    () => ({
      language,
      isArabic: language === "ar",
      t,
      toggleLanguage: () => setLanguage((current) => (current === "en" ? "ar" : "en"))
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
