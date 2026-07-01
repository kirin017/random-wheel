import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_PRODUCTS,
  type CartItem,
  type CheckoutInfo,
  type Order,
  type Product,
  buildOrderItems,
  calculateCartSubtotal,
} from '../utils/shopCatalog'

interface ShopState {
  products: Product[]
  cartItems: CartItem[]
  orders: Order[]
  cartOpen: boolean

  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  resetProducts: () => void

  addToCart: (productId: string, variantId: string) => void
  updateCartQuantity: (itemId: string, quantity: number) => void
  updateCartNote: (itemId: string, note: string) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void

  getCartSubtotal: () => number
  createOrder: (info: CheckoutInfo) => Order
  clearOrders: () => void
}

function makeCartItemId(productId: string, variantId: string): string {
  return `${productId}:${variantId}`
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      products: DEFAULT_PRODUCTS,
      cartItems: [],
      orders: [],
      cartOpen: false,

      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((product) => (product.id === id ? { ...product, ...updates } : product)),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
          cartItems: state.cartItems.filter((item) => item.productId !== id),
        })),
      resetProducts: () => set({ products: DEFAULT_PRODUCTS }),

      addToCart: (productId, variantId) =>
        set((state) => {
          const product = state.products.find((item) => item.id === productId)
          const variant = product?.variants.find((item) => item.id === variantId)
          if (!product || !variant || !product.available) return state

          const itemId = makeCartItemId(productId, variantId)
          const existing = state.cartItems.find((item) => item.id === itemId)
          if (existing) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item,
              ),
              cartOpen: true,
            }
          }
          return {
            cartItems: [...state.cartItems, { id: itemId, productId, variantId, quantity: 1, note: '' }],
            cartOpen: true,
          }
        }),
      updateCartQuantity: (itemId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        })),
      updateCartNote: (itemId, note) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) => (item.id === itemId ? { ...item, note } : item)),
        })),
      removeFromCart: (itemId) =>
        set((state) => ({ cartItems: state.cartItems.filter((item) => item.id !== itemId) })),
      clearCart: () => set({ cartItems: [] }),
      setCartOpen: (open) => set({ cartOpen: open }),

      getCartSubtotal: () => calculateCartSubtotal(get().products, get().cartItems),
      createOrder: (info) => {
        const state = get()
        const items = buildOrderItems(state.products, state.cartItems)
        const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
        const order: Order = {
          id: Date.now().toString(),
          customerName: info.customerName.trim(),
          phone: info.phone.replace(/[\s.]/g, ''),
          address: info.address.trim(),
          preferredTime: info.preferredTime.trim(),
          note: info.note.trim(),
          items,
          subtotal,
          status: 'new',
          timestamp: Date.now(),
        }
        set({ orders: [order, ...state.orders], cartItems: [] })
        return order
      },
      clearOrders: () => set({ orders: [] }),
    }),
    {
      name: 'byt-shop-v1',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<ShopState>
        return {
          products: state.products?.length ? state.products : DEFAULT_PRODUCTS,
          cartItems: state.cartItems ?? [],
          orders: state.orders ?? [],
          cartOpen: false,
        }
      },
    },
  ),
)
