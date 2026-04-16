# Quick Installation Guide

## 🚀 One-Command Installation

### Option 1: Automated Scripts

**Windows:**
```powershell
# Run PowerShell script
.\INSTALL_ALL.ps1

# OR run batch file
.\INSTALL_ALL.bat
```

**Linux/Mac:**
```bash
# Make script executable
chmod +x INSTALL_ALL.sh

# Run script
./INSTALL_ALL.sh
```

### Option 2: Manual Installation

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

## 📋 What Gets Installed

### Frontend (~60 packages)
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- UI Components
- Form Validation
- Charts & Icons

### Backend (~25 packages)
- Express.js
- Mongoose (MongoDB)
- JWT Authentication
- File Upload
- Security & Logging

## ⚡ Fast Installation Tips

1. **Use pnpm (faster than npm):**
   ```bash
   npm install -g pnpm
   pnpm install
   cd backend && pnpm install
   ```

2. **Use yarn (alternative):**
   ```bash
   npm install -g yarn
   yarn install
   cd backend && yarn install
   ```

3. **Parallel installation:**
   ```bash
   # Terminal 1
   npm install
   
   # Terminal 2
   cd backend && npm install
   ```

## ✅ Verify Installation

After installation, check:

```bash
# Frontend
npm list --depth=0

# Backend
cd backend
npm list --depth=0
```

## 🐛 Troubleshooting

### Clear cache and reinstall:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Use different registry:
```bash
npm install --registry https://registry.npmjs.org/
```

### Check Node.js version:
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

## 📝 Dependency Lists

See:
- `DEPENDENCIES.txt` - Frontend dependencies list
- `backend/DEPENDENCIES.txt` - Backend dependencies list

These are for reference - actual installation uses `package.json` files.

