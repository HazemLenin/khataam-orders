export default function Shell({ subtitle, children }) {
  return (
    <div className="page">
      <header className="hero">
        <div className="logo">🧆</div>
        <div>
          <h1>ختعم</h1>
          <p>{subtitle}</p>
        </div>
      </header>
      <main className="stack">{children}</main>
    </div>
  )
}
