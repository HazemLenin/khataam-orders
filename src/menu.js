// Prices in EGP. Item ids must match the whitelist in supabase/schema.sql.
export const DELIVERY_FEE = 0

export const GROUPS = [
  { title: 'فول', icon: '🫘' },
  { title: 'فلافل', icon: '🧆' },
  { title: 'بطاطس', icon: '🍟' },
]

export const MENU = [
  { id: 'foul', name: 'فول', price: 10, group: 'فول' },
  { id: 'foul_tahina', name: 'فول طحينة', price: 12, group: 'فول' },
  { id: 'falafel', name: 'فلافل', price: 10, group: 'فلافل' },
  { id: 'falafel_tahina', name: 'فلافل طحينة', price: 12, group: 'فلافل' },
  { id: 'falafel_kiri', name: 'فلافل كيري', price: 20, group: 'فلافل' },
  { id: 'potato_roumi', name: 'بطاطس رومي', price: 0, group: 'بطاطس' },
  { id: 'potato_roumi_mozz', name: 'بطاطس رومي موتزريلا', price: 38, group: 'بطاطس' },
]
