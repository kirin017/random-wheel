import { useShopStore } from '../../store/shopStore'
import { formatVnd, summarizeOrderItems } from '../../utils/shopCatalog'

export default function OrdersAdminSection() {
  const { orders, clearOrders } = useShopStore()

  function exportOrders() {
    const esc = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Thời gian', 'Họ tên', 'SĐT', 'Địa chỉ', 'Thời gian nhận', 'Sản phẩm', 'Tạm tính', 'Ghi chú', 'Trạng thái'],
      ...orders.map((order) => [
        new Date(order.timestamp).toLocaleString('vi-VN'),
        order.customerName,
        "'" + order.phone,
        order.address,
        order.preferredTime,
        summarizeOrderItems(order.items),
        order.subtotal,
        order.note,
        order.status,
      ]),
    ]
    const csv = rows.map((row) => row.map(esc).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'don-hang-byt.csv'
    a.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-cocoa-900">Đơn hàng ({orders.length})</h3>
        <div className="flex gap-2">
          <button onClick={exportOrders} disabled={orders.length === 0} className="rounded-lg bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700 disabled:opacity-50">Xuất CSV</button>
          <button onClick={clearOrders} disabled={orders.length === 0} className="rounded-lg bg-clay-300/40 px-3 py-1.5 text-xs font-semibold text-clay-600 disabled:opacity-50">Xóa</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl bg-cream-100 p-4 text-center text-sm text-cocoa-500">Chưa có đơn hàng local.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-cream-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-cocoa-900">{order.customerName} · {order.phone}</p>
                  <p className="text-xs text-cocoa-500">{order.items.length} dòng · {order.preferredTime || 'Chưa hẹn giờ'}</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-sage-700">{formatVnd(order.subtotal)}</p>
              </div>
              <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-cocoa-500">{summarizeOrderItems(order.items)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
