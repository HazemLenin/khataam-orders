import { createRoot } from 'react-dom/client'
import Order from './Order.jsx'
import Admin from './Admin.jsx'
import './styles.css'

const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin'

createRoot(document.getElementById('root')).render(isAdmin ? <Admin /> : <Order />)
