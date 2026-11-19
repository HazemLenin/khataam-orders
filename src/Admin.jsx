import { useCallback, useEffect, useState } from 'react'
import { summarize, toText } from './summary.js'
import Shell from './Shell.jsx'
import Summary from './Summary.jsx'

const KEY = 'khataam_admin'

function loadCreds() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) } catch { return null }
}

async function call(creds, action) {
  const r = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, action }),
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

  async function reset() {
    if (!window.confirm('هتمسح كل الطلبات وتعمل كود جديد. متأكد؟')) return
    setBusy(true)
    setMsg(null)
    try {
      const d = await call(creds, 'reset')
      setData(d)
      setMsg({ type: 'success', text: 'تم التصفير، ابعت الكود الجديد للناس ✅' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
    setBusy(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(toText(summarize(data.orders)))
      setMsg({ type: 'success', text: 'اتنسخ الطلب، الصقه في واتساب 📋' })
    } catch {
      setMsg({ type: 'error', text: 'النسخ مانفعش' })
    }
  }

  return (
    <Shell subtitle="لوحة التحكم">
      {!data ? (
        <p className="empty">جاري التحميل…</p>
      ) : (
        <>
          <section className="card">
            <div className="code-box">
              <div className="muted">كود النهارده</div>
              <div className="code-value">{data.code ?? '——'}</div>
              {!data.code && <div className="muted small">اضغط تصفير عشان تعمل أول كود</div>}
            </div>
            {msg && <p className={`alert ${msg.type}`}>{msg.text}</p>}
            <div className="actions wrap">
              <button className="btn danger" onClick={reset} disabled={busy}>
                {busy ? 'جاري التصفير…' : 'تصفير الطلبات وكود جديد'}
              </button>
              <button className="btn ghost" onClick={copy} disabled={!data.orders.length}>نسخ الطلب كنص</button>
              <button className="btn ghost" onClick={logout}>خروج</button>
            </div>
          </section>
          <Summary orders={data.orders} />
        </>
      )}
    </Shell>
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
      <form className="card code-card" onSubmit={submit}>
        <label htmlFor="user">اسم المستخدم</label>
        <input id="user" className="input" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />
        <label htmlFor="pass">كلمة السر</label>
        <input id="pass" className="input" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {error && <p className="alert error">{error}</p>}
        <button className="btn primary" disabled={!user || !pass || busy}>{busy ? 'جاري الدخول…' : 'دخول'}</button>
      </form>
    </Shell>
  )
}
