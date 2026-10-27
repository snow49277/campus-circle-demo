import * as D from './domain.js';

export const skills = {
  computer: ['电脑配置', '数码与效率'], photo: ['摄影构图', '影像与设计'],
  guitar: ['吉他练习', '音乐与表达'], ielts: ['雅思经验', '语言与经验'],
  ski: ['滑雪经验', '生活与运动'], other: ['其他需求', '其他技能']
};
export const times = ['周六 14:00—18:00', '周日 14:00—18:00'];
export const emptyDraft = () => ({skill:null,title:'',scope:'',level:'',mode:null,time:null,ongoing:null});
const text = (v,max) => typeof v === 'string' ? v.trim().slice(0,max) : '';
export function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('需求卡格式不正确，请重试。');
  return {skill:Object.hasOwn(skills,raw.skill)?raw.skill:null,title:text(raw.title,40),scope:text(raw.scope,300),level:text(raw.level,80),mode:['线上','线下'].includes(raw.mode)?raw.mode:null,time:times.includes(raw.time)?raw.time:null,ongoing:typeof raw.ongoing==='boolean'?raw.ongoing:null};
}
export function missingFields(d) {
  return [['skill','技能方向'],['title','需求标题'],['scope','本次目标'],['mode','交流形式'],['time','可用时间'],['ongoing','单次或持续']].filter(([key])=>d[key]===null||d[key]===undefined||d[key]==='').map(([,label])=>label);
}
export function draftListing(d,owner,campus,id='ai-draft') {
  const draft=normalizeDraft(d),missing=missingFields(draft);
  if(missing.length) throw new Error('请先补充：'+missing.join('、'));
  return {id,owner,campus,type:'request',status:'open',...draft,category:skills[draft.skill][1],duration:'一次具体帮助'};
}
export function candidatePool(state,draft,requestId=null) {
  const me=state.current, profile=D.user(state,me);
  if(!D.balance(state,me).can) return {candidates:[],reason:'你还有待回馈的帮助或已占用的预约。完成一次帮助后再接受新的帮助。'};
  const clone=structuredClone(state);
  const request=draftListing(draft,me,profile.campus,requestId||'ai-draft');
  if(requestId) {
    const current=clone.listings.find(l=>l.id===requestId&&l.owner===me&&l.type==='request');
    if(!current||current.status!=='open'||current.paused) return {candidates:[],reason:'这项需求已完成、暂停或不存在，请重新整理需求。'};
    Object.assign(current,request);
  } else clone.listings.push(request);
  const eligible=D.edges(clone).filter(e=>e.request===request.id);
  const candidates=eligible.slice(0,12).map(e=>{
    const l=clone.listings.find(l=>l.id===e.offer),u=D.user(clone,l.owner);
    return {id:l.id,owner:l.owner,title:l.title,scope:l.scope,experience:u.experience,mode:l.mode,time:l.time,ongoing:l.ongoing,voluntary:!!l.voluntary};
  });
  return {candidates,reason:candidates.length?'':'暂时没有同时满足技能、时间、交流形式和资格条件的候选。可以修改需求或等待新的供给。'};
}
export function normalizeRecommendations(raw,candidates) {
  if(!Array.isArray(raw)) throw new Error('推荐结果格式不正确，请重试。');
  const seen=new Set();
  return raw.slice(0,12).flatMap(r=>{
    const c=candidates.find(c=>c.id===r?.offerId);
    if(!c||seen.has(c.id)||!['strong','possible','not_fit'].includes(r.fit)) return [];
    const field=r.evidence?.field,quote=text(r.evidence?.quote,160);
    if(!['title','scope','experience'].includes(field)||!quote||!c[field]?.includes(quote)) return [];
    seen.add(c.id);
    return [{offerId:c.id,fit:r.fit,reason:text(r.reason,220),caveat:text(r.caveat,180),evidence:{field,quote}}];
  });
}
export const examples = [
  {label:'想把吉他和弦换得更顺',message:'我会按 C、G、Am、F，但换和弦总是停顿，想找人陪练。',draft:{skill:'guitar',title:'想让吉他和弦转换更流畅',scope:'已经会按 C、G、Am、F，希望一起练习转换，找出卡顿原因。',level:'会按基础和弦'}},
  {label:'照片总是缺少重点',message:'我拍的照片总是乱乱的，想知道怎么让主体更突出。',draft:{skill:'photo',title:'想改善照片的主体与构图',scope:'带三张自己拍的照片，讨论主体、留白和画面层次。',level:'摄影入门'}},
  {label:'想听真实的雅思课体验',message:'准备报雅思课，想先听上过课的人讲讲课程节奏和反馈方式。',draft:{skill:'ielts',title:'想了解雅思课程的真实体验',scope:'交流课程节奏、反馈方式和练习安排，帮助自己判断是否适合。',level:'正在选课'}}
];
