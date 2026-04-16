# 🚀 LogisticHub ERP — Complete Sample Data & Testing Guide
> **For Presentation to Ma'am** | Step-by-step walkthrough to verify all modules

---

## ✅ PRE-CHECK — Before You Start

Make sure both servers are running:
- **Backend**: `http://localhost:3001` (npm run dev in `/backend`)
- **Frontend**: `http://localhost:3000` (npm run dev in `/frontend`)

Open your browser → Go to → **http://localhost:3000**

---

## 🔐 STEP 1 — LOGIN AS ADMIN

Go to: `http://localhost:3000/auth/login`

Use these credentials:

| Field    | Value                        |
|----------|------------------------------|
| Email    | `admin@sricaargo.com`        |
| Password | `Admin@123`                  |

> If login fails, use the credentials you created during initial setup. If you forgot, see Step 1B below.

### Step 1B — Reset / Create Admin (if needed)
Open a new terminal in `e:\erp-portal-v2\backend` and run:

```bash
npx ts-node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const bcrypt = require('bcryptjs');
  const User = require('./src/models/User').default;
  const hash = await bcrypt.hash('Admin@123', 10);
  await User.findOneAndUpdate(
    { role: 'admin' },
    { password: hash },
    { new: true }
  );
  console.log('Password reset to Admin@123');
  process.exit(0);
});
"
```

---

## 🏢 STEP 2 — MASTER DATA SETUP

> Navigate to **Master** in the sidebar. Enter the following data in this exact order.

---

### 2A — Organization Info (Master → Organization)

Go to: `http://localhost:3000/master/organization`

| Field            | Value                        |
|------------------|------------------------------|
| Company Name     | Sri Caargo Logistics Pvt Ltd |
| GST Number       | 33AACCS1234A1Z5              |
| PAN Number       | AACCS1234A                   |
| Phone            | 9876543210                   |
| Email            | info@sricaargo.com           |
| Address          | 45, Anna Salai, Chennai       |
| City             | Chennai                      |
| State            | Tamil Nadu                   |
| Pincode          | 600002                       |

Click **Save / Update** ✅

---

### 2B — Branches (Master → Branches)

Go to: `http://localhost:3000/master/branches`

Click **Add Branch** and create these **3 branches**:

#### Branch 1 — Head Office
| Field         | Value                   |
|---------------|-------------------------|
| Branch Name   | Chennai HQ              |
| Branch Code   | CHN-HQ                  |
| City          | Chennai                 |
| State         | Tamil Nadu              |
| Phone         | 9876543210              |
| Email         | chennai@sricaargo.com   |
| Address       | 45, Anna Salai, Chennai |
| Pincode       | 600002                  |
| Is Active     | ✅ Yes                  |

#### Branch 2 — Mumbai
| Field         | Value                     |
|---------------|---------------------------|
| Branch Name   | Mumbai Branch             |
| Branch Code   | MUM-BR                    |
| City          | Mumbai                    |
| State         | Maharashtra               |
| Phone         | 9123456780                |
| Email         | mumbai@sricaargo.com      |
| Address       | 12, BKC, Bandra East      |
| Pincode       | 400051                    |
| Is Active     | ✅ Yes                    |

#### Branch 3 — Delhi
| Field         | Value                 |
|---------------|-----------------------|
| Branch Name   | Delhi Branch          |
| Branch Code   | DEL-BR                |
| City          | New Delhi             |
| State         | Delhi                 |
| Phone         | 9988776655            |
| Email         | delhi@sricaargo.com   |
| Address       | 8, Connaught Place    |
| Pincode       | 110001                |
| Is Active     | ✅ Yes                |

---

### 2C — Service Types (Master → Service Types)

Go to: `http://localhost:3000/master/service-types`

Add these **4 service types**:

| Service Name        | Code  | Description                       | Is Active |
|---------------------|-------|-----------------------------------|-----------|
| Domestic Air        | DA    | Air freight within India          | ✅        |
| International Air   | IA    | Air freight internationally       | ✅        |
| Express Delivery    | EXP   | Priority same-day delivery        | ✅        |
| Surface Transport   | SUR   | Road transport domestic           | ✅        |

---

### 2D — Clients (Master → Clients)

Go to: `http://localhost:3000/master/clients`

Add these **3 clients**:

#### Client 1
| Field          | Value                            |
|----------------|----------------------------------|
| Company Name   | Infosys Limited                  |
| Contact Person | Ramesh Kumar                     |
| Email          | ramesh@infosys.com               |
| Phone          | 9800001111                       |
| GST No         | 29AABCI1234A1Z5                  |
| Address        | Electronics City, Bangalore      |
| City           | Bangalore                        |
| State          | Karnataka                        |
| Pincode        | 560100                           |
| Credit Limit   | 500000                           |

