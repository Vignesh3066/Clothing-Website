import { products } from './data.ts';
export type CartItem = { productId: string; size: string; color: number; quantity: number };
export const itemKey = (item: CartItem) => `${item.productId}:${item.size}:${item.color}`;
export function readCart(raw: string | null): CartItem[] {
  try { const value: unknown = JSON.parse(raw || '[]'); if (!Array.isArray(value)) return [];
    const result: CartItem[] = [];
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue;
      const p = products.find(p => p.id === entry.productId);
      if (!p || !p.sizes.includes(entry.size) || !Number.isInteger(entry.color) || entry.color < 0 || entry.color >= p.colors.length || !Number.isInteger(entry.quantity) || entry.quantity < 1) continue;
      const item = {productId:p.id,size:entry.size,color:entry.color,quantity:Math.min(entry.quantity,5)};
      const existing = result.find(i=>itemKey(i)===itemKey(item));
      if(existing) existing.quantity=Math.min(5,existing.quantity+item.quantity); else result.push(item);
    } return result;
  } catch { return []; }
}
export function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find(i => itemKey(i) === itemKey(item));
  return existing ? cart.map(i => itemKey(i) === itemKey(item) ? {...i, quantity:Math.min(5,i.quantity+item.quantity)} : i) : [...cart,{...item,quantity:Math.min(5,item.quantity)}];
}
export const subtotal = (cart: CartItem[]) => cart.reduce((sum,i)=>sum+(products.find(p=>p.id===i.productId)?.price || 0)*i.quantity,0);
export const shippingCost = (total: number) => total === 0 || total >= 2500 ? 0 : 80;
