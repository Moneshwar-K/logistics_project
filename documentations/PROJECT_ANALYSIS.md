# Logistics ERP Software - Project Analysis Report

## 1. Project Summary
This project is a comprehensive **Logistics and Enterprise Resource Planning (ERP) System**, featuring a full-stack architecture with a React-based frontend and a Node.js/Express backend. It is designed to manage day-to-day operations for a logistics or shipping company, handling everything from shipments and Air Waybills (AWBs) to invoicing, tracking, proof of delivery (PODs), and driver management.

## 2. Technology Stack

### Frontend (Client-side)
The frontend is a modern web application designed for a rich, interactive user experience:
- **Framework**: Next.js 16 (using the new `app` directory router).
- **UI Library**: React 19.
- **Styling**: Tailwind CSS for utility-first styling.
- **Component Library**: Radix UI (accessible, unstyled components customized via Tailwind).
- **Form Management**: React Hook Form combined with Zod for robust schema-based validation.
- **Icons**: Lucide React.
- **Architecture**: Organized into modular feature sections via the Next.js `app` folder (e.g., Auth, Dashboard, Shipments, Invoices, Admin, Master configuration).

### Backend (Server-side & API)
The backend provides a scalable RESTful API for the frontend clients:
- **Environment**: Node.js.
- **Framework**: Express.js.
- **Language**: TypeScript (providing strong type safety across the entire API).
- **Database**: MongoDB (NoSQL) accessed via the `Mongoose` ODM (Object Data Modeling) library.
- **Authentication**: JSON Web Tokens (JWT) for secure authentication and active sessions.
- **Password Security**: `bcryptjs` for secure password hashing.
- **Other Utilities**: PDF generation (`pdfkit`, `@react-pdf/renderer`) for generating invoices and waybills, `multer` for secure file uploads, and custom logging middleware.

## 3. Core Modules & Entities (What is there)

Based on the architecture map, the project is structured around the following core functional domains:

- **Shipments & HAWB Management**: Core data structures for tracking `Shipments`, `Pickups`, and House Air Waybills (`Awb`). Handles updates to complex routing flows.
- **Billing & Invoicing**: Contains dynamic rate logic (`Rate`, `RateSheet`), complex charge handling models (`Charge`), and automation for generating `Invoice` documents per client.
- **Delivery & Operations**: Modules for Delivery Run Sheets (`DeliveryRunSheet`), `DriverAssignment`, and recording precise Proof of Delivery (`POD`, `PODUpload`) actions in real-time.
- **E-way Bills & Manifests**: Handles compliance, logistics bundling, and border documentation via the `EWayBill` and `Manifest` models.
- **Master Data Configuration**: Allow administrators to configure reusable entities such as `Branch`, `ServiceType`, and `Party` (which represents Clients, Vendors, or Bill-To Contacts).
- **Users & Access Control**: Segregated entities for system administrators (`User`) and specific field/operational workers (`Employee`), structured to enforce role-based access.
- **Auditing & Tracking**: Dedicated `HAWBAudit` and `TrackingEvent` modules ensuring every status transition string is timestamped and documented for accountability and dashboard reporting.

## 4. How it Functions (Workflow)

1. **Master Configuration**: Administrators define the operational framework by configuring core rate sheets, available services, and branch hierarchies.
2. **Order Lifecycle**: Agents or customers create Pickup Requests. Upon verification, these mature into active Shipments/AWBs.
3. **Dispatch & Tracking**: Shipments are bundled into Manifests and assigned to drivers. Their movement triggers `TrackingEvent` updates, ensuring real-time visibility.
4. **Delivery Execution**: Delivery reps utilize the system features for Run Sheets (DRS) to coordinate daily routes, marking shipments as delivered and attaching uploaded proofs (PODs).
5. **Billing Automation**: Once milestones are met, the billing engine scans the applicable `RateSheet` and triggers rule-based calculators to compile a final `Invoice`.
6. **Reporting**: The `audit` and `dashboard` modules synthesize tracking, revenue, and delivery performance metrics into real-time visual reports on the frontend.

## 5. Current System Status
- **Backend & Database**: Fully operational. The application has successfully connected to the resumed MongoDB Atlas cluster and the API is actively listening on port 3001.
- **Frontend**: The Next.js development server is running smoothly in the background on port 3000 and is actively connected to the backend.
