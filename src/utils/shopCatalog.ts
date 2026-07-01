import { driveImg } from './brandAssets'

export interface ProductVariant {
  id: string
  name: string
  price: number
  unit: string
  description?: string
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  audience: string
  storageNote: string
  image: string
  featured: boolean
  available: boolean
  variants: ProductVariant[]
}

export interface CartItem {
  id: string
  productId: string
  variantId: string
  quantity: number
  note: string
}

export interface OrderItem {
  productId: string
  productName: string
  variantId: string
  variantName: string
  unit: string
  unitPrice: number
  quantity: number
  note: string
  lineTotal: number
}

export interface Order {
  id: string
  customerName: string
  phone: string
  address: string
  preferredTime: string
  note: string
  items: OrderItem[]
  subtotal: number
  status: 'new'
  timestamp: number
}

export interface CheckoutInfo {
  customerName: string
  phone: string
  address: string
  preferredTime: string
  note: string
}

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'ginger-shot',
    name: 'Ginger Shot',
    category: 'Shot tươi',
    description: 'Shot gừng tươi cô đặc, cay ấm, chua ngọt rõ, tiện thêm vào routine buổi sáng.',
    audience: 'Người muốn đồ uống nhỏ gọn, tỉnh vị, giảm đồ uống ngọt nhiều đường.',
    storageNote: 'Bảo quản lạnh 0-4°C, dùng tốt nhất trong 24-48 giờ theo HSD trên nhãn.',
    image: driveImg('14Sw6OqnKCLuzzSctN_MTpOYpqLxY-zN7'),
    featured: true,
    available: true,
    variants: [
      { id: 'vang', name: 'Vàng', price: 35000, unit: 'shot' },
      { id: 'xanh', name: 'Xanh', price: 35000, unit: 'shot' },
      { id: 'cam', name: 'Cam', price: 35000, unit: 'shot' },
      { id: 'do', name: 'Đỏ', price: 35000, unit: 'shot' },
      { id: 'hong', name: 'Hồng', price: 35000, unit: 'shot' },
    ],
  },
  {
    id: 'detox-lo-trinh',
    name: 'Detox / Lộ trình',
    category: 'Combo đồ uống tươi',
    description: 'Các lộ trình rau củ quả tươi theo cấp độ BYT, dùng theo lịch hướng dẫn.',
    audience: 'Người muốn bắt đầu ăn lành/uống sạch có hướng dẫn và combo rõ ràng.',
    storageNote: 'Giữ lạnh 0-4°C trong toàn bộ quá trình nhận và dùng; uống theo thứ tự trên phiếu.',
    image: driveImg('1gV4hUF1zKQ8YlJylEGTqOV3oYeqzWpq5'),
    featured: true,
    available: true,
    variants: [
      { id: 'tam-thanh', name: 'Chạm lành Tam thanh', price: 156000, unit: 'gói' },
      { id: 'luc-sac', name: 'Chạm lành Lục sắc', price: 282000, unit: 'gói' },
      { id: 'nhe-bung', name: 'Thanh thể Nhẹ bụng', price: 900000, unit: 'lộ trình' },
      { id: 'an-nhien', name: 'Hòa vị An nhiên', price: 1490000, unit: 'lộ trình' },
      { id: 'tuoi-nhuan', name: 'Dưỡng nguyên Tươi nhuận', price: 5790000, unit: 'lộ trình' },
      { id: 'truong-xuan', name: 'Trường xuân Rực rỡ', price: 6359000, unit: 'lộ trình' },
    ],
  },
  {
    id: 'nuoc-ep',
    name: 'Nước ép',
    category: 'Nước ép tươi',
    description: 'Nước ép rau củ quả tươi nguyên chất theo công thức BYT, thay thế lựa chọn nước ngọt công nghiệp.',
    audience: 'Người muốn tăng khẩu phần rau quả và cần đồ uống nhẹ trong ngày.',
    storageNote: 'Bảo quản lạnh 0-4°C, dùng ngon nhất trong ngày, sau khi mở nắp nên uống hết ngay.',
    image: driveImg('15cpv22xS5CDCitdMvuKZ-atqybupgWMd'),
    featured: true,
    available: true,
    variants: [
      { id: 'tao-xanh', name: 'Táo xanh thanh lọc', price: 55000, unit: 'chai' },
      { id: 'can-tay', name: 'Tỉnh táo cần tây', price: 50000, unit: 'chai' },
      { id: 'kale', name: 'Kale thanh lọc', price: 55000, unit: 'chai' },
      { id: 'den-cam', name: 'Hồng xuân dền cam', price: 55000, unit: 'chai' },
      { id: 'dua-hau-bac-ha', name: 'Dưa hấu bạc hà', price: 50000, unit: 'chai' },
    ],
  },
  {
    id: 'sua-hat',
    name: 'Sữa hạt',
    category: 'Sữa hạt tươi',
    description: 'Sữa hạt/ngũ cốc vị dịu, dễ uống, phù hợp dùng hằng ngày hoặc dùng lạnh/ấm nhẹ.',
    audience: 'Gia đình, dân văn phòng, người muốn đồ uống bùi nhẹ và tiện dùng.',
    storageNote: 'Bảo quản lạnh 0-4°C; lắc nhẹ trước khi uống vì sản phẩm có thể tách lớp tự nhiên.',
    image: driveImg('1eQZr-Biucevy52dPTO2dygL5FE2uYHiK'),
    featured: true,
    available: true,
    variants: [
      { id: 'daily-250', name: 'Daily 250 ml', price: 25000, unit: 'chai' },
      { id: 'daily-330', name: 'Daily 330 ml', price: 30000, unit: 'chai' },
      { id: 'cao-cap', name: 'Cao cấp', price: 65000, unit: 'chai' },
    ],
  },
  {
    id: 'smoothie',
    name: 'Smoothie',
    category: 'Smoothie tươi',
    description: 'Smoothie xay mịn từ trái cây tươi, tiện làm bữa phụ hoặc món giải khát healthy.',
    audience: 'Người thích đồ uống sánh mịn, dân văn phòng bận rộn, khách cần bữa phụ tiện lợi.',
    storageNote: 'Bảo quản lạnh 0-4°C, lắc/khuấy đều trước khi uống, sau mở nắp nên dùng hết.',
    image: driveImg('1eMgxarXNiVrAv_KORItsR4ZIwbhw8zIw'),
    featured: true,
    available: true,
    variants: [
      { id: 'hoa-qua', name: 'Smoothie hoa quả', price: 69000, unit: 'ly' },
      { id: 'no-lau', name: 'Smoothie no lâu', price: 79000, unit: 'ly' },
    ],
  },
  {
    id: 'hat-lanh',
    name: 'Hạt lành',
    category: 'Set hạt',
    description: 'Set hạt/đậu/ngũ cốc định lượng theo ngày, giúp khách tự làm sữa hạt hoặc chế biến tại nhà.',
    audience: 'Người muốn tự làm sữa hạt nhưng không muốn tự cân đo nguyên liệu.',
    storageNote: 'Để nơi khô, mát, kín, tránh nắng và ẩm; set sẵn sàng cần bảo quản lạnh theo nhãn.',
    image: driveImg('10wyv6CnpIckdDnrlJI1THDROL6doaKdy'),
    featured: false,
    available: true,
    variants: [
      { id: '7-ngay-chua-so-che', name: 'Set 7 ngày chưa sơ chế', price: 105000, unit: 'set' },
      { id: '14-ngay-chua-so-che', name: 'Set 14 ngày chưa sơ chế', price: 196000, unit: 'set' },
      { id: '30-ngay-chua-so-che', name: 'Set 30 ngày chưa sơ chế', price: 390000, unit: 'set' },
      { id: '7-ngay-san-sang', name: 'Set 7 ngày sẵn sàng', price: 210000, unit: 'set' },
      { id: '14-ngay-san-sang', name: 'Set 14 ngày sẵn sàng', price: 392000, unit: 'set' },
    ],
  },
]

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function isValidVNPhone(raw: string): boolean {
  return /^0\d{9}$/.test(raw.replace(/[\s.]/g, ''))
}

export function getProductById(products: Product[], productId: string): Product | undefined {
  return products.find((product) => product.id === productId)
}

export function getVariantById(product: Product | undefined, variantId: string): ProductVariant | undefined {
  return product?.variants.find((variant) => variant.id === variantId)
}

export function calculateCartSubtotal(products: Product[], items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const product = getProductById(products, item.productId)
    const variant = getVariantById(product, item.variantId)
    return sum + (variant ? variant.price * item.quantity : 0)
  }, 0)
}

export function buildOrderItems(products: Product[], items: CartItem[]): OrderItem[] {
  return items.flatMap((item) => {
    const product = getProductById(products, item.productId)
    const variant = getVariantById(product, item.variantId)
    if (!product || !variant) return []
    return [{
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      unit: variant.unit,
      unitPrice: variant.price,
      quantity: item.quantity,
      note: item.note,
      lineTotal: variant.price * item.quantity,
    }]
  })
}

export function summarizeOrderItems(items: OrderItem[]): string {
  return items
    .map((item) => `${item.quantity} x ${item.productName} - ${item.variantName} (${formatVnd(item.lineTotal)})${item.note ? ` - Ghi chú: ${item.note}` : ''}`)
    .join('\n')
}
