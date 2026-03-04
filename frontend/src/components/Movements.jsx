import { useState, useEffect, useCallback } from 'react';
import { statsApi } from '../api/client';
import { Badge } from './ui/Modal';
import Ic from './ui/Icons';

const fmtDate = s => s ? new Date(s).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}) : '—';
const TYPES = ['entrada','salida','venta','ajuste'];

function MovBadge({ type }) {
  const m = { entrada:{c:'green',label:'📥 ENTRADA'}, salida:{c:'red',label:'📤 SALIDA'}, ajuste:{c:'yellow',label:'🔧 AJUSTE'}, venta:{c:'blue',label:'🏷️ VENTA'} };
  const v = m[type]||{c:'gray',label:type?.toUpperCase()};
  return <Badge color={v.c}>{v.label}</Badge>;
}

export default function Movements() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [type,    setType]    = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await statsApi.movements({ page, limit:LIMIT, type });
      setData(r.data.data); setTotal(r.data.total);
    } catch {} finally { setLoading(false); }
  }, [page, type]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total/LIMIT);

  // summary counts
  const counts = data.reduce((acc,m)=>{ acc[m.type]=(acc[m.type]||0)+1; return acc; }, {});

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'18px 28px 14px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <h1 style={{fontFamily:'var(--font-h)',fontSize:22,fontWeight:700,letterSpacing:'0.03em'}}>Registro de Movimientos</h1>
            <p style={{color:'var(--muted)',fontSize:12.5,marginTop:2}}>{total} movimiento{total!==1?'s':''} registrado{total!==1?'s':''}</p>
          </div>
          <button onClick={load} style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:7,padding:'8px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:7,fontSize:13,fontFamily:'var(--font-b)'}}>
            <Ic n="refresh" size={14}/>Actualizar
          </button>
        </div>

        {/* Type filter tabs */}
        <div style={{display:'flex',gap:6}}>
          {[{v:'',l:'Todos'},{v:'entrada',l:'📥 Entradas'},{v:'salida',l:'📤 Salidas'},{v:'venta',l:'🏷️ Ventas'},{v:'ajuste',l:'🔧 Ajustes'}].map(f=>(
            <button key={f.v} onClick={()=>{setType(f.v);setPage(1);}}
              style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${type===f.v?'var(--accent)':'var(--border2)'}`,background:type===f.v?'var(--accentDim)':'var(--card)',color:type===f.v?'var(--accent)':'var(--text2)',fontSize:13,cursor:'pointer',fontFamily:'var(--font-b)',fontWeight:type===f.v?600:400,transition:'all 0.15s'}}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{padding:'16px 28px 0',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[
          {type:'entrada', label:'Entradas',  color:'var(--green)',  icon:'📥'},
          {type:'salida',  label:'Salidas',   color:'var(--red)',    icon:'📤'},
          {type:'venta',   label:'Ventas',    color:'var(--blue)',   icon:'🏷️'},
          {type:'ajuste',  label:'Ajustes',   color:'var(--yellow)', icon:'🔧'},
        ].map(s=>(
          <div key={s.type} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:9,padding:'14px 16px',cursor:'pointer',transition:'all 0.15s'}}
            onClick={()=>{setType(s.type===type?'':s.type);setPage(1);}}
            style={{background:type===s.type?`${s.color}0D`:'var(--card)',border:`1px solid ${type===s.type?s.color+'40':'var(--border)'}`,borderRadius:9,padding:'14px 16px',cursor:'pointer',transition:'all 0.15s'}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:'var(--font-h)',fontSize:22,fontWeight:700,color:s.color}}>{counts[s.type]||0}</div>
            <div style={{fontSize:11.5,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:'var(--font-h)'}}>{s.label} <span style={{fontStyle:'normal',color:'var(--muted)',fontSize:10}}>(página actual)</span></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto',padding:'16px 28px 0'}}>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'48px',gap:12,color:'var(--muted)'}}>
              <span style={{width:18,height:18,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>Cargando...
            </div>
          ) : data.length===0 ? (
            <div style={{padding:'48px',textAlign:'center',color:'var(--muted)'}}>
              <div style={{fontSize:40,marginBottom:10}}>📋</div>
              <p style={{fontSize:15,color:'var(--text)'}}>Sin movimientos registrados</p>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-b)'}}>
              <thead>
                <tr style={{background:'var(--surface)'}}>
                  {['#','Pieza (SKU)','Nombre','Tipo','Cant.','Stock anterior','Stock nuevo','Motivo','Responsable','Fecha'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:10.5,fontFamily:'var(--font-h)',textTransform:'uppercase',letterSpacing:'0.09em',color:'var(--muted)',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((m,i)=>{
                  const delta = m.new_stock - m.prev_stock;
                  return (
                    <tr key={m.id} style={{borderBottom:'1px solid var(--border)',animation:`fadeIn 0.3s ${i*0.02}s ease both`}}>
                      <td style={{padding:'10px 14px',fontFamily:'var(--font-m)',fontSize:11,color:'var(--muted)'}}>{m.id}</td>
                      <td style={{padding:'10px 14px',fontFamily:'var(--font-m)',fontSize:11.5,color:'var(--accent)',whiteSpace:'nowrap'}}>{m.sku}</td>
                      <td style={{padding:'10px 14px',fontSize:13,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.part_name}</td>
                      <td style={{padding:'10px 14px'}}><MovBadge type={m.type}/></td>
                      <td style={{padding:'10px 14px',fontFamily:'var(--font-m)',fontSize:13,fontWeight:600,color:delta>=0?'var(--green)':'var(--red)'}}>
                        {delta>=0?'+':''}{delta}
                      </td>
                      <td style={{padding:'10px 14px',fontFamily:'var(--font-m)',fontSize:12,color:'var(--muted)'}}>{m.prev_stock}</td>
                      <td style={{padding:'10px 14px',fontFamily:'var(--font-m)',fontSize:12,fontWeight:600}}>{m.new_stock}</td>
                      <td style={{padding:'10px 14px',fontSize:12.5,color:'var(--text2)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.reason||'—'}</td>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)'}}/>
                          <span style={{fontSize:12.5}}>{m.user_name}</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11.5,color:'var(--muted)',fontFamily:'var(--font-m)',whiteSpace:'nowrap'}}>{fmtDate(m.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages>1 && (
        <div style={{padding:'12px 28px 16px',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          <button onClick={()=>setPage(p=>p-1)} disabled={page<=1} style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:6,padding:'7px 14px',cursor:page<=1?'not-allowed':'pointer',opacity:page<=1?0.4:1,fontFamily:'var(--font-b)',fontSize:13}}>← Anterior</button>
          {Array.from({length:Math.min(totalPages,8)},(_,i)=>i+1).map(n=>(
            <button key={n} onClick={()=>setPage(n)} style={{width:32,height:32,borderRadius:6,fontSize:13,fontWeight:600,background:n===page?'var(--accent)':'var(--card)',color:n===page?'#fff':'var(--muted)',border:`1px solid ${n===page?'var(--accent)':'var(--border2)'}`,cursor:'pointer'}}>{n}</button>
          ))}
          <button onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages} style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text2)',borderRadius:6,padding:'7px 14px',cursor:page>=totalPages?'not-allowed':'pointer',opacity:page>=totalPages?0.4:1,fontFamily:'var(--font-b)',fontSize:13}}>Siguiente →</button>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
