function internationalPhone(value) {
  const arabicDigits = String(value || '').replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  let digits = arabicDigits.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `20${digits.slice(1)}`
  return digits
}

export function whatsappChatUrl(phone) {
  const digits = internationalPhone(phone)
  return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : ''
}

export function shipmentWhatsAppUrl(order) {
  const phone = internationalPhone(order.customer?.phone || order.customerPhone)
  const shipmentStatus = order.shipment?.status || order.shipmentStatus || 'pending'
  if (!phone || !['ready', 'picked_up', 'in_transit', 'delivered'].includes(shipmentStatus)) return ''

  const orderNumber = order.id || order.orderNumber || order.orderId || '—'
  const customerName = typeof order.customer === 'string' ? order.customer : order.customer?.name
  const vendorName = order.vendor?.name || order.vendorName || 'المتجر'
  const carrier = order.shipment?.carrier || order.carrier || ''
  const trackingNumber = order.shipment?.trackingNumber || order.trackingNumber || ''
  const shipmentMessage = shipmentStatus === 'ready'
    ? `تم تجهيز طرد طلبك رقم ${orderNumber} للشحن من ${vendorName}.`
    : shipmentStatus === 'delivered'
      ? `تم تسجيل تسليم طلبك رقم ${orderNumber} من ${vendorName}.`
      : `تم شحن طرد طلبك رقم ${orderNumber} من ${vendorName}.`
  const message = [
    customerName ? `مرحبًا ${customerName}،` : 'مرحبًا،',
    shipmentMessage,
    carrier ? `شركة الشحن: ${carrier}` : '',
    trackingNumber ? `رقم التتبع: ${trackingNumber}` : '',
  ].filter(Boolean).join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
