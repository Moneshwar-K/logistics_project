/**
 * Print Utility for Invoice & POD PDFs
 * Handles: fetch PDF from backend → open in new window → trigger browser print dialog
 * Works with any connected printer (USB, network, WiFi)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Download and print an Invoice PDF
 * @param invoiceId - MongoDB ID of the invoice
 * @param autoprint - If true, triggers browser print dialog automatically
 */
export async function printInvoice(invoiceId: string, autoprint = true): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const url = `${API_BASE_URL}/invoices/${invoiceId}/pdf`;

    try {
        const response = await fetch(url, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });

        if (!response.ok) throw new Error(`Failed to generate invoice PDF: ${response.status}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (autoprint) {
            // Open in hidden iframe and trigger print dialog
            printBlobPDF(blobUrl, `Invoice-${invoiceId}`);
        } else {
            // Just download the file
            downloadBlob(blobUrl, `Invoice-${invoiceId}.pdf`);
        }
    } catch (error) {
        console.error('Print invoice failed:', error);
        alert('Failed to generate invoice. Please try again.');
    }
}

/**
 * Download and print a POD PDF
 * @param shipmentId - MongoDB ID of the shipment
 * @param autoprint - If true, triggers browser print dialog automatically
 */
export async function printPOD(shipmentId: string, autoprint = true): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const url = `${API_BASE_URL}/pod/${shipmentId}/pdf`;

    try {
        const response = await fetch(url, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });

        if (!response.ok) throw new Error(`Failed to generate POD PDF: ${response.status}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (autoprint) {
            printBlobPDF(blobUrl, `POD-${shipmentId}`);
        } else {
            downloadBlob(blobUrl, `POD-${shipmentId}.pdf`);
        }
    } catch (error) {
        console.error('Print POD failed:', error);
        alert('Failed to generate POD. Please try again.');
    }
}

/**
 * Open PDF in a new print-ready window and trigger browser's print dialog.
 * When the user connects a printer, the browser's native print dialog handles it.
 */
function printBlobPDF(blobUrl: string, title: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
        // Popup blocked — fallback to download
        downloadBlob(blobUrl, `${title}.pdf`);
        return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; }
        iframe { width: 100%; height: 100vh; border: none; }
        .print-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: #1a1a2e; color: white; padding: 8px 20px;
          display: flex; align-items: center; gap: 12px;
          font-family: system-ui, sans-serif;
        }
        .print-bar button {
          padding: 6px 16px; border-radius: 6px; border: none;
          font-weight: 600; cursor: pointer; font-size: 14px;
        }
        .btn-print { background: #4CAF50; color: white; }
        .btn-download { background: #2196F3; color: white; }
        .btn-close { background: #f44336; color: white; }
        iframe { margin-top: 45px; height: calc(100vh - 45px); }
        @media print {
          .print-bar { display: none !important; }
          iframe { margin-top: 0; height: 100vh; }
        }
      </style>
    </head>
    <body>
      <div class="print-bar">
        <span style="font-weight:700">${title}</span>
        <button class="btn-print" onclick="document.getElementById('pdf').contentWindow.print()">🖨️ Print</button>
        <button class="btn-download" onclick="downloadPDF()">📥 Download</button>
        <button class="btn-close" onclick="window.close()">✕ Close</button>
      </div>
      <iframe id="pdf" src="${blobUrl}"></iframe>
      <script>
        function downloadPDF() {
          const a = document.createElement('a');
          a.href = '${blobUrl}';
          a.download = '${title}.pdf';
          a.click();
        }
        // Auto-trigger print after PDF loads
        document.getElementById('pdf').onload = function() {
          setTimeout(() => { this.contentWindow.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
    printWindow.document.close();
}

/**
 * Download a blob as a file
 */
function downloadBlob(blobUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}
