# 🔑 Neo4j Password Setup Guide

## 🚨 Current Issue
Your Neo4j AuraDB instance doesn't have a password configured or you can't find it.

## ✅ Solution: Create New Instance

### Step 1: Create New Neo4j AuraDB Instance

1. **Go to Neo4j Console:**
   - Visit: https://console.neo4j.io/
   - Sign in to your account

2. **Create New Database:**
   - Click "New Instance"
   - Choose "AuraDB Free"
   - Set Database Name: `realestate-crm-v2`
   - **Set Password:** `RealEstate123!` (remember this!)
   - Choose Region: Closest to your location
   - Click "Create Instance"

3. **Wait for Creation:**
   - Instance creation takes 2-3 minutes
   - Status will change from "Creating" to "Running"

### Step 2: Get Connection Details

1. **Copy Connection String:**
   - Format: `neo4j+s://xxxxx.databases.neo4j.io:7687`
   - Username: `neo4j`
   - Password: `RealEstate123!`

### Step 3: Update Your .env File

Replace your current `.env` file with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Neo4j AuraDB Configuration
VITE_NEO4J_URI=neo4j+s://your-new-instance.databases.neo4j.io:7687
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=RealEstate123!

# Telegram Configuration (Optional)
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_TELEGRAM_WEBHOOK_URL=your_webhook_url

# WhatsApp Configuration (Optional)
VITE_WHATSAPP_API_KEY=your_whatsapp_api_key
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Feature Flags
VITE_AI_AGENT_ENABLED=true
VITE_AUTO_LEAD_CREATION=true
```

### Step 4: Test Connection

1. **Restart Development Server:**
   ```bash
   npm run dev
   ```

2. **Check Console:**
   - Look for: `✅ Neo4j AuraDB connected successfully!`

3. **Set Up Schema:**
   - Open Neo4j Browser for your new instance
   - Run the commands from `neo4j-schema.cypher`

## 🔍 Alternative: Find Existing Password

If you want to keep your current instance:

1. **Check AuraDB Dashboard:**
   - Go to your instance details
   - Look for "Security" or "Connection" tab
   - Find password reset option

2. **Check Email:**
   - Look for Neo4j welcome email
   - It might contain the password

3. **Contact Support:**
   - If you can't find the password
   - Neo4j support can help reset it

## 🎯 Quick Test

Once you have the password, test with:

```bash
# Restart your dev server
npm run dev

# Check browser console for:
# ✅ Neo4j AuraDB connected successfully!
```

---

**💡 Tip: Use the password `RealEstate123!` for easy remembering!** 