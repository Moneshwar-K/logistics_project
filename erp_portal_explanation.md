# Sri Caargo ERP Portal — Complete Explanation

## What Is This Project?

This is a **Logistics ERP (Enterprise Resource Planning) Portal** built for **Sri Caargo**, a courier/cargo/logistics company that handles **import-export shipments**. Think of it as the company's internal software that manages everything — from the moment a customer gives a parcel, to the moment it's delivered, to generating the invoice and collecting payment.

It has two parts:
- **Backend** (Node.js + Express + MongoDB) — runs on port `3001`, handles all data storage and business logic.
- **Frontend** (Next.js) — runs on port `3000`, the web interface used by staff and customers.

---

## How the Application Works — Start to End

```
Customer gives parcel → Staff creates a booking (HAWB) →
Shipment is processed → Documents uploaded → Status updated →
Delivered → POD collected → Invoice generated → Payment done
```

### Step-by-Step Flow

1. **Login** — Staff or customers log in via `/auth/login`. JWT tokens are issued and stored in `localStorage`. Every API call uses this token to authenticate.

2. **Dashboard** — After login, users land on `/dashboard` which shows live stats: active shipments, deliveries today, exceptions, pending audits, and revenue.

3. **Booking a Shipment** — Staff create a HAWB (House Air Waybill) booking. This is the "order" in the system.

4. **Operations** — The shipment goes through physical handling: it is received, consolidated into manifests, dispatched via DRS (Delivery Run Sheets), and finally delivered.

5. **POD (Proof of Delivery)** — Once delivered, the driver captures a signature/photo as proof.

6. **Billing** — After delivery (or sometimes before), the finance team generates an invoice and sends it to the client.

7. **Audit** — The HAWB audit checks that all charges are correct before invoicing.

---

## Role-Based Access

| Role | Access |
|------|--------|
| `admin` | Everything |
| `operations` | Shipments, Operations, Billing, Audit |
| `finance` | Billing, Reports |
| `driver` | Operations only |
| `customer` | My Shipments, Tracking only |

---

---

## 📁 MASTER (Admin Only)

> **Purpose:** Set up the foundational "lookup" data that all other modules depend on. Think of it as configuration.

### Clients
- **What:** A database of all your customers (companies/individuals who send parcels with you).
- **Why:** Every shipment needs a client tied to it. Rate cards, invoices, and reports are all linked to clients.
- **When used:** When onboarding a new customer. You add their name, address, contact, and GST info here.

### Branches
- **What:** Your company's office locations (e.g., Chennai HQ, Mumbai, Delhi).
- **Why:** Shipments are assigned to branches. Staff are linked to branches. Reports can be filtered by branch.
- **When used:** When you open a new office location or need to assign staff to a branch.

### Employees
- **What:** Internal staff records — name, designation, branch, department.
- **Why:** Used for assigning drivers, tracking who did what (audit trail), and user management.
- **When used:** When hiring a new employee or managing staff details.

### Service Types
- **What:** The types of delivery services you offer — e.g., Express, Standard, Air, Surface, Same Day.
- **Why:** Each shipment uses a service type which affects the rate/price calculation.
- **When used:** When launching a new service or adjusting the service catalog.

### Organization
- **What:** Your company's master profile — name, logo, GST number, address, bank details.
- **Why:** This info appears on invoices, PDFs, and other documents.
- **When used:** One-time setup or when company details change.

---

---

## 💰 BILLING (Admin, Finance, Operations)

> **Purpose:** Everything related to money — generating HAWBs, auditing charges, creating invoices, and duty bills.

### 1. HAWB Booking (`/billing/hawb-booking`)
- **What is HAWB?** House Air Waybill — it's the unique tracking number assigned to each shipment. Think of it like an "order ID" for a parcel.
- **Why:** Every shipment must have a HAWB. It contains the shipper, consignee, weight, dimensions, declared value, and service type.
- **When used:** When a customer brings in a package to be shipped. The staff member creates a HAWB booking which officially registers the shipment in the system.
- **Real-world analogy:** Like creating a bill/receipt at a courier counter.

### 2. HAWB Audit (`/billing/hawb-audit`)
- **What:** A review process where finance checks: Is the weight correct? Were the right charges applied? Is the service type accurate?
- **Why:** To catch errors before sending the invoice to the client. Prevents billing disputes.
- **When used:** After shipment is delivered and before generating the invoice. The auditor reviews each HAWB, approves or flags it.
- **Real-world analogy:** Like a manager double-checking a bill before sending it to the customer.

### 3. Invoice Generation (`/billing/invoice-generation`)
- **What:** Creates a formal tax invoice for the client combining one or many HAWBs.
- **Why:** The client needs an invoice to process payment. The invoice includes GST, service charges, fuel surcharges, etc.
- **When used:** After the audit is done and shipments are delivered. Finance selects the HAWBs and clicks "Generate Invoice".
- **Real-world analogy:** Like generating a monthly bill for a client consolidating all shipments.

