# Dependencies Installation Guide

This project uses **Node.js** with **npm/pnpm/yarn** (not Python, so no requirements.txt).

## Frontend Dependencies

### Installation Method 1: Using npm (Recommended)

```bash
# Navigate to project root
cd erp-portal-software

# Install all dependencies
npm install
```

### Installation Method 2: Using pnpm (Faster)

```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install
```

### Installation Method 3: Using yarn

```bash
# Install yarn globally (if not installed)
npm install -g yarn

# Install dependencies
yarn install
```

## Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

## Complete Setup Script

### Windows (PowerShell)

```powershell
# Frontend
cd erp-portal-software
npm install

# Backend
cd backend
npm install
```

### Linux/Mac

```bash
# Frontend
cd erp-portal-software
npm install

# Backend
cd backend
npm install
```

## What Gets Installed

### Frontend (Root)
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI components
- Form validation (React Hook Form + Zod)
- And 50+ other dependencies

### Backend
- Express.js
- Mongoose (MongoDB)
- JWT authentication
- File upload (Multer)
- Security (Helmet, CORS)
- Logging (Winston)
- And 20+ other dependencies

## Verify Installation

After installation, verify:

```bash
# Check frontend
cd erp-portal-software
npm list --depth=0

# Check backend
cd backend
npm list --depth=0
```

## Troubleshooting

### npm install fails
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Permission errors (Linux/Mac)
- Use `sudo npm install` (not recommended)
- Or fix npm permissions: `npm config set prefix ~/.npm-global`

### Network issues
- Use different registry: `npm install --registry https://registry.npmjs.org/`
- Or use yarn/pnpm which may have better caching

## Alternative: One-Command Install

Create a script to install both:

### install-all.sh (Linux/Mac)
```bash
#!/bin/bash
echo "Installing frontend dependencies..."
npm install
echo "Installing backend dependencies..."
cd backend && npm install
echo "✅ All dependencies installed!"
```

### install-all.ps1 (Windows)
```powershell
Write-Host "Installing frontend dependencies..."
npm install
Write-Host "Installing backend dependencies..."
cd backend
npm install
Write-Host "✅ All dependencies installed!"
```

