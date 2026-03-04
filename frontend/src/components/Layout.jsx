import { useAuth } from '../context/AuthContext';
import Ic from './ui/Icons';

const NAV = [
  { key:'dashboard',  label:'Dashboard',   icon:'dashboard' },
  { key:'inventory',  label:'Inventario',  icon:'box' },
  { key:'movements',  label:'Movimientos', icon:'activity' },
  { key:'users',      label:'Usuarios',    icon:'users',  adminOnly:true },
];

const ROLE_INFO = {
  admin:     { label:'Administrador', color:'#F97316' },
  operador:  { label:'Operador',      color:'#3B82F6' },
  consultor: { label:'Consultor',     color:'#22C55E' },
};

export default function Layout({ page, onNavigate, children, alerts }) {
  const { user, logout } = useAuth();
  const ri = ROLE_INFO[user?.role] || ROLE_INFO.consultor;

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg)', overflow:'hidden' }}>
      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside style={{
        width:230, background:'var(--surface)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', flexShrink:0,
      }}>
        {/* Brand */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#F97316,#C2410C)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, boxShadow:'0 4px 14px rgba(249,115,22,0.35)', flexShrink:0 }}>🚗</div>
            <div>
              <div style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:13.5, letterSpacing:'0.06em' }}>AUTOPARTES</div>
              <div style={{ fontFamily:'var(--font-m)', fontSize:9, color:'var(--muted)', letterSpacing:'0.05em' }}>INVENTARIO PRO v2.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'14px 10px', flex:1, overflowY:'auto' }}>
          <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.12em', color:'var(--muted)', textTransform:'uppercase', paddingLeft:8, marginBottom:6 }}>Menú principal</p>

          {NAV.filter(n => !n.adminOnly || user?.role === 'admin').map(n => {
            const active = page === n.key;
            const cnt = n.key === 'inventory' && alerts ? (alerts.low + alerts.out) : 0;
            return (
              <button key={n.key} onClick={() => onNavigate(n.key)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  gap:9, padding:'10px 10px', borderRadius:7, marginBottom:2,
                  background: active ? 'var(--accentDim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  fontSize:14, fontWeight: active ? 600 : 400,
                  border: 'none', cursor:'pointer',
                  borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  fontFamily:'var(--font-b)', transition:'all 0.15s',
                }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <Ic n={n.icon} size={15}/>{n.label}
                </span>
                {cnt > 0 && (
                  <span style={{ background:'rgba(239,68,68,0.2)', color:'var(--red)', borderRadius:4, padding:'1px 7px', fontSize:11, fontFamily:'var(--font-m)' }}>{cnt}</span>
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ height:1, background:'var(--border)', margin:'14px 8px 12px' }}/>
          <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.12em', color:'var(--muted)', textTransform:'uppercase', paddingLeft:8, marginBottom:6 }}>Alertas de stock</p>

          {alerts?.low > 0 && (
            <button onClick={()=>onNavigate('inventory')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:6, background:'rgba(234,179,8,0.07)', border:'1px solid rgba(234,179,8,0.18)', cursor:'pointer', marginBottom:6 }}>
              <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:'#EAB308' }}><Ic n="warning" size={13}/>Stock bajo</span>
              <span style={{ fontFamily:'var(--font-m)', fontSize:11, color:'#EAB308' }}>{alerts.low}</span>
            </button>
          )}
          {alerts?.out > 0 && (
            <button onClick={()=>onNavigate('inventory')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:6, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', cursor:'pointer' }}>
              <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:'var(--red)' }}><Ic n="x" size={13}/>Sin stock</span>
              <span style={{ fontFamily:'var(--font-m)', fontSize:11, color:'var(--red)' }}>{alerts.out}</span>
            </button>
          )}
        </nav>

        {/* User card */}
        <div style={{ padding:'14px', borderTop:'1px solid var(--border)' }}>
          <div style={{ background:'var(--card2)', borderRadius:9, padding:'11px 13px', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:`linear-gradient(135deg,${ri.color}44,${ri.color}22)`, border:`1px solid ${ri.color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Ic n="user" size={15} style={{ color:ri.color }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10.5, color:ri.color, fontWeight:600 }}>{ri.label}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              style={{ background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer', padding:4, borderRadius:5, display:'flex' }}>
              <Ic n="logout" size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT ──────────────────────────────── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {children}
      </main>
    </div>
  );
}
