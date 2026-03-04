import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { authAPI, partsAPI, categoriesAPI } from "./api";

/* ─── FONTS & GLOBAL CSS ────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Barlow:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#0A0C10; --surface:#111318; --card:#161A22; --border:#252A35; --border2:#2F3747;
      --text:#E8EAF0; --muted:#6B7590;
      --accent:#F97316; --accent2:#FB923C; --accentDim:rgba(249,115,22,0.12);
      --blue:#3B82F6; --green:#22C55E; --red:#EF4444; --yellow:#EAB308; --purple:#A855F7;
      --fh:'Rajdhani',sans-serif; --fb:'Barlow',sans-serif; --fm:'IBM Plex Mono',monospace;
    }
    html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--fb);}
    ::-webkit-scrollbar{width:5px;height:5px;}
    ::-webkit-scrollbar-track{background:var(--surface);}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
    ::-webkit-scrollbar-thumb:hover{background:var(--accent);}
    input,select,textarea{background:var(--surface);border:1px solid var(--border2);color:var(--text);
      font-family:var(--fb);border-radius:6px;padding:10px 14px;font-size:14px;
      transition:border-color .2s,box-shadow .2s;width:100%;outline:none;}
    input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accentDim);}
    select option{background:var(--card);}
    button{cursor:pointer;font-family:var(--fh);border:none;outline:none;}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    .fade-in{animation:fadeIn .3s ease both;}
    .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);
      display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
    .modal-box{background:var(--card);border:1px solid var(--border2);border-radius:12px;
      width:100%;max-width:570px;max-height:92vh;overflow-y:auto;
      animation:scaleIn .22s ease both;box-shadow:0 24px 64px rgba(0,0,0,.6);}
    .inv-table{width:100%;border-collapse:collapse;font-family:var(--fb);}
    .inv-table th{text-align:left;padding:10px 14px;font-family:var(--fh);font-size:11px;font-weight:700;
      letter-spacing:.1em;text-transform:uppercase;color:var(--muted);
      border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:2;}
    .inv-table td{padding:12px 14px;font-size:13.5px;border-bottom:1px solid var(--border);vertical-align:middle;}
    .inv-table tr:last-child td{border-bottom:none;}
    .inv-table tbody tr{transition:background .15s;}
    .inv-table tbody tr:hover{background:rgba(249,115,22,.04);}
    .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:4px;
      font-family:var(--fm);font-size:11px;font-weight:500;letter-spacing:.02em;}
    .bg{background:rgba(34,197,94,.12);color:#22C55E;border:1px solid rgba(34,197,94,.25);}
    .by{background:rgba(234,179,8,.12);color:#EAB308;border:1px solid rgba(234,179,8,.25);}
    .br{background:rgba(239,68,68,.12);color:#EF4444;border:1px solid rgba(239,68,68,.25);}
    .bb{background:rgba(59,130,246,.12);color:#3B82F6;border:1px solid rgba(59,130,246,.25);}
    .bo{background:rgba(249,115,22,.12);color:#F97316;border:1px solid rgba(249,115,22,.3);}
    .stat-card{background:var(--card);border:1px solid var(--border);border-radius:10px;
      padding:18px 20px;display:flex;flex-direction:column;gap:5px;position:relative;overflow:hidden;
      transition:border-color .2s,transform .2s;}
    .stat-card:hover{border-color:var(--border2);transform:translateY(-2px);}
    .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--ac,var(--accent));}
    .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:7px;
      font-size:14px;font-weight:600;letter-spacing:.03em;transition:all .18s;white-space:nowrap;}
    .btn-p{background:var(--accent);color:#fff;}
    .btn-p:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 16px rgba(249,115,22,.35);}
    .btn-p:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none;}
    .btn-g{background:transparent;color:var(--muted);border:1px solid var(--border2);}
    .btn-g:hover{background:var(--surface);color:var(--text);}
    .btn-d{background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.25);}
    .btn-d:hover{background:rgba(239,68,68,.2);}
    .btn-sm{padding:6px 12px;font-size:12.5px;}
    .btn-icon{padding:7px;border-radius:6px;}
    .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.25);
      border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
    .field-err{font-size:11.5px;color:var(--red);margin-top:4px;}
  `}</style>
);

/* ─── ICONS ──────────────────────────────────────────────── */
const Icon = ({ n, s = 16 }) => {
  const d = {
    search: "M21 21l-4.35-4.35M17 11a6 6 0 1 0-12 0 6 6 0 0 0 12 0",
    plus: "M12 5v14M5 12h14",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    x: "M18 6L6 18M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12l8.73-4.96M12 22V12",
    warn: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
    chart: "M18 20V10M12 20V4M6 20v-6",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
    refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    arrow_up: "M12 19V5M5 12l7-7 7 7",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
  };
  return (
    <span style={{ display:"inline-flex", alignItems:"center" }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {(d[n]||"").split("M").filter(Boolean).map((seg, i) => (
          <path key={i} d={"M"+seg}/>
        ))}
      </svg>
    </span>
  );
};

/* ─── HELPERS ──────────────────────────────────────────── */
const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;

const StockBadge = ({ qty }) => {
  if (qty === 0)   return <span className="badge br">✕ Agotado</span>;
  if (qty <= 2)    return <span className="badge by">⚠ Bajo ({qty})</span>;
  return                  <span className="badge bg">✓ Stock ({qty})</span>;
};
const CondBadge = ({ c }) => {
  const m = { Excelente:"bb", Bueno:"bg", Regular:"by", "Para reparar":"br" };
  return <span className={`badge ${m[c]||"bb"}`}>{c}</span>;
};

const MAKES = ["Toyota","Honda","Nissan","Chevrolet","Ford","Volkswagen","Hyundai","Kia","Mazda","Mitsubishi","Suzuki","Dodge","BMW","Mercedes-Benz","Audi","Subaru","Seat","Renault","Peugeot","Fiat"];
const CONDITIONS = ["Excelente","Bueno","Regular","Para reparar"];

/* ─── LOADING SPINNER ────────────────────────────────────── */
const Loader = ({ size = 32, text = "" }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:40, color:"var(--muted)" }}>
    <div style={{ width:size, height:size, border:"3px solid var(--border2)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
    {text && <span style={{ fontSize:13, fontFamily:"var(--fm)" }}>{text}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════ */
function Login({ onLogin }) {
  const [form, setForm]   = useState({ username:"", password:"" });
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");
    if (!form.username || !form.password) { setErr("Completa todos los campos."); return; }
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      localStorage.setItem("ap_token", res.token);
      onLogin(res.user);
    } catch (err) {
      setErr(err.message || "Credenciales incorrectas");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"var(--bg)",
      backgroundImage:"radial-gradient(ellipse at 20% 50%,rgba(249,115,22,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(59,130,246,.05) 0%,transparent 60%)",
    }}>
      <div style={{ width:"100%", maxWidth:410, padding:24 }} className="fade-in">
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:66, height:66, borderRadius:16,
            background:"linear-gradient(135deg,#F97316,#EA580C)", marginBottom:14, fontSize:28,
            boxShadow:"0 8px 24px rgba(249,115,22,.35)",
          }}>🚗</div>
          <h1 style={{ fontFamily:"var(--fh)", fontSize:28, fontWeight:700, letterSpacing:".06em" }}>AUTOPARTES PRO</h1>
          <p style={{ color:"var(--muted)", fontSize:12, marginTop:4, fontFamily:"var(--fm)" }}>SISTEMA DE INVENTARIO v2.0</p>
        </div>

        <div style={{ background:"var(--card)", border:"1px solid var(--border2)", borderRadius:14, padding:30, boxShadow:"0 20px 60px rgba(0,0,0,.4)" }}>
          <h2 style={{ fontFamily:"var(--fh)", fontSize:20, fontWeight:700, marginBottom:4 }}>Iniciar Sesión</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginBottom:26 }}>Ingresa con tus credenciales</p>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { key:"username", label:"Usuario",    type:"text",     icon:"user",  placeholder:"admin" },
              { key:"password", label:"Contraseña", type:"password", icon:"lock",  placeholder:"••••••••" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display:"block", fontSize:11.5, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted)", marginBottom:7 }}>{f.label}</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)" }}><Icon n={f.icon} s={15}/></span>
                  <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}
                    onKeyDown={e => e.key==="Enter" && submit()}
                    style={{ paddingLeft:38 }}/>
                </div>
              </div>
            ))}

            {err && (
              <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, color:"var(--red)", fontSize:13 }}>
                <Icon n="warn" s={14}/> {err}
              </div>
            )}

            <button className="btn btn-p" onClick={submit} disabled={loading} style={{ width:"100%", justifyContent:"center", padding:"13px 0", fontSize:15, marginTop:4 }}>
              {loading ? <span className="spinner"/> : <><Icon n="check" s={15}/> Entrar</>}
            </button>
          </div>

          <div style={{ marginTop:18, padding:"12px 14px", background:"var(--surface)", borderRadius:8, border:"1px solid var(--border)" }}>
            <p style={{ fontSize:11.5, color:"var(--muted)", fontFamily:"var(--fm)" }}>
              Demo: <span style={{ color:"var(--accent)" }}>admin</span> / <span style={{ color:"var(--accent)" }}>admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PART FORM MODAL
