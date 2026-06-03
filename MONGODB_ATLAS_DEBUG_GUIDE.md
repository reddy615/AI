# MongoDB Atlas TLS Connection Debugging Guide

## Problem Summary

**Error**: `SSL alert number 80: tlsv1 alert internal error` from MongoDB Atlas server

**Status**:
- ✅ Network connectivity: Working (ReplicaSet detected)
- ✅ SRV resolution: Working (cluster reachable)
- ❌ TLS handshake: Failing at server-side
- ❌ Connection: Rejected

**Key Finding**: This is a **server-side TLS error from MongoDB Atlas**, not a client configuration issue. Even with `tlsAllowInvalidCertificates=true`, the connection still fails at the same point.

---

## Immediate Action Items (Manual Verification Required)

### 1. Verify MongoDB Atlas Cluster Status

**Go to**: [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)

**Check**:
1. Navigate to: **Clusters** → **cluster0**
2. Look for cluster status (should be **GREEN**) 
3. Check for any **"Pending Activities"** section
4. Any orange/yellow warnings indicate configuration issues
5. Click **"Connect"** button → check connection status

**Expected State**: 
- Status: `Deployed and healthy`
- No pending operations
- No warnings or alerts

---

### 2. Verify Database User Credentials

**Go to**: MongoDB Atlas Dashboard → **Database Access** (or **Security** → **Database Users**)

**Check**:
1. Find user: `2300090002_db_user`
2. Verify user **Status**: Should show **ACTIVE** (green checkmark)
3. Verify **Authentication**: Should show appropriate method
4. Edit user → Verify password is correct
5. Check **Roles**: Should have appropriate permissions (at minimum `readWriteAnyDatabase`)

**Expected State**:
- User exists and is active
- Password matches: `HxX7I5nxmXy53IQd` (NO special characters to URL-encode)
- Has database access permissions

---

### 3. Verify Network Access (IP Whitelist)

**Go to**: MongoDB Atlas Dashboard → **Network Access** (or **Security** → **Network Access**)

**Check**:
1. Current whitelist entries
2. For **development/debugging**: Should have `0.0.0.0/0` (Allow from anywhere)
3. For **Railway deployment**: You'll need to whitelist Railway's IP (get from Railway dashboard)
4. Check if `127.0.0.1` / `0.0.0.0` is allowed (for local development)

**Current Machine IP**: 
- Local: `127.0.0.1` (if testing locally)
- Get public IP: `curl https://checkip.amazonaws.com`

**For Development**:
```
0.0.0.0/0 (Allow from anywhere)
```

**Important**: Temporarily whitelist `0.0.0.0/0` for debugging. Restrict later.

---

### 4. Verify Cluster Certificate Status

**Go to**: MongoDB Atlas Dashboard → **cluster0** → **More Options** (⋯) → **Manage Cluster**

**Check**:
1. Look for **TLS/SSL** section
2. Certificate status should be **ACTIVE**
3. If there's a **"Certificate Expiring Soon"** warning, renew it
4. Check for any certificate-related errors

**Expected State**:
- TLS/SSL: **Enabled** and **Active**
- Certificate: **Valid** and **Not Expired**
- No certificate-related warnings

---

### 5. Verify Connection String Format

**Current Connection String**:
```
mongodb+srv://2300090002_db_user:HxX7I5nxmXy53IQd@cluster0.2amgpzm.mongodb.net/?appName=Cluster0
```

**Verify**:
1. Format is correct: `mongodb+srv://USERNAME:PASSWORD@HOST/?appName=VALUE`
2. No extra spaces or quotes
3. Special characters in password: `HxX7I5nxmXy53IQd` - NO special characters, GOOD ✅
4. Host: `cluster0.2amgpzm.mongodb.net` - matches your cluster
5. Database name not included (Atlas chooses database at connection time) ✅

**Expected State**:
- Format: Correct SRV format
- No URL encoding issues (no special chars in password)
- Host resolves correctly

---

### 6. Advanced: Verify Cluster Configuration

**Go to**: MongoDB Atlas Dashboard → **cluster0** → **Configuration**

**Check**:
1. **Cloud Provider**: (AWS, Azure, GCP) - verify correct region
2. **Region**: Check if it's accessible from your network
3. **Tier**: M0 (free), M2, M10, etc. - verify cluster is actually deployed
4. **Version**: MongoDB version - ensure compatibility with mongoose 7.8.9
5. **Replication**: Should show "3 nodes" for replica set

**Expected State**:
- Cluster actively running (not paused)
- All nodes healthy (should see 3 nodes)
- Version compatible with Node.js driver

---

## If All Manual Checks Pass

If MongoDB Atlas dashboard shows everything is correct:

### 1. Try Connecting from MongoDB Compass (Desktop App)

