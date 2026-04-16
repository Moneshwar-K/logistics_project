# Logistics ERP Platform - Architecture Guide

## Overview
This is a comprehensive logistics platform inspired by DHL and Blue Dart, built with realistic workflows for shipment management, billing, tracking, and compliance.

## Core Features (Priority Order)

### 1. Billing & Invoice Generation
- Create invoices from shipments
- Support multiple billing types (Per Shipment, Consolidated, Monthly)
- Auto-calculate charges based on weight, distance, service type
- Generate PDF invoices
- Track payment status

### 2. E-Way Bill Management
- Integrate with Indian e-way bill system
- Auto-generate e-bills from shipments
- Track e-bill status and validity
- Compliance reporting

### 3. Real-Time Tracking
- Live shipment status updates
- Location tracking with timestamp
- Customer notifications
- Exception management

### 4. Shipment Management
- Create shipments (single/bulk)
- Edit shipment details
- Search and filter shipments
- Assign to drivers
- Track shipment lifecycle

## User Roles & Workflows

### Admin
- System configuration
- User management
- Rate management
- Branch management
- Analytics and reports

### Operations Manager
- Create shipments
- Assign to drivers
- Update status
- Exception handling
- POD verification

### Customer (Shipper/Consignee)
- Track shipments
- Generate billing reports
- Manage addresses
- Download invoices and documents

### Driver/Field Agent
- View assigned shipments
- Update delivery status
- Capture POD/signature
- Upload documents
- Report exceptions

### Finance
- View invoices
- Manage billing cycles
- Payment tracking
- Financial reports

## Core Data Models

### Shipment
- ID, HAWB, AWB
- Shipper/Consignee details
- Origin/Destination
- Weight, Dimensions, Contents
- Service Type (Domestic/International, Express/Standard)
- Status (Created → In Transit → Delivered/Exception)
- Charges breakdown
- Created/Updated timestamps

### Invoice
- ID, Invoice Number
- Shipments (linked)
- Billed Amount
- Tax details
- Payment Status
- Generated/Due dates

### E-Way Bill
- ID, E-Bill Number
- Linked Shipment
- Consignor/Consignee GST
- Total Value
- Status (Generated/Used/Expired)
- Validity period

### Tracking Event
- ID
- Shipment ID
- Status (Picked, In Transit, Delivered, Exception)
- Location
- Timestamp
- Notes

### POD (Proof of Delivery)
- ID
- Shipment ID
- Receiver name
- Signature/Photo
- Delivery timestamp
- Condition report

## API Integration Points

All API calls follow REST conventions:
- GET /shipments - List all
- POST /shipments - Create
- GET /shipments/{id} - Details
- PUT /shipments/{id} - Update
- POST /shipments/{id}/status - Update status
- POST /invoices - Generate
- POST /eway-bills - Generate
- GET /tracking/{hawb} - Real-time tracking

## Database Requirements

Core tables:
- users
- branches
- parties (shipper/consignee)
- shipments
- tracking_events
- invoices
- eway_bills
- pods
- documents
- charges

## Authentication & Authorization

- JWT-based auth
- Role-based access control (RBAC)
- Token stored in localStorage
- Automatic refresh on route change

## File Structure

```
/app
  /dashboard - Main dashboard
  /shipments - Shipment CRUD & list
  /tracking - Real-time tracking
  /billing/invoices - Invoice generation & list
  /billing/reports - Financial reports
  /eway-bills - E-way bill management
  /operations - Driver operations & POD
  /audit - System audit logs
  /documents - Document center
  /driver - Driver portal
  /users - User management
  /settings - Configuration
/components
  /layout - Sidebar, header, main layout
  /ui - Common UI components
  /features - Feature-specific components
  /providers - Auth & context providers
/lib
  /api.ts - API service layer
  /utils.ts - Utility functions
/types
  /logistics.ts - TypeScript definitions
/hooks
  /useAsync.ts - Async state management
```
