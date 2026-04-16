# Logistics ERP Backend API Documentation

Base URL: `http://localhost:3001/api`

All protected endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### POST /auth/login
Login user and get JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "branch_id": "uuid",
      "status": "active"
    },
    "token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/signup
Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "branch_id": "uuid",
  "role": "customer"
}
```

### GET /auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

---

## Shipments

### GET /shipments
List all shipments with filters.

**Query Parameters:**
- `status` - Filter by status
- `hawb` - Search by HAWB
- `origin_city` - Filter by origin
- `destination_city` - Filter by destination
- `date_from` - Start date
- `date_to` - End date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "hawb": "HAW2024000001",
      "shipper": { ... },
      "consignee": { ... },
      "status": "in_transit",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "total_pages": 2
  }
}
```

### GET /shipments/:id
Get shipment by ID.

### GET /shipments/hawb/:hawb
Get shipment by HAWB.

### POST /shipments
Create new shipment.

**Request:**
```json
{
  "shipper": {
    "name": "Shipper Name",
    "email": "shipper@example.com",
    "phone": "+1234567890",
    "address": "123 Street",
    "city": "City",
    "country": "Country"
  },
  "consignee": { ... },
  "origin_city": "Origin",
  "origin_country": "Country",
  "destination_city": "Destination",
  "destination_country": "Country",
  "service_type": "air",
  "shipment_type": "parcel",
  "total_cartons": 5,
  "total_weight": 10.5,
  "invoice_value": 1000,
  "invoice_currency": "INR",
  "mode": "air"
}
```

### PATCH /shipments/:id
Update shipment.

### DELETE /shipments/:id
Delete shipment (admin only).

---

## Tracking

### GET /tracking/quick
Public tracking by HAWB/AWB/reference number.

**Query Parameters:**
- `hawb` - HAWB number
- `awb` - AWB number
- `reference_number` - Reference number

### GET /tracking/:shipmentId
Get tracking details for shipment.

**Response:**
```json
{
  "success": true,
  "data": {
    "shipment": { ... },
    "current_status": { ... },
    "tracking_history": [ ... ],
    "documents": [ ... ],
    "transit_summary": {
      "total_cartons": 5,
      "total_weight": 10.5,
      "first_scan_date": "2024-01-01T00:00:00.000Z",
      "last_scan_date": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

### POST /tracking/:shipmentId/events
Create tracking event.

---

## Operations

### POST /operations/status-update
Update shipment status.

**Request:**
```json
{
  "hawb": "HAW2024000001",
  "new_status": "in_transit",
  "update_date": "2024-01-01",
  "remarks": "Status update remarks"
}
```

### GET /operations/history/:shipmentId
Get operation history for shipment.

---

## POD (Proof of Delivery)

### POST /pod
Create POD.

**Request:**
```json
{
  "shipment_id": "uuid",
  "receiver_name": "Receiver Name",
  "receiver_contact": "+1234567890",
  "receiver_address": "Address",
  "delivery_date": "2024-01-01",
  "delivery_time": "14:30",
  "acceptance_checklist": {
    "package_intact": true,
    "seals_intact": true,
    "no_damage": true,
    "weight_verified": true,
    "cartons_verified": true
  },
  "signature_url": "base64_encoded_signature",
  "remarks": "Optional remarks"
}
```

### GET /pod/:shipmentId
Get POD for shipment.

### POST /pod/upload/:shipmentId
Upload POD files (multipart/form-data).

**Files:**
- `pod_file` - POD document
- `signature_file` - Signature image
- `kyc_front` - KYC front
- `kyc_back` - KYC back

---

## Invoices

### GET /invoices
List invoices.

**Query Parameters:**
- `status` - Payment status
- `page` - Page number
- `limit` - Items per page

### POST /invoices/generate
Generate invoice from shipment.

**Request:**
```json
{
  "shipment_id": "uuid",
  "tax_percentage": 18
}
```

### POST /invoices
Create invoice manually.

### GET /invoices/:id
Get invoice by ID.

### POST /invoices/:id/payment
Record payment.

**Request:**
```json
{
  "payment_date": "2024-01-01",
  "payment_method": "bank_transfer",
  "amount": 1000
}
```

### GET /invoices/:id/pdf
Download invoice PDF.

---

## E-Way Bills

### GET /eway-bills
List e-way bills.

### POST /eway-bills
Create e-way bill.

**Request:**
```json
{
  "shipment_id": "uuid",
  "consignor_gstin": "27AABCT1234H1Z0",
  "consignee_gstin": "27AABCT1234H1Z0",
  "vehicle_number": "DL01AB1234",
  "valid_till_days": 1
}
```

### GET /eway-bills/:id
Get e-way bill.

### POST /eway-bills/:id/cancel
Cancel e-way bill.

**Request:**
```json
{
  "reason": "Cancellation reason"
}
```

---

## Documents

### GET /documents/:shipmentId
Get documents for shipment.

### POST /documents/:shipmentId
Upload document (multipart/form-data).

**Form Data:**
- `file` - Document file
- `document_type` - Type of document

### GET /documents/:id/download
Download document.

### DELETE /documents/:id
Delete document (admin only).

---

## Audit

### GET /audit/dashboard
Get audit dashboard KPIs.

### GET /audit/hawbs
List HAWB audits.

### POST /audit/hawbs/:hawb
Create audit.

### GET /audit/hawbs/:hawb
Get audit by HAWB.

---

## Driver Assignments

### GET /driver-assignments
List assignments.

### GET /driver-assignments/driver/:driverId
Get assignments for driver.

### POST /driver-assignments
Assign shipment to driver.

**Request:**
```json
{
  "shipment_id": "uuid",
  "driver_id": "uuid"
}
```

### PATCH /driver-assignments/:id/status
Update assignment status.

**Request:**
```json
{
  "status": "in_progress",
  "location": "Current Location"
}
```

---

## Users

### GET /users
List users (admin only).

### POST /users
Create user (admin only).

### GET /users/:id
Get user.

### PATCH /users/:id
Update user (admin only).

### DELETE /users/:id
Delete user (admin only).

---

## Branches

### GET /branches
List branches.

### GET /branches/:id
Get branch.

### POST /branches
Create branch (admin only).

### PATCH /branches/:id
Update branch (admin only).

---

## Reports

### GET /reports/dashboard
Get dashboard KPIs.

### GET /reports/shipments
Get shipment reports.

### GET /reports/billing
Get billing reports.

### GET /reports/revenue
Get revenue reports.

### GET /reports/performance
Get performance reports.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

---

## File Uploads

- Max file size: 10MB
- Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX
- Files stored in `uploads/` directory

---

## Notes

- All dates are in ISO 8601 format
- All monetary values are in decimal format
- Pagination defaults: page=1, limit=50
- All timestamps are in UTC

