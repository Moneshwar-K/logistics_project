# Clear TypeScript/tsx Cache

If you're seeing old error messages, tsx might be using cached code.

## Quick Fix

1. **Stop the server** (Ctrl+C)

2. **Clear node_modules cache** (optional but recommended):
   ```bash
   cd backend
   rm -rf node_modules/.cache
   # Or on Windows:
   rmdir /s /q node_modules\.cache
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

## Alternative: Force Reload

If the above doesn't work, try:

```bash
# Stop server
# Then:
cd backend
npm run dev -- --no-cache
```

Or restart your terminal/IDE to clear any in-memory caches.

