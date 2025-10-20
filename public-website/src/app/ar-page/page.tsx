export default function ArabicPage() {
  return (
    <div dir="rtl" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          🇩🇿 لوفت الجزائر - النسخة العربية
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
          ✅ الصفحة العربية تعمل بشكل صحيح مع المحتوى المترجم
        </p>
      </div>
      
      <div style={{ backgroundColor: '#fefbf3', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          🏠 إدارة احترافية للشقق المفروشة
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
          خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. 
          اعظم عوائدك الإيجارية مع خبرتنا المتخصصة.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/ar-page/contact" style={{ 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            اتصل بنا ←
          </a>
          <a href="/ar-page/portfolio" style={{ 
            backgroundColor: 'white', 
            color: '#f59e0b', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            border: '2px solid #f59e0b',
            fontWeight: '500'
          }}>
            ◀ اطلع على أعمالنا
          </a>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>إدارة العقارات</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>إدارة شاملة لعقاراتك مع متابعة شخصية مخصصة.</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>الحجوزات</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>نظام حجز محسن لزيادة معدل الإشغال إلى أقصى حد.</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔧</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>الصيانة</h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>خدمة صيانة وقائية وتصحيحية لعقاراتك.</p>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }}>
          <a href="/" style={{ color: '#f59e0b', textDecoration: 'none', marginLeft: '1rem' }}>→ العودة للرئيسية</a>
          <a href="/fr-page" style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '1rem' }}>🇫🇷 Français</a>
          <a href="/en-page" style={{ color: '#10b981', textDecoration: 'none' }}>🇺🇸 English</a>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>© 2024 لوفت الجزائر - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}