### 4. Duty Bill Generation (`/billing/duty-generation`)
- **What:** A separate bill specifically for **customs duty** charges on import/export shipments.
- **Why:** For international shipments, customs duty is charged by the government and must be recovered from the client separately.
- **When used:** When an import/international shipment arrives and customs duty has been paid on behalf of the client.
- **Real-world analogy:** Like telling the client "We paid customs on your behalf, here's the amount you owe us."

### 5. Invoices (`/billing/invoices`)
- **What:** A list of all generated invoices — pending, paid, overdue.
- **Why:** Finance tracks payment status here.
- **When used:** Daily by finance team to follow up on pending payments, record payments received.

### 6. Rate Cards (`/billing/rates`)
- **What:** Pricing tables — how much to charge per kg, per zone, per service type, per client.
- **Why:** The system auto-calculates shipment charges based on these rates.
- **When used:** When you sign a new contract with a client at a special rate, or when you revise your standard pricing.

### 7. Rate Calculator (`/billing/rate-calculator`)
- **What:** A tool where staff can quickly estimate the cost of a shipment before booking.
- **Why:** Useful for giving clients a quote before committing.
- **When used:** When a customer calls and asks "How much will it cost to send X kg to Y city?"

### 8. Zone Tariff (`/billing/zone-tariff`)
- **What:** A matrix that defines freight rates based on origin-destination zones (e.g., Zone A to Zone B = ₹15/kg).
- **Why:** Different geographic regions have different rates. The zone tariff defines this.
- **When used:** Set up once; updated when rates change.

### 9. FSC Charge (`/billing/fsc-charge`)
- **What:** Fuel Surcharge. An additional charge added on top of the freight rate to cover fuel cost fluctuations.
- **Why:** Fuel prices change. Instead of changing the base rate every time, a separate FSC percentage is added.
- **When used:** Updated monthly or when fuel prices change significantly.

### 10. AWB Management (`/billing/awb`)
- **What:** Airways Bill management — the airline's master document for air freight shipments.
- **Why:** For air shipments, an AWB is issued by the airline. This module tracks AWB numbers allocated to your company.
- **When used:** When booking air freight. AWB numbers are pre-allocated in blocks and assigned one-by-one to shipments.

### 11. Billing Reports (`/billing/reports`)
- **What:** Financial reports — revenue by client, by branch, by service type, outstanding payments, etc.
- **Why:** Management needs visibility into the financial health of the business.
- **When used:** Weekly/monthly by management and finance.

### 12. E-Way Bills (`/eway-bills`)
- **What:** A government-mandated electronic document required for movement of goods worth over ₹50,000 within India (GST rule).
- **Why:** It's legally required for road transport of goods. Without it, the vehicle can be stopped by tax authorities.
- **When used:** Before dispatching a surface/road shipment above the value threshold.

### 13. Documents (`/documents`)
- **What:** A central repository for all shipment-related documents — invoices, delivery receipts, customs documents, PODs.
- **Why:** All documents should be in one place for easy retrieval during audits or dispute resolution.
- **When used:** Whenever a document needs to be uploaded or retrieved for a shipment.

---

---

## 🚚 OPERATIONS (Admin, Operations, Driver)

> **Purpose:** The physical handling of shipments — from pickup to delivery.

### 1. Shipments (`/shipments/list`)
- **What:** A list of all active and past shipments in the system.
- **Why:** The central view for the operations team to see what's in the system.
- **When used:** Throughout the day to monitor shipment status, search for specific HAWBs.

### 2. Create Booking (`/shipments/booking/manual`)
- **What:** Manually create a new shipment booking by filling in a form.
- **Why:** When a customer walks in or calls, staff create the booking here.
- **When used:** When accepting a new shipment. You fill shipper, consignee, weight, dimensions, service type, and generate the HAWB.

### 3. Status Update (`/operations/status-update`)
- **What:** Update where a shipment currently is in the delivery process.
- **Why:** Tracking depends on these updates. The customer can see "In Transit", "Out for Delivery", "Delivered", etc.
- **When used:** At every stage — when shipment is received at hub, in transit to destination, out for delivery.

### 4. Proof of Delivery (`/operations/pod`)
- **What:** Record of delivery confirmation — who signed, when, photo of signed receipt.
- **Why:** Legal proof that the shipment was delivered to the right person.
- **When used:** Once the driver delivers the parcel, they record the POD.

### 5. Upload Documents (`/operations/pod-upload`)
- **What:** Upload scanned copies of physical delivery receipts, POD photos.
- **Why:** Physical documents need to be digitized for records.
- **When used:** After delivery, when digitizing paper proofs.

### 6. Consolidate Report (`/operations/consolidate-report`)
- **What:** A summary report of all shipments processed in a time period at a branch level.
- **Why:** For operational planning — how many shipments were handled, what's pending, what was delivered.
- **When used:** Daily/weekly by operations managers.

### 7. POD List (`/pods/list`)
- **What:** All proof of delivery records across all shipments.
- **Why:** Finance/operations can verify deliveries when processing invoices.
- **When used:** When auditing deliveries or resolving "did we deliver this?" disputes.

