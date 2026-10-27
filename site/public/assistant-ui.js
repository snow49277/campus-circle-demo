import * as A from './assistant-domain.js';
import * as D from './domain.js';

let ctx,config={configured:false,checked:false},accessCode='';
const sessions=new Map();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const session=()=>{const state=ctx.getState();let entry=sessions.get(state.current);if(!entry||entry.state!==state){entry={state,actor:state.current,mode:'example',draft:A.emptyDraft(),messages:[],results:null,busy:false,error:'',revision:0,requestId:null};sessions.set(state.current,entry);}return entry;};
const update=s=>{if(ctx.getState()===s.state&&ctx.getState().current===s.actor&&ctx.isVisible())ctx.render();};
const options=(values,current,placeholder)=>`<option value="">${placeholder}</option>`+values.map(([v,label])=>`<option value="${esc(v)}" ${current===v?'selected':''}>${esc(label)}</option>`).join('');
function statusText(s){return s.mode==='example'?'交互示例 · 不调用大模型':config.configured?'DeepSeek · 真实模型内测':config.checked?'DeepSeek · 待接通':'正在检查模型连接';}
export function view(state){
 const s=session(),d=s.draft,missing=A.missingFields(d),complete=!missing.length;
 return `<div class="page-eyebrow">FIND HELP, IN YOUR OWN WORDS</div><div class="ai-heading"><div><h1 class="page-title">先聊聊，你想学什么？</h1><p class="page-intro">不必先想好标签。一起把模糊的想法，整理成一次具体的互助。</p></div><span class="ai-status ${s.mode==='live'&&config.configured?'connected':''}"><i></i>${statusText(s)}</span></div>
 <div class="ai-steps"><span><b>01</b> 说出想法</span><span><b>02</b> 确认需求</span><span><b>03</b> 看看谁适合</span></div>
 <div class="ai-layout"><section class="ai-conversation"><div class="ai-chat-head"><span class="ai-avatar">✳</span><div><strong>互助小助手</strong><small>帮你说明需求，也帮你理解匹配</small></div><div class="ai-mode" aria-label="助手模式"><button data-ai="mode" data-mode="example" aria-pressed="${s.mode==='example'}" ${s.busy?'disabled':''}>交互示例</button><button data-ai="mode" data-mode="live" aria-pressed="${s.mode==='live'}" ${s.busy?'disabled':''}>真实 AI</button></div></div>
 ${s.mode==='live'?`<div class="ai-service-note">${config.configured?'对话及参与推荐的示例资料会发送至 DeepSeek。请勿输入私人信息。':'站点尚未配置模型服务。可以先体验示例，或直接编辑右侧需求卡。'}${config.configured?`<label>内测码<input type="password" id="ai-access" autocomplete="off" placeholder="由项目负责人提供" value="${esc(accessCode)}"></label>`:''}</div>`:'<div class="ai-service-note">下面是预设交互示例，用于展示产品流程；回复和推荐不是大模型生成。</div>'}
 <div class="ai-transcript" role="log" aria-label="需求对话" aria-live="polite"><div class="ai-message assistant"><span class="ai-speaker">互助小助手</span><p>你好！你希望解决什么具体问题？例如“照片总是没有重点”，或者“吉他换和弦总是卡住”。</p></div>${s.messages.map(m=>`<div class="ai-message ${m.role}"><span class="ai-speaker">${m.role==='user'?'你':s.mode==='example'?'示例助手':'互助小助手'}</span><p>${esc(m.content)}</p></div>`).join('')}${s.busy?'<div class="ai-thinking" role="status">✳ 正在整理，请稍候……</div>':''}</div>
 ${s.mode==='example'?`<div class="ai-example-list"><small>选一个想法，体验需求澄清</small>${A.examples.map((x,i)=>`<button data-ai="example" data-index="${i}">${esc(x.label)} <span>↗</span></button>`).join('')}${s.draft.skill?'<button data-ai="example-followup" class="ai-followup">线上，周六下午，先试一次 <span>↗</span></button>':''}</div>`:`<form id="ai-chat"><label class="sr-only" for="ai-message">向 AI 描述你的需求</label><textarea id="ai-message" name="message" maxlength="1000" rows="3" placeholder="说说你的目标、基础，或补充时间和交流方式……" ${!config.configured||s.busy?'disabled':''}>${esc(s.input||'')}</textarea><div class="ai-composer-bottom"><span>AI 可能理解有误，请核对需求卡</span><button class="button primary" type="submit" ${!config.configured||s.busy?'disabled':''}>${s.busy?'正在思考':'发送'} ↑</button></div></form>`}
 ${s.error?`<div class="ai-error" role="alert">${esc(s.error)} <button data-ai="retry" class="text-button" ${s.busy?'disabled':''}>重试</button></div>`:''}
 <div class="ai-chat-foot"><span>聊天记录仅保留在本次页面会话中</span><button data-ai="reset" class="text-button" ${s.busy?'disabled':''}>重新开始</button></div></section>
 <aside class="ai-draft"><div class="ai-draft-title"><span>YOUR NEXT STEP</span><h2>把这一次，说具体</h2><p>你确认后，需求才会发布。不会自动预约。</p></div><form id="ai-draft"><label>技能方向<select name="skill">${options(Object.entries(A.skills).map(([v,[l]])=>[v,l]),d.skill,'待补充')}</select></label><label>需求标题<input name="title" maxlength="40" value="${esc(d.title)}" placeholder="这次希望获得什么帮助？" required></label><label>这一次具体做什么<textarea name="scope" rows="3" maxlength="300" required placeholder="目标、准备材料和帮助范围">${esc(d.scope)}</textarea></label><label>当前基础 <small>选填</small><input name="level" maxlength="80" value="${esc(d.level)}" placeholder="例如：会按基础和弦"></label><div class="ai-draft-row"><label>交流方式<select name="mode">${options([['线上','线上'],['线下','线下']],d.mode,'待补充')}</select></label><label>互助周期<select name="ongoing">${options([['false','先试一次'],['true','希望持续']],d.ongoing===null?'':String(d.ongoing),'待补充')}</select></label></div><label>可用时间<select name="time">${options(A.times.map(v=>[v,v]),d.time,'待补充')}</select><small>Demo 暂提供两个时间段，实际时间需双方沟通。</small></label><div class="ai-completeness">${complete?'✓ 信息已齐全，请核对后发布':'待补充：'+missing.join('、')}</div><button class="button primary" type="submit" ${s.busy?'disabled':''}>${s.requestId?'保存需求修改':'确认并发布需求'} →</button><button class="button ghost" type="button" data-ai="match" ${s.busy?'disabled':''}>${s.mode==='example'?'预览示例匹配':'让 AI 辅助匹配'}</button>${s.requestId?'<button class="text-button" type="button" data-ai="rings">查看可组成的互助环 →</button>':''}</form></aside></div>
 ${renderResults(s,state)}`;
}
function renderResults(s,state){
 if(!s.results)return '';
 return `<section class="ai-results"><div class="section-head"><div><div class="page-eyebrow">A LITTLE CLOSER TO THE RIGHT PERSON</div><h2>${s.mode==='example'?'示例匹配结果':'为你找到的候选'}</h2></div><span class="muted">${s.mode==='example'?'规则筛选与预设解释':'规则筛选 + AI 辅助推荐'}</span></div><p class="ai-results-note">${s.results.reason?esc(s.results.reason):'这里只展示可能合适的帮助。先聊清楚，再由双方确认；持续学习需逐次征求同意。'}</p><div class="ai-recommendations">${s.results.items.map(r=>{const c=s.results.candidates.find(c=>c.id===r.offerId),p=D.user(state,c.owner);return `<article class="ai-recommendation"><div class="ai-rec-head"><span class="avatar ${p.color}">${p.initial}</span><div><strong>${esc(p.name)}</strong><small>${esc(c.title)}</small></div><span class="status ${r.fit==='not_fit'?'':'green'}">${r.fit==='strong'?'较贴合目标':r.fit==='possible'?'值得先聊聊':'可能不适合'}</span></div><p>${esc(r.reason)}</p><blockquote><small>资料依据 · ${s.mode==='example'?'虚构示例':'本人描述，未经平台认证'}</small>“${esc(r.evidence.quote)}”</blockquote><p class="ai-caveat">沟通前再确认：${esc(r.caveat||'是否愿意提供本次帮助，以及具体时间。')}</p><div class="panel-actions"><button class="button ghost" data-ai="profile" data-id="${c.owner}">查看经历</button><button class="button primary" data-ai="chat" data-id="${c.owner}">先聊几句 ↗</button></div></article>`;}).join('')}</div></section>`;
}
function readDraft(s){const f=document.querySelector('#ai-draft');if(!f)return s.draft;const values=Object.fromEntries(new FormData(f));values.ongoing=values.ongoing===''?null:values.ongoing==='true';return A.normalizeDraft(values);}
function assignDraft(s,d){if(JSON.stringify(s.draft)!==JSON.stringify(d)){s.draft=d;s.revision++;s.results=null;}}
async function call(s,payload){
 const controller=new AbortController();s.controller=controller;const timer=setTimeout(()=>controller.abort(),30000);
 try{const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json','x-ai-access-code':accessCode},body:JSON.stringify(payload),signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'请求失败，请重试。');return data;}finally{clearTimeout(timer);}
}
async function clarify(s,message,retry=false){
 if(s.busy)return;s.draft=readDraft(s);s.error='';s.busy=true;s.retry={type:'clarify',message};
 if(!retry)s.messages.push({role:'user',content:message});s.input='';const revision=s.revision;update(s);
 try{const data=await call(s,{task:'clarify',draft:s.draft,messages:s.messages.slice(-12)});if(revision!==s.revision)return;s.draft=A.normalizeDraft(data.draft);s.results=null;s.messages.push({role:'assistant',content:data.reply});s.messages=s.messages.slice(-24);s.retry=null;}
 catch(e){s.error=e.name==='AbortError'?'请求超时，请重试；草稿已保留。':e.message;}finally{s.busy=false;update(s);document.querySelector('.ai-transcript')?.scrollTo({top:99999});}
}
async function match(s){
 if(s.busy)return;
 try{assignDraft(s,readDraft(s));A.draftListing(s.draft,s.actor,D.user(s.state,s.actor).campus);}catch(e){s.error=e.message;update(s);return;}
 const {candidates,reason}=A.candidatePool(s.state,s.draft,s.requestId);s.error='';s.retry={type:'rank'};
 if(!candidates.length){s.results={candidates,items:[],reason};s.retry=null;update(s);return;}
 if(s.mode==='example'){
  s.results={candidates,reason:'以下依据固定规则和预设模板展示，不代表模型评测结果。',items:candidates.map(c=>({offerId:c.id,fit:'possible',reason:'技能方向、交流形式和可用时间符合当前需求。具体目标是否适合，还需要双方沟通。',caveat:s.draft.ongoing&&!c.ongoing?'该同学未声明持续互助意愿，需要先确认。':'请先确认本次范围、准备材料和是否愿意提供帮助。',evidence:{field:'scope',quote:c.scope}}))};s.retry=null;update(s);return;
 }
 if(!config.configured){s.error='真实 AI 尚未接通。你可以先体验示例，或手动发布需求。';update(s);return;}
 s.busy=true;const revision=s.revision;update(s);
 try{const data=await call(s,{task:'rank',draft:s.draft,candidates});if(revision!==s.revision)return;const fresh=A.candidatePool(s.state,s.draft,s.requestId).candidates;const items=A.normalizeRecommendations(data.recommendations,fresh);s.results={candidates:fresh,items,reason:items.length?'':'AI 未找到有充分依据的推荐。可以调整需求，或自行浏览现有供给。'};s.retry=null;}catch(e){s.error=e.name==='AbortError'?'匹配超时，请重试。':e.message;}finally{s.busy=false;update(s);document.querySelector('.ai-results')?.scrollIntoView({behavior:'smooth',block:'start'});}
}
export function init(context){
 ctx=context;
 fetch('/api/ai').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{config={configured:data.configured===true,checked:true};if(ctx.isVisible())ctx.render();}).catch(()=>{config={configured:false,checked:true};if(ctx.isVisible())ctx.render();});
 document.addEventListener('input',e=>{if(e.target.id==='ai-access')accessCode=e.target.value;if(e.target.id==='ai-message')session().input=e.target.value;});
 document.addEventListener('change',e=>{if(e.target.closest('#ai-draft')){const s=session();assignDraft(s,readDraft(s));const line=document.querySelector('.ai-completeness');if(line){const missing=A.missingFields(s.draft);line.textContent=missing.length?'待补充：'+missing.join('、'):'✓ 信息已齐全，请核对后发布';}document.querySelector('.ai-results')?.remove();}});
 document.addEventListener('click',e=>{const button=e.target.closest('[data-ai]');if(!button)return;e.preventDefault();const s=session();if(s.busy)return;const action=button.dataset.ai;
  if(action==='mode'){assignDraft(s,readDraft(s));s.mode=button.dataset.mode;s.messages=[];s.results=null;s.error='';s.retry=null;update(s);}
  if(action==='example'){const x=A.examples[Number(button.dataset.index)];s.draft={...A.emptyDraft(),...x.draft};s.requestId=null;s.messages=[{role:'user',content:x.message},{role:'assistant',content:'我把目标整理成了右侧需求卡。你更希望线上还是线下？什么时间方便，想先试一次还是持续学习？'}];s.results=null;s.error='';s.revision++;update(s);}
  if(action==='example-followup'){s.draft={...readDraft(s),mode:'线上',time:A.times[0],ongoing:false};s.messages.push({role:'user',content:'线上，周六下午，先试一次。'},{role:'assistant',content:'需求信息已经补齐。请核对右侧卡片，你可以先预览匹配，再确认发布。'});s.results=null;s.error='';s.revision++;update(s);}
  if(action==='reset'){s.controller?.abort();sessions.delete(s.actor);update(s);}
  if(action==='match')void match(s);
  if(action==='retry'){if(s.retry?.type==='clarify')void clarify(s,s.retry.message,true);else void match(s);}
  if(action==='profile')ctx.profile(button.dataset.id);
  if(action==='chat')ctx.chat(button.dataset.id);
  if(action==='rings')ctx.goMatches();
 });
 document.addEventListener('submit',e=>{
  if(!['ai-chat','ai-draft'].includes(e.target.id))return;e.preventDefault();const s=session();if(s.busy)return;
  if(e.target.id==='ai-chat'){const message=new FormData(e.target).get('message').trim();if(message)void clarify(s,message);return;}
  try{assignDraft(s,readDraft(s));const listing=A.draftListing(s.draft,s.actor,D.user(s.state,s.actor).campus);
   if(s.requestId){D.assert(!s.state.agreements.some(a=>a.request===s.requestId&&a.status!=='cancelled'),'这项需求已有约定，请在我的约定中处理。');D.updateListing(s.state,s.requestId,s.actor,listingFields(listing));}
   else{listing.id=D.uid(s.state);listing.origin=s.mode==='live'?'ai-assisted':'example-assisted';s.state.listings.push(listing);s.requestId=listing.id;}
   ctx.save();s.results=null;s.error='';ctx.toast('需求已发布。可以继续匹配，或查看可组成的互助环。');update(s);
  }catch(err){s.error=err.message;update(s);}
 });
}
function listingFields({id,owner,campus,...fields}){return fields;}
