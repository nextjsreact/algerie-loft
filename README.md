# 🏠 Algerie Loft Management System

A comprehensive property management system built with Next.js, designed specifically for managing loft properties in Algeria.

## 🚀 Live Demo

Visit the live application: [https://algerie-loft.vercel.app](https://algerie-loft.vercel.app)

## 📋 Features

### 🌐 Multi-language Support
- **French** (Primary)
- **Arabic** (RTL Support)
- **English**

### 🏢 Property Management
- Complete loft inventory management
- Owner relationship tracking
- Property photos and documentation
- Availability calendar
- Booking management

### 💰 Financial Management
- Transaction tracking
- Revenue analytics
- Bill management and alerts
- Payment method integration
- Multi-currency support (DZD, EUR, USD)

### 📊 Analytics & Reporting
- Real-time dashboard
- Revenue charts and statistics
- Occupancy rate tracking
- Executive reports
- PDF report generation

### 🔐 Authentication & Security
- Supabase authentication
- Role-based access control
- Secure data handling
- Row Level Security (RLS)

### 📱 Modern UI/UX
- Responsive design
- Dark/Light theme support
- Mobile-first approach
- Tailwind CSS styling
- Smooth animations

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **Testing**: Playwright, Jest
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nextjsreact/algerie-loft.git
   cd algerie-loft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   Run the SQL scripts in the `scripts/` directory to set up your database schema.

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
algerie-loft/
├── app/                    # Next.js App Router
├── components/             # Reusable UI components
├── lib/                   # Utility functions
├── messages/              # Translation files
├── scripts/               # Database scripts
├── styles/                # Global styles
├── utils/                 # Helper utilities
└── tests/                 # Test files
```

## 🌍 Internationalization

The application supports three languages with complete translations:
- All UI elements are translated
- RTL support for Arabic
- Dynamic language switching
- Localized date/number formatting

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 📦 Deployment

The application is optimized for Vercel deployment:

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the troubleshooting guides

## 🙏 Acknowledgments

- Built with Next.js and Supabase
- UI components inspired by shadcn/ui
- Icons from Lucide React
- Translations by native speakers

## 🔧 Recent Updates

### i18n Translation Consistency Fix
- Fixed missing translation keys across all locales
- Resolved namespace structure issues
- Improved timezone configuration
- Enhanced translation validation system

### Key Fixes Applied:
- ✅ Fixed `availability.algerCenterRegion` missing translations
- ✅ Fixed `availability.testOwner` missing translations  
- ✅ Resolved i18n configuration flattening issues
- ✅ Added proper timezone environment variables
- ✅ Preserved nested translation structure for namespace support

The application now properly supports both flat translation keys and namespace-based translations without any `MISSING_MESSAGE` errors.