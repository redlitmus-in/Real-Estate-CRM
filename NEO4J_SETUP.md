# 🗄️ Neo4j AuraDB Setup Guide

## 📋 Prerequisites

1. **Neo4j AuraDB Account**
   - Sign up at: https://neo4j.com/cloud/platform/aura-graph-database/
   - Choose "AuraDB Free" (50K nodes, 175K relationships)

## 🚀 Step-by-Step Setup

### Step 1: Create Neo4j AuraDB Instance

1. **Go to Neo4j Console:**
   - Visit: https://console.neo4j.io/
   - Sign in with your account

2. **Create New Database:**
   - Click "New Instance"
   - Choose "AuraDB Free"
   - Set Database Name: `realestate-crm`
   - Set Password: `YourSecurePassword123` (or your choice)
   - Choose Region: Closest to your location
   - Click "Create Instance"

3. **Wait for Creation:**
   - Instance creation takes 2-3 minutes
   - Status will change from "Creating" to "Running"

### Step 2: Get Connection Details

1. **Access Your Database:**
   - Click on your database instance
   - Look for "Connection Details" section

2. **Copy Connection String:**
   - Format: `neo4j+s://xxxxx.databases.neo4j.io:7687`
   - Username: `neo4j`
   - Password: The password you set during creation

### Step 3: Configure Environment Variables

1. **Create `.env` file in project root:**
   ```env
   # Neo4j AuraDB Configuration
   VITE_NEO4J_URI=neo4j+s://your-actual-instance.databases.neo4j.io:7687
   VITE_NEO4J_USER=neo4j
   VITE_NEO4J_PASSWORD=your_actual_password

   # Other existing variables...
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

2. **Replace placeholders:**
   - `your-actual-instance.databases.neo4j.io:7687` → Your actual connection string
   - `your_actual_password` → Your actual database password

### Step 4: Set Up Database Schema

1. **Open Neo4j Browser:**
   - In your AuraDB dashboard, click "Open with Neo4j Browser"
   - Or go to: `https://console.neo4j.io/` → Your Database → "Open with Neo4j Browser"

2. **Run Schema Commands:**
   - Copy the content from `neo4j-schema.cypher`
   - Paste in Neo4j Browser
   - Click "Run" or press Ctrl+Enter

3. **Verify Setup:**
   ```cypher
   // Check if data was created
   MATCH (c:Customer) RETURN c;
   MATCH (p:Property) RETURN p;
   MATCH (s:Session) RETURN s;
   ```

### Step 5: Test Connection

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Check Browser Console:**
   - Open browser developer tools
   - Look for: `✅ Neo4j AuraDB connected successfully!`

3. **Check Database Status:**
   - Go to your app
   - Look at the Database Status component
   - Neo4j should show as "Connected"

## 🔧 Troubleshooting

### Connection Issues

**Error: "Could not perform discovery"**
- ✅ Check your internet connection
- ✅ Verify Neo4j AuraDB instance is running
- ✅ Ensure connection string is correct
- ✅ Check if password is correct

**Error: "WebSocket connection failure"**
- ✅ Try accessing Neo4j Browser directly
- ✅ Check if your browser blocks WebSocket connections
- ✅ Try a different browser

**Error: "Invalid URI format"**
- ✅ Ensure URI starts with `neo4j+s://`
- ✅ Check for typos in connection string

### Environment Variables Not Loading

**Error: "Neo4j not configured"**
- ✅ Ensure `.env` file is in project root
- ✅ Restart development server after adding `.env`
- ✅ Check variable names start with `VITE_`

### Schema Issues

**Error: "Constraint already exists"**
- ✅ This is normal, constraints are created only once
- ✅ Continue with the rest of the schema

**Error: "Index already exists"**
- ✅ This is normal, indexes are created only once
- ✅ Continue with the rest of the schema

## 🎯 Verification Commands

### Test Basic Connection
```cypher
RETURN 1 as test;
```

### Check Sample Data
```cypher
// Check customers
MATCH (c:Customer) RETURN c;

// Check properties
MATCH (p:Property) RETURN p;

// Check sessions
MATCH (s:Session) RETURN s;

// Check messages
MATCH (m:Message) RETURN m;
```

### Test Relationships
```cypher
// Check customer-session relationships
MATCH (c:Customer)-[:HAS_SESSION]->(s:Session) RETURN c, s;

// Check session-message relationships
MATCH (s:Session)-[:HAS_MESSAGE]->(m:Message) RETURN s, m;
```

## 📊 Neo4j Browser Features

### Useful Commands for Development

1. **View Database Info:**
   ```cypher
   CALL dbms.components() YIELD name, versions, edition;
   ```

2. **Check Database Size:**
   ```cypher
   CALL db.schema.visualization();
   ```

3. **Clear All Data (Development Only):**
   ```cypher
   MATCH (n) DETACH DELETE n;
   ```

4. **Count All Nodes:**
   ```cypher
   MATCH (n) RETURN labels(n), count(n);
   ```

## 🚀 Next Steps

After successful setup:

1. **Test AI Conversations:**
   - Send messages in your app
   - Check console for Neo4j logs

2. **Monitor Performance:**
   - Use Neo4j Browser to monitor queries
   - Check database metrics in AuraDB dashboard

3. **Scale When Needed:**
   - Upgrade to paid plan for more nodes/relationships
   - Add more complex graph queries

## 📞 Support

- **Neo4j Documentation:** https://neo4j.com/docs/
- **AuraDB Documentation:** https://neo4j.com/docs/aura/
- **Community Forum:** https://community.neo4j.com/

---

**🎉 Congratulations! Your Neo4j AuraDB is now integrated with your Real Estate CRM!** 