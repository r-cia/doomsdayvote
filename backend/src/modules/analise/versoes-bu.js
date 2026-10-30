const CAMPOS = ['dt_geracao','dt_abertura','dt_encerramento','dt_emissao_bu','dt_bu_recebido_ts','dt_bu_recebido_data','precisao','precisao_dt_bu_recebido','qt_aptos','qt_comparecimento','qt_abstencoes','qt_elei_biom_sem_habilitacao','cd_tipo_urna','ds_tipo_urna','conteudo_sha256','imported_at','ativo','substitui_versao_id','lote'];

function ausente(v){return v===null||v===undefined;}
function normalizar(v){return v===undefined?null:v;}
function iguais(a,b){
  if(ausente(a)&&ausente(b))return true;
  if(ausente(a)||ausente(b))return false;
  if(typeof a==='object'||typeof b==='object'){try{return JSON.stringify(a)===JSON.stringify(b);}catch{return false;}}
  return a===b;
}
function diferencaNumerica(anterior,atual){
  const a=Number(anterior),b=Number(atual);
  if(Number.isNaN(a)||Number.isNaN(b))return null;
  if(typeof anterior==='boolean'||typeof atual==='boolean')return null;
  if(ausente(anterior)||ausente(atual))return null;
  return b-a;
}
function extrairVotaveis(versao){
  const candidatos=[versao&&versao.resultados,versao&&versao.votos,versao&&versao.votaveis,versao&&versao.resultado_votavel,versao&&versao.resultados_votavel];
  for(let i=0;i<candidatos.length;i++)if(Array.isArray(candidatos[i]))return candidatos[i];
  return [];
}
function chaveVotavel(item){return String(item&&item.cd_tipo_votavel)+'|'+String(item&&item.nr_votavel);}
function votosDo(item){if(!item)return null;if(ausente(item.qt_votos))return null;return Number(item.qt_votos);}

export function compararVersoes(anterior,atual){
  const a=anterior||{},b=atual||{};
  const campos_alterados=[];
  for(const campo of CAMPOS){
    const va=normalizar(a[campo]),vb=normalizar(b[campo]);
    if(!iguais(va,vb))campos_alterados.push({campo,anterior:va,atual:vb,diferenca:diferencaNumerica(va,vb)});
  }
  const mapaAnterior=new Map();
  for(const item of extrairVotaveis(a))mapaAnterior.set(chaveVotavel(item),item);
  const mapaAtual=new Map();
  for(const item of extrairVotaveis(b))mapaAtual.set(chaveVotavel(item),item);
  const chaves=new Set([...mapaAnterior.keys(),...mapaAtual.keys()]);
  const votaveis_alterados=[];
  for(const chave of chaves){
    const itemAnterior=mapaAnterior.get(chave),itemAtual=mapaAtual.get(chave);
    const nrVotavel=itemAtual&&itemAtual.nr_votavel!==undefined?itemAtual.nr_votavel:(itemAnterior?itemAnterior.nr_votavel:undefined);
    const nmVotavel=itemAtual&&itemAtual.nm_votavel!==undefined?itemAtual.nm_votavel:(itemAnterior?itemAnterior.nm_votavel:null);
    const va=votosDo(itemAnterior),vb=votosDo(itemAtual);
    if(iguais(va,vb)&&itemAnterior&&itemAtual)continue;
    votaveis_alterados.push({nr_votavel:nrVotavel,nm_votavel:nmVotavel,anterior:va,atual:vb,diferenca:diferencaNumerica(va,vb)});
  }
  votaveis_alterados.sort((x,y)=>Number(x.nr_votavel)-Number(y.nr_votavel));
  return {campos_alterados,votaveis_alterados,causa:null};
}
