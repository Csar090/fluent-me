/* A single review view for Capture and Library; every output retains its source revision. */
(function(){
  const lenses={all:'Complete communication review',structure:'Structure',coherence:'Coherence',clarity:'Clarity',concision:'Concision',impact:'Impact',executivePresence:'Executive presence',humorWit:'Generate humorous version',compression:'Compression',decisiveness:'Decisiveness',authenticity:'Authenticity',northStar:'North Star',custom:'Custom perspective'};
  const active=new Map();
  const plain=r=>{const copy=Object.assign({},r);delete copy.reviewHistory;return copy};
  function reviews(row){const r=row.aiReview;return r&&typeof r==='object'?[...(r.reviewHistory||[]),plain(r)]:[]}
  const current=(row,r)=>Number(r.transcriptRevision||1)===Number(row.metrics?.transcriptRevision||1);
  function coverage(row,key){const rs=reviews(row).filter(r=>current(row,r));if(key==='humorWit')return rs.some(r=>r.humorousVersion||r.humor?.humorousVersion)?'Reviewed':'Not yet reviewed';return rs.some(r=>(!r.perspective||r.perspective==='all'||r.perspective===key)&&(key==='custom'?r.perspective==='custom':typeof r.scores?.[key]==='number'))?'Reviewed':rs.some(r=>(r.reviewedCriteria||[]).includes(key))?'Assessed; insufficient evidence / N/A':'Not yet reviewed'}
  async function run(row,lens,custom,onStatus=()=>{},purpose='auto'){
    const api=window.FluencyCloud;if(!api.configured())throw Error('Connect Google in Settings, then reopen this saved sample.');
    if(!String(row.transcript||'').trim())throw Error('Transcribe the recording before requesting an AI review.');
    if(active.has(row.id))throw Error('A review for this session is already running.');
    const jobId=crypto.randomUUID(),revision=Number(row.metrics?.transcriptRevision||1),transcript=row.transcript;active.set(row.id,jobId);
    try{
      onStatus('Confirming this transcript in Google…');await api.cloudSave(row,{forReview:true});
      const rubric=api.rubric();rubric.mode=row.context;rubric.audience=String(row.audience||'');rubric.communicationPurpose=['reflection','explanation','storytelling','briefing','conversation','persuasion'].includes(purpose)?purpose:'auto';rubric.custom=[rubric.custom,window.FluencyImport?.reviewInstruction(row),row.metrics?.practiceFocus?'PRACTICE TASK (context, not the learner response): '+row.metrics.practiceFocus+'\nAssess whether the response addresses this task. For a supplied briefing, compare the learner response with its source facts and caveats; identify omissions or unsupported additions. Treat any word limit as a target and assess rhythm or rhyme only if requested, without sacrificing accuracy.':''].filter(Boolean).join('\n');rubric.analysisVersion='2.5';rubric.rubricVersion='communication-v2.5';rubric.perspective=lens;
      if(lens!=='all'){rubric.criteria=Object.fromEntries(Object.keys(lenses).filter(k=>!['all','custom'].includes(k)).map(k=>[k,k===lens]));rubric.custom=[rubric.custom,'Focus this review on '+(lenses[lens]||lens)+'.',custom].filter(Boolean).join('\n')}
      else if(custom)rubric.custom=[rubric.custom,custom].filter(Boolean).join('\n');
      if(lens==='all'||lens==='humorWit')rubric.custom+='\nProvide a complete humorousVersion rewrite of this message, with natural wit, playful comparisons or self-directed humor. Preserve facts and intent. It may be lengthy: do not impose executive concision on this version. Do not substitute applicability advice for the rewrite. For a complete review also supply executiveVersion and punchyVersion.';
      onStatus('Gemini review running…');await api.post({action:'analyze',jobId,sessionId:row.id,transcript,metrics:row.metrics||{},rubric});
      const end=Date.now()+150000;let result;
      while(Date.now()<end){await new Promise(r=>setTimeout(r,2500));const job=await api.jsonp('job',{jobId},30000);if(job.status==='ERROR')throw Error(job.error||'Review failed. Earlier reviews are retained.');if(job.status==='DONE'){result=job.result;break}}
      if(!result)throw Error('Review is still pending. Use Sync history later before retrying.');
      if(typeof result!=='object')throw Error('Gemini returned an unreadable review. You can retry.');
      result.perspective=result.perspective||lens;result.reviewJobId=result.reviewJobId||jobId;result.analyzedAt=result.analyzedAt||new Date().toISOString();result.transcriptRevision=revision;
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
  function teachingHtml(row,r){
    const x=r?.teachingExample;
    if(!x)return r?.teachingExampleStatus&&r.teachingExampleStatus!=='NOT_RETURNED'?'<p class="note">The communication review is saved. Its optional teaching example could not be validated; existing scores and versions remain available.</p>':'';
    if(!current(row,r))return '<p class="note">Teaching example belongs to an earlier transcript revision. Review the corrected transcript to generate a current example.</p>';
    const p=x.principle||{},segments=Array.isArray(x.structure)?x.structure:[],changes=Array.isArray(x.transformations)?x.transformations:[];
    const exercise=['point-extraction','pre-speech','structure-selection','compression','spontaneous'].includes(x.recommendedExerciseId)?x.recommendedExerciseId:'';
    return '<details class="review-teaching"><summary>How this could have been presented — learn by example</summary>'+
      '<p class="note">Same ideas, reorganised for this review perspective. This is an AI teaching example, not evidence of mastery.</p>'+
      '<p><b>Principle:</b> '+esc(p.name||'')+' — '+esc(p.why||'')+'</p>'+
      '<p><b>Original speech</b></p><p class="detail-text">'+esc(row.transcript||'')+'</p>'+
      '<p><b>How I could present the same speech</b></p><p class="detail-text">'+esc(x.improvedResponse||'')+'</p>'+
      '<p><b>Main point retained:</b> '+esc(x.mainPoint||'')+'</p>'+
      '<h4>How the thinking is structured</h4><ol>'+segments.map(s=>'<li><b>'+esc(s.role||'')+':</b> '+esc(s.text||'')+' <span class="note">Why here: '+esc(s.why||'')+'</span></li>').join('')+'</ol>'+
      '<h4>Learn by emulating the transformation</h4>'+changes.map(t=>'<p><b>Original:</b> “'+esc(t.sourceQuote||'')+'”<br><b>Reworked:</b> “'+esc(t.targetQuote||'')+'”<br><b>'+esc(t.operation||'')+':</b> '+esc(t.why||'')+'</p>').join('')+
      '<p><b>Before speaking:</b> '+esc(p.cue||'')+'</p><p><b>Use when:</b> '+esc(p.whenToUse||'')+' <b>Not always when:</b> '+esc(p.whenNotToUse||'')+'</p>'+
      (exercise?'<button type="button" class="review-practice" data-exercise="'+esc(exercise)+'">Practise this principle</button>':'')+'</details>';
  }
  function mount(row,parent){
    parent.querySelector('.saved-review-panel')?.remove();const panel=document.createElement('section');panel.className='saved-review-panel';
    const previous=reviews(row),r=row.aiReview,stale=r&&!current(row,r),prefix=parent.id+'-review',practice=r?.drill?.instruction||r?.nextPractice?.join(' • ')||r?.practiceChallenge;
    panel.innerHTML='<div id="'+prefix+'"><p class="note">Gemini runs only when you request a review. Saved recordings can be reviewed from another perspective at any time.</p>'+(stale?'<p class="review-stale">Transcript corrected since this review. Earlier feedback is retained; request a new review for the corrected text.</p>':'')+reviewHtml(r)+(practice?'<div class="coach challenge"><b>Next practice</b><span>'+esc(practice)+'</span><button class="next-attempt">Record next attempt</button></div>':'')+[['executiveVersion','Executive version'],['punchyVersion','Punchier version'],['humorousVersion','Humorous version']].map(([key,title])=>{const text=version(row,key);return '<section><h4>'+title+'</h4><p class="detail-text">'+esc(text||(key==='humorousVersion'?'A humorous rewrite has not been generated for this transcript.':'Not generated for this transcript yet.'))+'</p>'+(!text&&key==='humorousVersion'?'<button class="generate-humor">Generate humorous version</button>':'')+'</section>'}).join('')+teachingHtml(row,r)+
      '<div class="metrics">'+Object.keys(lenses).filter(k=>!['all','custom','humorWit'].includes(k)).map(k=>'<span>'+esc(lenses[k])+': '+coverage(row,k)+'</span>').join('')+'</div><label>Review perspective<select class="saved-lens">'+Object.entries(lenses).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select></label><label>Specific question or custom perspective<textarea class="saved-custom" rows="2"></textarea></label><div class="button-row"><button class="primary saved-run">Review with Gemini AI</button><button class="saved-prompt">Copy AI review prompt</button><button class="edit-transcript">Edit / correct transcript</button></div><p class="note saved-status" role="status">'+(!row.transcript?'Transcript needed: open retained audio and transcribe it locally.':'Ready when you choose.')+'</p>'+
      (previous.length>1?'<details><summary>Earlier reviews ('+(previous.length-1)+')</summary>'+previous.slice(0,-1).reverse().map(old=>'<article><h4>'+esc(lenses[old.perspective]||'Previous review')+' • '+esc(old.analyzedAt||'Earlier')+'</h4>'+reviewHtml(old)+[['executiveVersion','Executive version'],['punchyVersion','Punchier version'],['humorousVersion','Humorous version']].map(([key,label])=>old[key]?'<h4>'+label+'</h4><p class="detail-text">'+esc(old[key])+'</p>':'').join('')+'</article>').join('')+'</details>':'')+'</div>';
    parent.appendChild(panel);
    const button=panel.querySelector('.saved-run'),status=panel.querySelector('.saved-status'),humor=panel.querySelector('.generate-humor');
    const disabled=!String(row.transcript||'').trim()||active.has(row.id);button.disabled=disabled;if(humor)humor.disabled=disabled;
    async function request(lens){button.disabled=true;if(humor)humor.disabled=true;status.textContent='Preparing Gemini review…';try{await run(row,lens,panel.querySelector('.saved-custom').value,msg=>status.textContent=msg,panel.querySelector('.learning-purpose')?.value||'auto');mount(row,parent)}catch(e){status.textContent='Gemini review unavailable: '+(e?.message||String(e));console.error('Fluent Me review failed',e)}finally{button.disabled=!row.transcript;if(humor)humor.disabled=!row.transcript}}
    button.onclick=()=>request(panel.querySelector('.saved-lens').value);if(humor)humor.onclick=()=>request('humorWit');
    panel.querySelector('.next-attempt')?.addEventListener('click',()=>window.FluencyWorkflow.nextAttempt(row));
    panel.querySelector('.review-practice')?.addEventListener('click',async ev=>{
      const btn=ev.currentTarget;btn.disabled=true;
      try{
        const id=r?.reviewJobId||'',source=id?{sourceAssessmentId:'review:'+id,sourceEvidenceId:id,sourceSessionId:row.id,sourceTranscriptRevision:Number(row.metrics?.transcriptRevision||1),sourcePrincipleId:r?.teachingExample?.principle?.name||''}:null;
        const task=await window.FluencyPractice.start(btn.dataset.exercise,'independent',source);if(task)window.FluencyWorkflow.tab('capture')
      }
      catch(e){status.textContent='Practice could not start: '+(e?.message||String(e))}
      finally{btn.disabled=false}
    });
    panel.querySelector('.edit-transcript').onclick=()=>window.FluencyWorkflow.edit(row);
    panel.querySelector('.saved-prompt').onclick=()=>{
      const lens=panel.querySelector('.saved-lens').value,custom=panel.querySelector('.saved-custom').value;
      return window.FluencyClipboard.copy({button:panel.querySelector('.saved-prompt'),onStatus:msg=>status.textContent=msg,build:async()=>{
        const latest=(await all()).find(item=>item.id===row.id);
        if(!panel.isConnected||!latest)throw Error('This saved sample is no longer available. Reopen it and retry.');
        if(panel.querySelector('.saved-lens').value!==lens||panel.querySelector('.saved-custom').value!==custom)throw Error('The review selection changed. Copy again.');
        const rubric=window.FluencyCloud.rubric();
        return window.FluencyClipboard.payload(latest,{perspective:lens,criteria:rubric.criteria,custom:[rubric.custom,custom,window.FluencyImport?.reviewInstruction(latest)].filter(Boolean).join('\n'),instructions:'Review this communication for '+lenses[lens]+'. Preserve facts and meaning. Give evidence, a practice drill, executiveVersion, punchyVersion and a complete humorousVersion with no brevity limit. Do not infer vocal delivery from text.'});
      }});
    };
    // Optional cognitive features must never prevent the core review controls from binding.
    try{window.FluencyLearning?.mount(row,panel)}catch(e){console.error('Optional cognitive training panel failed to load',e);const note=document.createElement('p');note.className='note';note.textContent='Cognitive training could not load. Gemini communication review is still available.';panel.appendChild(note)}
    // Persistent review shortcuts reuse the page rail or a rail inside the open Library dialog.
    const inDialog=parent.id==='sessionDetail', railHost=inDialog?$('sessionDialog'):$('captureShortcuts');
    railHost?.querySelector('.review-navigation')?.remove();
    if(r&&railHost){
      const targets=[['Overview',panel.querySelector('#'+prefix+' > p')],['Communication',panel.querySelector('#'+prefix+' > .metrics')],['Rewrites',panel.querySelector('#'+prefix+' > section')],['Cognitive',panel.querySelector('.unified-cognitive-review')],['Worked example',panel.querySelector('.unified-cognitive-review .worked-example')],['Humour',panel.querySelector('.humour-thinking')]].filter(x=>x[1]);
      const nav=document.createElement('nav');nav.className='review-navigation'+(inDialog?' section-shortcuts review-dialog-shortcuts':'');nav.setAttribute('aria-label','Review sections');
      targets.forEach(([label,target],i)=>{target.id=prefix+'-section-'+i;const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{for(let p=target;p&&p!==panel;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;window.FluencyWorkflow.jump(target.id)};nav.appendChild(b)});
      if(inDialog)railHost.appendChild(nav);else{nav.dataset.shortcutTab='capture';nav.dataset.jump=prefix;const after=railHost.querySelector('[data-jump="reviewPanel"]');after.after(nav);window.FluencyWorkflow.refreshShortcuts()}
    }
    // Preserve the existing collapse UX; a storage/UI failure must not disable review.
    try{window.FluencyWorkflow.collapse($(prefix),'AI review & versions','ai-review')}catch(e){console.error('Review collapse control unavailable',e)}
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

