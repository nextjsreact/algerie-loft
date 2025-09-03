# Loft Algerie - Organized Project Structure

## 📁 Project Organization

This project has been organized for better maintainability and clarity:

### 📚 Documentation (`/docs/`)
All project documentation, setup guides, and implementation notes have been moved to the `docs/` folder:
- Setup guides (Database, Conversations, Notifications, etc.)
- Implementation documentation
- Fix guides and troubleshooting
- Deployment and migration guides

### 🔧 Scripts (`/scripts/`)
All automation scripts, utilities, and tools:
- PowerShell and batch scripts
- Translation analysis tools
- Build and deployment scripts
- Data extraction utilities

### 🌍 Environment Files (`/env-backup/`)
All environment configuration files (except active `.env`, `.env.local`, and `.env.example`)

### 🗄️ SQL Files (`/sql-backup/`)
Database schemas, migrations, and backup files

### 🏗️ Core Application Structure
```
/app/           - Next.js app directory
/components/    - React components
/lib/           - Utility libraries and configurations
/hooks/         - Custom React hooks
/utils/         - Helper functions
/styles/        - CSS and styling files
/public/        - Static assets
```

## 🚀 Quick Start

1. **Environment Setup**: Copy `.env.example` to `.env.local` and configure
2. **Install Dependencies**: `npm install`
3. **Database Setup**: Check `/docs/DATABASE_SETUP_GUIDE.md`
4. **Development**: `npm run dev`

## 📖 Documentation Index

Key documentation files in `/docs/`:
- `QUICK_START.md` - Get started quickly
- `DATABASE_SETUP_GUIDE.md` - Database configuration
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `SETUP_ORDER_GUIDE.md` - Complete setup sequence

## 🛠️ Available Scripts

Check `/scripts/` folder for:
- `Loft-Algerie.ps1` - Main application launcher
- Translation analysis tools
- Build and deployment utilities

---

*This organization was implemented to reduce root directory clutter and improve project maintainability.*