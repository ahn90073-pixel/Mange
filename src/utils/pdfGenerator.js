import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calculateCommission, calculateNetBalance, formatCurrency, formatDate } from './format'

function getAdminInfo(user) {
  const adminName = user?.fullName || user?.email || 'مدير المنصة'
  return { name: 'منصة التجار', adminName, role: 'مدير المنصة', email: user?.email || '' }
}

// Generate a Payment Voucher / Settlement Receipt PDF
export function generatePaymentVoucherPDF(settlement, vendor, user) {
  const adminInfo = getAdminInfo(user)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 20

  // Header band
  doc.setFillColor(29, 101, 242)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Voucher', marginX, 16)
  doc.text('سند سداد مالي', marginX, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(adminInfo.name, pageWidth - marginX, 16, { align: 'right' })
  doc.text(`Voucher #: ${settlement.id}`, pageWidth - marginX, 25, { align: 'right' })

  // Date
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(10)
  doc.text(`Date / التاريخ: ${formatDate(settlement.date)}`, marginX, 48)

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.line(marginX, 53, pageWidth - marginX, 53)

  // Vendor info section
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(29, 101, 242)
  doc.text('Vendor Information / بيانات التاجر', marginX, 65)

  const vendorInfo = [
    ['Company Name / اسم الشركة', vendor?.companyName || settlement.vendorName],
    ['Merchant Name / اسم التاجر', vendor?.merchantName || '—'],
    ['Email / البريد', vendor?.email || '—'],
    ['Phone / الهاتف', vendor?.phone || '—'],
    ['City / المدينة', vendor?.city || '—'],
  ]

  autoTable(doc, {
    startY: 70,
    head: [['Field / الحقل', 'Value / القيمة']],
    body: vendorInfo,
    theme: 'grid',
    headFillColor: [241, 245, 249],
    headTextColor: [30, 41, 59],
    headFontSize: 10,
    bodyFontSize: 10,
    margin: { left: marginX, right: marginX },
    styles: { cellPadding: 4 },
  })

  // Financial details section
  let afterY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(29, 101, 242)
  doc.text('Financial Details / تفاصيل المعاملة المالية', marginX, afterY)

  const financialRows = [
    ['Gross Amount / إجمالي المبلغ', formatCurrency(settlement.amount, settlement.currency)],
    ['Commission Deducted / العمولة المقتطعة', `- ${formatCurrency(settlement.commissionDeducted, settlement.currency)}`],
    ['Net Amount Paid / الصافي المدفوع', formatCurrency(settlement.netAmount, settlement.currency)],
    ['Period / الفترة المالية', settlement.period],
    ['Payment Method / طريقة الدفع', settlement.method],
    ['Reference / رقم المرجع', settlement.reference || '—'],
    ['Status / الحالة', settlement.status === 'completed' ? 'Completed / مكتمل' : 'Pending / قيد المعالجة'],
  ]

  autoTable(doc, {
    startY: afterY + 5,
    head: [['Description / البيان', 'Amount / المبلغ']],
    body: financialRows,
    theme: 'grid',
    headFillColor: [241, 245, 249],
    headTextColor: [30, 41, 59],
    bodyFontSize: 10,
    headFontSize: 10,
    margin: { left: marginX, right: marginX },
    styles: { cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold', textColor: [29, 101, 242] },
    },
  })

  // Net amount highlight box
  let signY = doc.lastAutoTable.finalY + 15
  doc.setFillColor(238, 246, 255)
  doc.roundedRect(marginX, signY, pageWidth - 2 * marginX, 18, 3, 3, 'F')
  doc.setTextColor(29, 101, 242)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Total Net Paid / إجمالي الصافي المدفوع: ${formatCurrency(settlement.netAmount, settlement.currency)}`,
    pageWidth / 2,
    signY + 11,
    { align: 'center' }
  )

  // Signature section
  let sigY = signY + 35
  doc.setDrawColor(200, 200, 200)
  doc.line(marginX, sigY, marginX + 60, sigY)
  doc.line(pageWidth - marginX - 60, sigY, pageWidth - marginX, sigY)
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${adminInfo.role}`, marginX, sigY + 5)
  doc.text(`${adminInfo.adminName}`, marginX, sigY + 10)
  doc.text('Vendor Signature / توقيع التاجر', pageWidth - marginX, sigY + 5, { align: 'right' })
  doc.text('Signature / توقيع الإدارة', marginX, sigY - 4)

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(226, 232, 240)
  doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `${adminInfo.name} - ${adminInfo.email}`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  )
  doc.text(
    `Generated on ${new Date().toLocaleString('en-GB')}`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  )

  doc.save(`Payment-Voucher-${settlement.id}.pdf`)
}

