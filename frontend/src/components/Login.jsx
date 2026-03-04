import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Ic from './ui/Icons';

export default function Login() {
  const { login } = useAuth();
  const [form,    setForm]    = useState({ username:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('Completa todos los campos.'); return; }
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const accounts = [
    { user:'admin',     pass:'admin123',    role:'Administrador', color:'#F97316' },
    { user:'operador',  pass:'oper456',     role:'Operador',      color:'#3B82F6' },
    { user:'consultor', pass:'consulta789', role:'Consultor',     color:'#22C55E' },
  ];

  return (
    <div style={{
      minHeight:'100vh', display:'flex', fontFamily:'var(--font-b)',
      background:'var(--bg)',
      backgroundImage:`
        radial-gradient(ellipse at 15% 60%, rgba(249,115,22,0.07) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.06) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.04) 0%, transparent 50%)
      `,
    }}>
      {/* Left panel */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px 56px',
        borderRight:'1px solid var(--border)',
        background:'linear-gradient(135deg, rgba(249,115,22,0.04) 0%, transparent 60%)',
      }}>
        {/* Brand */}
        <div style={{ marginBottom:48 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:32 }}>
            <div style={{
              width:52, height:52, borderRadius:14,
              background:'linear-gradient(135deg,#F97316,#C2410C)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:26, boxShadow:'0 8px 28px rgba(249,115,22,0.4)',
            }}>🚗</div>
            <div>
              <div style={{ fontFamily:'var(--font-h)', fontSize:22, fontWeight:700, letterSpacing:'0.06em' }}>AUTOPARTES PRO</div>
              <div style={{ fontFamily:'var(--font-m)', fontSize:10, color:'var(--muted)', letterSpacing:'0.08em' }}>SISTEMA DE INVENTARIO v2.0</div>
            </div>
          </div>
          <h1 style={{ fontFamily:'var(--font-h)', fontSize:36, fontWeight:700, lineHeight:1.2, marginBottom:12 }}>
            Gestión completa<br/>de tu inventario<span style={{ color:'var(--accent)' }}>.</span>
          </h1>
          <p style={{ color:'var(--text2)', fontSize:15, lineHeight:1.7, maxWidth:380 }}>
            Controla cada pieza de vehículo, registra movimientos, gestiona usuarios y visualiza reportes en tiempo real.
          </p>
        </div>

        {/* Feature list */}
        {[
          { icon:'box',     label:'Inventario completo',          desc:'60+ piezas categorizadas de sedán' },
          { icon:'activity',label:'Movimientos en tiempo real',   desc:'Entradas, salidas y ajustes de stock' },
          { icon:'chart',   label:'Dashboard con métricas',       desc:'Gráficas y alertas de stock bajo' },
          { icon:'users',   label:'Gestión de usuarios',          desc:'Roles: Admin, Operador, Consultor' },
        ].map(f => (
          <div key={f.label} style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:20 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'var(--accentDim)', border:'1px solid rgba(249,115,22,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', flexShrink:0 }}>
              <Ic n={f.icon} size={16}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{f.label}</div>
              <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right panel — form */}
      <div style={{ width:480, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px 48px', overflowY:'auto' }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:16, padding:36, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontFamily:'var(--font-h)', fontSize:24, fontWeight:700, marginBottom:6 }}>Iniciar Sesión</h2>
          <p style={{ color:'var(--muted)', fontSize:13, marginBottom:28 }}>Accede con tu usuario y contraseña</p>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Username */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Usuario</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n="user" size={15}/></span>
                <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
                  placeholder="Ingresa tu usuario" onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{ background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:7, padding:'11px 14px 11px 42px', fontSize:14, width:'100%', outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border2)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:11.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Contraseña</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n="lock" size={15}/></span>
                <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{ background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:7, padding:'11px 14px 11px 42px', fontSize:14, width:'100%', outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border2)'}
                />
              </div>
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, color:'var(--red)', fontSize:13 }}>
                <Ic n="warning" size={14}/> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'13px', fontSize:15, fontFamily:'var(--font-h)', fontWeight:600, letterSpacing:'0.04em', cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, opacity:loading?0.8:1, transition:'all 0.18s' }}
              onMouseEnter={e=>!loading&&(e.target.style.background='#FB923C')}
              onMouseLeave={e=>e.target.style.background='var(--accent)'}
            >
              {loading
                ? <><span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/> Verificando...</>
                : <><Ic n="check" size={15}/> Entrar al sistema</>
              }
            </button>
          </div>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop:20 }}>
          <p style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginBottom:12, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'var(--font-m)' }}>Cuentas de demostración</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {accounts.map(a => (
              <button key={a.user} onClick={()=>setForm({ username:a.user, password:a.pass })}
                style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'border-color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:a.color }}/>
                  <span style={{ fontFamily:'var(--font-m)', fontSize:12.5, color:'var(--text)' }}>{a.user}</span>
                  <span style={{ fontSize:11, color:'var(--muted)' }}>/ {a.pass}</span>
                </div>
                <span style={{ fontSize:11, color:a.color, fontWeight:600 }}>{a.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
