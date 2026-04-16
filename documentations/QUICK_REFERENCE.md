# Quick Reference Guide - Logistics ERP Platform

## 🚀 Getting Started (30 seconds)

```bash
# 1. Install & Run
npm install
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Login with demo credentials
Email: admin@example.com
Password: password123
```

---

## 📍 Main Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard` | KPIs & overview |
| All Shipments | `/shipments/list` | List & search shipments |
| Create Shipment | `/shipments/booking/manual` | New shipment form |
| Shipment Details | `/shipments/[id]` | Full shipment info |
| Invoices | `/billing/invoices` | Invoice management |
| Generate Invoice | `/billing/generate-invoice` | Auto-generate invoices |
| E-Way Bills | `/eway-bills` | E-Bill management |
| Generate E-Bill | `/eway-bills/generate` | Create e-way bills |
| Track Shipment | `/tracking/quick` | Live tracking |
| Operations | `/operations/status-update` | Update shipment status |
| Driver Portal | `/driver` | Driver deliveries |
| Admin Users | `/admin/users` | User management |

---

## 💻 Most Important Imports

### Utilities to Import
```typescript
// Business Logic
import { 
  calculateShippingCharges,
  isValidStatusTransition,
  getAllowedNextStatuses,
  isShipmentComplete,
  requiresAttention,
  calculateDaysInTransit
} from '@/lib/logistics-utils';

// Formatting
import { 
  formatCurrency,
  formatDate,
  formatHAWB,
  formatGSTIN,
  formatPhoneNumber,
  formatAddress
} from '@/lib/format';

// Validation
import { 
  validateForm,
  validateEmail,
  validatePhoneNumber,
  validateGSTIN,
  validateHAWB,
  hasFormErrors
} from '@/lib/validation';

// Constants
import { 
  SERVICE_TYPES,
  USER_ROLES,
  TAX_RATES,
  SHIPMENT_TYPES,
  STATUS_COLORS
} from '@/lib/constants';

// API & Hooks
import { apiService } from '@/lib/api';
import { useApi } from '@/hooks/use-api';
```

---

## 🔧 Common Tasks (Copy-Paste Ready)

### 1️⃣ Calculate Shipping Charges
```typescript
import { calculateShippingCharges, formatCurrency } from '@/lib/logistics-utils';

const charges = calculateShippingCharges(150, 500, 'air', 18);
console.log(`Total: ${formatCurrency(charges.total)}`);
// Output: Total: ₹2,272.00
```

### 2️⃣ Validate a Form
```typescript
import { validateForm, validateEmail, validatePhoneNumber } from '@/lib/validation';

const errors = validateForm(formData, {
  email: validateEmail,
  phone: validatePhoneNumber,
});

if (Object.keys(errors).length === 0) {
  console.log('Form is valid!');
} else {
  console.log('Form errors:', errors);
}
```

### 3️⃣ Check Status Transition
```typescript
import { isValidStatusTransition, getAllowedNextStatuses } from '@/lib/logistics-utils';

if (isValidStatusTransition('pending', 'picked_up')) {
  console.log('Valid transition');
}

const nextStates = getAllowedNextStatuses('in_transit');
// Returns: ['in_port', 'ready_for_delivery', 'exception']
```

### 4️⃣ Format Data for Display
```typescript
import { formatCurrency, formatDate, formatAddress } from '@/lib/format';

const display = {
  cost: formatCurrency(5000),           // ₹5,000.00
  date: formatDate('2024-01-15'),       // Jan 15, 2024
  location: formatAddress('NYC', 'NY', '10001', 'USA')  // NYC, NY, 10001, USA
};
```

### 5️⃣ Use API Hooks
```typescript
import { useApi } from '@/hooks/use-api';
import { apiService } from '@/lib/api';

const { data, loading, error, execute } = useApi();

useEffect(() => {
  execute(() => apiService.listShipments());
}, [execute]);

return loading ? <Spinner /> : <ShipmentList data={data} />;
```

### 6️⃣ Create a Shipment
```typescript
import { apiService } from '@/lib/api';

const shipment = await apiService.createShipment({
  shipper_id: 'shipper_1',
  consignee_id: 'cons_1',
  service_type: 'air',
  total_weight: 150,
  total_cartons: 10,
  invoice_value: 50000,
  invoice_currency: 'INR'
});
```

### 7️⃣ Generate Invoice
```typescript
import { apiService } from '@/lib/api';

const invoice = await apiService.createInvoice({
  shipment_id: 'ship_1',
  billed_party_id: 'shipper_1',
  invoice_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30*86400000).toISOString()
});
```

### 8️⃣ Generate E-Way Bill
```typescript
import { apiService } from '@/lib/api';

const ewayBill = await apiService.createEWayBill({
  shipment_id: 'ship_1',
  consignor_gstin: '27AABCT1234H1Z0',
  consignee_gstin: '27AABCT5678H1Z0',
  vehicle_number: 'DL01AB1234'
});
```

### 9️⃣ Search Shipments
```typescript
import { apiService } from '@/lib/api';

const result = await apiService.listShipments({
  hawb: 'HAW000001',
  status: 'in_transit',
  limit: 50
});

console.log(result.data); // Array of shipments
```

### 🔟 Update Shipment Status
```typescript
import { apiService } from '@/lib/api';

await apiService.updateShipmentStatus('ship_1', 'delivered', {
  location: 'New York',
  notes: 'Delivered successfully'
});
```

