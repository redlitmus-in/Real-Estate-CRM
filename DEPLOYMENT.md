# Deployment Guide

This guide covers deployment options for the Real Estate CRM application.

## Available Deployment Scripts

### Basic Deploy
```bash
npm run deploy
```
This builds the project and provides instructions for manual deployment.

### Platform-Specific Deployments

#### 1. Vercel (Recommended for React apps)
```bash
npm run deploy:vercel
```
**Setup:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Configure: `vercel`

#### 2. Netlify
```bash
npm run deploy:netlify
```
**Setup:**
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Initialize: `netlify init`

#### 3. GitHub Pages
```bash
npm run deploy:gh-pages
```
**Setup:**
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json homepage field
3. Configure GitHub repository settings

#### 4. Firebase Hosting
```bash
npm run deploy:firebase
```
**Setup:**
1. Install Firebase CLI: `npm i -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`

#### 5. Surge.sh
```bash
npm run deploy:surge
```
**Setup:**
1. Install Surge: `npm install --save-dev surge`
2. Login: `surge login`

## Environment Variables

Before deploying, ensure you have the following environment variables configured:

### Supabase Configuration
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Neo4j Configuration
```env
VITE_NEO4J_URI=your_neo4j_uri
VITE_NEO4J_USER=your_neo4j_username
VITE_NEO4J_PASSWORD=your_neo4j_password
```

### Telegram Bot (Optional)
```env
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### WhatsApp Integration (Optional)
```env
VITE_WHATSAPP_API_KEY=your_whatsapp_api_key
```

## Production Build Optimization

The current build shows a large bundle size (1.5MB). Consider these optimizations:

### 1. Code Splitting
Implement dynamic imports for route-based code splitting:

```typescript
// Instead of direct imports
import AdminDashboard from './pages/admin/AdminDashboard'

// Use dynamic imports
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
```

### 2. Bundle Analysis
Install and use bundle analyzer:
```bash
npm install --save-dev rollup-plugin-visualizer
```

### 3. Tree Shaking
Ensure unused code is eliminated by:
- Using ES modules
- Avoiding side effects in modules
- Configuring proper tree shaking in Vite

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase project deployed and configured
- [ ] Neo4j database accessible from production
- [ ] CORS settings configured for production domains
- [ ] SSL certificates configured
- [ ] Domain and DNS configured
- [ ] Monitoring and error tracking set up
- [ ] Performance monitoring configured

## Troubleshooting

### Common Issues

1. **Build Fails**: Check for TypeScript errors and missing dependencies
2. **Environment Variables Not Loading**: Ensure they're prefixed with `VITE_`
3. **CORS Errors**: Configure Supabase and Neo4j CORS settings
4. **Large Bundle Size**: Implement code splitting and analyze bundle

### Performance Monitoring

Consider adding:
- Sentry for error tracking
- Google Analytics for user tracking
- Web Vitals monitoring
- Performance budgets

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **CORS**: Configure proper CORS policies for production
3. **HTTPS**: Ensure all production deployments use HTTPS
4. **Content Security Policy**: Implement CSP headers
5. **Rate Limiting**: Configure rate limiting for APIs

## Recommended Deployment Strategy

For a production Real Estate CRM:

1. **Development**: Use Vercel for preview deployments
2. **Staging**: Use Vercel or Netlify with staging environment
3. **Production**: Use Vercel with custom domain and SSL
4. **Backup**: Maintain GitHub Pages as fallback

## Monitoring and Maintenance

- Set up automated deployments with GitHub Actions
- Configure health checks for all services
- Implement logging and monitoring
- Set up automated backups for databases
- Configure alerts for downtime and errors 