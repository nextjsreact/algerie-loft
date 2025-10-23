import PublicHeader from '@/components/public/PublicHeader';

export default function TestArabicNav() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center py-8">Test Navigation Arabe</h1>
        
        {/* Test avec locale arabe */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-center">Navigation en Arabe (RTL)</h2>
          <div dir="rtl">
            <PublicHeader locale="ar" text={{ login: "تسجيل الدخول" }} />
          </div>
        </div>
        
        {/* Test avec locale française pour comparaison */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-center">Navigation en Français (LTR)</h2>
          <div dir="ltr">
            <PublicHeader locale="fr" text={{ login: "Connexion" }} />
          </div>
        </div>
        
        {/* Test avec locale anglaise pour comparaison */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-center">Navigation en Anglais (LTR)</h2>
          <div dir="ltr">
            <PublicHeader locale="en" text={{ login: "Login" }} />
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Corrections Appliquées :</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>✅ Ajout de classes CSS spécifiques pour RTL</li>
            <li>✅ Espacement correct entre les éléments de navigation en arabe</li>
            <li>✅ Direction RTL appliquée correctement</li>
            <li>✅ Police et espacement optimisés pour l'arabe</li>
            <li>✅ Classes conditionnelles basées sur la locale</li>
          </ul>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Avant la correction :</h4>
            <p className="text-blue-700">الرئيسيةالخدماتالمعرضحولنااتصالAR (éléments collés)</p>
            
            <h4 className="font-semibold text-blue-800 mb-2 mt-4">Après la correction :</h4>
            <p className="text-blue-700" dir="rtl">الرئيسية | الخدمات | المعرض | حولنا | اتصال | AR (éléments espacés)</p>
          </div>
        </div>
      </div>
    </div>
  );
}