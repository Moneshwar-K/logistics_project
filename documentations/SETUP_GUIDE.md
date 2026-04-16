# Logistics ERP Portal - Setup Guide

## Quick Start

### Demo Credentials
The application comes with built-in demo authentication for testing without a backend API:

- **Email:** `admin@example.com`
- **Password:** `password123`

Use these credentials to log in and explore the entire application.

---

## Architecture Overview

### Current State (Demo Mode)
- **Authentication:** Demo mode with localStorage storage
- **API Calls:** All endpoints defined and ready for backend integration
- **UI/UX:** Fully functional with placeholder data
- **Database:** Not connected - ready to connect

### Components
- `/app` - Next.js pages and routing
- `/components` - Reusable React components
- `/types` - TypeScript interfaces and types
- `/lib` - Utility functions and API service
- `/hooks` - Custom React hooks

---

## Environment Variables

### For Demo Mode (Current)
No environment variables needed. The app works out of the box.

### For Backend Integration
When you're ready to connect your database, add this environment variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.com/api
```

The API should implement these RESTful endpoints:

#### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

#### Shipments
- `GET /shipments` - List shipments
- `POST /shipments` - Create shipment
- `GET /shipments/{id}` - Get shipment details
- `GET /shipments/hawb/{hawb}` - Get by HAWB number
- `PATCH /shipments/{id}` - Update shipment

#### Tracking
- `GET /tracking/quick` - Quick tracking search
- `GET /tracking/{shipmentId}` - Get tracking details
- `POST /tracking/{shipmentId}/events` - Create tracking event

#### Operations
- `POST /operations/status-update` - Update shipment status
- `GET /operations/history/{shipmentId}` - Get status history

#### POD (Proof of Delivery)
- `POST /pod` - Create POD
- `GET /pod/{shipmentId}` - Get POD
- `POST /pod/upload/{shipmentId}` - Upload POD files

#### Audit
- `GET /audit/dashboard` - Get audit dashboard KPIs
- `GET /audit/hawbs` - List HAWBs for audit
- `POST /audit/hawbs/{hawb}` - Create audit record

#### Billing
- `POST /invoices` - Create invoice
- `GET /invoices` - List invoices
- `GET /invoices/{id}` - Get invoice details

#### Master Data
- `GET /branches` - List branches
- `GET /parties` - List shippers/consignees
- `GET /users` - List users
- `POST /users` - Create user

---

## Pages Built

### Authentication
- ✅ `/auth/login` - Login page with demo credentials
- ✅ `/auth/signup` - Signup page with branch selection

### Dashboard
- ✅ `/dashboard` - Main admin dashboard with KPIs

### Tracking
- ✅ `/tracking/quick` - Public tracking search
- ✅ `/tracking/admin` - Admin tracking with results
- ✅ `/tracking/customer` - Customer-facing detailed tracking

### Shipment Management
- ✅ `/shipments/booking/quick` - Quick HAWB entry
- ✅ `/shipments/booking/manual` - Detailed HAWB entry
- ✅ `/shipments/list` - Shipment list and search

### Operations
- ✅ `/operations/status-update` - Status update workflow
- ✅ `/operations/pod` - POD confirmation form
- ✅ `/operations/pod-upload` - POD file upload

### Audit
- ✅ `/audit` - Audit dashboard with KPIs

### Supporting
- ✅ `/billing/invoices` - Invoice management
- ✅ `/reports` - Reports dashboard
- ✅ `/users` - User management
- ✅ `/settings` - System settings

---

## Troubleshooting

### "Failed to fetch" errors
**Cause:** API endpoint not available or environment variable not set
**Solution:** 
1. Ensure you're in demo mode (no env var needed)
2. Or set `NEXT_PUBLIC_API_BASE_URL` to your API endpoint
3. Or check that your API server is running

### Authentication not persisting
**Cause:** localStorage being cleared or browser cache issue
**Solution:**
1. Check browser's Application > Local Storage
2. Verify `auth_token` and `user_data` are stored
3. Clear browser cache and try again

### Branches dropdown empty
**Cause:** API failure or no branches in system
**Solution:**
1. In demo mode, check that getBranches() returns demo data
2. In production, ensure your API returns at least one branch
3. Check browser console for specific errors

### Form submissions not working
**Cause:** API not integrated or validation errors
**Solution:**
1. Check browser console for error messages
2. Verify form validation passes (check red error messages)
3. Ensure API endpoint exists and is accessible

---

## Customization

### Changing Demo Credentials
Edit `/lib/api.ts` in the `login()` method to change demo credentials.

### Adding More Demo Data
Edit the demo data in API service methods like `getBranches()`.

### Changing Colors/Theme
Edit `/app/globals.css` to modify design tokens (background, primary, accent colors).

### Adding New Pages
1. Create page in `/app/[section]/[page]/page.tsx`
2. Add route to sidebar in `/components/layout/sidebar.tsx`
3. Create any required API calls in `/lib/api.ts`

---

## Database Integration Checklist

When ready to integrate with your database:

- [ ] Set `NEXT_PUBLIC_API_BASE_URL` environment variable
- [ ] Implement all endpoints defined in `/lib/api.ts`
- [ ] Ensure API returns proper TypeScript types from `/types/logistics.ts`
- [ ] Add authentication token to Authorization header
- [ ] Test each page's data fetching
- [ ] Remove demo credentials from `/lib/api.ts`
- [ ] Add proper error handling for your API responses

---

## Support

For issues or questions:
1. Check the debug logs in browser console (F12)
2. Verify all API endpoints match the expected format
3. Ensure TypeScript types match API response structure
