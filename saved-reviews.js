/* Reviews belong to saved sessions, independently of the capture form. */
(function(){
  const lenses={all:'Complete communication review',structure:'Structure',coherence:'Coherence',clarity:'Clarity',concision:'Concision',impact:'Impact',executivePresence:'Executive presence',humorWit:'Humor & wit',compression:'Compression',decisiveness:'Decisiveness',authenticity:'Authenticity',custom:'Custom perspective'};
  const active=new Map();
  const plain=r=>{const copy=Object.assign({},r);delete copy.reviewHistory;return copy};
  function reviews(row){const r=row.aiReview;return r&&typeof r==='object'?[...(r.reviewHistory||[]),plain(r)]:[]}
  function coverage(row,key){const rs=reviews(row);return rs.some(r=>key==='custom'?r.perspective==='custom':r.scores&&r.scores[key]!=null)?'Reviewed':rs.some(r=>(r.reviewedCriteria||[]).includes(key))?'Assessed; insufficient evidence / N/A':'Not yet reviewed'}
  async function run(row,lens,custom,onStatus){
    const api=window.FluencyCloud;if(!api.configured())throw Error('Connect Google in Settings, then reopen this saved sample.');
    if(!String(row.transcript||'').trim())throw Error('Transcribe the recording before requesting an AI review.');
    if(active.has(row.id))throw Error('A review for this session is already running.');
    const jobId=crypto.randomUUID();active.set(row.id,jobId);
    try{
      onStatus('Saving the session to Google…');await api.cloudSave(row);
      const rubric=api.rubric();rubric.mode=row.context;rubric.analysisVersion='2.4';rubric.rubricVersion='north-star-v2.4';rubric.perspective=lens;
      if(lens!=='all'){rubric.criteria=Object.fromEntries(Object.keys(lenses).filter(k=>!['all','custom'].includes(k)).map(k=>[k,k===lens]));rubric.custom=[rubric.custom,'Focus this review on '+(lenses[lens]||lens)+'.',custom].filter(Boolean).join('\n')}
      else if(custom)rubric.custom=[rubric.custom,custom].filter(Boolean).join('\n');
      onStatus('Gemini review running…');await api.post({action:'analyze',jobId,sessionId:row.id,transcript:row.transcript,metrics:row.metrics||{},rubric});
      const end=Date.now()+150000;let result;
      while(Date.now()<end){await new Promise(r=>setTimeout(r,2500));const job=await api.jsonp('job',{jobId},30000);if(job.status==='ERROR')throw Error(job.error||'Review failed. Your saved session and earlier reviews are retained.');if(job.status==='DONE'){result=job.result;break}}
      if(!result)throw Error('Review is still pending. Use Sync history later before retrying.');
      if(typeof result!=='object'||!result)throw Error('Gemini returned an unreadable review. You can retry.');
      result.perspective=result.perspective||lens;result.analyzedAt=result.analyzedAt||new Date().toISOString();
      result.reviewedCriteria=result.reviewedCriteria||Object.keys(rubric.criteria||{}).filter(k=>rubric.criteria[k]);
      if(!result.reviewHistory)result.reviewHistory=reviews(row);
      const updated=Object.assign({},row,{aiStatus:'DONE',aiReview:result,updatedAt:new Date().toISOString()});
      await api.saveLocal(updated);Object.assign(row,updated);api.updateFocus([updated]);await render();return result;
    }finally{active.delete(row.id)}
  }
  function reviewHtml(r){if(!r||typeof r!=='object')return '<p class="note">No AI review yet. Choose a perspective below whenever you are ready.</p>';
    const scores=Object.entries(r.scores||{}).filter(([,v])=>v!=null).map(([k,v])=>'<span>'+esc(lenses[k]||k)+': '+esc(String(v))+'</span>').join('');
    return '<p>'+esc(r.summary||'')+'</p><div class="metrics">'+scores+'</div><p><b>What worked:</b> '+esc((r.whatWorked||r.strengths||[]).join(' • '))+'</p><p><b>What needs work:</b> '+esc((r.needsWork||[]).map(x=>(x.dimension?x.dimension+': ':'')+(x.issue||x.coach||'')).join(' • ')||r.primaryLeak||r.primaryLever||'—')+'</p><p><b>Next practice:</b> '+esc(r.drill?.instruction||r.practiceChallenge||'—')+'</p>'+(r.executiveVersion||r.tighterVersion?'<h4>Executive version</h4><p class="detail-text">'+esc(r.executiveVersion||r.tighterVersion)+'</p>':'')+(r.humor?'<div class="coach humor"><b>Humor &amp; Wit</b><span>'+esc(r.humor.opportunity||'No forced humor needed in this context.')+'</span><b>Executive take</b><span>'+esc(r.humor.executiveTake||r.humor.executiveVersion||'Use only when it strengthens the message.')+'</span></div>':'');
  }
  function mount(row,parent){
    parent.querySelector('.saved-review-panel')?.remove();const panel=document.createElement('section');panel.className='saved-review-panel';
    const previous=reviews(row);panel.innerHTML='<h3>AI reviews & perspectives</h3><p class="note">Review this saved transcript now or return later. Earlier reviews remain available. Gemini runs only when you choose it.</p>'+reviewHtml(row.aiReview)+'<div class="metrics">'+Object.keys(lenses).filter(k=>!['all','custom'].includes(k)).map(k=>'<span>'+esc(lenses[k])+': '+coverage(row,k)+'</span>').join('')+'</div><label>Review perspective<select class="saved-lens">'+Object.entries(lenses).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select></label><label>Specific question or custom perspective<textarea class="saved-custom" rows="2" placeholder="For example: Could I make this story punchier without forcing humor?"></textarea></label><div class="button-row"><button class="primary saved-run">Review with Gemini AI</button><button class="saved-prompt">Copy AI review prompt</button></div><p class="note saved-status" role="status">'+(!row.transcript?'Transcript needed. Open retained Telegram audio for local transcription; if it expired, resend it to the bot.':row.aiStatus==='ERROR'?'The previous request failed. You can retry or choose another perspective.':'Ready whenever you choose.')+'</p>'+(previous.length>1?'<details><summary>Earlier reviews ('+(previous.length-1)+')</summary>'+previous.slice(0,-1).reverse().map(r=>'<article><h4>'+esc(lenses[r.perspective]||'Previous review')+' • '+esc(r.analyzedAt||'Earlier')+'</h4>'+reviewHtml(r)+'</article>').join('')+'</details>':'');
    parent.appendChild(panel);const button=panel.querySelector('.saved-run'),status=panel.querySelector('.saved-status');button.disabled=!String(row.transcript||'').trim()||active.has(row.id);
    button.onclick=async()=>{button.disabled=true;try{await run(row,panel.querySelector('.saved-lens').value,panel.querySelector('.saved-custom').value,msg=>status.textContent=msg);mount(row,parent)}catch(e){status.textContent=e.message}finally{button.disabled=!String(row.transcript||'').trim()}};
    panel.querySelector('.saved-prompt').onclick=async()=>{try{if(!row.transcript)throw Error('A transcript is needed first.');const lens=panel.querySelector('.saved-lens').value;await navigator.clipboard.writeText('Act as my communication coach. Review for '+lenses[lens]+'. Separate measurable facts from inference. Preserve factual meaning. Give strengths, evidence, improvements and one practical drill. Do not infer vocal delivery from text alone.\n'+panel.querySelector('.saved-custom').value+'\nMetrics: '+JSON.stringify(row.metrics||{})+'\nTranscript:\n'+row.transcript);status.textContent='Prompt copied. Paste it into your chosen AI assistant.'}catch(e){status.textContent=e.message}};
  }
  function open(row){$('sessionDetail').innerHTML='<h2>'+esc(row.title)+'</h2><p class="detail-text">'+esc(row.transcript||'Transcript not saved yet.')+'</p>';mount(row,$('sessionDetail'));if(!$('sessionDialog').open)$('sessionDialog').showModal()}
  window.FluencyReviews={run,mount,open,coverage,reviews};
})();
