/* Practice uses the existing capture/attempt stack and the server-owned registry. */
(function(){
  let registry=null,practice=null,preparingAt=0,sequence=0,loading=null;
  const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
  async function load(){
    if(registry)return registry;if(loading)return loading;
    loading=(async()=>{if(!window.FluencyAccess?.isReady())throw Error('Sign in before loading cognitive practice.');const response=await window.FluencyCloud.jsonp('learningRegistry',{},30000);if(!response.registry||response.registry.version!=='learning-v1'||!Array.isArray(response.registry.exercises))throw Error('Install the Phase 1 backend files and deploy the new version to enable practice.');registry=response.registry;return registry;})();
    try{return await loading}catch(e){if(String(e.message).includes('UNKNOWN_ACTION'))throw Error('Install all Phase 1 backend files and deploy a new version to enable cognitive practice. Existing features remain available.');throw e}finally{loading=null}
  }
  function exercise(){return registry?.exercises.find(x=>x.id===practice?.exerciseId)}
  function status(message){const el=$('practiceStatus');if(el)el.textContent=message}
  function show(){
    const panel=$('practiceTask');if(!panel)return;panel.hidden=!practice;if(!practice)return;
    const e=exercise();$('practicePrompt').textContent=practice.prompt;$('practiceConstraints').textContent=e?e.constraints+' • Prepare '+e.preparationSeconds+'s • Respond within '+e.responseSeconds+'s • Up to '+e.maxWords+' whitespace-separated words. Limits are targets; recording is never cut off.':'';
    $('practiceHint').textContent=practice.assistance==='hint'?(e?.hint||'Hint unavailable until registry loads.'):'Independent attempt: no structure hint shown.';
    $('practiceSelf').value=practice.selfAssessment||'';$('practiceReady').hidden=!preparingAt;
  }
  async function start(exerciseId,assistance='independent'){
    if(!window.FluencyAccess?.isReady())throw Error('Sign in before starting practice.');
    const r=await load(),e=r.exercises.find(x=>x.id===exerciseId);if(!e)throw Error('Exercise not found.');
    if(recorder?.state==='recording')throw Error('Stop the current recording before changing practice.');
    if(blob||$('transcript').value.trim()){
      if(!confirm('Save the current capture before starting a new cognitive task?'))return null;
      const row=await window.FluencyWorkflow.saveCapture();if(!row)return null;
      await window.FluencyWorkflow.nextAttempt(row);if($('sessionId').value===row.id)return null;
    }else{reset();$('sessionId').value=crypto.randomUUID();$('groupId').value=$('sessionId').value;$('attemptNo').value=1;$('attemptBadge').textContent='Attempt 1';}
    // A different task starts a different group; retries retain the group.
    $('groupId').value=$('sessionId').value;$('attemptNo').value=1;$('attemptBadge').textContent='Attempt 1';
    practice={taskId:crypto.randomUUID(),exerciseId:e.id,exerciseVersion:e.version,registryVersion:r.version,rubricVersion:e.rubricVersion,prompt:e.prompts[sequence++%e.prompts.length],assistance:assistance==='hint'?'hint':'independent',selfAssessment:'',preparationElapsedSeconds:null,parentSessionId:'',interventionId:''};
    preparingAt=Date.now();$('title').value=e.name;show();status('Preparation started. Choose your main point, press Ready, then use the existing recorder or transcript input.');return clone(practice);
  }
  function ready(){if(!practice||!preparingAt)return;practice.preparationElapsedSeconds=Math.round((Date.now()-preparingAt)/100)/10;preparingAt=0;show();status('Ready. Preparation elapsed time recorded; thinking time is not independently verified. Use Start recording or enter your response.');}
  function snapshot(){if(!practice)return null;practice.selfAssessment=$('practiceSelf')?.value||practice.selfAssessment||'';return clone(practice)}
  function restore(row){practice=clone(row?.metrics?.learningPractice||null);preparingAt=0;show();status(practice?'Saved task restored. Corrections keep the task and create a new transcript revision.':'Choose an exercise when ready.');}
  function clear(){practice=null;preparingAt=0;show();if($('practiceSelf'))$('practiceSelf').value='';status('Choose an exercise when ready.');}
  async function retry(row,intervention,exampleEvidenceId=''){
    await load();const p=clone(row.metrics?.learningPractice);if(!p)throw Error('This is a free sample. Start the recommended exercise from Cognitive practice.');
    await window.FluencyWorkflow.nextAttempt(row);if($('sessionId').value===row.id)return null;
    practice=Object.assign(p,{parentSessionId:row.id,interventionId:intervention?.id||'',workedExampleUsed:!!exampleEvidenceId,exampleEvidenceId:exampleEvidenceId,selfAssessment:'',preparationElapsedSeconds:null,assistance:$('practiceAssistance')?.value==='hint'?'hint':'independent'});preparingAt=Date.now();show();status(intervention?'Retry target: '+intervention.instruction+' Success: '+intervention.retrySuccess:'Repeat the same prompt and constraints.');return snapshot();
  }
  function mount(){
    if($('cognitivePracticeCard'))return;const card=document.createElement('article');card.id='cognitivePracticeCard';card.className='card';
    card.innerHTML='<h2>Cognitive practice</h2><p class="note">Choose a task, organise your point, then use the existing recorder or transcript input. AI runs only when you request cognitive feedback.</p><div class="button-row"><button id="loadPractice">Load exercises</button></div><label>Exercise<select id="practiceExercise" disabled><option>Load exercises first</option></select></label><label>Assistance<select id="practiceAssistance"><option value="independent">Independent — no hint</option><option value="hint">Structure hint</option></select></label><button id="startPractice" disabled>Start task</button><div id="practiceTask" hidden><h3 id="practicePrompt"></h3><p class="note" id="practiceConstraints"></p><p id="practiceHint"></p><button id="practiceReady">Ready — preparation complete</button><label>Self-assessment: intended point and biggest difficulty<textarea id="practiceSelf" rows="2" maxlength="3000"></textarea></label><button id="clearPractice">End task for next capture</button></div><p id="practiceStatus" class="note" role="status">Choose an exercise when ready.</p>';
    document.querySelector('#capture .hero').before(card);
    $('loadPractice').onclick=async()=>{const button=$('loadPractice');button.disabled=true;try{const r=await load();$('practiceExercise').innerHTML=r.exercises.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join('');$('practiceExercise').disabled=false;$('startPractice').disabled=false;show();status('Five exercises ready. Choose an exercise and assistance level.');}catch(e){status(e.message)}finally{button.disabled=false}};
    $('startPractice').onclick=async()=>{const button=$('startPractice');button.disabled=true;try{await start($('practiceExercise').value,$('practiceAssistance').value)}catch(e){status(e.message)}finally{button.disabled=false}};
    $('practiceReady').onclick=ready;
    $('clearPractice').onclick=async()=>{if(recorder?.state==='recording')return status('Stop the current recording first.');if(blob||$('transcript').value.trim()){if(!confirm('Save this task response before ending the task?'))return;const saved=await window.FluencyWorkflow.saveCapture();if(!saved)return;reset();}clear();};
    new MutationObserver(()=>{if(!window.FluencyAccess?.isReady())clear()}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }
  const previousReset=reset;reset=function(){previousReset();clear()};
  window.FluencyPractice={load,start,ready,snapshot,restore,clear,retry};document.addEventListener('DOMContentLoaded',mount);
})();
