/* A single review view for Capture and Library; every output retains its source revision. */
(function(){
  const lenses={all:'Complete communication review',structure:'Structure',coherence:'Coherence',clarity:'Clarity',concision:'Concision',impact:'Impact',executivePresence:'Executive presence',humorWit:'Generate humorous version',compression:'Compression',decisiveness:'Decisiveness',authenticity:'Authenticity',northStar:'North Star',custom:'Custom perspective'};
  const active=new Map();
  const plain=r=>{const copy=Object.assign({},r);delete copy.reviewHistory;return copy};
  function reviews(row){const r=row.aiReview;return r&&typeof r==='object'?[...(r.reviewHistory||[]),plain(r)]:[]}
  const current=(row,r)=>Number(r.transcriptRevision||1)===Number(row.metrics?.transcriptRevision||1);
  function coverage(row,key){const rs=reviews(row).filter(r=>current(row,r));if(key==='humorWit')return rs.some(r=>r.humorousVersion||r.humor?.humorousVersion)?'Reviewed':'Not yet reviewed';return rs.some(r=>(!r.perspective||r.perspective==='all'||r.perspective===key)&&(key==='custom'?r.perspective==='custom':typeof r.scores?.[key]==='number'))?'Reviewed':rs.some(r=>(r.reviewedCriteria||[]).includes(key))?'Assessed; insufficient evidence / N/A':'Not yet reviewed'}
  async function run(row,lens,custom,onStatus=()=>{}){
    const api=window.FluencyCloud;if(!api.configured())throw Error('Connect Google in Settings, then reopen this saved sample.');
    if(!String(row.transcript||'').trim())throw Error('Transcribe the recording before requesting an AI review.');
    if(active.has(row.id))throw Error('A review for this session is already running.');
    const jobId=crypto.randomUUID(),revision=Number(row.metrics?.transcriptRevision||1),transcript=row.transcript;active.set(row.id,jobId);
    try{
      onStatus('Confirming this transcript in Google…');await api.cloudSave(row,{forReview:true});
      const rubric=api.rubric();rubric.mode=row.context;rubric.analysisVersion='2.5';rubric.rubricVersion='communication-v2.5';rubric.perspective=lens;
      if(lens!=='all'){rubric.criteria=Object.fromEntries(Object.keys(lenses).filter(k=>!['all','custom'].includes(k)).map(k=>[k,k===lens]));rubric.custom=[rubric.custom,'Focus this review on '+(lenses[lens]||lens)+'.',custom].filter(Boolean).join('\n')}
      else if(custom)rubric.custom=[rubric.custom,custom].filter(Boolean).join('\n');
      if(lens==='all'||lens==='humorWit')rubric.custom+='\nProvide a complete humorousVersion rewrite of this message, with natural wit, playful comparisons or self-directed humor. Preserve facts and intent. It may be lengthy: do not impose executive concision on this version. Do not substitute applicability advice for the rewrite. For a complete review also supply executiveVersion and punchyVersion.';
      onStatus('Gemini review running…');await api.post({action:'analyze',jobId,sessionId:row.id,transcript,metrics:row.metrics||{},rubric});
      const end=Date.now()+150000;let result;
      while(Date.now()<end){await new Promise(r=>setTimeout(r,2500));const job=await api.jsonp('job',{jobId},30000);if(job.status==='ERROR')throw Error(job.error||'Review failed. Earlier reviews are retained.');if(job.status==='DONE'){result=job.result;break}}
      if(!result)throw Error('Review is still pending. Use Sync history later before retrying.');
      if(typeof result!=='object')throw Error('Gemini returned an unreadable review. You can retry.');
      result.perspective=result.perspective||lens;result.analyzedAt=result.analyzedAt||new Date().toISOString();result.transcriptRevision=revision;
      result.reviewedCriteria=result.reviewedCriteria||Object.keys(rubric.criteria||{}).filter(k=>rubric.criteria[k]);
      const latest=(await all()).find(x=>x.id===row.id)||row;
      if(!result.reviewHistory)result.reviewHistory=reviews(latest);
      const updated=Object.assign({},latest,{aiStatus:'DONE',aiReview:result,updatedAt:new Date().toISOString()});
      await api.saveLocal(updated);Object.assign(row,updated);api.updateFocus([updated]);await render();return result;
    }finally{active.delete(row.id)}
  }
  function version(row,key){return reviews(row).filter(r=>current(row,r)).reverse().map(r=>key==='executiveVersion'?r.executiveVersion||r.tighterVersion:key==='humorousVersion'?r.humorousVersion||r.humor?.humorousVersion:r[key]).find(v=>typeof v==='string'&&v.trim())||''}
  function reviewHtml(r){if(!r||typeof r!=='object')return '<p class="note">No AI review yet. Choose a perspective below whenever you are ready.</p>';
    const scores=Object.entries(r.scores||{}).filter(([k,v])=>k!=='humorWit'&&typeof v==='number').map(([k,v])=>'<span>'+esc(lenses[k]||k)+': '+v+'</span>').join('');
    return '<p>'+esc(r.summary||'')+'</p><div class="metrics">'+scores+'</div><p><b>What worked:</b> '+esc((r.whatWorked||r.strengths||[]).join(' • '))+'</p><p><b>What needs work:</b> '+esc((r.needsWork||[]).map(x=>(x.dimension?x.dimension+': ':'')+(x.issue||x.coach||'')).join(' • ')||r.primaryLeak||r.primaryLever||'—')+'</p>';
  }
  function mount(row,parent){
    parent.querySelector('.saved-review-panel')?.remove();const panel=document.createElement('section');panel.className='saved-review-panel';
    const previous=reviews(row),r=row.aiReview,stale=r&&!current(row,r),prefix=parent.id+'-review',practice=r?.drill?.instruction||r?.nextPractice?.join(' • ')||r?.practiceChallenge;
    panel.innerHTML='<div id="'+prefix+'"><p class="note">Gemini runs only when you request a review. Saved recordings can be reviewed from another perspective at any time.</p>'+(stale?'<p class="review-stale">Transcript corrected since this review. Earlier feedback is retained; request a new review for the corrected text.</p>':'')+reviewHtml(r)+(practice?'<div class="coach challenge"><b>Next practice</b><span>'+esc(practice)+'</span><button class="next-attempt">Record next attempt</button></div>':'')+[['executiveVersion','Executive version'],['punchyVersion','Punchier version'],['humorousVersion','Humorous version']].map(([key,title])=>{const text=version(row,key);return '<section><h4>'+title+'</h4><p class="detail-text">'+esc(text||(key==='humorousVersion'?'A humorous rewrite has not been generated for this transcript.':'Not generated for this transcript yet.'))+'</p>'+(!text&&key==='humorousVersion'?'<button class="generate-humor">Generate humorous version</button>':'')+'</section>'}).join('')+
      '<div class="metrics">'+Object.keys(lenses).filter(k=>!['all','custom','humorWit'].includes(k)).map(k=>'<span>'+esc(lenses[k])+': '+coverage(row,k)+'</span>').join('')+'</div><label>Review perspective<select class="saved-lens">'+Object.entries(lenses).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select></label><label>Specific question or custom perspective<textarea class="saved-custom" rows="2"></textarea></label><div class="button-row"><button class="primary saved-run">Review with Gemini AI</button><button class="saved-prompt">Copy AI review prompt</button><button class="edit-transcript">Edit / correct transcript</button></div><p class="note saved-status" role="status">'+(!row.transcript?'Transcript needed: open retained audio and transcribe it locally.':'Ready when you choose.')+'</p>'+
      (previous.length>1?'<details><summary>Earlier reviews ('+(previous.length-1)+')</summary>'+previous.slice(0,-1).reverse().map(old=>'<article><h4>'+esc(lenses[old.perspective]||'Previous review')+' • '+esc(old.analyzedAt||'Earlier')+'</h4>'+reviewHtml(old)+[['executiveVersion','Executive version'],['punchyVersion','Punchier version'],['humorousVersion','Humorous version']].map(([key,label])=>old[key]?'<h4>'+label+'</h4><p class="detail-text">'+esc(old[key])+'</p>':'').join('')+'</article>').join('')+'</details>':'')+'</div>';
    parent.appendChild(panel);window.FluencyWorkflow.collapse($(prefix),'AI review & versions','ai-review');
    const button=panel.querySelector('.saved-run'),status=panel.querySelector('.saved-status'),humor=panel.querySelector('.generate-humor');
    const disabled=!String(row.transcript||'').trim()||active.has(row.id);button.disabled=disabled;if(humor)humor.disabled=disabled;
    async function request(lens){button.disabled=true;if(humor)humor.disabled=true;try{await run(row,lens,panel.querySelector('.saved-custom').value,msg=>status.textContent=msg);mount(row,parent)}catch(e){status.textContent=e.message}finally{button.disabled=!row.transcript;if(humor)humor.disabled=!row.transcript}}
    button.onclick=()=>request(panel.querySelector('.saved-lens').value);if(humor)humor.onclick=()=>request('humorWit');
    panel.querySelector('.next-attempt')?.addEventListener('click',()=>window.FluencyWorkflow.nextAttempt(row));
    panel.querySelector('.edit-transcript').onclick=()=>window.FluencyWorkflow.edit(row);
    panel.querySelector('.saved-prompt').onclick=async()=>{try{await navigator.clipboard.writeText('Review this communication for '+lenses[panel.querySelector('.saved-lens').value]+'. Preserve facts and meaning. Give evidence, a practice drill, executiveVersion, punchyVersion and a complete humorousVersion with no brevity limit. Do not infer vocal delivery from text.\n'+panel.querySelector('.saved-custom').value+'\nTranscript:\n'+row.transcript);status.textContent='Prompt copied.'}catch(e){status.textContent=e.message}};
  }
  function renderCurrent(row){mount(row,$('aiResult'));$('aiResult').hidden=false}
  function open(row){
    const parent=$('sessionDetail');parent.innerHTML='<div class="dialog-toolbar"><button data-detail-jump="detailTranscript">Transcript</button><button data-detail-jump="detailTimestamps">Timestamps</button><button data-detail-jump="sessionDetail-review">Review & versions</button><button id="detailPractice">Record next attempt</button></div><h2>'+esc(row.title)+'</h2><p>Attempt '+esc(row.attempt||1)+'</p><section id="detailTranscript"><p class="detail-text">'+esc(row.transcript||'Transcript not saved yet.')+'</p><button id="detailEdit">Edit / correct transcript</button></section><section id="detailTimestamps"><p class="note">'+(row.metrics?.timingTranscriptMatches===false?'Original transcription timing; corrected words have not been realigned.':'Timing from the original transcription.')+'</p><pre>'+esc(row.timestampedTranscript||'No saved timing evidence.')+'</pre></section>';
    window.FluencyWorkflow.collapse($('detailTranscript'),'Transcript','saved-transcript');window.FluencyWorkflow.collapse($('detailTimestamps'),'Word timestamps','saved-timestamps');mount(row,parent);
    parent.querySelectorAll('[data-detail-jump]').forEach(b=>b.onclick=()=>window.FluencyWorkflow.jump(b.dataset.detailJump));
    $('detailEdit').onclick=()=>window.FluencyWorkflow.edit(row);$('detailPractice').onclick=()=>window.FluencyWorkflow.nextAttempt(row);
    if(!$('sessionDialog').open)$('sessionDialog').showModal();
  }
  window.FluencyReviews={run,mount,open,coverage,reviews,renderCurrent,version};
})();
