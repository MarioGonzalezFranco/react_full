import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { statsApi } from '../api/client';
import { Badge } from './ui/Modal';
import Ic from './ui/Icons';

const fmt = n => `$${Number(n||0).toLocaleString('es-MX',{minimumFractionDigits:0})}`;
const fmtDate = s => s ? new Date(s).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}) : '—';

const MOVE_COLORS = { entrada:'#22C55E', salida:'#EF4444', ajuste:'#EAB308', venta:'#3B82F6' };
const COND_COLORS = { Excelente:'#22C55E', Bueno:'#3B82F6', Regular:'#EAB308', 'Para reparar':'#EF4444' };

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden', transition:'transform 0.2s, border-color 0.2s' }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:color }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:38, height:38, borderRadius:9, background:`${color}1A`, border:`1px solid ${color}35`, display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</div>
        {sub && <span style={{ fontSize:11, color:'var(--muted)', background:'var(--surface)', padding:'2px 8px', borderRadius:4, border:'1px solid var(--border)', fontFamily:'var(--font-m)' }}>{sub}</span>}
      </div>
      <div style={{ fontFamily:'var(--font-h)', fontSize:28, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:6, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-h)' }}>{label}</div>
    </div>
  );
}

function MovTypeBadge({ type }) {
  const m = { entrada:{c:'green',t:'ENTRADA'}, salida:{c:'red',t:'SALIDA'}, ajuste:{c:'yellow',t:'AJUSTE'}, venta:{c:'blue',t:'VENTA'} };
  const v = m[type] || { c:'gray', t:type?.toUpperCase() };
  return <Badge color={v.c}>{v.t}</Badge>;
}

