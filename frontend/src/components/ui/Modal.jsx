import Ic from './Icons';

export function Modal({ title, subtitle, size='md', onClose, children, footer }) {
  const widths = { sm:420, md:560, lg:720, xl:900 };
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.72)',
        backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
        justifyContent:'center', zIndex:2000, padding:20,
      }}
    >
      <div style={{
        background:'var(--card)', border:'1px solid var(--border2)',
        borderRadius:12, width:'100%', maxWidth:widths[size]||560,
        maxHeight:'92vh', display:'flex', flexDirection:'column',
        boxShadow:'0 32px 80px rgba(0,0,0,0.65)',
        animation:'scaleIn 0.2s ease both',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-h)', fontSize:18, fontWeight:700 }}>{title}</h3>
            {subtitle && <p style={{ color:'var(--muted)', fontSize:12.5, marginTop:3 }}>{subtitle}</p>}
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border2)', borderRadius:6, padding:'5px 7px', color:'var(--muted)', cursor:'pointer', display:'flex', alignItems:'center', marginLeft:12 }}>
              <Ic n="x" size={15}/>
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding:'14px 24px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}

export function Btn({ children, variant='primary', size='md', onClick, disabled, type='button', style={} }) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:6, borderRadius:7,
    fontFamily:'var(--font-h)', fontWeight:600, letterSpacing:'0.03em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border:'none', transition:'all 0.18s', whiteSpace:'nowrap',
    ...style,
  };
  const sizes   = { sm:{padding:'6px 12px', fontSize:12.5}, md:{padding:'9px 18px',fontSize:14}, lg:{padding:'12px 22px',fontSize:16} };
  const variants = {
    primary: { background:'var(--accent)', color:'#fff' },
    ghost:   { background:'transparent', color:'var(--text2)', border:'1px solid var(--border2)' },
    danger:  { background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.3)' },
    success: { background:'rgba(34,197,94,0.1)', color:'var(--green)', border:'1px solid rgba(34,197,94,0.3)' },
    info:    { background:'rgba(59,130,246,0.1)', color:'var(--blue)', border:'1px solid rgba(59,130,246,0.3)' },
  };
  return (
    <button type={type} onClick={disabled?null:onClick} style={{ ...base, ...sizes[size], ...variants[variant]||variants.primary }}>
      {children}
    </button>
  );
}

export function Badge({ children, color='blue' }) {
  const colors = {
    blue:   { bg:'rgba(59,130,246,0.12)',  c:'#3B82F6', bd:'rgba(59,130,246,0.3)' },
    green:  { bg:'rgba(34,197,94,0.12)',   c:'#22C55E', bd:'rgba(34,197,94,0.3)' },
    yellow: { bg:'rgba(234,179,8,0.12)',   c:'#EAB308', bd:'rgba(234,179,8,0.3)' },
    red:    { bg:'rgba(239,68,68,0.12)',   c:'#EF4444', bd:'rgba(239,68,68,0.3)' },
    orange: { bg:'rgba(249,115,22,0.12)',  c:'#F97316', bd:'rgba(249,115,22,0.3)' },
    purple: { bg:'rgba(168,85,247,0.12)',  c:'#A855F7', bd:'rgba(168,85,247,0.3)' },
    gray:   { bg:'rgba(100,116,139,0.15)', c:'#94A3B8', bd:'rgba(100,116,139,0.3)' },
  };
  const v = colors[color] || colors.blue;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 9px', borderRadius:4,
      background:v.bg, color:v.c, border:`1px solid ${v.bd}`,
      fontSize:11.5, fontFamily:'var(--font-m)', fontWeight:500,
    }}>{children}</span>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div>
      {label && <label style={{ display:'block', fontSize:11.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color: error?'var(--red)':'var(--muted)', marginBottom:6 }}>{label}</label>}
      <input {...props} style={{ background:'var(--surface)', border:`1px solid ${error?'var(--red)':'var(--border2)'}`, color:'var(--text)', fontFamily:'var(--font-b)', borderRadius:6, padding:'10px 14px', fontSize:14, width:'100%', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', ...(props.style||{}) }}
        onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accentDim)'; }}
        onBlur={e  => { e.target.style.borderColor=error?'var(--red)':'var(--border2)'; e.target.style.boxShadow='none'; }}
      />
      {error && <p style={{ fontSize:11.5, color:'var(--red)', marginTop:4 }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div>
      {label && <label style={{ display:'block', fontSize:11.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color: error?'var(--red)':'var(--muted)', marginBottom:6 }}>{label}</label>}
      <select {...props} style={{ background:'var(--surface)', border:`1px solid ${error?'var(--red)':'var(--border2)'}`, color:'var(--text)', fontFamily:'var(--font-b)', borderRadius:6, padding:'10px 14px', fontSize:14, width:'100%', outline:'none', cursor:'pointer', ...(props.style||{}) }}>
        {children}
      </select>
      {error && <p style={{ fontSize:11.5, color:'var(--red)', marginTop:4 }}>{error}</p>}
    </div>
  );
}
