import { useState, useEffect, useCallback } from 'react';
import { partsApi, statsApi } from '../api/client';
import { Modal, Btn, Badge, Input, Select } from './ui/Modal';
import { toast } from './ui/Toast';
import Ic from './ui/Icons';
import { useAuth } from '../context/AuthContext';

const MAKES = ['Toyota','Honda','Nissan','Chevrolet','Ford','Volkswagen','Hyundai','Kia','Mazda','Mitsubishi','Suzuki','Dodge','BMW','Mercedes-Benz','Audi','Seat','Peugeot','Renault'];
const CONDITIONS = ['Excelente','Bueno','Regular','Para reparar'];
const fmt = n => `$${Number(n||0).toLocaleString('es-MX',{minimumFractionDigits:0})}`;
const fmtDate = s => s ? new Date(s).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}) : '—';

function stockBadge(stock, minStock) {
  if (stock===0)            return <Badge color="red">Agotado</Badge>;
  if (stock<=minStock)      return <Badge color="yellow">Bajo ({stock})</Badge>;
  return                           <Badge color="green">En stock ({stock})</Badge>;
}
function condBadge(c) {
  const m={Excelente:'blue',Bueno:'green',Regular:'yellow','Para reparar':'red'};
  return <Badge color={m[c]||'gray'}>{c}</Badge>;
}

