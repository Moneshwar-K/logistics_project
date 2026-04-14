// Sri Caargo Logistics ERP - Company Configuration

export const COMPANY_CONFIG = {
  // Company Information (from POD sample)
  name: 'SRI CAARGO',
  fullName: 'Sri Caargo Logistics',
  tagline: 'International Freight Forwarding & Logistics',
  
  // Contact Details
  address: {
    line1: 'T/9 Covalam Muthu Street',
    line2: 'Periamet CH-3',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600003',
    country: 'India'
  },
  
  // Tax & Registration
  gstin: '33DNGPK7947J1ZJ',
  pan: 'DNGPK7947J',
  
  // Contact Information
  email: 'sricaargo@gmail.com',
  phone: '+91 7338965037',
  alternatePhone: '+91 7338965039',
  customerCare: '+91 8838186638',
  website: 'www.sricaargo.in',
  
  // Proprietor
  proprietor: {
    name: '9840225030',
    code: '8838710511'
  },
  
  // Branding Colors (from POD sample - maroon/red theme)
  theme: {
    primary: '#8B1538',      // Deep maroon/burgundy
    secondary: '#A52A2A',    // Brown
    accent: '#DC143C',       // Crimson red
    text: '#FFFFFF',         // White text on dark backgrounds
    background: '#FFFFFF',   // White background
    border: '#8B1538',       // Maroon borders
  },
  
  // Document Prefixes
  prefixes: {
    hawb: 'HAW',
    invoice: 'INV',
    pod: 'POD',
    ewayBill: 'EWAY'
  },
  
  // Banking Details (placeholder - update with actual details)
  bank: {
    name: '',
    accountNumber: '',
    ifsc: '',
    branch: ''
  },
  
  // Terms & Conditions (from POD sample)
  terms: [
    'Consignor or consignee is responsible for any incorrect or false declaration from the time of booking till delivery of the above mentioned material.',
    'Any queries or disputes regarding the shipment should be mailed within 2 days for AIR booking and 3 days for TRAIN booking. Queries No queries shall be entertained beyond this timeline.',
    'Value goods insurance claim customer said.',
    'Goods condition and documents must be good and update document only accept.',
    'All payment made by cheque should be in favour of SRICAARGO.'
  ],
  
  // Service Modes
  serviceModes: ['Air', 'Railways', 'Road', 'Sea'],
  
  // Payment Modes
  paymentModes: ['Credit', 'Cash', 'Online Transfer', 'Cheque'],
  
  // Tax Rates
  tax: {
    gst: 18,
    cgst: 9,
    sgst: 9,
    igst: 18
  }
};
