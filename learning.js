/* Cognitive evidence is separate from the existing communication review and score history. */
(function(){
  const active=new Map();
  const safe=x=>esc(String(x??''));
  const rev=row=>Number(row.metrics?.transcriptRevision)||1;
  function missingComponents(r){
    const missing=[];
    if(r?.status!=='SUPPORTED')missing.push('sufficient diagnostic evidence');
    if(!r?.contextDiagnosis?.purposeId)missing.push('communication purpose');
    if(!r?.contextDiagnosis?.reason||r.contextDiagnosis.reason==='Communication purpose was not established from the supplied evidence.')missing.push('purpose explanation');
    if(!r?.recommendedPrinciple||!r?.intervention?.recommendedExerciseId)missing.push('evidence-linked principle and practice');
    if(!r?.workedExample)missing.push('validated worked example');
    else if(!r.workedExample.thinkingWalkthrough)missing.push('speech-specific thinking walkthrough');
    return missing;
  }
  function humourThinkingHtml(r){
    const h=r?.humourThinking;
    if(!h)return '<p class="note">Humour thinking was not available in this saved review'+(r?.humourThinkingStatus==='INVALID'?' because the returned analysis could not be validated.':'.')+'</p>';
    if(h.status!=='APPLICABLE')return '<p class="note">'+safe(h.reason||'There is not enough context for a suitable humorous take.')+'</p>';
    const items=a=>Array.isArray(a)?a.map(x=>'<li>'+safe(x)+'</li>').join(''):'';
    return '<p><b>Context:</b> '+safe(h.context)+'</p><p><b>What you said:</b> “'+safe(h.sourceQuote)+'”</p><p><b>Underlying meaning:</b> '+safe(h.underlyingMeaning)+'</p><p><b>Humour opportunity:</b> '+safe(h.opportunity)+'</p><p><b>Humorous angle:</b> '+safe(h.angle)+'</p><h4>Building the layers</h4><ol>'+items(h.layers)+'</ol><h4>How to think of it</h4><ol>'+items(h.thinkingSteps)+'</ol><p><b>Humorous take:</b> '+safe(h.humorousTake)+'</p><p><b>Why it works:</b> '+safe(h.whyItWorks)+'</p><p><b>When to use:</b> '+safe(h.whenToUse)+'</p><p><b>When not to use:</b> '+safe(h.whenNotToUse)+'</p>';
  }
  async function history(row){return (await window.FluencyCloud.jsonp('learningHistory',{sessionId:row.id},30000)).entries||[]}
  async function assess(row,selfAssessment,onStatus=()=>{},purposeOverride='auto'){
    if(!window.FluencyAccess?.isReady())throw Error('Sign in before cognitive feedback.');
    if(active.has(row.id))throw Error('Cognitive feedback is already running for this sample.');
    if(!row.transcript?.trim())throw Error('A saved transcript is needed.');
    if(row.transcript.length>20000)throw Error('Cognitive training supports up to 20,000 characters. Your saved transcript is intact.');
    if(String(selfAssessment||'').length>3000)throw Error('Self-assessment must be at most 3,000 characters.');
    await window.FluencyPractice.load();const jobId=crypto.randomUUID(),transcript=row.transcript,revision=rev(row);active.set(row.id,jobId);
    try{
      onStatus('Confirming the exact transcript and task in Google…');await window.FluencyCloud.cloudSave(row,{forReview:true});
      onStatus('Cognitive diagnosis running. Existing reviews remain available.');await window.FluencyCloud.post({action:'learningAssess',jobId,sessionId:row.id,transcript,transcriptRevision:revision,selfAssessment:String(selfAssessment||''),purposeOverride:purposeOverride});
      const deadline=Date.now()+150000;let result;
      while(Date.now()<deadline){await new Promise(r=>setTimeout(r,2500));const job=await window.FluencyCloud.jsonp('job',{jobId},30000);if(job.status==='ERROR')throw Error(job.error||'Cognitive feedback failed.');if(job.status==='DONE'){result=job.result;break}}
      if(!result)throw Error('Cognitive feedback is pending. Use Load saved feedback before requesting another assessment.');
      if(result.schemaVersion!=='diagnosis-v1'||!Array.isArray(result.observations)||!Array.isArray(result.competencyEvidence))throw Error('Invalid cognitive feedback response.');
      if(!window.FluencyAccess.isReady())throw Error('Workspace locked. Feedback is retained in Google; sign in and load it later.');
      const latest=(await all()).find(x=>x.id===row.id);onStatus(!latest||rev(latest)!==revision||latest.transcript!==transcript?'Assessment retained for an earlier revision. Load saved feedback to inspect it.':'Cognitive feedback saved. No mastery claim is made.');return result;
    }finally{active.delete(row.id)}
  }
  function workedExampleHtml(r){
    const x=r.workedExample;if(!x)return '<section><h4>Learning by example</h4><p class="note">'+(r.workedExampleStatus&&r.workedExampleStatus!=='NOT_RETURNED'?'Diagnosis retained, but the worked example could not be validated. Request fresh cognitive feedback to try again.':'This feedback has no worked example. Request fresh cognitive feedback after installing the teaching update.')+'</p></section>';
    const walk=x.thinkingWalkthrough;return '<section class="worked-example"><h4>How this could be presented — worked example</h4><p class="note">AI teaching example, separate from your performance. Check that it preserves your facts and intent; use the mechanism to construct your own retry.</p><p><b>Main point retained:</b> '+safe(x.mainPoint)+'</p><p><b>Original expression:</b></p><p class="detail-text">'+safe(r.__sourceTranscript||'')+'</p><p><b>Improved expression:</b></p><p class="detail-text">'+safe(x.improvedResponse)+'</p><h4>How the response is structured</h4><ol>'+x.structure.map(part=>'<li><b>'+safe(part.role)+':</b> '+safe(part.text)+'<br><span class="note">Why here: '+safe(part.why)+'</span></li>').join('')+'</ol><h4>What changed, and the cognitive operation</h4>'+x.transformations.map(t=>'<p><b>Original:</b> “'+safe(t.source.quote)+'”<br><b>Reworked:</b> “'+safe(t.target.quote)+'”<br><b>'+safe(t.operationId)+':</b> '+safe(t.explanation)+'</p>').join('')+(walk?'<h4>Thinking reconstruction (AI interpretation)</h4><p>'+safe(walk.application)+'</p><ol>'+walk.mentalSteps.map(step=>'<li>'+safe(step)+'</li>').join('')+'</ol><p><b>When not to apply:</b> '+safe(walk.whenNotToUse)+'</p>':'')+'<h4>Before speaking: build it yourself</h4><ol>'+x.beforeSpeaking.map(step=>'<li>'+safe(step)+'</li>').join('')+'</ol><p class="note">For the retry, use your own wording. If you used this example, tick the assistance checkbox below; a model example is never counted as your improvement.</p></section>';
  }
  function principleAndPracticeHtml(entry){
    const r=entry.result,e=entry.evidence,p=r.recommendedPrinciple,c=r.contextDiagnosis;
    return (c?.purposeId?'<p><b>Communication purpose:</b> '+safe(c.purposeId)+' ('+safe(c.source)+') — '+safe(c.reason)+'</p>':'')+
      (p?'<section><h4>Recommended cognitive principle: '+safe(p.name)+'</h4><p><b>Why here:</b> '+safe(p.why)+'</p><p><b>Mental steps:</b> '+p.mentalSteps.map(safe).join(' → ')+'</p><p><b>Example:</b> '+safe(p.example)+'</p><p><b>When to use:</b> '+safe(p.whenToUse)+'</p><p><b>When not to use:</b> '+safe(p.whenNotToUse)+'</p></section>':'')+
      (entry.current&&!e.practice&&r.intervention?.recommendedExerciseId?'<button type="button" class="learning-practice">Practise this principle</button><p class="note">Starts a linked exercise; does not claim improvement until a new assessment.</p>':'');
  }
  function resultHtml(entry,options={}){
    const r=entry.result,e=entry.evidence;return '<article><h4>Attempt '+safe(e.attempt)+' • revision '+safe(e.transcriptRevision)+' • '+safe(r.rubricVersion)+'</h4><p class="note">'+(entry.current?'Current transcript evidence':'Historical evidence — transcript changed')+' • '+safe(e.assistance)+' structure assistance'+(e.practice?.workedExampleUsed?' • worked example used (self-reported)':'')+' • '+safe(r.evidenceQuality)+'</p><p>'+safe(r.summary)+'</p><p><b>Self-assessment comparison:</b> '+safe(r.selfAssessmentComparison)+'</p>'+r.strengths.map(x=>'<p><b>Observed strength:</b> “'+safe(x.quote)+'” — '+safe(x.reason)+'</p>').join('')+r.observations.map(x=>'<p><b>Observed pattern:</b> “'+safe(x.quote)+'” — '+safe(x.interpretation)+'<br><b>Possible mechanism:</b> '+safe(x.hypothesis)+'<br><span class="note">'+safe(x.confidence)+' confidence. '+safe(x.uncertainty)+'</span></p>').join('')+'<div class="metrics">'+r.competencyEvidence.map(x=>'<span>'+safe(x.competencyId)+': '+safe(x.status)+'</span>').join('')+'</div>'+(r.intervention?'<p><b>One retry target:</b> '+safe(r.intervention.instruction)+'</p><p><b>Success criterion:</b> '+safe(r.intervention.retrySuccess)+'</p>':'<p class="note">No supported intervention selected. Gather more relevant evidence.</p>')+principleAndPracticeHtml(entry)+(options.omitWorkedExample?'<p class="note">The complete worked example and sentence-by-sentence transformation are displayed in the communication review above.</p>':workedExampleHtml(Object.assign({},r,{__sourceTranscript:e.transcript})))+'<p class="note">'+(r.limitations||[]).map(safe).join(' ')+' Mastery: not determined.</p><details><summary>Exact assessed transcript and task</summary><p>'+safe(e.practice?.prompt||'Free sample')+'</p><p class="detail-text">'+safe(e.transcript)+'</p></details></article>';
  }
  function compare(entries,row){
    const current=entries.filter(x=>x.current&&x.result.rubricVersion==='cognitive-v1').sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    const latest=current.filter(x=>x.evidence.sessionId===row.id).at(-1),parentId=latest?.evidence.practice?.parentSessionId;if(!parentId)return '<p class="note">A linked, assessed retry is needed for comparison.</p>';
    const parent=current.filter(x=>x.evidence.sessionId===parentId).at(-1),p=latest.evidence.practice,q=parent?.evidence.practice;
    if(!parent||!q||q.taskId!==p.taskId||q.prompt!==p.prompt||q.exerciseId!==p.exerciseId||q.exerciseVersion!==p.exerciseVersion||parent.result.rubricVersion!==latest.result.rubricVersion)return '<p class="note">Comparable current evidence is unavailable. Earlier feedback remains in history.</p>';
    const target=p.interventionId,initial=parent.result.observations.some(x=>x.errorId===target),retry=latest.result.observations.some(x=>x.errorId===target),sufficient=latest.result.status==='SUPPORTED'&&parent.result.status==='SUPPORTED';
    const interpretation=!target?'No targeted intervention recorded.':!sufficient?'Insufficient evidence to judge the target.':!initial?'The target was not observed in the selected earlier assessment.':retry?'The targeted pattern is still observed.':'The targeted pattern was not flagged in this retry. This alone does not establish resolution or mastery.';
    return '<h4>Linked retry comparison</h4><p>'+safe(interpretation)+'</p><div class="metrics"><span>Earlier words: '+safe(parent.evidence.wordCount)+'</span><span>Retry words: '+safe(latest.evidence.wordCount)+'</span><span>Assistance: '+safe(q.assistance)+' → '+safe(p.assistance)+'</span></div><p class="note">Worked example use (self-reported): '+(q.workedExampleUsed?'yes':'not reported')+' → '+(p.workedExampleUsed?'yes':'not reported')+'. Counts are descriptive; fewer words alone do not prove better communication. Compare the quoted feedback and preserved meaning.</p>';
  }
  function mount(row,parent){
    parent.querySelector('.cognitive-training')?.remove();const section=document.createElement('section');section.className='cognitive-training';
    section.innerHTML='<h3>Cognitive assessment</h3><p class="note">Communication feedback, full cognitive diagnosis and the worked example are generated in one Gemini review. Separate diagnostic exercises are optional and are not needed for ordinary reviews.</p><label>Your intended point and biggest difficulty<textarea class="learning-self" rows="2" maxlength="3000"></textarea></label>'+(row.metrics?.learningPractice?'':'<label>Communication purpose — correct after capture if needed<select class="learning-purpose"><option value="auto">Infer from speech</option><option value="reflection">Reflection</option><option value="explanation">Explanation / teaching</option><option value="storytelling">Storytelling</option><option value="briefing">Professional briefing</option><option value="conversation">Conversation</option><option value="persuasion">Persuasion / recommendation</option></select></label>')+'<div class="button-row"><button class="learning-run">Request another independent cognitive assessment</button><button class="learning-load">Load saved feedback</button><button class="learning-retry" disabled>Retry this task</button></div><label class="check"><input type="checkbox" class="learning-example-used" disabled> I used the worked example for this retry (self-reported)</label><p class="learning-status note" role="status">Feedback is requested explicitly and may use Gemini.</p><div class="learning-results"></div>';
    section.querySelector('.learning-self').value=row.metrics?.learningPractice?.selfAssessment||'';parent.appendChild(section);
    // The ordinary communication review is the single AI entry point for free reflection.
    // The legacy standalone cognitive assessment remains available on explicit request only.
    const validReview=!!row.aiReview&&rev(row)===Number(row.aiReview.transcriptRevision||1);
    const combined=Boolean(validReview&&row.aiReview.cognitiveAssessmentStatus==='AVAILABLE'&&row.aiReview.cognitiveAssessment);
    const missing=combined?missingComponents(row.aiReview.cognitiveAssessment):[];
    if(combined&&row.aiReview.cognitiveEvidenceStatus!=='STORED')missing.push('confirmed cognitive evidence storage');
    const message=document.createElement('p');message.className='note learning-one-pass';
    message.textContent=combined?(missing.length?'Communication feedback and a partial cognitive assessment were generated together. Missing: '+missing.join(', ')+'.':'Communication and cognitive assessments were generated together from one Gemini request.'):validReview?'This saved review does not yet include a completed cognitive assessment. Use the main “Review with Gemini AI” button above to request both together; do not request independent cognitive feedback.':'Use “Review with Gemini AI” above once to request communication and cognitive reviews together. A separate assessment is not part of the normal workflow.';
    const purpose=section.querySelector('.learning-purpose')?.parentElement;
    section.insertBefore(message,purpose||section.querySelector('.learning-self').parentElement);
    const advanced=document.createElement('details');advanced.className='learning-advanced';advanced.innerHTML='<summary>Advanced: independent cognitive exercises and retries (not required for a normal review)</summary><p class="note">Use only for a deliberately separate cognitive assessment or an exercise retry. The primary Gemini communication review already requests the complete cognitive assessment.</p>';
    const moved=[section.querySelector('.learning-self')?.parentElement,section.querySelector('.learning-run')?.parentElement,section.querySelector('.learning-example-used')?.closest('label'),section.querySelector('.learning-status'),section.querySelector('.learning-results')];
    moved.forEach(node=>{if(node)advanced.appendChild(node)});
    section.appendChild(advanced);
    // A single Gemini review now supplies the complete cognitive diagnosis and its teaching example.
    // Render directly from the saved review; no second AI request or evidence reload is required.
    const combinedReview=row.aiReview||{},cognitive=combinedReview.cognitiveAssessment;
    const currentReview=validReview;
    const combinedOutput=document.createElement('section');combinedOutput.className='unified-cognitive-review';
    if(currentReview&&combinedReview.cognitiveAssessmentStatus==='AVAILABLE'&&cognitive){
      const evidence={sessionId:row.id,attempt:row.attempt||1,transcriptRevision:rev(row),transcript:row.transcript,assistance:row.metrics?.learningPractice?.assistance||'UNKNOWN',practice:row.metrics?.learningPractice||null};
      combinedOutput.innerHTML='<h4>'+(missing.length?'Partial cognitive assessment':'Complete cognitive assessment')+' — included in this Gemini review</h4>'+
        (missing.length?'<p class="note">Missing or unvalidated: '+missing.map(safe).join(', ')+'. Existing feedback is retained.</p>':'')+
        '<p class="note">Same review request • '+safe(combinedReview.cognitiveEvidenceStatus==='STORED'?'Evidence saved to cognitive history.':'Assessment included in this review; separate evidence-history storage is not yet confirmed.')+'</p>'+
        resultHtml({current:true,evidence: evidence,result:cognitive},{omitWorkedExample:false});
      message.textContent=missing.length?'One Gemini review returned communication feedback and a partial cognitive assessment. Missing: '+missing.join(', ')+'.':'One Gemini review completed both assessments. The cognitive analysis and worked example appear below.';
    }else if(currentReview&&combinedReview.cognitiveAssessmentStatus==='VALIDATION_FAILED'){
      combinedOutput.innerHTML='<p class="note">Communication feedback was retained, but the cognitive assessment did not pass evidence validation. This is not a completed cognitive review. The full review can be requested again after the issue is corrected.</p>';
    }else if(currentReview&&combinedReview.cognitiveAssessmentStatus==='EVIDENCE_UNAVAILABLE'){
      combinedOutput.innerHTML='<p class="note">This review includes communication feedback but no cognitive evidence could be prepared for this transcript. Do not treat it as a completed cognitive assessment.</p>';
    }else if(currentReview&&combinedReview.cognitiveAssessmentStatus==='NOT_RETURNED'){
      combinedOutput.innerHTML='<p class="note">Gemini returned communication feedback but omitted the required cognitive assessment. The one-call review is incomplete. Please use the main review button after the backend is corrected.</p>';
    }else if(currentReview&&!combinedReview.cognitiveAssessmentStatus){
      combinedOutput.innerHTML='<p class="note">This saved review comes from a backend version that did not return the full cognitive assessment. Deploy the unified Apps Script backend, then use the main review button once. Clicking independent cognitive feedback is not the fix.</p>';
    }
    if(combinedOutput.innerHTML)section.insertBefore(combinedOutput,advanced);
    if(currentReview){const humour=document.createElement('section');humour.className='humour-thinking';humour.innerHTML='<h3>Humour: the thinking behind the take</h3>'+humourThinkingHtml(cognitive);section.appendChild(humour);}
    const run=section.querySelector('.learning-run'),load=section.querySelector('.learning-load'),retry=section.querySelector('.learning-retry'),status=section.querySelector('.learning-status'),results=section.querySelector('.learning-results');let selected=null;
    async function refresh(){const latest=(await all()).find(x=>x.id===row.id);if(!latest)throw Error('Sample unavailable. Reopen the saved sample.');const entries=await history(latest);if(!section.isConnected||!window.FluencyAccess.isReady())return;selected=entries.filter(x=>x.current&&x.evidence.sessionId===row.id&&x.result.rubricVersion==='cognitive-v1').at(-1);results.innerHTML=compare(entries,latest)+entries.slice().reverse().map(resultHtml).join('');if(!entries.length)results.innerHTML='<p class="note">No cognitive feedback saved for this attempt group.</p>';retry.disabled=!latest.metrics?.learningPractice||!selected;const exampleUsed=section.querySelector('.learning-example-used');exampleUsed.disabled=!selected?.result?.workedExample;if(exampleUsed.disabled)exampleUsed.checked=false;status.textContent='Saved cognitive feedback loaded. Historical revisions are labelled.';}
    run.disabled=!row.transcript;run.onclick=async()=>{run.disabled=true;try{const latest=(await all()).find(x=>x.id===row.id);if(!latest)throw Error('Sample unavailable.');await assess(latest,section.querySelector('.learning-self').value,msg=>status.textContent=msg,section.querySelector('.learning-purpose')?.value||'auto');await refresh()}catch(e){status.textContent=e.message}finally{run.disabled=!row.transcript}};
    results.addEventListener('click',async ev=>{if(!ev.target.matches('.learning-practice'))return;const button=ev.target;button.disabled=true;
      try{const latest=(await all()).find(x=>x.id===row.id),a=selected;
        if(!latest||!a?.current||a.evidence.sessionId!==row.id||rev(latest)!==a.evidence.transcriptRevision||latest.transcript!==a.evidence.transcript||latest.metrics?.learningPractice)throw Error('Current free-recording diagnosis required. Reload saved feedback after corrections.');
        const exerciseId=a.result.intervention?.recommendedExerciseId;if(!exerciseId)throw Error('No existing exercise is linked.');
        const source={sourceAssessmentId:a.assessmentId,sourceEvidenceId:a.evidence.evidenceId,sourceSessionId:row.id,sourceTranscriptRevision:rev(latest),sourcePrincipleId:a.result.recommendedPrinciple?.id||''};
        const task=await window.FluencyPractice.start(exerciseId,'independent',source);if(task)window.FluencyWorkflow.tab('capture');
      }catch(e){status.textContent='Unable to start practice: '+(e.message||String(e))}finally{button.disabled=false}});
    load.onclick=async()=>{load.disabled=true;try{await refresh()}catch(e){status.textContent=e.message}finally{load.disabled=false}};
    retry.onclick=async()=>{retry.disabled=true;try{const latest=(await all()).find(x=>x.id===row.id);if(!latest||!selected||rev(latest)!==selected.evidence.transcriptRevision||latest.transcript!==selected.evidence.transcript)throw Error('Transcript changed. Load current feedback first.');await window.FluencyPractice.retry(latest,selected.result.intervention,section.querySelector('.learning-example-used').checked?selected.evidence.evidenceId:'')}catch(e){status.textContent=e.message}finally{retry.disabled=!selected}};
    const observer=new MutationObserver(()=>{if(!section.isConnected){observer.disconnect();return}if(!window.FluencyAccess?.isReady()){results.replaceChildren();section.querySelector('.learning-self').value='';selected=null;retry.disabled=true;section.querySelector('.learning-example-used').checked=false;section.querySelector('.learning-example-used').disabled=true}});observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }
  window.FluencyLearning={assess,history,mount,compare,resultHtml,workedExampleHtml,humourThinkingHtml};
})();