export default function Dashboard({ onNavigate }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await statsApi.dashboard(); setData(r.data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, gap:12, color:'var(--muted)' }}>
      <span style={{ width:20,height:20,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/>
      Cargando dashboard...
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  const { totals={}, byCategory=[], byCondition=[], recentMovements=[], topValue=[], alertLow=[], alertOut=[], movsByDay=[] } = data || {};

  // Prepare chart data
  const catChartData = byCategory.slice(0,8).map(c => ({ name: c.label.replace('Sistema ',''), count: c.count, units: c.units, color: c.color }));
  const condData     = byCondition.map(c => ({ name: c.condition, value: c.count, color: COND_COLORS[c.condition]||'#94A3B8' }));
  const daysData     = movsByDay.map(d => ({ day: d.day?.slice(5), entradas: d.entradas||0, salidas: d.salidas||0 }));

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-h)', fontSize:24, fontWeight:700, letterSpacing:'0.03em' }}>Dashboard</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:3 }}>Resumen general del inventario de autopartes</p>
        </div>
        <button onClick={load} style={{ background:'var(--card)', border:'1px solid var(--border2)', color:'var(--text2)', borderRadius:7, padding:'8px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontSize:13, fontFamily:'var(--font-b)' }}>
          <Ic n="refresh" size={14}/>Actualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14 }}>
        <StatCard label="Total Piezas"   value={totals.total_parts||0}   icon={<Ic n="package" size={17}/>} color="#F97316"/>
        <StatCard label="Unidades Stock" value={totals.total_units||0}   icon={<Ic n="box" size={17}/>}     color="#3B82F6"/>
        <StatCard label="En Stock"       value={totals.in_stock||0}      icon={<Ic n="check" size={17}/>}   color="#22C55E"/>
        <StatCard label="Stock Bajo"     value={totals.low_stock||0}     icon={<Ic n="warning" size={17}/>} color="#EAB308" sub="Alerta"/>
        <StatCard label="Sin Stock"      value={totals.out_of_stock||0}  icon={<Ic n="x" size={17}/>}       color="#EF4444" sub="Crítico"/>
        <StatCard label="Valor Total"    value={fmt(totals.total_value)} icon={<Ic n="chart" size={17}/>}   color="#A855F7" sub="MXN"/>
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr', gap:18 }}>
        {/* Category bar chart */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'20px 20px 12px' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700, marginBottom:16 }}>Piezas por Categoría</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catChartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'#5C6B88' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'#5C6B88' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} cursor={{ fill:'rgba(249,115,22,0.06)' }}/>
              <Bar dataKey="count" name="Piezas" radius={[4,4,0,0]}>
                {catChartData.map((e,i)=><Cell key={i} fill={e.color||'#F97316'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Condition pie */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'20px 20px 12px' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700, marginBottom:16 }}>Por Condición</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={condData} cx="50%" cy="45%" outerRadius={65} innerRadius={38} paddingAngle={3} dataKey="value" label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {condData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }}/>
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize:11, paddingTop:6 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Movements area chart */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'20px 20px 12px' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700, marginBottom:16 }}>Movimientos 7 días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daysData} margin={{ top:0, right:0, left:-28, bottom:0 }}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/></linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize:9, fill:'#5C6B88' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:9, fill:'#5C6B88' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }}/>
              <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#22C55E" fill="url(#gE)" strokeWidth={2}/>
              <Area type="monotone" dataKey="salidas"  name="Salidas"  stroke="#EF4444" fill="url(#gS)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr', gap:18 }}>
        {/* Recent movements */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700 }}>Últimos Movimientos</h3>
            <button onClick={()=>onNavigate('movements')} style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-b)' }}>Ver todos →</button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['SKU','Pieza','Tipo','Cant.','Fecha'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'8px 14px', fontSize:10.5, color:'var(--muted)', fontFamily:'var(--font-h)', textTransform:'uppercase', letterSpacing:'0.08em', background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMovements.slice(0,8).map((m,i)=>(
                  <tr key={m.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'9px 14px', fontFamily:'var(--font-m)', fontSize:11, color:'var(--accent)' }}>{m.sku}</td>
                    <td style={{ padding:'9px 14px', fontSize:12.5, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.part_name}</td>
                    <td style={{ padding:'9px 14px' }}><MovTypeBadge type={m.type}/></td>
                    <td style={{ padding:'9px 14px', fontFamily:'var(--font-m)', fontSize:12, color: m.type==='entrada'?'var(--green)':'var(--red)' }}>{m.type==='entrada'?'+':'-'}{m.quantity}</td>
                    <td style={{ padding:'9px 14px', fontSize:11, color:'var(--muted)' }}>{fmtDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top value */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700 }}>Mayor Valor en Stock</h3>
          </div>
          <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {topValue.map((p,i)=>(
              <div key={p.sku} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background: i===0?'rgba(249,115,22,0.2)':i===1?'rgba(59,130,246,0.15)':'rgba(100,116,139,0.15)', color: i===0?'var(--accent)':i===1?'var(--blue)':'var(--muted)', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize:10.5, color:'var(--muted)', fontFamily:'var(--font-m)' }}>{p.sku} · x{p.stock}</div>
                </div>
                <span style={{ fontFamily:'var(--font-m)', fontSize:12, color:'var(--green)', flexShrink:0 }}>{fmt(p.total_value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:700 }}>Alertas de Stock</h3>
            <Ic n="bell" size={14} style={{ color:'var(--yellow)' }}/>
          </div>
          <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {alertOut.slice(0,3).map(p=>(
              <div key={p.sku} style={{ padding:'8px 10px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:'var(--font-m)', fontSize:11, color:'var(--red)' }}>{p.sku}</span>
                  <Badge color="red">SIN STOCK</Badge>
                </div>
                <div style={{ fontSize:12, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
              </div>
            ))}
            {alertLow.slice(0,4).map(p=>(
              <div key={p.sku} style={{ padding:'8px 10px', background:'rgba(234,179,8,0.07)', border:'1px solid rgba(234,179,8,0.18)', borderRadius:7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:'var(--font-m)', fontSize:11, color:'var(--yellow)' }}>{p.sku}</span>
                  <Badge color="yellow">BAJO ({p.stock})</Badge>
                </div>
                <div style={{ fontSize:12, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
              </div>
            ))}
            {alertOut.length===0&&alertLow.length===0&&(
              <div style={{ textAlign:'center', padding:'20px', color:'var(--muted)', fontSize:13 }}>
                <div style={{ fontSize:24, marginBottom:6 }}>✅</div>Todo el stock en niveles normales
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
