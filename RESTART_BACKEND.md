# URGENT: Backend Cache Issue - Complete Reset Required

## Problem
Backend is returning error: **"Email, token, and password fields are required"**

This error message does NOT exist in the current code. **The backend is running STALE/CACHED code**.

---

## Solution: Complete Backend Restart

### Option 1: Hard Reset (RECOMMENDED)

#### Step 1: Kill All Node Processes
```bash
# Windows CMD or PowerShell
taskkill /F /IM node.exe
```

#### Step 2: Clear Node Cache
```bash
cd backend
rmdir /S /Q node_modules
del package-lock.json
npm install
```

#### Step 3: Start Backend Fresh
```bash
npm start
```

### Option 2: Quick Restart

#### Step 1: Stop Backend
Press **Ctrl+C** in terminal running backend and wait 3-5 seconds

#### Step 2: Check Port 5000
```bash
netstat -ano | findstr :5000
```

If something is still running, kill it:
```bash
taskkill /PID <PID> /F
```

#### Step 3: Start Again
```bash
cd backend
npm start
```

Watch for:
```
API listening on http://0.0.0.0:5000 (reachable on LAN)
```

---

## After Backend Restart

### Step 1: Verify Backend Health
```bash
curl http://192.168.1.8:5000/health
```

### Step 2: Clear Frontend Cache
**Browser**: Ctrl+Shift+Delete → Clear all → Refresh (F5)
**Expo**: Kill app → Restart or Ctrl+R

### Step 3: Test Password Reset
1. Email: `guest1@gmail.com`
2. Password: `TestPass123!`
3. Confirm: `TestPass123!`
4. Click "Reset Password"

---

## Backend Should Accept This

```json
{
  "email": "guest1@gmail.com",
  "newPassword": "TestPass123!",
  "confirmPassword": "TestPass123!"
}
```

NOT a "token" field.

---

## Also Noted: check-email Returns 401

The `/api/users/check-email` is returning **401 Unauthorized**. This will be fixed by clearing backend cache.

---

## Password Requirements
- 6+ characters
- 1 uppercase letter (A-Z)
- 1 number (0-9)
- 1 special character (!@#$%^&*)

Example: `GuestPass123!` ✅

---

## DO THIS NOW:

```bash
# Kill all node processes
taskkill /F /IM node.exe

# Go to backend
cd backend

# Clear everything
rmdir /S /Q node_modules
del package-lock.json

# Reinstall
npm install

# Start fresh
npm start
```

Then reload your app and try again!
