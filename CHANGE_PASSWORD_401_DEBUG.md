# Change Password 401 Error - Debug & Fix ✅

## Changes Made

### 1. Added `skipAuth: false` to Change Password API Call
**File:** `frontend/src/screens/users/ChangePasswordScreen.js` (line 63)

```javascript
const res = await requestWithFallback('/api/users/change-password', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentPassword: currentPassword.trim(),
    newPassword: newPassword.trim(),
  }),
  skipAuth: false,  // ← ADDED: Ensure JWT token is included
});
```

### 2. Added Debug Logging to API Layer
**File:** `frontend/src/config/api.js` (lines 66-76)

```javascript
if (!skipAuth) {
  const token = await getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    if (__DEV__) {
      console.log(`[API] Token attached (length: ${token.length})`);
    }
  } else {
    if (__DEV__) {
      console.warn('[API] No token found in storage!');
    }
  }
}
```

### 3. Improved Error Handling
**File:** `frontend/src/screens/users/ChangePasswordScreen.js` (lines 65-70)

Better error logging to display exact response from backend.

---

## Why You're Getting 401

The 401 error means the backend received the request but **either:**
1. No Authorization header was sent
2. The token in the header was missing or invalid
3. The token was expired

---

## Debugging - What to Check

### Step 1: Check if You're Actually Logged In
1. Open browser DevTools: **F12**
2. Go to **Application** tab → **Local Storage**
3. Look for `wmt_auth_token` key
4. **If NOT present:** You're not logged in! Login first.
5. **If present:** Copy the token value for next step

### Step 2: Check Console for Debug Logs
1. Open **Console** tab in DevTools
2. Try to change password
3. Look for one of these logs:
   - `[API] Token attached (length: XXX)` ← Good, token is being sent
   - `[API] No token found in storage!` ← Bad, login first

### Step 3: Check Network Request Headers
1. Open **Network** tab
2. Try to change password
3. Find the `change-password` request (PUT)
4. Click it and go to **Headers** section
5. Look for **Authorization** in Request Headers
6. Should show: `Authorization: Bearer eyJhbGciOi...` (JWT token)
7. **If missing:** Token is not being attached, check console for why

### Step 4: Verify Token is Valid
1. Copy the token from localStorage
2. Go to https://jwt.io
3. Paste token in the "Encoded" field
4. Look at the "Payload" section
5. Find the `exp` field - this is expiration time (Unix timestamp)
6. Convert to readable date: Go to https://www.unixtimestamp.com
7. **If exp is in the PAST:** Token is expired, logout and login again

---

## Test the Backend Directly

Create a test to verify the backend accepts tokens properly:

```bash
cd backend
node test-change-password.js
```

This script will:
1. Login with `guest1@gmail.com` / `Guest@123`
2. Get a fresh JWT token
3. Call change-password WITH the token (should succeed)
4. Call change-password WITHOUT token (should fail with 401)
5. Show you exactly what's working and what's not

---

## Common Fixes

### Fix 1: User Not Logged In
**Problem:** Console shows `[API] No token found in storage!`

**Solution:**
- Make sure you logged in successfully
- Check that login showed no errors
- Try logging out and logging in again

### Fix 2: Token is Expired  
**Problem:** Token exists but is old (exp is in past on jwt.io)

**Solution:**
- Logout: Click menu → Sign out
- Login again to get fresh token
- Try change password again

### Fix 3: Browser Has Old Code
**Problem:** You made the fix but still getting error

**Solution:**
- Hard refresh browser: **Ctrl + Shift + Delete**
- Clear "All time" data including cookies and cache
- Close browser completely
- Reopen and try again

### Fix 4: Backend JWT_SECRET Issue
**Problem:** Token is being sent, Authorization header shows it, but still 401

**Solution:**
- Restart backend:
  ```bash
  cd backend
  npm start
  ```
- The backend might have a cached/wrong JWT_SECRET
- After restart, try change password again

---

## Code Flow

```
ChangePasswordScreen.js
  ↓ User clicks "Change Password"
  ↓ Calls submit() function
  ↓ Calls requestWithFallback('/api/users/change-password', { skipAuth: false })
  
api.js (requestWithFallback)
  ↓ Sees skipAuth: false
  ↓ Calls getStoredToken() → gets JWT from AsyncStorage
  ↓ Adds header: Authorization: Bearer <token>
  ↓ Calls fetch(url, { headers, method: PUT, body: ... })

Network
  ↓ Sends PUT request with Authorization header
  
Backend (authMiddleware.protect)
  ↓ Reads Authorization header
  ↓ Extracts token from "Bearer XXX"
  ↓ Verifies token with JWT_SECRET
  ↓ Sets req.user from token
  ↓ Calls next()

Backend (changePassword controller)
  ↓ Gets user from req.user
  ↓ Checks currentPassword against user's password hash
  ↓ Updates password
  ↓ Returns 200 success
```

---

## Files Modified

1. ✅ `frontend/src/screens/users/ChangePasswordScreen.js`
   - Added `skipAuth: false` (line 63)
   - Improved error handling (lines 65-70)

2. ✅ `frontend/src/config/api.js`
   - Added debug logging for token attachment (lines 66-76)

3. ✅ `backend/test-change-password.js` (NEW)
   - Test script to verify endpoint works

---

## Testing Checklist

Before saying it's broken, check:

- [ ] You are logged in (token in localStorage)
- [ ] Console shows `[API] Token attached` message  
- [ ] Network tab shows `Authorization: Bearer` header
- [ ] Token is not expired (check exp on jwt.io)
- [ ] Backend is running (`npm start`)
- [ ] Backend responded with specific error message (not generic 401)

---

## If STILL Getting 401

1. **Restart everything:**
   ```bash
   # Stop backend (Ctrl+C)
   cd backend
   npm start
   
   # In another terminal
   cd frontend
   npm start
   ```

2. **Clear all storage:**
   - DevTools → Application → Local Storage → Clear All
   - DevTools → Application → Cookies → Clear All

3. **Login fresh:**
   - Logout if needed
   - Login with your username/password
   - Confirm you see profile page (not error)

4. **Try change password:**
   - Click profile icon
   - Click "Change Password"
   - Enter old password, new password
   - Click submit
   - Check console for `[API] Token attached` message

5. **If STILL 401:**
   - Check backend logs for errors
   - Run: `node backend/test-change-password.js`
   - Share backend error message

---

## Summary

The frontend is now properly configured to:
✅ Set `skipAuth: false` to require token
✅ Include JWT token in Authorization header
✅ Log when token is attached (debug)
✅ Log error if token missing (debug)
✅ Handle and display backend errors

If you're still getting 401, it means:
- Either you're not actually logged in (no token in storage)
- Or your token is invalid/expired (too old)
- Or backend has an issue with token validation

Check the debugging steps above to determine which one! 🔍