// Generate a vendor financial report PDF
export function generateVendorReportPDF(vendor, user) {
  const adminInfo = getAdminInfo(user)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 20

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Vendor Financial Report', marginX, 16)
  doc.text('تقرير مالي للتاجر', marginX, 25)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(adminInfo.name, pageWidth - marginX, 16, { align: 'right' })
  doc.text(`Vendor ID: ${vendor.id}`, pageWidth - marginX, 25, { align: 'right' })

  // Vendor details
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(29, 101, 242)
  doc.text('Vendor Details / تفاصيل التاجر', marginX, 50)

  const vendorRows = [
    ['Company / الشركة', vendor.companyName],
    ['Merchant / التاجر', vendor.merchantName],
    ['Email / البريد', vendor.email],
    ['Phone / الهاتف', vendor.phone],
    ['City / المدينة', vendor.city],
    ['Status / الحالة', vendor.status],
    ['Registered / تاريخ التسجيل', formatDate(vendor.registeredAt)],
  ]

  autoTable(doc, {
    startY: 55,
    head: [['Field / الحقل', 'Value / القيمة']],
    body: vendorRows,
    theme: 'grid',
    headFillColor: [241, 245, 249],
    headTextColor: [30, 41, 59],
    bodyFontSize: 10,
    headFontSize: 10,
    margin: { left: marginX, right: marginX },
    styles: { cellPadding: 4 },
  })

  // Financial summary
  let afterY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(29, 101, 242)
  doc.text('Financial Summary / الملخص المالي', marginX, afterY)

  const commission = Number.isFinite(Number(vendor.commissionAmount))
    ? Number(vendor.commissionAmount)
    : calculateCommission(vendor.totalSales, vendor.commissionType, vendor.commissionValue)
  const netBalance = calculateNetBalance(vendor)

  const financialRows = [
    ['Total Sales / إجمالي المبيعات', formatCurrency(vendor.totalSales)],
    ['Total Orders / إجمالي الطلبات', String(vendor.totalOrders)],
    ['Total Products / إجمالي المنتجات', String(vendor.totalProducts)],
    [
      `Commission (${vendor.commissionType === 'percentage' ? vendor.commissionValue + '%' : 'fixed'}) / العمولة`,
      `- ${formatCurrency(commission)}`,
    ],
    ['Settled Amount / المبلغ المسدد', `- ${formatCurrency(vendor.settledAmount)}`],
    ['Net Balance / الصافي المستحق', formatCurrency(netBalance)],
  ]

  autoTable(doc, {
    startY: afterY + 5,
    head: [['Description / البيان', 'Value / القيمة']],
    body: financialRows,
    theme: 'grid',
    headFillColor: [241, 245, 249],
    headTextColor: [30, 41, 59],
    bodyFontSize: 10,
    headFontSize: 10,
    margin: { left: marginX, right: marginX },
    styles: { cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // Net balance highlight
  let balY = doc.lastAutoTable.finalY + 15
  doc.setFillColor(238, 246, 255)
  doc.roundedRect(marginX, balY, pageWidth - 2 * marginX, 18, 3, 3, 'F')
  doc.setTextColor(29, 101, 242)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Net Balance Due / الصافي المستحق للتاجر: ${formatCurrency(netBalance)}`,
    pageWidth / 2,
    balY + 11,
    { align: 'center' }
  )

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(226, 232, 240)
  doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `${adminInfo.name} - Generated on ${new Date().toLocaleString('en-GB')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  doc.save(`Vendor-Report-${vendor.id}.pdf`)
}