═══════════════════════════════════════════════════════════ */
function PartModal({ part, categories, onSave, onClose }) {
  const empty = {
    sku:"", name:"", category: categories[0]?.id || "motor",
    make:"Toyota", model:"", year: new Date().getFullYear(),
    condition_status:"Bueno", stock:1, price:"", location:"", notes:"",
  };
  const [form, setForm]   = useState(part ? { ...part } : empty);
  const [errs, setErrs]   = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrs(e => ({...e,[k]:null})); };

  const validate = () => {
    const e = {};
    if (!form.sku.trim())   e.sku  = "Requerido";
    if (!form.name.trim())  e.name = "Requerido";
    if (!form.model.trim()) e.model = "Requerido";
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = "Precio inválido";
    if (!form.location.trim()) e.location = "Requerido";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price), stock: Number(form.stock), year: Number(form.year) });
    } catch (err) {
      setErrs({ sku: err.message });
      setSaving(false);
    }
  };

  const FL = ({ label, err, children }) => (
    <div>
      <label style={{ display:"block", fontSize:11.5, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color: err ? "var(--red)" : "var(--muted)", marginBottom:6 }}>{label}</label>
      {children}
      {err && <p className="field-err">{err}</p>}
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h3 style={{ fontFamily:"var(--fh)", fontSize:18, fontWeight:700 }}>{part?.id ? "✏️ Editar Pieza" : "➕ Nueva Pieza"}</h3>
            <p style={{ color:"var(--muted)", fontSize:12, marginTop:2 }}>{part?.id ? `SKU: ${part.sku}` : "Completa los campos requeridos"}</p>
          </div>
          <button className="btn btn-g btn-sm btn-icon" onClick={onClose}><Icon n="x" s={15}/></button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <FL label="SKU / Código *" err={errs.sku}>
              <input value={form.sku} onChange={e=>set("sku",e.target.value)} placeholder="Ej: MOT-001"/>
            </FL>
            <FL label="Categoría">
              <select value={form.category} onChange={e=>set("category",e.target.value)}>
                {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </FL>
          </div>

          <FL label="Nombre de la Pieza *" err={errs.name}>
            <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej: Motor Completo 1.6L"/>
          </FL>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 100px", gap:14 }}>
            <FL label="Marca">
              <select value={form.make} onChange={e=>set("make",e.target.value)}>
                {MAKES.map(m=><option key={m}>{m}</option>)}
              </select>
            </FL>
            <FL label="Modelo *" err={errs.model}>
              <input value={form.model} onChange={e=>set("model",e.target.value)} placeholder="Ej: Corolla"/>
            </FL>
            <FL label="Año">
              <input type="number" value={form.year} onChange={e=>set("year",e.target.value)} min={1970} max={2030}/>
            </FL>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <FL label="Condición">
              <select value={form.condition_status} onChange={e=>set("condition_status",e.target.value)}>
                {CONDITIONS.map(c=><option key={c}>{c}</option>)}
              </select>
            </FL>
            <FL label="Stock">
              <input type="number" value={form.stock} onChange={e=>set("stock",e.target.value)} min={0}/>
            </FL>
            <FL label="Precio MXN *" err={errs.price}>
              <input type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder="0.00" min={0}/>
            </FL>
          </div>

          <FL label="Ubicación en Almacén *" err={errs.location}>
            <input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Ej: A-01"/>
          </FL>

          <FL label="Notas">
            <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Observaciones, estado, km, etc." style={{ resize:"vertical" }}/>
          </FL>
        </div>

        <div style={{ padding:"14px 24px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button className="btn btn-g" onClick={onClose}>Cancelar</button>
          <button className="btn btn-p" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner"/> : <><Icon n="check" s={14}/> {part?.id ? "Guardar Cambios" : "Registrar"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DELETE MODAL
═══════════════════════════════════════════════════════════ */
function DeleteModal({ part, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{ maxWidth:400 }}>
        <div style={{ padding:"28px 28px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
          <h3 style={{ fontFamily:"var(--fh)", fontSize:20, fontWeight:700, marginBottom:8 }}>Eliminar Pieza</h3>
          <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.6 }}>
            ¿Confirmas eliminar <strong style={{color:"var(--text)"}}>{part.name}</strong>?<br/>
            <span style={{ fontFamily:"var(--fm)", fontSize:12, color:"var(--accent)" }}>{part.sku}</span>
          </p>
          <p style={{ marginTop:10, fontSize:12, color:"var(--red)" }}>Esta acción no se puede deshacer.</p>
        </div>
        <div style={{ padding:"0 28px 24px", display:"flex", gap:10, justifyContent:"center" }}>
          <button className="btn btn-g" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
          <button className="btn btn-d" style={{ flex:1 }} disabled={loading} onClick={async()=>{
            setLoading(true);
            await onConfirm();
          }}>
            {loading ? <span className="spinner"/> : <><Icon n="trash" s={14}/> Eliminar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW MODAL
═══════════════════════════════════════════════════════════ */
function ViewModal({ part, onEdit, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{ maxWidth:480 }}>
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:44, height:44, borderRadius:10, background:`${part.category_color||"#F97316"}20`, border:`1px solid ${part.category_color||"#F97316"}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
              {part.category_icon || "🔧"}
            </div>
            <div>
              <div style={{ fontFamily:"var(--fm)", fontSize:11, color:"var(--muted)" }}>{part.sku}</div>
              <h3 style={{ fontFamily:"var(--fh)", fontSize:17, fontWeight:700, marginTop:2 }}>{part.name}</h3>
            </div>
          </div>
          <button className="btn btn-g btn-sm btn-icon" onClick={onClose}><Icon n="x" s={15}/></button>
        </div>
        <div style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:0 }}>
          {[
            ["Categoría", part.category_label],
            ["Vehículo",  `${part.make} ${part.model} ${part.year}`],
            ["Condición", null, <CondBadge c={part.condition_status}/>],
            ["Stock",     null, <StockBadge qty={part.stock}/>],
            ["Precio",    fmt(part.price)],
            ["Ubicación", part.location],
          ].map(([k,v,node])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--fh)", textTransform:"uppercase", letterSpacing:".06em" }}>{k}</span>
              {node || <span style={{ fontSize:14, fontWeight:500 }}>{v}</span>}
            </div>
          ))}
          {part.notes && (
            <div style={{ background:"var(--surface)", borderRadius:8, padding:14, marginTop:14 }}>
              <p style={{ fontSize:11, color:"var(--muted)", marginBottom:6, textTransform:"uppercase", letterSpacing:".07em", fontFamily:"var(--fh)" }}>Notas</p>
              <p style={{ fontSize:13.5, lineHeight:1.7 }}>{part.notes}</p>
            </div>
          )}
        </div>
        <div style={{ padding:"12px 24px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button className="btn btn-g" onClick={onClose}>Cerrar</button>
          <button className="btn btn-p" onClick={()=>{ onClose(); onEdit(part); }}>
            <Icon n="edit" s={14}/> Editar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function Toast({ msg, type }) {
  const colors = { success:["rgba(34,197,94,.15)","rgba(34,197,94,.4)","var(--green)"], danger:["rgba(239,68,68,.15)","rgba(239,68,68,.4)","var(--red)"], info:["rgba(59,130,246,.15)","rgba(59,130,246,.4)","var(--blue)"] };
  const [bg, border, color] = colors[type] || colors.success;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:2000, background:bg, border:`1px solid ${border}`, color, padding:"12px 20px", borderRadius:10, fontSize:14, backdropFilter:"blur(8px)", boxShadow:"0 8px 24px rgba(0,0,0,.4)", animation:"slideUp .3s ease both", maxWidth:340, fontFamily:"var(--fb)" }}>
      {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [session, setSession]     = useState(null);
  const [parts, setParts]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [stats, setStats]         = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [modal, setModal]         = useState(null);
  const [toast, setToast]         = useState(null);

  // Filters & pagination
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [condFilter, setCondFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy]       = useState("name");
  const [sortDir, setSortDir]     = useState("ASC");
  const [page, setPage]           = useState(1);
  const PER = 12;

  const searchTimer = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Check token on load ──
  useEffect(() => {
    const token = localStorage.getItem("ap_token");
    if (token) {
      authAPI.me().then(r => setSession(r.user)).catch(() => localStorage.removeItem("ap_token"));
    }
  }, []);

  // ── Load categories once ──
  useEffect(() => {
    if (!session) return;
    categoriesAPI.list().then(r => setCategories(r.data)).catch(console.error);
  }, [session]);

  // ── Load parts ──
  const loadParts = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await partsAPI.list({ search, category: catFilter, condition: condFilter, stock_status: stockFilter, sort_by: sortBy, sort_dir: sortDir, page: p, per_page: PER });
      setParts(res.data);
      setTotal(res.total);
    } catch (err) {
      showToast("Error cargando inventario: " + err.message, "danger");
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, condFilter, stockFilter, sortBy, sortDir, page]);

  // ── Load stats ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await partsAPI.stats();
      setStats(res);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { if (session) { loadParts(1); setPage(1); } }, [search, catFilter, condFilter, stockFilter, sortBy, sortDir, session]);
  useEffect(() => { if (session) loadParts(page); }, [page]);
  useEffect(() => { if (session) loadStats(); }, [session]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };

  const handleSearch = (v) => {
    clearTimeout(searchTimer.current);
    setSearch(v);
    searchTimer.current = setTimeout(() => setPage(1), 300);
  };

  const handleLogout = () => {
    localStorage.removeItem("ap_token");
    setSession(null);
    setParts([]);
    setStats(null);
  };

  // ── CRUD ──
  const savePart = async (data) => {
    if (data.id) {
      await partsAPI.update(data.id, data);
      showToast(`✅ "${data.name}" actualizado correctamente.`);
    } else {
      await partsAPI.create(data);
      showToast(`✅ "${data.name}" registrado en inventario.`);
    }
    setModal(null);
    await Promise.all([loadParts(page), loadStats()]);
  };

  const deletePart = async (id) => {
    const p = parts.find(x => x.id === id);
    await partsAPI.remove(id);
    showToast(`🗑️ "${p?.name}" eliminado.`, "danger");
    setModal(null);
    await Promise.all([loadParts(page), loadStats()]);
  };

  const totalPages = Math.ceil(total / PER);

  if (!session) return <><GlobalStyles/><Login onLogin={setSession}/></>;

  const SortArrow = ({ col }) => sortBy !== col ? <span style={{opacity:.25,marginLeft:3}}>↕</span> : <span style={{marginLeft:3}}>{sortDir==="ASC"?"↑":"↓"}</span>;

  const activeFilters = [search, catFilter, condFilter, stockFilter].some(Boolean);

  return (
    <>
      <GlobalStyles/>
      <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

        {/* ══ SIDEBAR ══ */}
        <aside style={{ width:218, background:"var(--surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
          {/* Brand */}
          <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#F97316,#EA580C)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:"0 4px 12px rgba(249,115,22,.3)", flexShrink:0 }}>🚗</div>
              <div>
                <div style={{ fontFamily:"var(--fh)", fontWeight:700, fontSize:14, letterSpacing:".06em" }}>AUTOPARTES</div>
                <div style={{ fontFamily:"var(--fm)", fontSize:9, color:"var(--muted)" }}>INVENTARIO PRO</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding:"14px 10px", flex:1, overflowY:"auto" }}>
            <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:".12em", color:"var(--muted)", textTransform:"uppercase", paddingLeft:8, marginBottom:8 }}>Módulos</p>
            {[{ icon:"box", label:"Inventario" }, { icon:"chart", label:"Estadísticas" }, { icon:"tag", label:"Categorías" }].map((item, i) => (
              <div key={item.label} style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 10px", borderRadius:7, marginBottom:2, cursor:"pointer", background: i===0?"var(--accentDim)":"transparent", color: i===0?"var(--accent)":"var(--muted)", fontSize:14, fontWeight: i===0?600:400, borderLeft: i===0?"2px solid var(--accent)":"2px solid transparent", transition:"all .15s" }}>
                <Icon n={item.icon} s={15}/> {item.label}
              </div>
            ))}

            <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:".12em", color:"var(--muted)", textTransform:"uppercase", paddingLeft:8, margin:"16px 0 8px" }}>Filtros rápidos</p>
            {[
              { label:"Todo el inventario", val:"", count: stats?.stats?.total || 0 },
              { label:"Stock bajo",         val:"low", count: stats?.stats?.low_stock || 0, warn:true },
              { label:"Sin stock",          val:"out", count: stats?.stats?.out_stock || 0, danger:true },
            ].map(f => (
              <div key={f.val} onClick={()=>{ setStockFilter(f.val); setPage(1); }} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:6, cursor:"pointer", marginBottom:2, background: stockFilter===f.val?"var(--accentDim)":"transparent", color: f.danger?"var(--red)":f.warn?"var(--yellow)":"var(--muted)", fontSize:12.5, fontWeight: stockFilter===f.val?600:400, transition:"all .15s" }}>
                <span>{f.label}</span>
                <span style={{ background: f.danger?"rgba(239,68,68,.15)":f.warn?"rgba(234,179,8,.15)":"var(--border)", color: f.danger?"var(--red)":f.warn?"var(--yellow)":"var(--muted)", borderRadius:4, padding:"1px 7px", fontSize:11, fontFamily:"var(--fm)" }}>{f.count}</span>
              </div>
            ))}

            {/* Categories list */}
            {stats?.by_category?.length > 0 && (
              <>
                <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:".12em", color:"var(--muted)", textTransform:"uppercase", paddingLeft:8, margin:"16px 0 8px" }}>Por Categoría</p>
                {stats.by_category.filter(c=>c.count>0).slice(0,6).map(c => (
                  <div key={c.id} onClick={()=>{ setCatFilter(catFilter===c.id?"":c.id); setPage(1); }} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:6, cursor:"pointer", marginBottom:2, background: catFilter===c.id?`${c.color}18`:"transparent", transition:"background .15s" }}>
                    <span style={{ fontSize:12.5, color: catFilter===c.id?c.color:"var(--muted)" }}>{c.icon} {c.label}</span>
                    <span style={{ fontSize:11, fontFamily:"var(--fm)", color: catFilter===c.id?c.color:"var(--muted)" }}>{c.count}</span>
                  </div>
                ))}
              </>
            )}
          </nav>

          {/* User */}
          <div style={{ padding:"12px 12px 16px", borderTop:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:8, background:"var(--card)" }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>👤</div>
              <div style={{ flex:1, minWidth:0, overflow:"hidden" }}>
                <div style={{ fontSize:12.5, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.name}</div>
                <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"var(--fm)" }}>{session.username}</div>
              </div>
              <button onClick={handleLogout} title="Cerrar sesión" style={{ background:"transparent", color:"var(--muted)", padding:4, borderRadius:5, display:"flex", alignItems:"center" }}>
                <Icon n="logout" s={14}/>
              </button>
            </div>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>

          {/* Header */}
          <div style={{ padding:"18px 26px 14px", borderBottom:"1px solid var(--border)", background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ fontFamily:"var(--fh)", fontSize:22, fontWeight:700, letterSpacing:".03em" }}>Inventario de Piezas</h1>
              <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>
                {loading ? "Cargando…" : `${total} pieza${total!==1?"s":""} ${activeFilters?"en resultados filtrados":"en total"}`}
              </p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-g btn-sm" onClick={()=>Promise.all([loadParts(page),loadStats()])} title="Actualizar">
                <Icon n="refresh" s={14}/>
              </button>
              <button className="btn btn-p" onClick={()=>setModal({type:"add"})}>
                <Icon n="plus" s={15}/> Nueva Pieza
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding:"18px 26px 0", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
            {[
              { label:"Total Piezas",  value: stats?.stats?.total       || 0,  color:"#F97316", icon:"📦" },
              { label:"En Stock",      value: stats?.stats?.in_stock     || 0,  color:"#22C55E", icon:"✅" },
              { label:"Stock Bajo",    value: stats?.stats?.low_stock    || 0,  color:"#EAB308", icon:"⚠️" },
              { label:"Sin Stock",     value: stats?.stats?.out_stock    || 0,  color:"#EF4444", icon:"❌" },
              { label:"Valor Total",   value: fmt(stats?.stats?.total_value||0), color:"#3B82F6", icon:"💰", mono:true },
            ].map(s=>(
              <div key={s.label} className="stat-card" style={{ "--ac":s.color }}>
                <div style={{ fontSize:18 }}>{s.icon}</div>
                {statsLoading
                  ? <div style={{ height:30, background:"var(--border)", borderRadius:4, animation:"pulse 1.5s ease infinite" }}/>
                  : <div style={{ fontFamily: s.mono?"var(--fm)":"var(--fh)", fontSize: s.mono?15:24, fontWeight:700, color:s.color }}>{s.value}</div>
                }
                <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--fh)", textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ padding:"14px 26px", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative", flex:"1 1 200px", minWidth:160 }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"var(--muted)" }}><Icon n="search" s={14}/></span>
              <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="Buscar SKU, nombre, marca…" style={{ paddingLeft:35, background:"var(--card)", height:36, fontSize:13 }}/>
            </div>
            <select value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(1);}} style={{ width:"auto", height:36, background:"var(--card)", fontSize:13 }}>
              <option value="">📂 Todas las categorías</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select value={condFilter} onChange={e=>{setCondFilter(e.target.value);setPage(1);}} style={{ width:"auto", height:36, background:"var(--card)", fontSize:13 }}>
              <option value="">🔧 Todas las condiciones</option>
              {CONDITIONS.map(c=><option key={c}>{c}</option>)}
            </select>
            {activeFilters && (
              <button className="btn btn-g btn-sm" onClick={()=>{setSearch("");setCatFilter("");setCondFilter("");setStockFilter("");setPage(1);}}>
                <Icon n="x" s={12}/> Limpiar filtros
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ flex:1, padding:"0 26px 20px" }}>
            <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
              {loading ? (
                <Loader text="Cargando inventario…"/>
              ) : parts.length === 0 ? (
                <div style={{ padding:"60px 20px", textAlign:"center", color:"var(--muted)" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                  <p style={{ fontSize:16, fontWeight:600, color:"var(--text)" }}>Sin resultados</p>
                  <p style={{ fontSize:13, marginTop:4 }}>Intenta con otros filtros.</p>
                </div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className="inv-table">
                    <thead>
                      <tr>
                        {[["sku","SKU"],["name","Pieza"],["category","Categoría"],["make","Vehículo"],["condition_status","Condición"],["stock","Stock"],["price","Precio"],["location","Ubicación"],].map(([col,lbl])=>(
                          <th key={col} onClick={()=>handleSort(col)} style={{ cursor:"pointer", userSelect:"none" }}>{lbl}<SortArrow col={col}/></th>
                        ))}
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((p, idx) => (
                        <tr key={p.id} className="fade-in" style={{ animationDelay:`${idx*.02}s` }}>
                          <td><span style={{ fontFamily:"var(--fm)", fontSize:12, color:"var(--accent)" }}>{p.sku}</span></td>
                          <td><span style={{ fontWeight:500 }}>{p.name}</span></td>
                          <td>
                            <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:5, fontSize:11.5, background:`${p.category_color||"#888"}18`, color:p.category_color||"#888", border:`1px solid ${p.category_color||"#888"}35`, fontFamily:"var(--fh)", fontWeight:600 }}>
                              {p.category_icon} {p.category_label}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize:13 }}>{p.make} {p.model}</div>
                            <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--fm)" }}>{p.year}</div>
                          </td>
                          <td><CondBadge c={p.condition_status}/></td>
                          <td><StockBadge qty={p.stock}/></td>
                          <td><span style={{ fontFamily:"var(--fm)", fontSize:13, fontWeight:600, color:"var(--green)" }}>{fmt(p.price)}</span></td>
                          <td><span style={{ fontFamily:"var(--fm)", fontSize:12, background:"var(--surface)", padding:"3px 8px", borderRadius:4, border:"1px solid var(--border2)" }}>{p.location}</span></td>
                          <td>
                            <div style={{ display:"flex", gap:5 }}>
                              <button className="btn btn-g btn-sm btn-icon" title="Ver" onClick={()=>setModal({type:"view",part:p})} style={{ color:"var(--blue)" }}><Icon n="eye" s={14}/></button>
                              <button className="btn btn-g btn-sm btn-icon" title="Editar" onClick={()=>setModal({type:"edit",part:p})} style={{ color:"var(--accent)" }}><Icon n="edit" s={14}/></button>
                              <button className="btn btn-g btn-sm btn-icon" title="Eliminar" onClick={()=>setModal({type:"delete",part:p})} style={{ color:"var(--red)" }}><Icon n="trash" s={14}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14 }}>
                <span style={{ fontSize:12.5, color:"var(--muted)", fontFamily:"var(--fm)" }}>
                  Página {page} de {totalPages} · {total} resultados
                </span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <button className="btn btn-g btn-sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ opacity:page<=1?.4:1 }}>← Anterior</button>
                  {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                    let n = i+1;
                    if (totalPages > 7) {
                      if (page <= 4) n = i+1;
                      else if (page >= totalPages-3) n = totalPages-6+i;
                      else n = page-3+i;
                    }
                    return (
                      <button key={n} onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:6, fontSize:13, fontWeight:600, background:n===page?"var(--accent)":"var(--card)", color:n===page?"#fff":"var(--muted)", border:`1px solid ${n===page?"var(--accent)":"var(--border2)"}`, cursor:"pointer" }}>{n}</button>
                    );
                  })}
                  <button className="btn btn-g btn-sm" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={{ opacity:page>=totalPages?.4:1 }}>Siguiente →</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {modal?.type==="add"    && <PartModal part={null}       categories={categories} onSave={savePart} onClose={()=>setModal(null)}/>}
      {modal?.type==="edit"   && <PartModal part={modal.part} categories={categories} onSave={savePart} onClose={()=>setModal(null)}/>}
      {modal?.type==="delete" && <DeleteModal part={modal.part} onConfirm={()=>deletePart(modal.part.id)} onClose={()=>setModal(null)}/>}
      {modal?.type==="view"   && <ViewModal part={modal.part} onEdit={p=>setModal({type:"edit",part:p})} onClose={()=>setModal(null)}/>}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
    </>
  );
}