#### Client 2
| Field          | Value                            |
|----------------|----------------------------------|
| Company Name   | Tata Consultancy Services        |
| Contact Person | Priya Nair                       |
| Email          | priya@tcs.com                    |
| Phone          | 9900002222                       |
| GST No         | 27AABCT5432B1Z2                  |
| Address        | Powai, Mumbai                    |
| City           | Mumbai                           |
| State          | Maharashtra                      |
| Pincode        | 400076                           |
| Credit Limit   | 750000                           |

#### Client 3
| Field          | Value                            |
|----------------|----------------------------------|
| Company Name   | Wipro Technologies               |
| Contact Person | Suresh Babu                      |
| Email          | suresh@wipro.com                 |
| Phone          | 9700003333                       |
| GST No         | 29AAACW1234B1Z3                  |
| Address        | Sarjapur Road, Bangalore         |
| City           | Bangalore                        |
| State          | Karnataka                        |
| Pincode        | 560035                           |
| Credit Limit   | 300000                           |

---

### 2E — Employees (Master → Employees)

Go to: `http://localhost:3000/master/employees`

Add these **3 employees**:

#### Employee 1 — Operations Staff
| Field          | Value              |
|----------------|--------------------|
| Name           | Karthik Selvan     |
| Employee ID    | EMP001             |
| Department     | Operations         |
| Designation    | Operations Manager |
| Email          | karthik@sricaargo.com |
| Phone          | 9600001234         |
| Branch         | Chennai HQ         |
| Date of Join   | 2023-01-15         |

#### Employee 2 — Billing Staff
| Field          | Value              |
|----------------|--------------------|
| Name           | Meena Devi         |
| Employee ID    | EMP002             |
| Department     | Billing            |
| Designation    | Billing Executive  |
| Email          | meena@sricaargo.com |
| Phone          | 9500005678         |
| Branch         | Chennai HQ         |
| Date of Join   | 2023-03-20         |

#### Employee 3 — Sales
| Field          | Value            |
|----------------|------------------|
| Name           | Arjun Patel      |
| Employee ID    | EMP003           |
| Department     | Sales            |
| Designation    | Sales Executive  |
| Email          | arjun@sricaargo.com |
| Phone          | 9400009012       |
| Branch         | Mumbai Branch    |
| Date of Join   | 2024-01-10       |

---

## 📦 STEP 3 — OPERATIONS MODULE

> Navigate to **Operations** in the sidebar.

---

### 3A — Create a Pickup (Operations → Pickups)

Go to: `http://localhost:3000/operations/pickups`

| Field            | Value                     |
|------------------|---------------------------|
| Client           | Infosys Limited           |
| Pickup Address   | Electronics City, Bangalore |
| Contact Person   | Ramesh Kumar              |
| Contact Phone    | 9800001111                |
| Pickup Date      | Tomorrow's date           |
| No. of Packages  | 5                         |
| Approx Weight    | 25 kg                     |
| Notes            | Handle with care          |

Click **Schedule Pickup** ✅

---

### 3B — HAWB Booking / Create Shipment

Go to: `http://localhost:3000/billing/hawb-booking` OR `http://localhost:3000/shipments`

Click **New Shipment / Book HAWB** and fill:

#### Shipment 1 — Domestic Air
| Field             | Value                          |
|-------------------|--------------------------------|
| HAWB Number       | SC2604130001 (auto or manual)  |
| Shipper Name      | Infosys Limited                |
| Shipper Phone     | 9800001111                     |
| Shipper Address   | Electronics City, Bangalore    |
| Receiver Name     | Tata Consultancy Services      |
| Receiver Phone    | 9900002222                     |
| Receiver Address  | Powai, Mumbai                  |
| Origin            | Bangalore                      |
| Destination       | Mumbai                         |
| Service Type      | Domestic Air                   |
| No. of Pieces     | 3                              |
| Actual Weight     | 12.5 kg                        |
| Volumetric Weight | 8.0 kg                         |
| Chargeable Weight | 12.5 kg                        |
| Content           | Electronic Components          |
| Value             | 45000                          |
| Branch            | Chennai HQ                     |

Click **Save / Book** ✅ — Note the HAWB number generated.

