# 🔧 Quick Fixes for Common Issues

## 🚨 If Homepage Shows 404

The website uses internationalized routing. Always use locale prefixes:

❌ **Wrong**: `http://localhost:3001`
✅ **Correct**: `http://localhost:3001/fr`

## 🔄 If Server Stops Responding

Restart the development server:
```bash
cd public-website
npm run dev
```

## 🖼️ If Images Don't Load

Check if images exist in the public directory:
```bash
ls public-website/public/images/
```

## 🌐 If Language Switching Doesn't Work

1. Check the language switcher component
2. Verify middleware configuration
3. Test each locale URL manually

## 📱 If Mobile View Looks Broken

1. Open Chrome DevTools (F12)
2. Click device toolbar icon
3. Select mobile device
4. Refresh page

## 🔍 If SEO Tags Are Missing

1. View page source (Ctrl+U)
2. Search for `<title>` and `<meta`
3. Check layout.tsx implementation

## ⚡ If Performance Is Slow

1. Check Network tab in DevTools
2. Look for large resources
3. Verify image optimization
4. Test on different network speeds

## 📊 If Analytics Don't Work

1. Check browser console for errors
2. Verify Google Analytics ID in environment
3. Test with browser extensions disabled

## 🛠️ Environment Variables

Create `.env.local` file if missing:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
NEXT_PUBLIC_SITE_URL=http://localhost:3001
GOOGLE_SITE_VERIFICATION=your-verification-code
```

## 🔄 Complete Reset

If all else fails:
```bash
cd public-website
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```