---

## 🎨 Color Tokens (Light Theme)

```typescript
// Primary Colors
Primary: #1a73e8 (Google Blue)
White: #ffffff
Foreground: #202124 (Dark text)
Muted: #80868b (Light text)

// Status Colors
Delivered: #34a853 (Green)
In Transit: #1a73e8 (Blue)
Pending: #fbbc04 (Yellow)
Hold/Exception: #d33b27 (Red)

// Usage in Tailwind
bg-blue-600       // Primary button
border-blue-200   // Card borders
text-blue-800     // Text
bg-blue-50        // Light backgrounds
```

---

## 📚 File Guide

| Need | File |
|------|------|
| Create features | `/app/**/page.tsx` |
| Add components | `/components/**/*.tsx` |
| Business logic | `/lib/logistics-utils.ts` |
| Format data | `/lib/format.ts` |
| Validate forms | `/lib/validation.ts` |
| Configuration | `/lib/constants.ts` |
| API calls | `/lib/api.ts` |
| Custom hooks | `/hooks/use-api.ts` |
| Types | `/types/logistics.ts` |
| Styles | `/app/globals.css` |

---

## 🔑 Key Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Go to Dashboard | Cmd/Ctrl + D |
| Search | Cmd/Ctrl + K |
| New Shipment | Cmd/Ctrl + N |
| Settings | Cmd/Ctrl + , |

---

## ✅ Validation Rules (Quick Reference)

| Field | Rules |
|-------|-------|
| Email | Must be valid email format |
| Password | 8+ chars, uppercase, number |
| Phone | 10+ digits, valid format |
| GSTIN | Exactly 15 chars, uppercase |
| HAWB | 3-20 alphanumeric |
| Weight | > 0, max 1,000,000 kg |
| Amount | Must be positive number |

---

## 🌐 Status Values

```typescript
// Shipment Status
pending, picked_up, in_transit, in_port, 
customs_clearance, ready_for_delivery, out_for_delivery,
delivered, on_hold, exception, cancelled

// Invoice Status
pending, paid, overdue, partial

// E-Way Bill Status
generated, in_transit, delivered, expired

// User Roles
admin, operations, customer, driver, finance
```

---

## 📊 Data Examples

### Shipment
```typescript
{
  hawb: "HAW000001",
  shipper: { name: "Global Imports Ltd", email: "hello@globalimports.com" },
  consignee: { name: "Export Solutions Co", email: "info@exportsolutions.com" },
  status: "in_transit",
  service_type: "air",
  total_weight: 150,
  total_cartons: 10,
  invoice_value: 50000
}
```

### Invoice
```typescript
{
  invoice_number: "INV-2024-0001",
  shipment_id: "ship_1",
  subtotal: 5000,
  tax_percentage: 18,
  tax_amount: 900,
  total_amount: 5900,
  payment_status: "pending",
  due_date: "2024-02-08"
}
```

### E-Way Bill
```typescript
{
  eway_bill_number: "401001234567890",
  shipment_id: "ship_1",
  consignor_gstin: "27AABCT1234H1Z0",
  consignee_gstin: "27AABCT5678H1Z0",
  vehicle_number: "DL01AB1234",
  status: "in_transit"
}
```

---

## 🐛 Debugging Tips

### Check What Data You Have
```typescript
console.log("[v0] Shipment:", shipment);
console.log("[v0] Errors:", errors);
console.log("[v0] Loading:", loading);
```

### Test Calculations
```typescript
import { calculateShippingCharges } from '@/lib/logistics-utils';
const charges = calculateShippingCharges(150, 500, 'air');
console.log(charges); // See breakdown
```

### Validate Before Submit
```typescript
import { validateForm, validateEmail } from '@/lib/validation';
const errors = validateForm(data, { email: validateEmail });
console.log(errors); // See validation errors
```

---

## 🚨 Common Errors & Fixes

| Error | Solution |
|-------|----------|
| `useAuth() must be used within AuthProvider` | Wrap component in `<AuthProvider>` |
| `Cannot read property 'data' of undefined` | Check if API call completed |
| `Type 'x' is not assignable to type 'y'` | Check types in `/types/logistics.ts` |
| `Validation failed` | Check format matches `lib/validation.ts` |
| API 404 error | Check `NEXT_PUBLIC_API_BASE_URL` env var |

---

## 📖 Learning Path

1. **Start**: Read `/PROJECT_INDEX.md`
2. **Understand**: Check `/PLATFORM_ARCHITECTURE.md`
3. **Learn Enhancements**: See `/ENHANCEMENTS_AND_FIXES.md`
4. **Check Examples**: Review `/IMPROVEMENTS_SUMMARY.md`
5. **Build Features**: Create pages in `/app`
6. **Use Utilities**: Import from `/lib`

---

## 💬 Need Help?

| Topic | Reference |
|-------|-----------|
| API Integration | `/lib/api.ts` |
| Business Rules | `/lib/logistics-utils.ts` |
| Validation Rules | `/lib/validation.ts` |
| Format Examples | `/lib/format.ts` |
| Configuration | `/lib/constants.ts` |
| Project Structure | `/PROJECT_INDEX.md` |
| Improvements Made | `/IMPROVEMENTS_SUMMARY.md` |

---

**Version**: 2.0 (Enhanced)  
**Status**: ✅ Production Ready  
**Last Updated**: 2024

Happy coding! 🚀