function PartForm({ part, categories, onSave, onClose }) {
  const init = part ? { ...part, category_id: part.category_id } : {
    sku:'', name:'', category_id:'', make:'Toyota', model:'', year:new Date().getFullYear(),
    condition:'Bueno', stock:0, min_stock:2, price:'', cost:'', location:'', notes:'',
  };
  const [f, setF] = useState(init);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k,v) => { setF(p=>({...p,[k]:v})); setErr(e=>({...e,[k]:null})); };

  const validate = () => {
    const e={};
    if(!f.sku.trim())   e.sku='Requerido';
    if(!f.name.trim())  e.name='Requerido';
    if(!f.category_id)  e.category_id='Selecciona una categoría';
    if(!f.model.trim()) e.model='Requerido';
    if(!f.price||isNaN(f.price)||Number(f.price)<0) e.price='Precio inválido';
    if(!f.location.trim()) e.location='Requerido';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if(Object.keys(e).length>0){ setErr(e); return; }
    setSaving(true);
    try {
      const data = {...f, price:Number(f.price), cost:Number(f.cost)||0, stock:Number(f.stock), min_stock:Number(f.min_stock), year:Number(f.year)};
      if(part?.id) await partsApi.update(part.id, data);
      else         await partsApi.create(data);
      onSave();
    } catch(err) {
      toast(err.response?.data?.error || 'Error al guardar', 'error');
    } finally { setSaving(false); }
  };

  const Row = ({children, cols='1fr 1fr'}) => <div style={{display:'grid',gridTemplateColumns:cols,gap:14}}>{children}</div>;

  return (
    <Modal title={part?.id?'✏️ Editar Pieza':'➕ Nueva Pieza'} subtitle={part?.id?`SKU: ${part.sku}`:'Completa todos los campos'} size="lg" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Guardando...':part?.id?'Guardar Cambios':'Registrar Pieza'}</Btn></>}
    >
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Row cols="1fr 1fr">
          <Input label="SKU / Código *" value={f.sku} onChange={e=>set('sku',e.target.value)} placeholder="Ej: MOT-001" error={err.sku}/>
          <Select label="Categoría *" value={f.category_id} onChange={e=>set('category_id',e.target.value)} error={err.category_id}>
            <option value="">— Seleccionar —</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </Select>
        </Row>
        <Input label="Nombre de la Pieza *" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Ej: Motor Completo 1.6L" error={err.name}/>
        <Row cols="1fr 1fr 1fr">
          <Select label="Marca" value={f.make} onChange={e=>set('make',e.target.value)}>
            {MAKES.map(m=><option key={m}>{m}</option>)}
          </Select>
          <Input label="Modelo *" value={f.model} onChange={e=>set('model',e.target.value)} placeholder="Ej: Corolla" error={err.model}/>
          <Input label="Año" type="number" value={f.year} onChange={e=>set('year',e.target.value)} min={1990} max={2030}/>
        </Row>
        <Row cols="1fr 1fr 1fr">
          <Select label="Condición" value={f.condition} onChange={e=>set('condition',e.target.value)}>
            {CONDITIONS.map(c=><option key={c}>{c}</option>)}
          </Select>
          <Input label="Stock inicial" type="number" value={f.stock} onChange={e=>set('stock',e.target.value)} min={0}/>
          <Input label="Stock mínimo" type="number" value={f.min_stock} onChange={e=>set('min_stock',e.target.value)} min={0}/>
        </Row>
        <Row cols="1fr 1fr 1fr">
          <Input label="Precio venta (MXN) *" type="number" value={f.price} onChange={e=>set('price',e.target.value)} placeholder="0" error={err.price}/>
          <Input label="Costo (MXN)" type="number" value={f.cost} onChange={e=>set('cost',e.target.value)} placeholder="0"/>
          <Input label="Ubicación almacén *" value={f.location} onChange={e=>set('location',e.target.value)} placeholder="Ej: A-01" error={err.location}/>
        </Row>
        <div>
          <label style={{display:'block',fontSize:11.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--muted)',marginBottom:6}}>Notas / Descripción</label>
          <textarea value={f.notes} onChange={e=>set('notes',e.target.value)} rows={3}
            placeholder="Observaciones, estado, km, procedencia, etc."
            style={{background:'var(--surface)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:6,padding:'10px 14px',fontSize:14,width:'100%',outline:'none',resize:'vertical',fontFamily:'var(--font-b)'}}/>
        </div>
      </div>
    </Modal>
  );
}

function MovementModal({ part, onClose, onDone }) {
  const [f,   setF]   = useState({ type:'entrada', quantity:1, reason:'' });
  const [loading, setL] = useState(false);

  const submit = async () => {
    if(!f.quantity||Number(f.quantity)<=0){ toast('Cantidad inválida','error'); return; }
    setL(true);
    try {
      await partsApi.movement(part.id, { ...f, quantity:Number(f.quantity) });
      toast(`Movimiento registrado: ${f.type} x${f.quantity}`, 'success');
      onDone();
    } catch(e) {
      toast(e.response?.data?.error||'Error al registrar', 'error');
    } finally { setL(false); }
  };

  const typeColor = { entrada:'var(--green)', salida:'var(--red)', ajuste:'var(--yellow)', venta:'var(--blue)' };

  return (
    <Modal title="📦 Registrar Movimiento" subtitle={`${part.sku} — ${part.name}`} size="sm" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn onClick={submit} disabled={loading}>{loading?'Registrando...':'Registrar'}</Btn></>}
    >
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'var(--muted)',fontSize:13}}>Stock actual</span>
          <span style={{fontFamily:'var(--font-m)',fontSize:16,fontWeight:600,color:'var(--text)'}}>{part.stock} uds.</span>
        </div>
        <div>
          <label style={{display:'block',fontSize:11.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Tipo de Movimiento</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[{t:'entrada',label:'📥 Entrada'},{t:'salida',label:'📤 Salida'},{t:'venta',label:'🏷️ Venta'},{t:'ajuste',label:'🔧 Ajuste'}].map(({t,label})=>(
              <button key={t} onClick={()=>setF(p=>({...p,type:t}))}
                style={{padding:'10px',borderRadius:7,border:`1px solid ${f.type===t?typeColor[t]:'var(--border2)'}`,background:f.type===t?`${typeColor[t]}15`:'var(--surface)',color:f.type===t?typeColor[t]:'var(--text2)',cursor:'pointer',fontSize:13,fontFamily:'var(--font-b)',fontWeight:f.type===t?600:400,transition:'all 0.15s'}}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <Input label={f.type==='ajuste'?'Nuevo valor de stock':'Cantidad'} type="number" value={f.quantity} onChange={e=>setF(p=>({...p,quantity:e.target.value}))} min={1}/>
        <Input label="Motivo / Observaciones" value={f.reason} onChange={e=>setF(p=>({...p,reason:e.target.value}))} placeholder="Ej: Venta cliente, compra proveedor..."/>
      </div>
    </Modal>
  );
}

function ViewModal({ part, onEdit, onClose }) {
  const cat = { icon: part.cat_icon||'📦', label: part.cat_label||'—', color: part.cat_color||'#94A3B8' };
  const margin = part.price&&part.cost ? ((part.price-part.cost)/part.price*100).toFixed(1) : null;

  return (
    <Modal title="Vista detalle" subtitle={`SKU: ${part.sku}`} size="md" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cerrar</Btn><Btn onClick={()=>{onClose();onEdit(part);}}>✏️ Editar</Btn></>}
    >
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {/* Header card */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:10,padding:'14px 18px',display:'flex',gap:14,alignItems:'center'}}>
          <div style={{width:48,height:48,borderRadius:10,background:`${cat.color}18`,border:`1px solid ${cat.color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
            {cat.icon}
          </div>
          <div>
            <div style={{fontFamily:'var(--font-h)',fontSize:17,fontWeight:700}}>{part.name}</div>
            <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontFamily:'var(--font-m)',fontSize:11,color:'var(--accent)'}}>{part.sku}</span>
              {condBadge(part.condition)}
              {stockBadge(part.stock, part.min_stock)}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            ['Categoría', cat.label],
            ['Vehículo',  `${part.make} ${part.model} ${part.year}`],
            ['Precio',    fmt(part.price)],
            ['Costo',     fmt(part.cost)],
            ['Margen',    margin?`${margin}%`:'—'],
            ['Ubicación', part.location],
            ['Stock',     `${part.stock} uds.`],
            ['Mín stock', `${part.min_stock} uds.`],
          ].map(([k,v])=>(
            <div key={k} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:'var(--font-h)',marginBottom:3}}>{k}</div>
              <div style={{fontSize:14,fontWeight:500}}>{v}</div>
            </div>
          ))}
        </div>

        {part.notes && (
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 16px'}}>
            <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:'var(--font-h)',marginBottom:6}}>Notas</div>
            <div style={{fontSize:13.5,lineHeight:1.65,color:'var(--text2)'}}>{part.notes}</div>
          </div>
        )}
        <div style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-m)',textAlign:'right'}}>
          Creado: {fmtDate(part.created_at)} · Actualizado: {fmtDate(part.updated_at)}
        </div>
      </div>
    </Modal>
  );
}

export default function Inventory() {
  const { user } = useAuth();
  const [parts,    setParts]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [cats,     setCats]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const LIMIT = 15;

  const [filters, setFilters] = useState({ search:'', category:'', condition:'', stock:'', sort:'name', dir:'asc' });
  const [modal,   setModal]   = useState(null); // null | {type, part?}

  const setFilter = (k,v) => { setFilters(f=>({...f,[k]:v})); setPage(1); };
  const clearFilters = () => { setFilters({ search:'', category:'', condition:'', stock:'', sort:'name', dir:'asc' }); setPage(1); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await partsApi.list({ ...filters, page, limit:LIMIT });
      setParts(r.data.data); setTotal(r.data.total);
    } catch { toast('Error al cargar inventario','error'); }
    finally  { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { statsApi.categories().then(r=>setCats(r.data)).catch(()=>{}); }, []);

  const handleDelete = async (part) => {
    if(!window.confirm(`¿Eliminar "${part.name}" (${part.sku})?`)) return;
    try {
      await partsApi.remove(part.id);
      toast(`"${part.name}" eliminado`, 'warning');
      load();
    } catch(e) { toast(e.response?.data?.error||'Error al eliminar','error'); }
  };

  const totalPages = Math.ceil(total/LIMIT);
  const canWrite   = user?.role !== 'consultor';

  const SortBtn = ({col}) => (
    <button onClick={()=>{ const nd=filters.sort===col&&filters.dir==='asc'?'desc':'asc'; setFilter('sort',col); setFilter('dir',nd); }}
      style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',padding:'0 2px',display:'inline-flex',alignItems:'center'}}>
      {filters.sort===col ? <Ic n={filters.dir==='asc'?'arrowUp':'arrowDown'} size={12}/> : <Ic n="arrowUpDown" size={12}/>}
    </button>
  );

  const exportCSV = () => {
    const headers = ['SKU','Nombre','Categoría','Marca','Modelo','Año','Condición','Stock','Precio','Ubicación'];
    const rows    = parts.map(p=>[p.sku,p.name,p.cat_label,p.make,p.model,p.year,p.condition,p.stock,p.price,p.location]);
    const csv     = [headers,...rows].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download='inventario.csv'; a.click();
    toast('CSV exportado correctamente','success');
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'18px 28px 14px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div>
            <h1 style={{fontFamily:'var(--font-h)',fontSize:22,fontWeight:700,letterSpacing:'0.03em'}}>Inventario de Piezas</h1>
            <p style={{color:'var(--muted)',fontSize:12.5,marginTop:2}}>{total} pieza{total!==1?'s':''} registrada{total!==1?'s':''} · Página {page}/{totalPages||1}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn variant="ghost" size="sm" onClick={exportCSV}><Ic n="download" size={13}/>Exportar CSV</Btn>
            <Btn variant="ghost" size="sm" onClick={load}><Ic n="refresh" size={13}/>Refrescar</Btn>
            {canWrite && <Btn size="sm" onClick={()=>setModal({type:'add'})}><Ic n="plus" size={13}/>Nueva Pieza</Btn>}
          </div>
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',flex:'1 1 200px',minWidth:160}}>
            <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--muted)'}}><Ic n="search" size={14}/></span>
            <input value={filters.search} onChange={e=>setFilter('search',e.target.value)} placeholder="Buscar SKU, nombre, marca..."
              style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:6,padding:'8px 12px 8px 34px',fontSize:13.5,width:'100%',outline:'none'}}
              onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
          </div>
          <select value={filters.category} onChange={e=>setFilter('category',e.target.value)}
            style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:6,padding:'8px 12px',fontSize:13,outline:'none',cursor:'pointer',height:36}}>
            <option value="">📂 Categoría</option>
            {cats.map(c=><option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
          </select>
          <select value={filters.condition} onChange={e=>setFilter('condition',e.target.value)}
            style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:6,padding:'8px 12px',fontSize:13,outline:'none',cursor:'pointer',height:36}}>
            <option value="">🔧 Condición</option>
            {CONDITIONS.map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={filters.stock} onChange={e=>setFilter('stock',e.target.value)}
            style={{background:'var(--card)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:6,padding:'8px 12px',fontSize:13,outline:'none',cursor:'pointer',height:36}}>
            <option value="">📦 Stock</option>
            <option value="ok">En stock</option>
            <option value="low">Bajo</option>
            <option value="out">Agotado</option>
          </select>
          {(filters.search||filters.category||filters.condition||filters.stock) && (
            <Btn variant="ghost" size="sm" onClick={clearFilters}><Ic n="x" size={12}/>Limpiar</Btn>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px',gap:12,color:'var(--muted)'}}>
            <span style={{width:18,height:18,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>
            Cargando...
          </div>
        ) : parts.length===0 ? (
          <div style={{padding:'60px',textAlign:'center',color:'var(--muted)'}}>
            <div style={{fontSize:42,marginBottom:12}}>🔍</div>
            <p style={{fontSize:16,fontWeight:600,color:'var(--text)'}}>Sin resultados</p>
            <p style={{fontSize:13,marginTop:4}}>Intenta con otros filtros de búsqueda.</p>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-b)'}}>
            <thead>
              <tr style={{background:'var(--surface)',position:'sticky',top:0,zIndex:2}}>
                {[['SKU','sku'],['Pieza','name'],['Categoría','category_id'],['Vehículo','make'],['Condición','condition'],['Stock','stock'],['Precio','price'],['Costo','cost'],['Ubicación','location'],['Acciones',null]].map(([h,k])=>(
                  <th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:10.5,fontFamily:'var(--font-h)',textTransform:'uppercase',letterSpacing:'0.09em',color:'var(--muted)',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>
                    {h}{k&&<SortBtn col={k}/>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parts.map((p,i)=>(
                <tr key={p.id} style={{borderBottom:'1px solid var(--border)',transition:'background 0.12s',animation:`fadeIn 0.3s ${i*0.02}s ease both`}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(249,115,22,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'11px 14px',fontFamily:'var(--font-m)',fontSize:11.5,color:'var(--accent)',whiteSpace:'nowrap'}}>{p.sku}</td>
                  <td style={{padding:'11px 14px',fontWeight:500,fontSize:13.5,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</td>
                  <td style={{padding:'11px 14px'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:5,fontSize:11.5,background:`${p.cat_color}18`,color:p.cat_color,border:`1px solid ${p.cat_color}35`,fontFamily:'var(--font-h)',fontWeight:600,whiteSpace:'nowrap'}}>
                      {p.cat_icon} {p.cat_label}
                    </span>
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{fontSize:13}}>{p.make} {p.model}</div>
                    <div style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-m)'}}>{p.year}</div>
                  </td>
                  <td style={{padding:'11px 14px'}}>{condBadge(p.condition)}</td>
                  <td style={{padding:'11px 14px'}}>{stockBadge(p.stock,p.min_stock)}</td>
                  <td style={{padding:'11px 14px',fontFamily:'var(--font-m)',fontSize:13,fontWeight:600,color:'var(--green)',whiteSpace:'nowrap'}}>{fmt(p.price)}</td>
                  <td style={{padding:'11px 14px',fontFamily:'var(--font-m)',fontSize:12.5,color:'var(--muted)',whiteSpace:'nowrap'}}>{fmt(p.cost)}</td>
                  <td style={{padding:'11px 14px'}}>
                    <span style={{fontFamily:'var(--font-m)',fontSize:11.5,background:'var(--surface)',padding:'3px 8px',borderRadius:4,border:'1px solid var(--border2)'}}>{p.location}</span>
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:5}}>
                      <button title="Ver detalle" onClick={()=>setModal({type:'view',part:p})} style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:5,padding:'5px 7px',color:'var(--blue)',cursor:'pointer',display:'flex',alignItems:'center'}}><Ic n="eye" size={13}/></button>
                      {canWrite&&<><button title="Registrar movimiento" onClick={()=>setModal({type:'movement',part:p})} style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:5,padding:'5px 7px',color:'var(--green)',cursor:'pointer',display:'flex',alignItems:'center'}}><Ic n="move" size={13}/></button>
                      <button title="Editar" onClick={()=>setModal({type:'edit',part:p})} style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.25)',borderRadius:5,padding:'5px 7px',color:'var(--accent)',cursor:'pointer',display:'flex',alignItems:'center'}}><Ic n="edit" size={13}/></button>
                      <button title="Eliminar" onClick={()=>handleDelete(p)} style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:5,padding:'5px 7px',color:'var(--red)',cursor:'pointer',display:'flex',alignItems:'center'}}><Ic n="trash" size={13}/></button></>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages>1 && (
        <div style={{padding:'12px 28px',borderTop:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',gap:6,flexShrink:0}}>
          <Btn variant="ghost" size="sm" onClick={()=>setPage(p=>p-1)} disabled={page<=1}>← Anterior</Btn>
          {Array.from({length:Math.min(totalPages,7)},(_,i)=>{const n=i+1;return(
            <button key={n} onClick={()=>setPage(n)} style={{width:32,height:32,borderRadius:6,fontSize:13,fontWeight:600,background:n===page?'var(--accent)':'var(--card)',color:n===page?'#fff':'var(--muted)',border:`1px solid ${n===page?'var(--accent)':'var(--border2)'}`,cursor:'pointer'}}>{n}</button>
          );})}
          <Btn variant="ghost" size="sm" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages}>Siguiente →</Btn>
        </div>
      )}

      {/* Modals */}
      {modal?.type==='add'      && <PartForm categories={cats} onSave={()=>{setModal(null);load();toast('Pieza creada correctamente','success');}} onClose={()=>setModal(null)}/>}
      {modal?.type==='edit'     && <PartForm part={modal.part} categories={cats} onSave={()=>{setModal(null);load();toast('Pieza actualizada correctamente','success');}} onClose={()=>setModal(null)}/>}
      {modal?.type==='view'     && <ViewModal part={modal.part} onEdit={p=>setModal({type:'edit',part:p})} onClose={()=>setModal(null)}/>}
      {modal?.type==='movement' && <MovementModal part={modal.part} onClose={()=>setModal(null)} onDone={()=>{setModal(null);load();}}/>}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
