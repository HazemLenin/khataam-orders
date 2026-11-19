import { useCallback, useEffect, useState } from 'react'
import { groupMenu } from './summary.js'
import Shell from './Shell.jsx'
import Summary from './Summary.jsx'

const KEY = 'khataam_admin'

function loadCreds() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) } catch { return null }
}

async function call(creds, action, extra) {
  const r = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, action, ...extra }),
  })
  if (r.status === 401) throw Object.assign(new Error('اسم المستخدم أو كلمة السر غلط'), { unauthorized: true })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'حصلت مشكلة، جرب تاني')
  return j
}

export default function Admin() {
  const [creds, setCreds] = useState(loadCreds)
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
    setCreds(null)
    setData(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      setData(await call(creds, 'get'))
    } catch (e) {
      if (e.unauthorized) logout()
    }
  }, [creds, logout])

  useEffect(() => {
    if (!creds) return
    refresh()
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [creds, refresh])

  if (!creds) {
    return (
      <Login
        onLogin={(c, d) => {
          try { sessionStorage.setItem(KEY, JSON.stringify(c)) } catch { /* ignore */ }
          setData(d)
          setCreds(c)
        }}
      />
    )
  }

  // Runs an admin action; returns true on success so forms can clear themselves.
  async function run(action, extra, okText, setMessage = setMsg) {
    setBusy(true)
    setMessage(null)
    try {
      setData(await call(creds, action, extra))
      setMessage({ type: 'success', text: okText })
      return true
    } catch (e) {
      if (e.unauthorized) logout()
      setMessage({ type: 'error', text: e.message })
      return false
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    if (!window.confirm('هتمسح كل الطلبات وتعمل كود جديد. متأكد؟')) return
    run('reset', {}, 'تم التصفير، ابعت الكود الجديد للناس ✅')
  }

  return (
    <Shell subtitle="لوحة التحكم">
      {!data ? (
        <p className="empty">جاري التحميل…</p>
      ) : (
        <>
          <div className="cw"><section className="card">
            <div className="code-box">
              <div className="muted">كود النهارده</div>
              <div className="code-value">
                {(data.code ?? '------').split('').map((d, i) => <span key={i}>{d}</span>)}
              </div>
              {!data.code && <div className="muted small">اضغط تصفير عشان تعمل أول كود</div>}
            </div>
            {msg && <p className={`alert ${msg.type}`}>{msg.text}</p>}
            <div className="actions wrap">
              <button className="btn danger" onClick={reset} disabled={busy}>
                {busy ? 'لحظة…' : 'تصفير الطلبات وكود جديد'}
              </button>
              <button className="btn ghost" onClick={logout}>خروج</button>
            </div>
          </section></div>
          <MenuEditor data={data} busy={busy} run={run} />
          <Summary orders={data.orders} menu={data.menu} deliveryFee={data.delivery_fee} />
        </>
      )}
    </Shell>
  )
}

function MenuEditor({ data, busy, run }) {
  const [msg, setMsg] = useState(null)
  const [fee, setFee] = useState(String(data.delivery_fee))
  const groups = groupMenu(data.menu)
  const save = (item, okText) => run('save_item', { item }, okText, setMsg)

  function remove(item) {
    if (!window.confirm(`هتحذف «${item.name}» من المنيو، ولو حد طالبه هيتشال من طلبه. متأكد؟`)) return
    run('delete_item', { id: item.id }, `اتحذف «${item.name}»`, setMsg)
  }

  return (
    <div className="cw"><section className="card">
      <h2>المنيو والأسعار</h2>
      <datalist id="categories">
        {groups.map((g) => <option key={g.title} value={g.title} />)}
      </datalist>

      {groups.map((g) => (
        <div key={g.title}>
          <h3>{g.icon} {g.title}</h3>
          {g.items.map((item) => (
            <ItemRow key={item.id} item={item} busy={busy} onSave={(v) => save(v, `اتحفظ «${v.name}»`)} onDelete={() => remove(item)} />
          ))}
        </div>
      ))}

      <h3>➕ صنف جديد</h3>
      <ItemRow isNew busy={busy} onSave={(v) => save(v, `اتضاف «${v.name}»`)} />

      <h3>🛵 التوصيل</h3>
      <form
        className="menu-row fee-row"
        onSubmit={(e) => {
          e.preventDefault()
          run('set_fee', { fee: Number(fee) }, 'اتحفظ سعر التوصيل', setMsg)
        }}
      >
        <input className="input" type="number" min="0" step="0.5" inputMode="decimal" aria-label="سعر التوصيل" value={fee} onChange={(e) => setFee(e.target.value)} />
        <span className="muted">ج.م بيتقسم على كل اللي طلبوا</span>
        <button className="btn primary" disabled={busy || fee === '' || Number(fee) === Number(data.delivery_fee)}>حفظ</button>
      </form>

      {msg && <p className={`alert ${msg.type}`}>{msg.text}</p>}
    </section></div>
  )
}

function ItemRow({ item, isNew, busy, onSave, onDelete }) {
  const blank = { name: '', price: '', category: '' }
  const [v, setV] = useState(() => (item ? { name: item.name, price: String(item.price), category: item.category } : blank))
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const valid = v.name.trim() && v.category.trim() && v.price !== '' && Number(v.price) >= 0
  const dirty = isNew || v.name !== item.name || Number(v.price) !== Number(item.price) || v.category !== item.category

  async function submit(e) {
    e.preventDefault()
    const ok = await onSave({ id: item?.id, name: v.name.trim(), price: Number(v.price), category: v.category.trim() })
    if (ok && isNew) setV(blank)
  }

  return (
    <form className="menu-row" onSubmit={submit}>
      <input className="input" placeholder="اسم الصنف" maxLength={40} aria-label="اسم الصنف" value={v.name} onChange={set('name')} />
      <input className="input" type="number" min="0" step="0.5" inputMode="decimal" placeholder="السعر" aria-label="السعر" value={v.price} onChange={set('price')} />
      <input className="input" placeholder="القسم" maxLength={30} list="categories" aria-label="القسم" value={v.category} onChange={set('category')} />
      <div className="row-actions">
        <button className="btn primary" disabled={busy || !valid || !dirty}>{isNew ? 'إضافة' : 'حفظ'}</button>
        {!isNew && <button type="button" className="btn ghost" onClick={onDelete} disabled={busy} aria-label={`حذف ${item.name}`}>🗑️</button>}
      </div>
    </form>
  )
}

function Login({ onLogin }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const c = { user, pass }
      onLogin(c, await call(c, 'get'))
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  return (
    <Shell subtitle="دخول المسؤول">
      <div className="cw narrow"><form className="card code-card" onSubmit={submit}>
        <div className="lock" aria-hidden="true">👨‍🍳</div>
        <label htmlFor="user">اسم المستخدم</label>
        <input id="user" className="input" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />
        <label htmlFor="pass">كلمة السر</label>
        <input id="pass" className="input" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {error && <p className="alert error">{error}</p>}
        <button className="btn primary" disabled={!user || !pass || busy}>{busy ? 'جاري الدخول…' : 'دخول'}</button>
      </form></div>
    </Shell>
  )
}
