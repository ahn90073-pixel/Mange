// Display labels for values returned by the Mange administration API.
export const vendorStatusMap = {
  active: { label: 'نشط', class: 'badge-success' },
  suspended: { label: 'موقوف', class: 'badge-danger' },
  pending_approval: { label: 'بانتظار الموافقة', class: 'badge-warning' },
}

export const orderStatusMap = {
  delivered: { label: 'تم التوصيل', class: 'badge-success' },
  shipped: { label: 'تم الشحن', class: 'badge-primary' },
  processing: { label: 'قيد التنفيذ', class: 'badge-warning' },
  confirmed: { label: 'مؤكد', class: 'badge-primary' },
  pending: { label: 'بانتظار التأكيد', class: 'badge-warning' },
  cancelled: { label: 'ملغي', class: 'badge-danger' },
  returned: { label: 'مرتجع', class: 'badge-neutral' },
  refunded: { label: 'مسترد', class: 'badge-neutral' },
}

export const settlementStatusMap = {
  completed: { label: 'مكتمل', class: 'badge-success' },
  pending: { label: 'قيد المعالجة', class: 'badge-warning' },
  void: { label: 'ملغي', class: 'badge-danger' },
}
