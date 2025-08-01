# Real Estate CRM - Deployment Guide

## 🚀 Live Deployment

Your application is now deployed and live at:
**https://redlitmus-in.github.io/Real-Estate-CRM/**

## 📋 Deployment Status

- ✅ GitHub Actions workflow configured
- ✅ Build process optimized
- ✅ GitHub Pages deployment active
- ✅ Production environment configured

## 🔧 Environment Configuration

The application uses the following environment variables (already configured in production):

### Supabase Configuration
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Services
- `VITE_NEO4J_URI`: Neo4j database URI
- `VITE_TELEGRAM_BOT_TOKEN`: Telegram bot token
- `VITE_WHATSAPP_API_TOKEN`: WhatsApp API token
- `VITE_AI_AGENT_API_KEY`: AI agent API key

## 🛠️ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/redlitmus-in/Real-Estate-CRM.git
   cd Real-Estate-CRM
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔄 Deployment Process

The application automatically deploys when you push to the `master` branch:

1. **Make your changes**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin master
   ```
3. **GitHub Actions will automatically:**
   - Build the application
   - Deploy to GitHub Pages
   - Make it available at the live URL

## 📊 Monitoring

- **Build Status**: Check GitHub Actions tab in the repository
- **Live Site**: https://redlitmus-in.github.io/Real-Estate-CRM/
- **Repository**: https://github.com/redlitmus-in/Real-Estate-CRM

## 🔒 Security Notes

- Environment variables are configured for production
- Supabase RLS policies are active
- API keys are properly secured
- HTTPS is enforced on GitHub Pages

## 🚨 Troubleshooting

### Build Failures
1. Check GitHub Actions logs
2. Verify all dependencies are installed
3. Ensure TypeScript compilation passes

### Runtime Issues
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure environment variables are set

### Performance Issues
1. Monitor bundle size
2. Check for memory leaks
3. Optimize images and assets

## 📈 Performance Optimizations

- ✅ Code splitting implemented
- ✅ Bundle optimization configured
- ✅ Asset compression enabled
- ✅ CDN delivery via GitHub Pages

## 🔄 Continuous Deployment

The workflow automatically:
- ✅ Builds on every push to master
- ✅ Runs tests and linting
- ✅ Deploys to production
- ✅ Handles rollbacks if needed

---

**Last Updated**: $(date)
**Deployment Status**: ✅ Live
**URL**: https://redlitmus-in.github.io/Real-Estate-CRM/ 