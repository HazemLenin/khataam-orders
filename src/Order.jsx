import { useCallback, useEffect, useState } from 'react'
import { supabase, errorMessage, isInvalidCode } from './supabase.js'
import { normalizeName, money, subtotalOf, groupMenu } from './summary.js'
import Shell from './Shell.jsx'
import Summary from './Summary.jsx'

const CODE_KEY = 'khataam_code'
const NAME_KEY = 'khataam_name'
const load = (k) => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const save = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k) } catch { /* private mode */ } }

export default function Order() {
  const [code, setCode] = useState(() => load(CODE_KEY))
  const [state, setState] = useState(null)
  const [notice, setNotice] = useState('')

  const lock = useCallback((msg) => {
    save(CODE_KEY, '')
    setCode('')
    setState(null)
    setNotice(msg)
  }, [])

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_state', { p_code: code })
    if (isInvalidCode(error)) return lock('الكود اتغير، اطلب الكود الجديد')
    if (!error) setState(data)
  }, [code, lock])

  useEffect(() => {
    if (!code) return
    refresh()
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [code, refresh])

  if (!code) {
    return (
      <CodeScreen
        notice={notice}
        onUnlock={(c, data) => {
          save(CODE_KEY, c)
          setNotice('')
          setState(data)
          setCode(c)
        }}
      />
    )
  }

  return (
    <Shell subtitle="طلبات النهارده">
      {state ? (
        <>
          <OrderForm code={code} orders={state.orders} menu={state.menu} onSaved={refresh} onLock={lock} />
          <Summary orders={state.orders} menu={state.menu} deliveryFee={state.delivery_fee} highlight={normalizeName(load(NAME_KEY))} />
        </>
      ) : (
        <p className="empty">جاري التحميل…</p>
      )}
    </Shell>
  )
}

function CodeScreen({ notice, onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(notice)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const { data, error } = await supabase.rpc('get_state', { p_code: value })
    setBusy(false)
    if (error) return setError(errorMessage(error))
    onUnlock(value, data)
  }

  return (
    <Shell subtitle="اكتب كود النهارده عشان تطلب">
      <div className="cw narrow"><form className="card code-card" onSubmit={submit}>
        <div className="lock" aria-hidden="true">🔐</div>
        <label htmlFor="code">كود الدخول</label>
        <input
          id="code"
          className="code-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          autoFocus
        />
        {error && <p className="alert error">{error}</p>}
        <button className="btn primary" disabled={value.length !== 6 || busy}>
          {busy ? 'جاري التأكد…' : 'دخول'}
        </button>
      </form></div>
    </Shell>
  )
}

function OrderForm({ code, orders, menu, onSaved, onLock }) {
  const [name, setName] = useState(() => load(NAME_KEY))
  const [qty, setQty] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [burst, setBurst] = useState(0)

  const existing = orders.find((o) => o.name === normalizeName(name))

  // Pre-fill when the typed name matches a saved order (only when the match changes, not on every poll).
  useEffect(() => {
    if (existing) setQty(existing.items)
  }, [existing?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  const setItem = (id, v) => {
    const n = Math.max(0, Math.min(20, Math.trunc(Number(v)) || 0))
    setQty((q) => ({ ...q, [id]: n }))
  }

  async function run(fn, okText, celebrate) {
    setBusy(true)
    setMsg(null)
    const { error } = await fn()
    setBusy(false)
    if (isInvalidCode(error)) return onLock('الكود اتغير، اطلب الكود الجديد')
    if (error) return setMsg({ type: 'error', text: errorMessage(error) })
    setMsg({ type: 'success', text: okText })
    if (celebrate) setBurst((b) => b + 1)
    onSaved()
  }

  function submit(e) {
    e.preventDefault()
    const n = normalizeName(name)
    if (!n) return setMsg({ type: 'error', text: 'اكتب اسمك الأول' })
    // Drop items the admin removed from the menu since this page loaded.
    const items = Object.fromEntries(Object.entries(qty).filter(([id, v]) => v > 0 && menu.some((m) => m.id === id)))
    if (!Object.keys(items).length) return setMsg({ type: 'error', text: 'اختار صنف واحد على الأقل' })
    save(NAME_KEY, n)
    run(() => supabase.rpc('submit_order', { p_code: code, p_name: n, p_items: items }),
      existing ? 'تم تعديل طلبك ✅' : 'تم تسجيل طلبك، بالهنا والشفا 😋', true)
  }

  function remove() {
    run(() => supabase.rpc('delete_order', { p_code: code, p_name: normalizeName(name) }), 'تم حذف طلبك')
    setQty({})
  }

  const subtotal = subtotalOf(qty, menu)

  return (
    <div className="cw"><form className="card" onSubmit={submit}>
      <h2>{existing ? 'عدّل طلبك' : 'طلبك'}</h2>

      <label htmlFor="name">اسمك</label>
      <input
        id="name"
        className="input"
        maxLength={40}
        placeholder="مثلاً: أحمد"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {existing && <p className="hint">لقينا طلبك، عدّل وابعت تاني وهيتغير.</p>}

      {groupMenu(menu).map((g) => (
        <div key={g.title} className="group">
          <h3><span className="group-icon">{g.icon}</span> {g.title}</h3>
          <div className="menu">
            {g.items.map((m) => {
              const q = qty[m.id] || 0
              return (
                <div className={`item ${q ? 'picked' : ''}`} key={m.id}>
                  <div className="item-icon" aria-hidden="true">{g.icon}</div>
                  <div className="grow">
                    <div className="item-name">{m.name}</div>
                    <div className="item-price">{money(m.price)}</div>
                  </div>
                  <div className="stepper">
                    <button type="button" aria-label={`زود ${m.name}`} onClick={() => setItem(m.id, q + 1)}>+</button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="20"
                      aria-label={`كمية ${m.name}`}
                      value={q}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setItem(m.id, e.target.value)}
                    />
                    <button type="button" aria-label={`قلل ${m.name}`} onClick={() => setItem(m.id, q - 1)} disabled={!q}>−</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {msg && <p className={`alert ${msg.type}`}>{msg.text}</p>}

      <div className="bar">
        {burst > 0 && <Burst key={burst} />}
        <div>
          <div className="muted small">حسابك</div>
          <strong className="price">{money(subtotal)}</strong>
        </div>
        <div className="actions">
          {existing && (
            <button type="button" className="btn ghost" onClick={remove} disabled={busy}>حذف طلبي</button>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? 'جاري الإرسال…' : existing ? 'حفظ التعديل' : 'ابعت الطلب'}
          </button>
        </div>
      </div>
    </form></div>
  )
}

function Burst() {
  const bits = ['🧆', '🫘', '🍟', '🎉', '✨', '🌶️']
  return (
    <div className="burst" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          style={{
            '--x': `${Math.round((Math.random() - 0.5) * 320)}px`,
            '--y': `${Math.round(-120 - Math.random() * 260)}px`,
            '--r': `${Math.round((Math.random() - 0.5) * 540)}deg`,
          }}
        >
          {bits[i % bits.length]}
        </span>
      ))}
    </div>
  )
}
