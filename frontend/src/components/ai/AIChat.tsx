import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { Send, X, Minimize2, Sparkles } from 'lucide-react';
import { api } from '../../services/store';

const QUICK_PROMPTS = [
  'Team performance summary',
  'Pending leave requests',
  'Attendance insights',
  'Top performers',
];

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: "Hi! I'm Grevya AI — your HR intelligence assistant. I have live access to your company data. Ask me anything!", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const data = await api.post('/ai/chat', { messages: history });
      setMessages(m => [...m, { id: (Date.now()+1).toString(), role: 'assistant', content: data.reply || 'Could not process that.', timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(m => [...m, { id: (Date.now()+1).toString(), role: 'assistant', content: 'Having trouble connecting. Please try again.', timestamp: new Date().toISOString() }]);
    } finally { setTyping(false); }
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} style={{ position:'fixed', bottom:24, right:24, width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(124,58,237,0.45)', zIndex:500 }} title="Grevya AI">
          <Sparkles size={22} />
        </button>
      )}
      {open && (
        <div style={{ position:'fixed', bottom:24, right:24, width:380, height:minimized?60:560, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', zIndex:500, display:'flex', flexDirection:'column', overflow:'hidden', transition:'height 250ms' }}>
          <div style={{ padding:'14px 18px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={17} color="white" /></div>
            <div style={{ flex:1 }}>
              <div style={{ color:'white', fontWeight:700, fontSize:'0.875rem' }}>Grevya AI</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.7rem' }}>HR Intelligence · Live Data</div>
            </div>
            <button onClick={() => setMinimized(v=>!v)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.8)', cursor:'pointer', padding:4 }}><Minimize2 size={15} /></button>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.8)', cursor:'pointer', padding:4 }}><X size={16} /></button>
          </div>
          {!minimized && (<>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column', gap:12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display:'flex', alignItems:'flex-end', gap:8, flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                  {msg.role==='assistant' && <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Sparkles size={13} color="white" /></div>}
                  <div style={{ maxWidth:'78%', padding:'10px 13px', borderRadius:msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px', background:msg.role==='user'?'linear-gradient(135deg,#7c3aed,#4f46e5)':'var(--bg)', color:msg.role==='user'?'white':'var(--text)', fontSize:'0.825rem', lineHeight:1.55, border:msg.role==='user'?'none':'1px solid var(--border)' }}>{msg.content}</div>
                </div>
              ))}
              {typing && (
                <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={13} color="white" /></div>
                  <div style={{ padding:'10px 14px', borderRadius:'16px 16px 16px 4px', background:'var(--bg)', border:'1px solid var(--border)', display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#7c3aed', animation:`bounce 1s ${i*0.18}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding:'8px 14px 0', display:'flex', flexWrap:'wrap', gap:6 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} style={{ padding:'5px 10px', borderRadius:20, border:'1px solid var(--primary)', background:'var(--primary-subtle)', color:'var(--primary)', fontSize:'0.7rem', cursor:'pointer', fontWeight:500 }}>{p}</button>
              ))}
            </div>
            <div style={{ padding:'10px 14px 14px', display:'flex', gap:8, alignItems:'flex-end' }}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask anything about your team..." rows={1} style={{ flex:1, padding:'10px 13px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:'0.825rem', resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.5, maxHeight:80, overflowY:'auto' }} />
              <button onClick={()=>send()} disabled={!input.trim()||typing} style={{ width:38, height:38, borderRadius:'50%', background:input.trim()&&!typing?'linear-gradient(135deg,#7c3aed,#4f46e5)':'var(--border)', color:'white', border:'none', cursor:input.trim()&&!typing?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Send size={15} />
              </button>
            </div>
          </>)}
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </>
  );
}