#### Shipment 2 — Express Delivery
| Field             | Value                          |
|-------------------|--------------------------------|
| Shipper Name      | Wipro Technologies             |
| Shipper Phone     | 9700003333                     |
| Shipper Address   | Sarjapur Road, Bangalore       |
| Receiver Name     | Tech Mahindra                  |
| Receiver Phone    | 9600004444                     |
| Receiver Address  | Sector 62, Noida               |
| Origin            | Bangalore                      |
| Destination       | Delhi                          |
| Service Type      | Express Delivery               |
| No. of Pieces     | 1                              |
| Actual Weight     | 3.0 kg                         |
| Chargeable Weight | 3.0 kg                         |
| Content           | Legal Documents                |
| Value             | 5000                           |
| Branch            | Chennai HQ                     |

Click **Save / Book** ✅

#### Shipment 3 — International Air
| Field             | Value                          |
|-------------------|--------------------------------|
| Shipper Name      | Tata Consultancy Services      |
| Shipper Phone     | 9900002222                     |
| Shipper Address   | Powai, Mumbai                  |
| Receiver Name     | Global Tech Inc                |
| Receiver Phone    | +14155550100                   |
| Receiver Address  | 100 Market St, San Francisco   |
| Origin            | Mumbai                         |
| Destination       | San Francisco, USA             |
| Service Type      | International Air              |
| No. of Pieces     | 2                              |
| Actual Weight     | 8.0 kg                         |
| Chargeable Weight | 8.0 kg                         |
| Content           | Software CDs / IT Equipment    |
| Value             | 120000                         |
| Branch            | Mumbai Branch                  |

Click **Save / Book** ✅

---

### 3C — HAWB Audit (Billing → HAWB Audit)

Go to: `http://localhost:3000/billing/hawb-audit`

- Search for the HAWB you just created (e.g., `SC2604130001`)
- Verify all details are correct
- Change status to **Audited / Verified** ✅
- Click **Save Audit**

---

### 3D — Create Manifest (Operations → Manifests)

Go to: `http://localhost:3000/operations/manifests`

| Field           | Value              |
|-----------------|--------------------|
| Manifest No     | MNF-CHN-001        |
| Origin Branch   | Chennai HQ         |
| Destination     | Mumbai Branch      |
| Date            | Today's date       |
| Flight/Vehicle  | Flight No: 6E-3421 |
| Add Shipments   | Select Shipment 1 & 2 from list |

Click **Create Manifest** ✅

---

### 3E — DRS (Delivery Run Sheet) (Operations → DRS)

Go to: `http://localhost:3000/operations/drs`

| Field         | Value           |
|---------------|-----------------|
| DRS Number    | DRS-MUM-001     |
| Branch        | Mumbai Branch   |
| Driver Name   | Ravi Kumar      |
| Vehicle No    | MH-12-AB-1234   |
| Date          | Today           |
| Shipments     | Add Shipment 1  |

Click **Create DRS** ✅

---

### 3F — POD Upload (Operations → POD Upload)

Go to: `http://localhost:3000/operations/pod-upload`

- Search for Shipment 1 (HAWB No.)
- Select **Delivered** as status
- Enter: Received by — **Priya Nair**
- Date: Today
- Upload any PDF or image as POD document (use any dummy file from your PC)

Click **Submit POD** ✅

---

### 3G — Status Update (Operations → Status Update)

Go to: `http://localhost:3000/operations/status-update`

- Search HAWB of Shipment 2
- Set status: **In Transit**
- Location: **Bangalore Hub**
- Remarks: Shipment dispatched via Air

Click **Update** ✅

---

## 💰 STEP 4 — BILLING MODULE

> Navigate to **Billing** in the sidebar.

---

### 4A — Rate Setup (Billing → Rates)

Go to: `http://localhost:3000/billing/rates`

Add a rate entry:

| Field            | Value            |
|------------------|------------------|
| Service Type     | Domestic Air     |
| Origin Zone      | South            |
| Destination Zone | West             |
| Min Weight (kg)  | 0.5              |
| Rate per kg      | 85               |
| Min Charge       | 250              |

Click **Save Rate** ✅

---

### 4B — Invoice Generation (Billing → Invoice Generation)

Go to: `http://localhost:3000/billing/invoice-generation`

| Field         | Value               |
|---------------|---------------------|
| Client        | Infosys Limited     |
| From Date     | Start of this month |
| To Date       | Today               |
| Branch        | Chennai HQ          |

Click **Fetch Shipments** → All booked shipments for Infosys will appear.

Select **Shipment 1** → Click **Generate Invoice** ✅

Note down the Invoice Number (e.g., `INV-2604-001`)

---

### 4C — Duty Bill Generation (Billing → Duty Generation)

Go to: `http://localhost:3000/billing/duty-generation`

For the international shipment (Shipment 3):

| Field             | Value           |
|-------------------|-----------------|
| HAWB Number       | (Shipment 3 HAWB) |
| Custom Value      | 120000          |
| Duty %            | 18              |
| Duty Amount       | 21600           |
| Handling Charges  | 500             |

