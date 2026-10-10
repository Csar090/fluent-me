/* Cognitive evidence is separate from the existing communication review and score history. */
(function(){
  const active=new Map();
  const safe=x=>esc(String(x??''));
  const rev=row=>Number(row.metrics?.transcriptRevision)||1;
  async function history(row){return (await window.FluencyCloud.jsonp('learningHistory',{sessionId:row.id},30000)).entries||[]}
  async function assess(row,selfAssessment,onStatus=()=>{}){
    if(!window.FluencyAccess?.isReady())throw Error('Sign in before cognitive feedback.');
    if(active.has(row.id))throw Error('Cognitive feedback is already running for this sample.');
    if(!row.transcript?.trim())throw Error('A saved transcript is needed.');
    if(row.transcript.length>20000)throw Error('Cognitive training supports up to 20,000 characters. Your saved transcript is intact.');
    if(String(selfAssessment||'').length>3000)throw Error('Self-assessment must be at most 3,000 characters.');
    await window.FluencyPractice.load();const jobId=crypto.randomUUID(),transcript=row.transcript,revision=rev(row);active.set(row.id,jobId);
    try{
      onStatus('Confirming the exact transcript and task in Google…');await window.FluencyCloud.cloudSave(row,{forReview:true});
      onStatus('Cognitive diagnosis running. Existing reviews remain available.');await window.FluencyCloud.post({action:'learningAssess',jobId,sessionId:row.id,transcript,transcriptRevision:revision,selfAssessment:String(selfAssessment||'')});
      const deadline=Date.now()+150000;let result;
      while(Date.now()<deadline){await new Promise(r=>setTimeout(r,2500));const job=await window.FluencyCloud.jsonp('job',{jobId},30000);if(job.status==='ERROR')throw Error(job.error||'Cognitive feedback failed.');if(job.status==='DONE'){result=job.result;break}}
      if(!result)throw Error('Cognitive feedback is pending. Use Load saved feedback before requesting another assessment.');
      if(result.schemaVersion!=='diagnosis-v1'||!Array.isArray(result.observations)||!Array.isArray(result.competencyEvidence))throw Error('Invalid cognitive feedback response.');
      if(!window.FluencyAccess.isReady())throw Error('Workspace locked. Feedback is retained in Google; sign in and load it later.');
      const latest=(await all()).find(x=>x.id===row.id);onStatus(!latest||rev(latest)!==revision||latest.transcript!==transcript?'Assessment retained for an earlier revision. Load saved feedback to inspect it.':'Cognitive feedback saved. No mastery claim is made.');return result;
    }finally{active.delete(row.id)}
  }
  function resultHtml(entry){
    const r=entry.result,e=entry.evidence;return '<article><h4>Attempt '+safe(e.attempt)+' • revision '+safe(e.transcriptRevision)+' • '+safe(r.rubricVersion)+'</h4><p class="note">'+(entry.current?'Current transcript evidence':'Historical evidence — transcript changed')+' • '+safe(e.assistance)+' assistance • '+safe(r.evidenceQuality)+'</p><p>'+safe(r.summary)+'</p><p><b>Self-assessment comparison:</b> '+safe(r.selfAssessmentComparison)+'</p>'+r.strengths.map(x=>'<p><b>Observed strength:</b> “'+safe(x.quote)+'” — '+safe(x.reason)+'</p>').join('')+r.observations.map(x=>'<p><b>Observed pattern:</b> “'+safe(x.quote)+'” — '+safe(x.interpretation)+'<br><b>Possible mechanism:</b> '+safe(x.hypothesis)+'<br><span class="note">'+safe(x.confidence)+' confidence. '+safe(x.uncertainty)+'</span></p>').join('')+'<div class="metrics">'+r.competencyEvidence.map(x=>'<span>'+safe(x.competencyId)+': '+safe(x.status)+'</span>').join('')+'</div>'+(r.intervention?'<p><b>One retry target:</b> '+safe(r.intervention.instruction)+'</p><p><b>Success criterion:</b> '+safe(r.intervention.retrySuccess)+'</p>':'<p class="note">No supported intervention selected. Gather more relevant evidence.</p>')+'<p class="note">'+(r.limitations||[]).map(safe).join(' ')+' Mastery: not determined.</p><details><summary>Exact assessed transcript and task</summary><p>'+safe(e.practice?.prompt||'Free sample')+'</p><p class="detail-text">'+safe(e.transcript)+'</p></details></article>';
  }
  function compare(entries,row){
    const current=entries.filter(x=>x.current&&x.result.rubricVersion==='cognitive-v1').sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    const latest=current.filter(x=>x.evidence.sessionId===row.id).at(-1),parentId=latest?.evidence.practice?.parentSessionId;if(!parentId)return '<p class="note">A linked, assessed retry is needed for comparison.</p>';
    const parent=current.filter(x=>x.evidence.sessionId===parentId).at(-1),p=latest.evidence.practice,q=parent?.evidence.practice;
    if(!parent||!q||q.taskId!==p.taskId||q.prompt!==p.prompt||q.exerciseId!==p.exerciseId||q.exerciseVersion!==p.exerciseVersion||parent.result.rubricVersion!==latest.result.rubricVersion)return '<p class="note">Comparable current evidence is unavailable. Earlier feedback remains in history.</p>';
    const target=p.interventionId,initial=parent.result.observations.some(x=>x.errorId===target),retry=latest.result.observations.some(x=>x.errorId===target),sufficient=latest.result.status==='SUPPORTED'&&parent.result.status==='SUPPORTED';
    const interpretation=!target?'No targeted intervention recorded.':!sufficient?'Insufficient evidence to judge the target.':!initial?'The target was not observed in the selected earlier assessment.':retry?'The targeted pattern is still observed.':'The targeted pattern was not flagged in this retry. This alone does not establish resolution or mastery.';
    return '<h4>Linked retry comparison</h4><p>'+safe(interpretation)+'</p><div class="metrics"><span>Earlier words: '+safe(parent.evidence.wordCount)+'</span><span>Retry words: '+safe(latest.evidence.wordCount)+'</span><span>Assistance: '+safe(q.assistance)+' → '+safe(p.assistance)+'</span></div><p class="note">Counts are descriptive; fewer words alone do not prove better communication. Compare the quoted feedback and preserved meaning.</p>';
  }
  function mount(row,parent){
    parent.querySelector('.cognitive-training')?.remove();const section=document.createElement('section');section.className='cognitive-training';
    section.innerHTML='<h3>Cognitive training</h3><p class="note">Optional: evidence → possible mechanism → one intervention → retry. Existing review perspectives and rewrites remain available above.</p><label>Your intended point and biggest difficulty<textarea class="learning-self" rows="2" maxlength="3000"></textarea></label><div class="button-row"><button class="learning-run">Request cognitive feedback</button><button class="learning-load">Load saved feedback</button><button class="learning-retry" disabled>Retry this task</button></div><p class="learning-status note" role="status">Feedback is requested explicitly and may use Gemini.</p><div class="learning-results"></div>';
    section.querySelector('.learning-self').value=row.metrics?.learningPractice?.selfAssessment||'';parent.appendChild(section);
    const run=section.querySelector('.learning-run'),load=section.querySelector('.learning-load'),retry=section.querySelector('.learning-retry'),status=section.querySelector('.learning-status'),results=section.querySelector('.learning-results');let selected=null;
    async function refresh(){const latest=(await all()).find(x=>x.id===row.id);if(!latest)throw Error('Sample unavailable. Reopen the saved sample.');const entries=await history(latest);if(!section.isConnected||!window.FluencyAccess.isReady())return;selected=entries.filter(x=>x.current&&x.evidence.sessionId===row.id&&x.result.rubricVersion==='cognitive-v1').at(-1);results.innerHTML=compare(entries,latest)+entries.slice().reverse().map(resultHtml).join('');if(!entries.length)results.innerHTML='<p class="note">No cognitive feedback saved for this attempt group.</p>';retry.disabled=!latest.metrics?.learningPractice||!selected;status.textContent='Saved cognitive feedback loaded. Historical revisions are labelled.';}
    run.disabled=!row.transcript;run.onclick=async()=>{run.disabled=true;try{const latest=(await all()).find(x=>x.id===row.id);if(!latest)throw Error('Sample unavailable.');await assess(latest,section.querySelector('.learning-self').value,msg=>status.textContent=msg);await refresh()}catch(e){status.textContent=e.message}finally{run.disabled=!row.transcript}};
    load.onclick=async()=>{load.disabled=true;try{await refresh()}catch(e){status.textContent=e.message}finally{load.disabled=false}};
    retry.onclick=async()=>{retry.disabled=true;try{const latest=(await all()).find(x=>x.id===row.id);if(!latest||!selected||rev(latest)!==selected.evidence.transcriptRevision||latest.transcript!==selected.evidence.transcript)throw Error('Transcript changed. Load current feedback first.');await window.FluencyPractice.retry(latest,selected.result.intervention)}catch(e){status.textContent=e.message}finally{retry.disabled=!selected}};
    const observer=new MutationObserver(()=>{if(!section.isConnected){observer.disconnect();return}if(!window.FluencyAccess?.isReady()){results.replaceChildren();section.querySelector('.learning-self').value='';selected=null;retry.disabled=true}});observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }
  window.FluencyLearning={assess,history,mount,compare,resultHtml};
})();
