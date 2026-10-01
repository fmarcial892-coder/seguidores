const express=require("express");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const GRAPH_VERSION=process.env.GRAPH_API_VERSION||"v24.0";
const TOKEN=process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_ID=process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

app.use(express.static(path.join(__dirname)));

app.get("/api/analyze",async(req,res)=>{
  const username=String(req.query.username||"").replace(/^@/,"").trim();
  if(!/^[A-Za-z0-9._]{1,30}$/.test(username)) return res.status(400).json({error:"Nome de usuário inválido."});
  if(!TOKEN||!IG_ID) return res.status(503).json({error:"A análise real ainda precisa ser configurada no Render com INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID. O site já está pronto para a API oficial."});
  try{
    const fields="business_discovery.username("+encodeURIComponent(username)+"){username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url}";
    const url="https://graph.facebook.com/"+GRAPH_VERSION+"/"+IG_ID+"?fields="+fields+"&access_token="+encodeURIComponent(TOKEN);
    const response=await fetch(url);
    const body=await response.json();
    if(!response.ok||body.error) return res.status(502).json({error:body.error?.message||"A API não retornou dados para este perfil."});
    const d=body.business_discovery;
    if(!d) return res.status(404).json({error:"Perfil público não encontrado ou não disponível pela API autorizada."});
    res.json(d);
  }catch(e){res.status(500).json({error:"Falha ao consultar a fonte autorizada."})}
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log("Seguidores online na porta "+PORT));