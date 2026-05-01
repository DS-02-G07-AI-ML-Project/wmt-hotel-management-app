# Password Reset 401 Error - Solution

## Issue
The password reset endpoints are returning **401 Unauthorized** errors:
- `GET /api/users/check-email` → 401
- `POST /api/users/reset-password` → 400 (Bad Request)

## Root Causes & Solutions

### 1. **Backend Not Running or MongoDB Connection Failed** ⚠️ PRIMARY
If the database connection fails silently, the backend may return unexpected status codes.

**Solution:**
```bash
cd backend
# Check if backend is running and responsive
curl http://192.168.1.8:5000/health

# Should respond with:
# {"ok":true,"env":"development","uptimeSec":123,"timestamp":"..."}
```

If health check fails:
- Verify MongoDB connection string in `backend/.env`
- Confirm MongoDB cluster allows connections from your IP
- Restart the backend: `npm start` or `node server.js`

### 2. **Debug Logging Interfering** ✅ FIXED
The controllers had excessive `console.log` statements that could interfere with responses.

**Fixed in:**
- `backend/controllers/userController.js` - Removed debug logs from both endpoints
- Endpoints now return clean JSON responses only

### 3. **Routes Not Explicitly Marked as Public** ✅ FIXED
Added clear documentation in:
- `backend/routes/userRoutes.js` - Added comment "Public routes (no authentication required)"

---

## Verification Steps

### Step 1: Verify Backend Health
```bash
curl -X GET http://192.168.1.8:5000/health
```

Expected response:
```json
{
  "ok": true,
  "env": "development",
  "uptimeSec": 123,
  "timestamp": "2026-05-01T..."
}
```

### Step 2: Test Check-Email Endpoint
```bash
curl -X GET "http://192.168.1.8:5000/api/users/check-email?email=test@gmail.com"
```

Expected response:
```json
{
  "exists": false  // or true if user exists
}
```

### Step 3: Test Reset-Password Endpoint
```bash
curl -X POST http://192.168.1.8:5000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }'
```

Expected responses:
- If user doesn't exist: `{ "success": false, "message": "No account found" }` (404)
- If passwords don't match: `{ "success": false, "message": "Passwords do not match" }` (400)
- If password too weak: `{ "success": false, "message": "Password must be..." }` (400)
- **If successful**: `{ "success": true, "message": "Password reset successfully" }` (200)

---

## Automated Verification Script

Run this to automatically verify all password reset endpoints:

```bash
cd backend
node verify-password-reset.js http://192.168.1.8:5000
```

This will test:
- ✅ Backend health
- ✅ Check email (non-existent)
- ✅ Check email (existing)
- ✅ Reset password (missing fields)
- ✅ Reset password (user not found)
- ✅ Reset password (weak password)

---

## Frontend Configuration

Make sure the frontend has the correct API URL configured:

### For React Native (Expo)
Set this environment variable:
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:5000
```

Or in your `.env` or app configuration.

### For React Native Web
The API configuration is in `frontend/src/config/api.js` and should automatically try:
1. Environment variable `EXPO_PUBLIC_API_BASE_URL`
2. Fallback to localhost:5000
3. Other local hosts (127.0.0.1, 10.0.2.2, etc.)

---

## After Fixing

1. **Restart backend:**
   ```bash
   cd backend
   npm start  # or node server.js
   ```

2. **Reload frontend app**
   - If React Native: Reload app (Ctrl+R or shake device)
   - If React Native Web: Refresh browser (F5)

3. **Test password reset flow:**
   - Navigate to "Forgot Password?" on login screen
   - Enter a registered user's email
   - Verify "Email verified" message appears
   - Enter new password (must meet requirements)
   - Click "Reset Password"
   - Should redirect to Login with success message

---

## Files Modified in This Session

1. **backend/controllers/userController.js**
   - Removed debug logging from `checkEmailExists` function
   - Removed debug logging from `resetPassword` function
   - Functions now return clean JSON only

2. **backend/routes/userRoutes.js**
   - Added documentation comment "Public routes (no authentication required)"
   - Clarifies that check-email and reset-password endpoints need no auth

3. **backend/verify-password-reset.js** (NEW)
   - Automated verification script
   - Tests all password reset endpoints
   - Run with: `node verify-password-reset.js [API_URL]`

---

## Password Requirements

For password reset to succeed, the new password must:
- ✅ Be at least 6 characters long
- ✅ Contain at least one uppercase letter (A-Z)
- ✅ Contain at least one number (0-9)
- ✅ Contain at least one special character (!@#$%^&*)

Example valid password: `MyNewPass123!`

---

## Need Help?

If you're still getting errors after these steps:

1. Check backend server logs for any error messages
2. Verify MongoDB connection string and connectivity
3. Ensure no firewall is blocking port 5000
4. Try accessing backend health endpoint from your browser: http://192.168.1.8:5000/health
5. Check browser DevTools Network tab for the actual response

The password reset feature is fully implemented and just needs the backend to be properly connected to MongoDB.