### 8. Pickup Requests (`/operations/pickups`)
- **What:** Manage customer pickup requests — when a customer wants you to come and collect their parcel.
- **Why:** Instead of the customer dropping off, you send a pickup agent.
- **When used:** When a client raises a pickup request (on-demand or scheduled).

### 9. Floor Stock (`/operations/stock`)
- **What:** Inventory of shipments currently sitting in the warehouse/hub.
- **Why:** Track what's physically in the godown — received but not yet dispatched.
- **When used:** Daily by warehouse staff to know what needs to be dispatched next.

### 10. Manifests (`/operations/manifests`)
- **What:** A manifest is a consolidated list of shipments loaded onto one vehicle or flight for movement.
- **Why:** When you're moving 50 parcels together from Mumbai to Chennai, you create one manifest with all 50 HAWBs. This is the official document for that vehicle/consignment.
- **When used:** Before dispatching a batch of shipments to the next hub or destination.

### 11. Receiving (`/operations/receiving`)
- **What:** Acknowledge receipt of shipments arriving from another hub.
- **Why:** When a manifest arrives from another branch, the receiving branch must confirm what they got (and flag discrepancies).
- **When used:** When a truck/flight arrives with a batch of shipments at your hub.

### 12. Delivery Run Sheets (DRS) (`/operations/drs`)
- **What:** A DRS is the daily delivery plan for a driver — a list of shipments they must deliver today on a specific route.
- **Why:** Organizes the delivery workflow for field staff. Driver knows exactly what to deliver, in what order.
- **When used:** Every morning, the operations team creates DRS for each delivery staff member.

---

---

## 🔍 TRACKING

> **Purpose:** Visibility — where is my shipment right now?

### Tracking (`/tracking`)
- **What:** Internal tracking view — search by HAWB and see the full journey of a shipment.
- **When used:** By staff when a customer calls asking "Where is my parcel?"

### Public Tracking (`/tracking/quick`)
- **What:** A public-facing page where anyone can enter a HAWB number and see the status — no login required.
- **When used:** Shared with customers so they can track their own shipments.

### Customer Portal (`/tracking/customer`)
- **What:** A dedicated portal view for logged-in customers to see all their shipments and statuses.
- **When used:** When a corporate client logs in to monitor all their shipments at once.

### Booking (`/shipments/booking/manual`)
- **What:** Quick link to create a new shipment from within the tracking section.

---

---

## 🛡️ ADMIN (Admin Only)

> **Purpose:** System administration — user access, HAWB number control, system-wide notifications.

### HAWB Allocation (`/admin/hawb-allocation`)
- **What:** Pre-allocate a block of HAWB numbers (e.g., SC0001 to SC1000) so that booking staff can use them sequentially.
- **Why:** HAWB numbers must be unique and controlled. You can't let the system auto-generate random numbers — they need to be in your registered sequence.
- **When used:** When you run out of HAWB numbers or start a new series.

### Notifications (`/admin/notifications`)
- **What:** Send system-wide or targeted notifications to staff — alerts, announcements, updates.
- **When used:** When there's a system update, policy change, or operational alert.

### Order Enquiry (`/admin/order-enquiry`)
- **What:** Advanced search and enquiry tool for looking up any shipment with detailed filters.
- **When used:** When customer/management needs detailed historical data on any order.

### User Management (`/admin/users`)
- **What:** Create, edit, deactivate portal users — assign roles (admin, operations, finance, driver, customer).
- **Why:** Controls who has access to what in the system.
- **When used:** When onboarding a new staff member or revoking access for someone who left.

---

---

## 📊 REPORTS

> **Purpose:** Business intelligence — how is the company performing?

- **Shipment Reports** — Volume of shipments over time, by branch, by service type.
- **Billing Reports** — Revenue, outstanding invoices, collection rate.
- **Revenue Reports** — Total earnings breakdown.
- **Performance Reports** — On-time delivery rate, exceptions, SLA compliance.

**When used:** Weekly/monthly by management for strategic planning.

---

---

## 📝 AUDIT LOG

> **Purpose:** See every action taken in the system — who did what, when.

- **Why:** Security and accountability. If something goes wrong (wrong invoice, deleted shipment), you can trace it back.
- **When used:** By admin during investigation of discrepancies or compliance audits.

---

---

## 🔁 Summary: Typical Day in the Life

| Time | Who | Action |
|------|-----|--------|
| Morning | Operations | Create DRS for delivery agents |
| Morning | Warehouse | Receive incoming manifests from other hubs |
| Throughout day | Counter staff | Create HAWB bookings for walk-in customers |
| Throughout day | Operations | Update shipment statuses |
| Evening | Drivers | Submit PODs for delivered shipments |
| End of day | Operations | Create outgoing manifest, dispatch to next hub |
| Weekly | Finance | Run HAWB audit, generate invoices |
| Monthly | Management | Review reports |
| As needed | Admin | Add users, allocate HAWB numbers |

