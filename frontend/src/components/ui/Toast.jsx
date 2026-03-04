import { useState, useCallback, useEffect, useRef } from 'react';
import Ic from './Icons';

let _addToast = null;

export function toast(msg, type='success', duration=4000) {
  _addToast?.({ msg, type, duration });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  _addToast = useCallback(({ msg, type, duration }) => {
    const id = ++counterRef.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id));

  const colors = {
    success: { bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.35)',  color:'#22C55E' },
    error:   { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.35)',  color:'#EF4444' },
    warning: { bg:'rgba(234,179,8,0.12)',  border:'rgba(234,179,8,0.35)',  color:'#EAB308' },
    info:    { bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.35)', color:'#3B82F6' },
  };

  const icons = { success:'check', error:'x', warning:'warning', info:'info' };

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10, maxWidth:360 }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            background: c.bg, border:`1px solid ${c.border}`, color: c.color,
            padding:'12px 16px', borderRadius:10, fontSize:14, fontFamily:"var(--font-b)",
            backdropFilter:'blur(12px)', display:'flex', alignItems:'center', gap:10,
            boxShadow:'0 8px 28px rgba(0,0,0,0.4)',
            animation:'slideInRight 0.3s ease both',
          }}>
            <Ic n={icons[t.type]} size={15}/>
            <span style={{ flex:1 }}>{t.msg}</span>
            <button onClick={()=>remove(t.id)} style={{ background:'transparent', border:'none', color:'inherit', cursor:'pointer', opacity:0.7, padding:2 }}>
              <Ic n="x" size={13}/>
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}