Click **Generate Duty Bill** ✅

---

### 4D — Rate Calculator (Billing → Rate Calculator)

Go to: `http://localhost:3000/billing/rate-calculator`

| Field       | Value         |
|-------------|---------------|
| Origin      | Bangalore     |
| Destination | Mumbai        |
| Weight      | 12.5          |
| Service     | Domestic Air  |

Click **Calculate** — Should show the rate breakdown ✅

---

## 📍 STEP 5 — TRACKING

Go to: `http://localhost:3000/tracking`

Enter the HAWB number of **Shipment 2** → Click **Track**

Should show the status timeline:
- ✅ Booked
- ✅ In Transit (Bangalore Hub)

---

## 📊 STEP 6 — DASHBOARD & REPORTS

Go to: `http://localhost:3000/dashboard`

You should see:
- Total Shipments count ✅
- Revenue summary ✅
- Recent activity ✅

Go to: `http://localhost:3000/reports`

Run a **Shipment Report**:
| Field     | Value               |
|-----------|---------------------|
| From Date | Start of this month |
| To Date   | Today               |
| Branch    | Chennai HQ          |

Click **Generate Report** ✅

---

## 👤 STEP 7 — ADMIN MODULE

### 7A — User Management (Admin → Users)

Go to: `http://localhost:3000/users`

Create a new user:

| Field    | Value                      |
|----------|----------------------------|
| Name     | Karthik Selvan             |
| Email    | karthik@sricaargo.com      |
| Role     | operations                 |
| Branch   | Chennai HQ                 |
| Password | Karthik@123                |

Click **Create User** ✅

---

### 7B — Audit Logs (Admin → Audit)

Go to: `http://localhost:3000/audit`

- All actions you performed will be listed here
- Shows who did what and when ✅

---

## 🤖 STEP 8 — AI CHATBOT (Caargo Chatbot)

Look for the **chat icon** (bottom right corner) on any page.

Click it and type:
- `"What is the status of my shipment SC2604130001?"`
- `"Show me billing summary for this month"`
- `"How do I create a new shipment?"`

The AI chatbot should respond intelligently ✅

---

## 📋 PRESENTATION CHECKLIST

Use this checklist during your demo:

| Module         | Feature                  | Status |
|----------------|--------------------------|--------|
| Login          | Admin login              | ☐      |
| Master         | Organization info        | ☐      |
| Master         | Branches (3 created)     | ☐      |
| Master         | Service types (4 created)| ☐      |
| Master         | Clients (3 created)      | ☐      |
| Master         | Employees (3 created)    | ☐      |
| Operations     | Pickup scheduled         | ☐      |
| Operations     | HAWB Booking (3 AWBs)    | ☐      |
| Billing        | HAWB Audit done          | ☐      |
| Operations     | Manifest created         | ☐      |
| Operations     | DRS created              | ☐      |
| Operations     | POD uploaded             | ☐      |
| Operations     | Status updated           | ☐      |
| Billing        | Rate added               | ☐      |
| Billing        | Invoice generated        | ☐      |
| Billing        | Duty bill generated      | ☐      |
| Billing        | Rate calculator tested   | ☐      |
| Tracking       | Shipment tracked         | ☐      |
| Dashboard      | Stats visible            | ☐      |
| Reports        | Report generated         | ☐      |
| Admin          | User created             | ☐      |
| Admin          | Audit logs visible       | ☐      |
| Chatbot        | AI responds              | ☐      |

---

## ⚠️ COMMON ISSUES & FIXES

| Problem                          | Fix                                                          |
|----------------------------------|--------------------------------------------------------------|
| "Valid Branch ID required"       | Make sure you selected a Branch when creating shipment       |
| Login fails                      | Check credentials or reset password (Step 1B)               |
| No data showing in lists         | Refresh page, check if backend is running on port 3001       |
| Invoice not generating           | Make sure shipment status is "Audited" before generating     |
| Rate calculator shows ₹0         | Add a rate entry first in Billing → Rates                    |
| Chatbot not responding           | Check GOOGLE_API_KEY in backend/.env                         |
| POD upload fails                 | Check UPLOAD_DIR in backend/.env is writable                 |

---

## 🎯 DEMO FLOW (Recommended order for Ma'am)

1. **Login** → Show dashboard
2. **Master** → Show org, branches, clients
3. **Operations** → Create a shipment live (Shipment 1)
4. **Billing** → Audit the HAWB → Generate Invoice
5. **Tracking** → Track the shipment
6. **Reports** → Show report
7. **Admin** → Show audit logs
8. **Chatbot** → Ask about shipment

> **Total demo time: ~10-15 minutes**
