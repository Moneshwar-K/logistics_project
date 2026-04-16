# Backend Implementation Guide

This document provides a guide for implementing the remaining backend controllers and services.

## Current Status

✅ **Completed:**
- Project structure and configuration
- Database migrations
- Authentication system (login, signup, JWT)
- Shipment service and controller (basic CRUD)
- Middleware (auth, error handling, rate limiting, file upload)
- Route definitions for all modules

⏳ **To Be Implemented:**
- Remaining controllers (tracking, operations, POD, invoices, e-way bills, documents, audit, driver, users, branches, reports)
- Remaining services (business logic for all modules)
- Validators (Zod schemas for input validation)
- Utility functions (HAWB generation, charge calculation, etc.)

## Implementation Pattern

Each module follows this pattern:

### 1. Controller (`src/controllers/[module]Controller.ts`)
- Handles HTTP requests/responses
- Validates input (using validators)
- Calls service layer
- Returns formatted responses

### 2. Service (`src/services/[module]Service.ts`)
- Contains business logic
- Interacts with database
- Validates business rules
- Handles errors

### 3. Validator (`src/validators/[module]Validator.ts`)
- Zod schemas for input validation
- Type-safe validation

## Next Steps

### Priority 1: Core Controllers & Services

1. **Tracking Controller & Service**
   - `getTrackingDetails(shipmentId)`
   - `createTrackingEvent(shipmentId, eventData)`
   - `getTrackingHistory(shipmentId)`
   - `quickTracking(hawb)`

2. **Operations Controller & Service**
   - `updateStatus(shipmentId, statusData)`
   - `getHistory(shipmentId)`
   - Validate status transitions

3. **POD Controller & Service**
   - `createPOD(shipmentId, podData)`
   - `getPOD(shipmentId)`
   - `uploadPODFiles(shipmentId, files)`
   - Handle signature uploads

4. **Invoice Controller & Service**
   - `generateInvoice(shipmentId)`
   - `createInvoice(invoiceData)`
   - `listInvoices(filters)`
   - `recordPayment(invoiceId, paymentData)`
   - Calculate charges automatically

### Priority 2: Supporting Modules

5. **E-Way Bill Controller & Service**
   - `createEWayBill(shipmentId, ewayBillData)`
   - `listEWayBills(filters)`
   - `cancelEWayBill(ewayBillId, reason)`
   - Validate GSTIN format

6. **Document Controller & Service**
   - `uploadDocument(shipmentId, file, documentType)`
   - `getShipmentDocuments(shipmentId)`
   - `downloadDocument(documentId)`
   - Handle file storage

7. **Audit Controller & Service**
   - `getDashboard()`
   - `createAudit(hawb, auditData)`
   - `listHAWBAudits(filters)`
   - Calculate discrepancies

8. **Driver Controller & Service**
   - `assignShipment(shipmentId, driverId)`
   - `listAssignments(filters)`
   - `updateStatus(assignmentId, status, location)`
   - `completeAssignment(assignmentId)`

### Priority 3: Management & Reports

9. **User Controller & Service**
   - `listUsers(filters)`
   - `createUser(userData)`
   - `updateUser(userId, userData)`
   - Role-based access

10. **Branch Controller & Service**
    - `listBranches()`
    - `createBranch(branchData)`
    - `updateBranch(branchId, branchData)`

11. **Report Controller & Service**
    - `getDashboard()`
    - `getShipmentReports(filters)`
    - `getBillingReports(filters)`
    - `getRevenueReports(filters)`
    - Aggregate data from multiple tables

## Example Implementation

Here's an example of how to implement a controller and service:

### Controller Example

```typescript
// src/controllers/trackingController.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { trackingService } from '../services/trackingService';

export const trackingController = {
  async getTrackingDetails(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const tracking = await trackingService.getTrackingDetails(shipmentId);

      res.json({
        success: true,
        data: tracking,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
  // ... other methods
};
```

### Service Example

```typescript
// src/services/trackingService.ts
import { db } from '../config/database';
import { createError } from '../middleware/errorHandler';

export const trackingService = {
  async getTrackingDetails(shipmentId: string) {
    // Get shipment
    const shipment = await db('shipments').where({ id: shipmentId }).first();
    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Get tracking events
    const events = await db('tracking_events')
      .where({ shipment_id: shipmentId })
      .orderBy('timestamp', 'desc');

    // Get current status
    const currentStatus = events[0] || null;

    // Get documents
    const documents = await db('documents')
      .where({ shipment_id: shipmentId });

    return {
      shipment,
      current_status: currentStatus,
      tracking_history: events,
      documents,
      transit_summary: {
        total_cartons: shipment.total_cartons,
        total_weight: shipment.total_weight,
        first_scan_date: events[events.length - 1]?.timestamp,
        last_scan_date: events[0]?.timestamp,
      },
    };
  },
  // ... other methods
};
```

## Testing

After implementing each module:

1. Test with Postman/Thunder Client
2. Verify database operations
3. Test error cases
4. Test authorization
5. Test validation

## Database Queries

Use Knex.js query builder:

```typescript
// Simple query
const user = await db('users').where({ id: userId }).first();

// Join query
const shipment = await db('shipments')
  .leftJoin('parties as shipper', 'shipments.shipper_id', 'shipper.id')
  .select('shipments.*', 'shipper.*')
  .where('shipments.id', shipmentId)
  .first();

// Insert with returning
const [newRecord] = await db('table')
  .insert(data)
  .returning('*');

// Update
await db('table')
  .where({ id })
  .update({ field: value });
```

## Error Handling

Always use `createError` for consistent error responses:

```typescript
import { createError } from '../middleware/errorHandler';

if (!resource) {
  throw createError('Resource not found', 404);
}
```

## File Uploads

Files are handled by multer middleware:

```typescript
// In route
router.post('/upload', upload.single('file'), controller.upload);

// In controller
const file = req.file;
const fileUrl = `/uploads/${file.filename}`;
```

## Status Transitions

Use the status transition validation from `shipmentService.ts`:

```typescript
if (!isValidStatusTransition(currentStatus, newStatus)) {
  throw createError('Invalid status transition', 400);
}
```

## Charge Calculation

Implement charge calculation logic:

```typescript
function calculateCharges(weight, distance, serviceType, taxPercentage) {
  const baseCharge = { air: 500, sea: 300, road: 200 }[serviceType];
  const weightCharge = weight * 50;
  const distanceCharge = Math.ceil(distance / 100) * 100;
  const serviceCharge = (baseCharge + weightCharge + distanceCharge) * 0.1;
  const subtotal = baseCharge + weightCharge + distanceCharge + serviceCharge;
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax;
  return { baseCharge, weightCharge, distanceCharge, serviceCharge, subtotal, tax, total };
}
```

## Next Actions

1. Start with Tracking module (simplest)
2. Then Operations (uses tracking)
3. Then POD (uses operations)
4. Then Invoices (uses shipments)
5. Continue with remaining modules

Each module should be fully tested before moving to the next.

