import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const MESSAGES = {
  invalid_code: 'الكود غلط أو انتهى، اطلب الكود الجديد',
  invalid_name: 'الاسم لازم يكون من حرف لـ 40 حرف',
  invalid_items: 'الكميات لازم تكون أرقام صحيحة من 0 لـ 20',
  empty_order: 'اختار صنف واحد على الأقل',
}

export const isInvalidCode = (error) => error?.message?.includes('invalid_code')

export const errorMessage = (error) =>
  MESSAGES[Object.keys(MESSAGES).find((k) => error?.message?.includes(k))] || 'حصلت مشكلة، جرب تاني'
