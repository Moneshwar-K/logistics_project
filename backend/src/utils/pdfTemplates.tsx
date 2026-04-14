import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.woff2' },
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.woff2', fontWeight: 700 }, // Bold
    ],
});

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    companyInfo: { marginBottom: 10 },
    billTo: { marginTop: 20, marginBottom: 20 },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
    tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
    total: { marginTop: 20, textAlign: 'right', fontSize: 12, fontWeight: 'bold' },
});

export const InvoicePDF = ({ invoice }: { invoice: any }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>INVOICE</Text>
                    <Text>Invoice #: {invoice.invoice_number}</Text>
                    <Text>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</Text>
                </View>
                <View>
                    <Text style={{ fontWeight: 'bold' }}>My Logistics Co.</Text>
                    <Text>123 Cargo Street</Text>
                    <Text>New Delhi, India</Text>
                    <Text>GSTIN: 07AABC1234F1Z5</Text>
                </View>
            </View>

            <View style={styles.billTo}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
                <Text>{invoice.billed_party_id?.name}</Text>
                <Text>{invoice.billed_party_id?.address}</Text>
                <Text>{invoice.billed_party_id?.city}</Text>
                <Text>GSTIN: {invoice.billed_party_id?.gst_number || 'N/A'}</Text>
            </View>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={[styles.tableCol, { width: '40%' }]}><Text>Description</Text></View>
                    <View style={[styles.tableCol, { width: '15%' }]}><Text>HSN</Text></View>
                    <View style={[styles.tableCol, { width: '10%' }]}><Text>Qty</Text></View>
                    <View style={[styles.tableCol, { width: '15%' }]}><Text>Rate</Text></View>
                    <View style={[styles.tableCol, { width: '20%' }]}><Text>Amount</Text></View>
                </View>

                {invoice.charges?.map((item: any, i: number) => (
                    <View style={styles.tableRow} key={i}>
                        <View style={[styles.tableCol, { width: '40%' }]}><Text>{item.description}</Text></View>
                        <View style={[styles.tableCol, { width: '15%' }]}><Text>{item.hsn_code}</Text></View>
                        <View style={[styles.tableCol, { width: '10%' }]}><Text>{item.quantity}</Text></View>
                        <View style={[styles.tableCol, { width: '15%' }]}><Text>{item.unit_price}</Text></View>
                        <View style={[styles.tableCol, { width: '20%' }]}><Text>{item.amount}</Text></View>
                    </View>
                ))}
            </View>

            <View style={styles.total}>
                <Text>Subtotal: {invoice.subtotal.toFixed(2)}</Text>
                <Text>IGST: {invoice.igst.toFixed(2)}</Text>
                <Text>CGST: {invoice.cgst.toFixed(2)}</Text>
                <Text>SGST: {invoice.sgst.toFixed(2)}</Text>
                <Text style={{ marginTop: 5, fontSize: 14 }}>Total: {invoice.currency} {invoice.total_amount.toFixed(2)}</Text>
            </View>
        </Page>
    </Document>
);
