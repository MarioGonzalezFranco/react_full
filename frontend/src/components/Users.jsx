import { useState, useEffect } from 'react';
import { usersApi } from '../api/client';
import { Modal, Btn, Badge, Input, Select } from './ui/Modal';
import { toast } from './ui/Toast';
import Ic from './ui/Icons';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { val:'admin',     label:'Administrador', color:'#F97316', desc:'Acceso total al sistema' },
  { val:'operador',  label:'Operador',      color:'#3B82F6', desc:'Gestión de inventario y movimientos' },
  { val:'consultor', label:'Consultor',     color:'#22C55E', desc:'Solo lectura del inventario' },
];

const fmtDate = s => s ? new Date(s).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}) : 'Nunca';

function UserForm({ user:u, onSave, onClose }) {
  const [f,  setF] = useState({ username:u?.username||'', name:u?.name||'', email:u?.email||'', role:u?.role||'operador', password:'', active: u?.active!==undefined?u.active:1 });
  const [err,setErr] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k,v) => { setF(p=>({...p,[k]:v})); setErr(e=>({...e,[k]:null})); };

  const validate = () => {
    const e={};
    if(!f.name.trim())  e.name='Requerido';
    if(!f.email.trim()) e.email='Requerido';
    if(!u && !f.username.trim()) e.username='Requerido';
    if(!u && !f.password.trim()) e.password='Requerido';
    if(f.password && f.password.length<6) e.password='Mínimo 6 caracteres';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if(Object.keys(e).length>0){ setErr(e); return; }
    setSaving(true);
    try {
      const data = { ...f };
      if(!data.password) delete data.password;
      if(u) await usersApi.update(u.id, data);
      else  await usersApi.create(data);
      onSave();
    } catch(err) {
      toast(err.response?.data?.error||'Error al guardar','error');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={u?`✏️ Editar — ${u.username}`:'👤 Nuevo Usuario'} subtitle={u?`ID: ${u.id} · ${u.role}`:'Crea un nuevo usuario del sistema'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn onClick={handleSave} disabled={saving}>{saving?'Guardando...':u?'Guardar Cambios':'Crear Usuario'}</Btn></>}
    >
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {!u && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Input label="Usuario (login) *" value={f.username} onChange={e=>set('username',e.target.value)} placeholder="Ej: jperez" error={err.username}/>
            <Input label="Contraseña *" type="password" value={f.password} onChange={e=>set('password',e.target.value)} placeholder="Mínimo 6 caracteres" error={err.password}/>
          </div>
        )}
        {u && (
          <Input label="Nueva contraseña (dejar en blanco para no cambiar)" type="password" value={f.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" error={err.password}/>
        )}
        <Input label="Nombre completo *" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="Ej: Juan Pérez García" error={err.name}/>
        <Input label="Correo electrónico *" type="email" value={f.email} onChange={e=>set('email',e.target.value)} placeholder="Ej: juan@empresa.mx" error={err.email}/>

        <div>
          <label style={{display:'block',fontSize:11.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Rol del usuario</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {ROLES.map(r=>(
              <label key={r.val} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',borderRadius:8,border:`1px solid ${f.role===r.val?r.color+'50':'var(--border2)'}`,background:f.role===r.val?`${r.color}0C`:'var(--surface)',cursor:'pointer',transition:'all 0.15s'}}>
                <input type="radio" checked={f.role===r.val} onChange={()=>set('role',r.val)} style={{marginTop:2,accentColor:r.color}}/>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:f.role===r.val?r.color:'var(--text)'}}>{r.label}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {u && (
          <Select label="Estado de la cuenta" value={f.active} onChange={e=>set('active',Number(e.target.value))}>
            <option value={1}>✅ Activo</option>
            <option value={0}>🚫 Desactivado</option>
          </Select>
        )}
      </div>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await usersApi.list(); setUsers(r.data); }
    catch(e) { toast(e.response?.data?.error||'Error al cargar usuarios','error'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleToggle = async (u) => {
    if(u.id===me?.id){ toast('No puedes modificar tu propia cuenta aquí','warning'); return; }
    try {
      await usersApi.update(u.id, { active: u.active?0:1 });
      toast(`Usuario ${u.active?'desactivado':'activado'}`, u.active?'warning':'success');
      load();
    } catch(e) { toast(e.response?.data?.error||'Error','error'); }
  };

  const ROLE_MAP = Object.fromEntries(ROLES.map(r=>[r.val,r]));

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'18px 28px 14px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1 style={{fontFamily:'var(--font-h)',fontSize:22,fontWeight:700,letterSpacing:'0.03em'}}>Gestión de Usuarios</h1>
          <p style={{color:'var(--muted)',fontSize:12.5,marginTop:2}}>{users.length} usuario{users.length!==1?'s':''} registrado{users.length!==1?'s':''}</p>
        </div>
        <Btn size="sm" onClick={()=>setModal({type:'add'})}><Ic n="plus" size={13}/>Nuevo Usuario</Btn>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px',gap:12,color:'var(--muted)'}}>
            <span style={{width:18,height:18,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>Cargando...
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
            {users.map(u=>{
              const ri = ROLE_MAP[u.role] || ROLES[2];
              return (
                <div key={u.id} style={{background:'var(--card)',border:`1px solid ${u.id===me?.id?'rgba(249,115,22,0.35)':'var(--border)'}`,borderRadius:10,overflow:'hidden',transition:'transform 0.2s,border-color 0.2s',opacity:u.active?1:0.6}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor=u.id===me?.id?'rgba(249,115,22,0.5)':'var(--border2)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor=u.id===me?.id?'rgba(249,115,22,0.35)':'var(--border)';}}>

                  <div style={{padding:'16px 18px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{width:44,height:44,borderRadius:11,background:`${ri.color}20`,border:`1.5px solid ${ri.color}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Ic n="user" size={18} style={{color:ri.color}}/>
                      </div>
                      <div>
                        <div style={{fontFamily:'var(--font-h)',fontSize:16,fontWeight:700}}>{u.name}</div>
                        <div style={{fontFamily:'var(--font-m)',fontSize:11,color:'var(--muted)',marginTop:2}}>@{u.username}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {u.id===me?.id && <Badge color="orange">TÚ</Badge>}
                      <Badge color={u.active?'green':'gray'}>{u.active?'Activo':'Inactivo'}</Badge>
                    </div>
                  </div>

                  <div style={{padding:'0 18px 14px',display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:ri.color}}/>
                      <span style={{fontSize:13,fontWeight:600,color:ri.color}}>{ri.label}</span>
                      <span style={{fontSize:11.5,color:'var(--muted)'}}>· {ri.desc}</span>
                    </div>
                    <div style={{fontSize:12.5,color:'var(--text2)'}}>📧 {u.email}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
                      <div style={{background:'var(--surface)',borderRadius:7,padding:'8px 10px',border:'1px solid var(--border)'}}>
                        <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Creado</div>
                        <div style={{fontSize:11.5,fontFamily:'var(--font-m)'}}>{fmtDate(u.created_at)}</div>
                      </div>
                      <div style={{background:'var(--surface)',borderRadius:7,padding:'8px 10px',border:'1px solid var(--border)'}}>
                        <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Último acceso</div>
                        <div style={{fontSize:11.5,fontFamily:'var(--font-m)'}}>{fmtDate(u.last_login)}</div>
                      </div>
                    </div>
                  </div>

                  {u.id !== me?.id && (
                    <div style={{padding:'10px 18px',borderTop:'1px solid var(--border)',display:'flex',gap:8}}>
                      <Btn variant="ghost" size="sm" onClick={()=>setModal({type:'edit',user:u})} style={{flex:1,justifyContent:'center'}}><Ic n="edit" size={13}/>Editar</Btn>
                      <Btn variant={u.active?'danger':'success'} size="sm" onClick={()=>handleToggle(u)} style={{flex:1,justifyContent:'center'}}>
                        {u.active ? <><Ic n="x" size={13}/>Desactivar</> : <><Ic n="check" size={13}/>Activar</>}
                      </Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal?.type==='add'  && <UserForm onSave={()=>{setModal(null);load();toast('Usuario creado','success');}} onClose={()=>setModal(null)}/>}
      {modal?.type==='edit' && <UserForm user={modal.user} onSave={()=>{setModal(null);load();toast('Usuario actualizado','success');}} onClose={()=>setModal(null)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
