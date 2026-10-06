import "server-only";

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { invoiceItems, invoices } from "@/db/schema";
import { formatMoney } from "@/lib/invoices/calculations";

const blue = "#3978d7";
const darkGray = "#666666";
const line = "#c9c9c9";

const styles = StyleSheet.create({
  page: { paddingHorizontal: 30, paddingTop: 36, paddingBottom: 42, fontFamily: "Helvetica", fontSize: 8.5, color: "#202020" },
  intro: { position: "relative" },
  introRule: { position: "absolute", top: 0, bottom: -8, left: "64%", width: 0.7, backgroundColor: line },
  header: { flexDirection: "row", minHeight: 92 },
  brand: { width: "40%", paddingRight: 18 },
  logo: { width: 180, height: 43, objectFit: "contain", objectPosition: "left center" },
  month: { marginTop: 8, fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  issuer: { width: "24%", paddingRight: 8, alignItems: "flex-end", lineHeight: 1.2 },
  client: { width: "36%", paddingLeft: 9, lineHeight: 1.2 },
  partyName: { fontFamily: "Helvetica-Bold" },
  partyLine: { marginTop: 2 },
  invoiceTitle: { color: blue, fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 3 },
  invoiceTitleSpacer: { opacity: 0 },
  taxId: { color: "#777777", fontSize: 11 },
  invoiceMeta: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3 },
  numberBox: { width: 94, minHeight: 29, backgroundColor: blue, color: "#ffffff", padding: 4 },
  dateBox: { width: 94, minHeight: 29, backgroundColor: "#c3c3c3", color: "#555555", padding: 4 },
  boxLabel: { fontSize: 6.5, marginBottom: 3 },
  boxValue: { fontSize: 10 },
  table: { marginTop: 8 },
  tableHeader: { position: "relative", height: 18, flexDirection: "row", alignItems: "center", backgroundColor: darkGray, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  tableHeaderRule: { position: "absolute", top: 0, bottom: 0, left: "64%", width: 0.7, backgroundColor: line },
  body: { position: "relative", minHeight: 232, borderLeftWidth: 0.7, borderRightWidth: 0.7, borderBottomWidth: 0.7, borderColor: line, paddingTop: 13 },
  bodyRuleOne: { position: "absolute", top: 0, bottom: 0, left: "64%", width: 0.7, backgroundColor: line },
  bodyRuleTwo: { position: "absolute", top: 0, bottom: 0, left: "77%", width: 0.7, backgroundColor: line },
  bodyRuleThree: { position: "absolute", top: 0, bottom: 0, left: "88.5%", width: 0.7, backgroundColor: line },
  itemRow: { flexDirection: "row", minHeight: 17, alignItems: "flex-start" },
  description: { width: "64%", paddingHorizontal: 3 },
  quantity: { width: "13%", paddingHorizontal: 3, textAlign: "right" },
  price: { width: "11.5%", paddingHorizontal: 3, textAlign: "right" },
  amount: { width: "11.5%", paddingHorizontal: 3, textAlign: "right" },
  totals: { marginLeft: "64%", width: "36%", borderLeftWidth: 0.7, borderRightWidth: 0.7, borderBottomWidth: 0.7, borderColor: line },
  totalRow: { minHeight: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: line },
  totalLabel: { width: "64%", paddingHorizontal: 5 },
  totalValue: { width: "36%", paddingHorizontal: 3, textAlign: "right", fontFamily: "Helvetica-Bold" },
  withholding: { color: "#e23b32" },
  grandTotal: { minHeight: 17, fontFamily: "Helvetica-Bold", fontSize: 9 },
  contactBar: { marginTop: 18, height: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 70, backgroundColor: blue, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 6.5 },
  payment: { marginTop: 13, maxWidth: "64%", lineHeight: 1.45 },
  paymentLabel: { color: "#777777", fontSize: 6.5, textTransform: "uppercase", marginBottom: 4 },
  footer: { position: "absolute", left: 30, right: 30, bottom: 25, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", color: "#777777", fontSize: 7.5 },
  signatureArea: { width: 115, alignItems: "center" },
  signature: { width: 105, maxHeight: 38, objectFit: "contain", marginBottom: 2 },
  signatureLine: { width: 115, borderTopWidth: 0.7, borderTopColor: "#777777", paddingTop: 2, textAlign: "center" },
});

type Invoice = typeof invoices.$inferSelect;
type Item = typeof invoiceItems.$inferSelect;

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatMonth(value: string, locale: string) {
  const formatted = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function InvoicePdf({ invoice, items, signatureSource, logoSource }: { invoice: Invoice; items: Item[]; signatureSource?: string; logoSource?: string }) {
  const es = invoice.language === "es";
  const locale = es ? "es-ES" : "en-US";
  const issuer = invoice.issuerSnapshot;
  const client = invoice.clientSnapshot;
  const labels = es
    ? { invoice: "Factura", invoiceNumber: "Factura Nº", date: "Fecha", description: "Concepto", qty: "Cantidad", price: "Precio", amount: "Importe", subtotal: "Importe base", vat: "IVA", withholding: "IRPF", total: "Total", payment: "Condiciones de pago", email: "Correo", phone: "Teléfono" }
    : { invoice: "Invoice", invoiceNumber: "Invoice No.", date: "Date", description: "Description", qty: "Quantity", price: "Price", amount: "Amount", subtotal: "Subtotal", vat: "VAT", withholding: "Withholding", total: "Total", payment: "Payment terms", email: "Email", phone: "Phone" };
  const money = (value: number) => formatMoney(value, invoice.currency, locale);
  const quantity = (value: string) => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(Number(value));
  const issuerLocation = [issuer.postalCode, issuer.city, issuer.province].filter(Boolean).join(", ");
  const clientLocation = [client.postalCode, client.city, client.province].filter(Boolean).join(", ");

  return <Document title={`${labels.invoice} ${invoice.number}`} author={issuer.legalName}>
    <Page size="A4" style={styles.page}>
      <View style={styles.intro}>
        <View style={styles.introRule} />
        <View style={styles.header}>
          <View style={styles.brand}>{logoSource ? (
            // React PDF images are not HTML images and do not support alt.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image style={styles.logo} src={logoSource} />
          ) : <Text style={[styles.invoiceTitle, { fontSize: 22 }]}>{issuer.legalName}</Text>}<Text style={styles.month}>{formatMonth(invoice.issueDate, locale)}</Text></View>
          <View style={styles.issuer}><Text style={[styles.invoiceTitle, styles.invoiceTitleSpacer]}>{labels.invoice}</Text><Text style={styles.partyName}>{issuer.legalName}</Text><Text style={styles.partyLine}>{issuer.address}</Text><Text style={styles.partyLine}>{issuerLocation}</Text><Text style={[styles.taxId, styles.partyLine]}>{issuer.taxId}</Text></View>
          <View style={styles.client}><Text style={styles.invoiceTitle}>{labels.invoice}</Text><Text style={styles.partyName}>{client.name}</Text><Text style={styles.partyLine}>{client.address}</Text><Text style={styles.partyLine}>{clientLocation}</Text><Text style={[styles.taxId, styles.partyLine]}>{client.taxId}</Text></View>
        </View>
        <View style={styles.invoiceMeta}><View style={styles.numberBox}><Text style={styles.boxLabel}>{labels.invoiceNumber}</Text><Text style={styles.boxValue}>{invoice.number}</Text></View><View style={styles.dateBox}><Text style={styles.boxLabel}>{labels.date}</Text><Text>{formatDate(invoice.issueDate, locale)}</Text></View></View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}><View style={styles.tableHeaderRule} /><Text style={styles.description}>{labels.description}</Text><Text style={styles.quantity}>{labels.qty}</Text><Text style={styles.price}>{labels.price}</Text><Text style={styles.amount}>{labels.amount}</Text></View>
        <View style={styles.body}><View style={styles.bodyRuleOne} /><View style={styles.bodyRuleTwo} /><View style={styles.bodyRuleThree} />{items.map((item) => <View key={item.id} style={styles.itemRow}><Text style={styles.description}>{item.description}</Text><Text style={styles.quantity}>{quantity(item.quantity)}</Text><Text style={styles.price}>{money(item.unitPriceCents)}</Text><Text style={styles.amount}>{money(item.amountCents)}</Text></View>)}</View>
        <View style={styles.totals}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>{labels.subtotal}</Text><Text style={styles.totalValue}>{money(invoice.subtotalCents)}</Text></View>
          {invoice.vatEnabled && <View style={styles.totalRow}><Text style={styles.totalLabel}>{labels.vat} {invoice.vatRate / 100}%</Text><Text style={styles.totalValue}>{money(invoice.vatCents)}</Text></View>}
          {invoice.withholdingEnabled && <View style={styles.totalRow}><Text style={styles.totalLabel}>{labels.withholding} {invoice.withholdingRate / 100}%</Text><Text style={[styles.totalValue, styles.withholding]}>-{money(invoice.withholdingCents)}</Text></View>}
          <View style={[styles.totalRow, styles.grandTotal]}><Text style={styles.totalLabel}>{labels.total}</Text><Text style={styles.totalValue}>{money(invoice.totalCents)}</Text></View>
        </View>
      </View>

      {(issuer.email || issuer.phone) && <View style={styles.contactBar}>{issuer.email && <Text>{labels.email}: {issuer.email}</Text>}{issuer.phone && <Text>{labels.phone}: {issuer.phone}</Text>}</View>}
      {invoice.paymentTerms && <View style={styles.payment}><Text style={styles.paymentLabel}>{labels.payment}</Text><Text>{invoice.paymentTerms}</Text></View>}
      <View style={styles.footer}><Text>{issuer.iban}</Text><View style={styles.signatureArea}>{signatureSource && (
        // React PDF images are not HTML images and do not support alt.
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image style={styles.signature} src={signatureSource} />
      )}<Text style={styles.signatureLine}>{issuer.legalName}</Text></View></View>
    </Page>
  </Document>;
}