Download [MongoDB Compass](https://www.mongodb.com/products/compass)

**Test Connection**:
1. Open MongoDB Compass
2. Click **"New Connection"** → **"Advanced Connection String"**
3. Paste your connection string:
```
mongodb+srv://2300090002_db_user:HxX7I5nxmXy53IQd@cluster0.2amgpzm.mongodb.net/?appName=Cluster0
```
4. Click **"Save & Connect"**

**Result**:
- ✅ Success: Your connection string is valid. The issue is Node.js/mongoose-specific
- ❌ Fails: There's a problem with the cluster or credentials themselves

---

### 2. If Compass Connects but Node.js Fails

This indicates a Node.js driver issue:

**Try Alternative Connection Options in db.js**:

```javascript
// Option A: Remove SRV, use direct connection
const uri = 'mongodb://2300090002_db_user:HxX7I5nxmXy53IQd@cluster0-shard-00-00.2amgpzm.mongodb.net:27017,cluster0-shard-00-01.2amgpzm.mongodb.net:27017,cluster0-shard-00-02.2amgpzm.mongodb.net:27017/?ssl=true&replicaSet=atlas-75dd2y-shard-0&authSource=admin';

// Option B: Use MongoDB URI with explicit TLS options
const options = {
  tls: true,
  tlsAllowInvalidCertificates: false,
  retryWrites: true,
  serverSelectionTimeoutMS: 5000,
};
```

---

## Temporary Development Workaround

If you need to work while debugging MongoDB:

### 1. Use Local MongoDB (Development Only)

Install MongoDB locally and use:
```env
MONGO_URI=mongodb://127.0.0.1:27017/ai-interview
```

### 2. Use MongoDB Atlas Free Tier on Different Cluster

Create a new cluster and test connection.

---

## Current Code Status

### Files Modified for Debugging
- ✅ `server/src/config/db.js` - Added connection logging and event handlers
- ✅ `server/server.js` - Added bootstrap logging
- ✅ `server/src/app.js` - Enhanced `/health` and `/ready` endpoints

### Health Endpoint Testing

```bash
# Check MongoDB connection status
curl http://localhost:5000/health

# Expected Response (Connected):
{
  "success": true,
  "status": "ok",
  "mongodb": {
    "readyState": 1,
    "readyStateDescription": "connected",
    "connected": true,
    "host": "cluster0-shard-00-00.2amgpzm.mongodb.net",
    "name": "admin"
  }
}

# Expected Response (Disconnected):
{
  "success": true,
  "status": "degraded",
  "mongodb": {
    "readyState": 0,
    "readyStateDescription": "disconnected",
    "connected": false
  }
}
```

---

## Next Steps After Verification

1. **If cluster is healthy and credentials correct**:
   - Problem may be driver version or Node.js version incompatibility
   - Consider updating `mongoose` or `mongodb` driver
   - Try test connection from Compass first

2. **If cluster has issues**:
   - Fix cluster status in MongoDB Atlas
   - Ensure all network access rules are correct
   - Renew certificates if needed

3. **After fixing**:
   - Restart backend: `npm run dev`
   - Test `/health` endpoint
   - Run complete flow: register → login → upload resume → logout → login again
   - Verify resume persists in MongoDB

---

## MongoDB Connection String Reference

**Your Current Connection String**:
```
mongodb+srv://2300090002_db_user:HxX7I5nxmXy53IQd@cluster0.2amgpzm.mongodb.net/?appName=Cluster0
```

**Parts Explained**:
- `mongodb+srv://` - Protocol (SRV = Service Records DNS lookup)
- `2300090002_db_user` - Database username
- `HxX7I5nxmXy53IQd` - Database password (NOT URL-encoded, no special chars)
- `cluster0.2amgpzm.mongodb.net` - MongoDB Atlas cluster hostname
- `/?appName=Cluster0` - Optional parameter

**If Password Had Special Characters** (for reference):
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `&` → `%26`

Your password has none of these, so no encoding needed. ✅

---

## Debugging Terminal Output

When backend starts, look for these logs:

```
[db.js] MongoDB connecting...
  type: 'MongoDB Atlas'
  uri: 'mongodb+srv://2300090002_db_user:***@cluster0.2amgpzm.mongodb.net/?appName=Cluster0'

[mongoose] Connecting to MongoDB...
[db.js] MongoDB connected (MongoDB Atlas)  ← SUCCESS

OR

[db.js] MongoDB connection failed: {...}  ← FAILURE
[Bootstrap] MongoDB unavailable - starting in degraded mode
```

---

## Summary

The MongoDB connection issue is **server-side TLS rejection**. This requires:

1. ✅ Verify cluster status in MongoDB Atlas dashboard (must be GREEN)
2. ✅ Verify database user is active with correct password
3. ✅ Verify network whitelist allows your IP (use `0.0.0.0/0` for debugging)
4. ✅ Verify TLS certificate is valid and active
5. ✅ Test connection with MongoDB Compass to isolate Node.js driver issues

Once cluster is verified as healthy, the Node.js connection should work.

---

**Contact MongoDB Support** if:
- Cluster shows as healthy but still can't connect
- Certificate renewal fails
- Persistent TLS errors after verification
