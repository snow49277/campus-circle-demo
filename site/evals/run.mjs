import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {handleAI} from '../lib/ai-service.mjs';
if(process.env.RUN_LIVE_AI_EVAL!=='1'||!process.env.DEEPSEEK_API_KEY||!process.env.AI_ACCESS_CODE){
 console.error('未运行真实模型评测。需显式设置 RUN_LIVE_AI_EVAL=1，并通过安全环境变量配置 DEEPSEEK_API_KEY 和 AI_ACCESS_CODE。该命令会产生真实API调用费用。');process.exitCode=1;
}else{
 const cases=JSON.parse(await readFile(new URL('./cases.json',import.meta.url),'utf8')),results=[];
 for(const c of cases){
  const start=Date.now();const body={task:c.task,draft:c.draft||{},...(c.task==='clarify'?{messages:c.messages}:{candidates:c.candidates})};
  const request=new Request('https://eval.local/api/ai',{method:'POST',headers:{origin:'https://eval.local','content-type':'application/json','x-ai-access-code':process.env.AI_ACCESS_CODE},body:JSON.stringify(body)});
  const response=await handleAI(request,process.env);const output=await response.json();
  const checks=c.expected?Object.entries(c.expected).map(([key,value])=>({key,expected:value,actual:output.draft?.[key],passed:output.draft?.[key]===value})):[];
  if(c.expectedFirst)checks.push({key:'first_candidate',expected:c.expectedFirst,actual:output.recommendations?.[0]?.offerId,passed:output.recommendations?.[0]?.offerId===c.expectedFirst&&output.recommendations?.[0]?.fit!=='not_fit'});
  if(c.expectedNoFit)checks.push({key:'no_false_fit',passed:Array.isArray(output.recommendations)&&output.recommendations.every(r=>r.fit==='not_fit')});
  results.push({id:c.id,status:response.status,latencyMs:Date.now()-start,checks,output,humanReview:c.review});
  console.log(`${c.id}: HTTP ${response.status}, ${checks.filter(x=>x.passed).length}/${checks.length} 自动字段检查通过`);
 }
 await mkdir('outputs',{recursive:true});const report={time:new Date().toISOString(),model:process.env.DEEPSEEK_MODEL||'deepseek-flash',dataset:'10 synthetic cases; human semantic review still required',results};
 await writeFile('outputs/ai-eval.json',JSON.stringify(report,null,2)+'\n');console.log('报告已写入 outputs/ai-eval.json；请人工复核自然语言质量与依据。');
}
