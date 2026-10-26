/**
 * "Restante de hoy" card rendered inside the chat.
 * Works as a ChatGPT App widget (window.openai) and as an MCP App (postMessage handshake).
 */
export const REMAINING_WIDGET_URI = 'ui://gofit/remaining.html'
export const REMAINING_WIDGET_URI_CHATGPT = 'ui://gofit/remaining-chatgpt.html'

export const REMAINING_WIDGET_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{--bg:#fff;--fg:#111827;--muted:#6b7280;--line:#f3f4f6;--ok:#10b981;--warn:#f59e0b;--bad:#ef4444;--btn:#111827;--btnfg:#fff}
  @media (prefers-color-scheme:dark){:root{--bg:#111827;--fg:#f9fafb;--muted:#9ca3af;--line:#1f2937;--btn:#10b981;--btnfg:#052e1c}}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 Inter,-apple-system,system-ui,sans-serif}
  .card{max-width:420px;margin:0 auto;padding:16px;border:1px solid var(--line);border-radius:18px;display:flex;gap:16px;align-items:center}
  .ring{position:relative;width:104px;height:104px;flex:none}.ring svg{width:100%;height:100%;transform:rotate(-90deg)}
  .ring .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .n{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}.l{font-size:11px;color:var(--muted)}
  .rows{flex:1;min-width:0}.row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:var(--muted)}.row b{color:var(--fg);font-variant-numeric:tabular-nums}
  .tot{border-top:1px solid var(--line);margin-top:4px;padding-top:6px;font-weight:600;color:var(--fg)}
  .chip{display:inline-block;margin-top:8px;font-size:11px;padding:3px 9px;border-radius:999px;background:#ecfdf5;color:#047857}.chip.over{background:#fffbeb;color:#92400e}
  .btn{display:block;margin:12px auto 0;max-width:420px;text-align:center;padding:11px 16px;border-radius:12px;background:var(--btn);color:var(--btnfg);font-weight:600;text-decoration:none;font-size:14px}
  .foot{max-width:420px;margin:6px auto 0;text-align:center;font-size:10px;color:var(--muted)}
  .empty{max-width:420px;margin:0 auto;padding:24px;text-align:center;color:var(--muted)}
</style></head><body>
<div id="app" class="empty">Cargando tu día…</div>
<script>
(function(){
  var R=46,C=2*Math.PI*R;
  var fmt=function(n){return Math.abs(Math.round(n)).toLocaleString('es-PE')};
  function render(d){
    if(!d||typeof d.consumed!=='number'){return}
    var app=document.getElementById('app');app.className='';
    var goal=d.max||0,over=goal&&d.remaining<0,pct=goal?Math.min(100,d.consumed/goal*100):0;
    var color=!goal?'#d1d5db':pct>110?'var(--bad)':pct>100?'var(--warn)':'var(--ok)';
    var center=goal?'<p class="n" style="color:'+(over?'var(--bad)':'var(--fg)')+'">'+fmt(d.remaining)+'</p><p class="l">'+(over?'exceso':'restante')+'</p>':'<p class="n">'+fmt(d.consumed-d.burned)+'</p><p class="l">netas</p>';
    var rows='<div class="row"><span>🎯 Máximo</span><b>'+(goal?fmt(goal):'—')+'</b></div>'
      +'<div class="row"><span>🍴 Comida</span><b>−'+fmt(d.consumed)+'</b></div>'
      +'<div class="row"><span>🔥 Ejercicio</span><b>+'+fmt(d.burned)+'</b></div>'
      +(goal?'<div class="row tot"><span>= '+(over?'Exceso':'Restante')+'</span><b>'+(over?'−':'')+fmt(d.remaining)+' kcal</b></div>':'');
    var chip=goal?(over?'<span class="chip over">🌱 Te pasaste '+fmt(d.remaining)+' kcal, mañana equilibras</span>':'<span class="chip">✅ En déficit · '+(d.protein!=null?'P '+Math.round(d.protein)+(d.protein_goal?'/'+d.protein_goal:'')+' g':'')+'</span>'):'';
    app.innerHTML='<div class="card"><div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="'+R+'" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="60" cy="60" r="'+R+'" fill="none" stroke="'+color+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(pct/100*C)+' '+C+'"/></svg><div class="c">'+center+'</div></div><div class="rows"><p style="margin:0 0 4px;font-size:12px;color:var(--muted)">'+(d.label||'Hoy')+' · '+(d.meals||0)+' comida'+(d.meals===1?'':'s')+'</p>'+rows+chip+'</div></div>'
      +(d.link?'<a id="open" class="btn" href="'+d.link+'" target="_blank" rel="noopener">Ver completo en GoFit →</a><p class="foot">El enlace te abre la cuenta sin contraseña · vence en 5 min</p>':'');
    var a=document.getElementById('open');
    if(a)a.addEventListener('click',function(e){
      if(window.openai&&window.openai.openExternal){e.preventDefault();window.openai.openExternal({href:d.link});}
      else if(!window.openai&&window.parent!==window){e.preventDefault();window.parent.postMessage({jsonrpc:'2.0',id:Date.now(),method:'ui/open-link',params:{url:d.link}},'*');}
    });
  }
  function fromContent(p){try{var t=(p&&p.content||[]).filter(function(c){return c.type==='text'}).map(function(c){return c.text}).join('\\n');var m=t.match(/<!--data:(.*?)-->/);return m?JSON.parse(m[1]):null}catch(e){return null}}
  if(window.openai){
    render(window.openai.toolOutput);
    window.addEventListener('openai:set_globals',function(){render(window.openai.toolOutput)});
  }else if(window.parent!==window){
    window.addEventListener('message',function(e){
      var m=e.data;if(!m||m.jsonrpc!=='2.0')return;
      if(m.id===1&&m.result){window.parent.postMessage({jsonrpc:'2.0',method:'ui/notifications/initialized'},'*');}
      if(m.method==='ui/notifications/tool-result'){var p=m.params||{};render(p.structuredContent||fromContent(p));}
    });
    window.parent.postMessage({jsonrpc:'2.0',id:1,method:'ui/initialize',params:{protocolVersion:'2026-01-26',capabilities:{},clientInfo:{name:'gofit-remaining',version:'1.0.0'}}},'*');
  }
})();
</script></body></html>`
