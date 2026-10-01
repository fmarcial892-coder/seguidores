const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let history=JSON.parse(localStorage.getItem("seg_history")||"[]");

function showView(id){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#"+id).classList.add("active");
  const titles={dashboard:"Visão geral",new:"Nova análise",history:"Histórico",results:"Resultados"};
  $("#pageTitle").textContent=titles[id]||"Visão geral";
  $$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===id));
  if(id==="history") renderHistory();
}
$$(".nav").forEach(n=>n.onclick=()=>showView(n.dataset.view));
$("#menu").onclick=()=>$(".sidebar").classList.toggle("open");

function clean(v){return v.trim().replace(/^@/,"").replace(/[^a-zA-Z0-9._]/g,"").slice(0,30)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("#start").onclick=async()=>{
  const u=clean($("#username").value); $("#error").textContent="";
  if(!u){$("#error").textContent="Informe um nome de usuário.";return}
  const btn=$("#start"); btn.disabled=true; btn.textContent="Analisando perfil público…";
  try{
    const r=await fetch("/api/analyze?username="+encodeURIComponent(u));
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Não foi possível analisar este perfil.");
    history.unshift({username:u,created:new Date().toLocaleString("pt-BR"),data});
    history=history.slice(0,50); localStorage.setItem("seg_history",JSON.stringify(history));
    renderResult(data); updateStats();
  }catch(e){$("#error").textContent=e.message||"Erro na análise."}
  finally{btn.disabled=false;btn.textContent="Iniciar análise"}
};

function renderResult(d){
  $("#resultTitle").textContent="@"+(d.username||"perfil");
  $("#resultMeta").textContent="Consulta concluída em "+new Date().toLocaleString("pt-BR");
  $("#resultCount").textContent="1";
  $("#siteCount").textContent=d.website?"1":"0";
  $("#resultsBody").innerHTML=`<tr>
    <td><b>@${escapeHtml(d.username)}</b></td>
    <td>${escapeHtml(d.name||"—")}</td>
    <td>${escapeHtml(d.biography||"—")}</td>
    <td>${d.website?'<a href="'+escapeHtml(d.website)+'" target="_blank" rel="noopener">'+escapeHtml(d.website)+'</a>':"—"}</td>
  </tr>
  <tr><td colspan="4"><b>Seguidores:</b> ${escapeHtml(d.followers_count??"—")} &nbsp; <b>Seguindo:</b> ${escapeHtml(d.follows_count??"—")} &nbsp; <b>Publicações:</b> ${escapeHtml(d.media_count??"—")}</td></tr>`;
  showView("results");
}

function renderHistory(){
  const el=$("#historyList");
  if(!history.length){el.className="empty";el.textContent="Nenhuma análise realizada ainda.";return}
  el.className="";
  el.innerHTML=history.map((x,i)=>'<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #eee"><span><b>@'+escapeHtml(x.username)+'</b><small style="display:block;color:#888">'+escapeHtml(x.created)+'</small></span><button class="secondary" data-history="'+i+'">Abrir</button></div>').join("");
  $$("#historyList [data-history]").forEach(b=>b.onclick=()=>renderResult(history[Number(b.dataset.history)].data));
}

$("#export").onclick=()=>{
  const d=history[0]?.data;if(!d)return;
  const rows=[["Perfil","Nome","Biografia","Site público","Seguidores","Seguindo","Publicações"],[d.username,d.name,d.biography,d.website,d.followers_count,d.follows_count,d.media_count]];
  const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="analise-instagram.csv";a.click();URL.revokeObjectURL(a.href);
  localStorage.setItem("seg_exports",String(Number(localStorage.getItem("seg_exports")||0)+1));updateStats();
};
function updateStats(){$("#statAnalyses").textContent=history.length;$("#statProfiles").textContent=history.length;$("#statExports").textContent=localStorage.getItem("seg_exports")||"0"}
updateStats();