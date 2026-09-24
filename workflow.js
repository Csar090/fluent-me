/* Capture, correction and navigation share one session identity. */
(function(){
  let saving=false,loaded=null;
  const revision=row=>Number(row?.metrics?.transcriptRevision||1);
  function collapse(box,title,key,buttonId,existingButton){
    if(!box||box.dataset.collapseMounted)return;
    box.dataset.collapseMounted='1';
    let button=existingButton;
    if(!button){const bar=document.createElement('div');bar.className='collapse-toolbar';const heading=document.createElement('h3');heading.textContent=title;button=document.createElement('button');button.type='button';bar.append(heading,button);box.before(bar)}
    button.id=buttonId||button.id||box.id+'Toggle';button.setAttribute('aria-controls',box.id);
    let folded=localStorage.getItem('fluency-collapse-'+key)==='1';
    const apply=()=>{box.hidden=folded;button.textContent=folded?'Expand':'Minimize';button.setAttribute('aria-expanded',String(!folded));button.setAttribute('aria-label',(folded?'Expand ':'Minimize ')+title)};
    button.onclick=()=>{folded=!folded;localStorage.setItem('fluency-collapse-'+key,folded?'1':'0');apply()};apply();
  }
  function jump(id){const el=$(id);if(!el)return;for(let p=el;p&&p!==document.body;p=p.parentElement){if(p.dataset.collapseMounted&&p.hidden)document.querySelector('[aria-controls="'+p.id+'"]')?.click()}if(el.hidden&&!el.dataset.collapseMounted)return;el.scrollIntoView?.({behavior:'smooth',block:'start'});}
  function refreshShortcuts(){const active=document.querySelector('main>.tab.active')?.id;document.querySelectorAll('[data-shortcut-tab]').forEach(b=>{const target=$(b.dataset.jump);b.hidden=b.dataset.shortcutTab!==active||!target||Boolean(target.hidden&&!target.dataset.collapseMounted)})}
  function tab(name){if($('sessionDialog').open)$('sessionDialog').close();document.querySelectorAll('body>nav [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('main>.tab').forEach(x=>x.classList.toggle('active',x.id===name));refreshShortcuts();jump(name);}
  function correctedMetrics(row,text){
    const m=Object.assign({},row.metrics||{}),changed=text!==String(row.transcript||'');
    const words=text.match(/[a-z0-9\u2019']+/gi)||[];let fillers=0;
    $('fillerWords').value.split(',').map(x=>x.trim()).filter(Boolean).forEach(f=>{const pattern=f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');fillers+=(text.match(new RegExp('\\b'+pattern+'\\b','gi'))||[]).length});
    Object.assign(m,{words:words.length,fillers,rate:words.length?Math.round(fillers*1000/words.length)/10:0,wpm:row.duration?Math.round(words.length*60/row.duration):0});m.fillerRate=m.rate;
    if(changed){m.transcriptRevision=revision(row)+1;m.transcriptCorrectedAt=new Date().toISOString();m.timingTranscriptMatches=false;}else m.transcriptRevision=revision(row);
    return m;
  }
  async function captureRow(){
    const id=$('sessionId').value||crypto.randomUUID();$('sessionId').value=id;
    const prior=(await all()).find(x=>x.id===id)||(loaded?.id===id?loaded:{})||{};
    const text=$('transcript').value.trim(),base=Object.assign({},prior,window.FluencyV23?.activeTelegram||{});
    const metrics=Object.assign({},base.metrics||{},window.getFluencyExtendedMetrics?.()||analyze());
    metrics.transcriptRevision=revision(base);
    if(base.id&&String(base.transcript||'')!==text){Object.assign(metrics,correctedMetrics(base,text));if(!base.transcript&&text&&window.getFluencyWordTimestamps?.().length){metrics.timingTranscriptMatches=true;delete metrics.transcriptCorrectedAt}}
    const focus=$('practiceFocus').textContent;if(focus)metrics.practiceFocus=focus;
    return Object.assign({},base,{id,createdAt:base.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),groupId:$('groupId').value||id,attempt:Number($('attemptNo').value)||1,title:$('title').value.trim()||'Untitled sample',context:$('context').value,audience:$('audience').value.trim(),duration,transcript:text,transcriptionStatus:base.source==='TELEGRAM'&&text?'COMPLETE':base.transcriptionStatus,timestampedTranscript:$('timestampedTranscript').value,metrics,wordTimestamps:window.getFluencyWordTimestamps?.()||[],reflection:$('reflection').value.trim(),tags:$('tags').value.trim(),audio:$('retainAudio').checked?(blob||base.audio||null):null});
  }
  async function persist(row){
    await window.FluencyCloud.saveLocal(row);
    if(window.FluencyCloud.configured()&&row.transcript)await window.FluencyCloud.cloudSave(row);
  }
  async function saveCapture(repeat=false){
    if(saving)return null;if(recorder?.state==='recording')throw Error('Stop the recording before saving.');
    if(!blob&&!$('transcript').value.trim()){toast('Record audio or add a transcript.');return null;}
    saving=true;$('saveBtn').disabled=true;$('repeatBtn').disabled=true;
    try{const row=await captureRow();await persist(row);loaded=row;$('groupId').value=row.groupId;$('captureSaveStatus').textContent=window.FluencyCloud.configured()?'Saved on this device and confirmed in Google.':'Saved on this device; Google sync is pending.';await render();if(row.source==='TELEGRAM'&&row.transcript&&window.FluencyCloud.configured())document.dispatchEvent(new Event('fluency-cloud-synced'));$('repeatBtn').hidden=false;await compare(row.groupId);if(repeat)await nextAttempt(row);return row;}
    catch(e){$('captureSaveStatus').textContent='Save needs attention: '+e.message;toast(e.message);return null;}
    finally{saving=false;$('saveBtn').disabled=false;$('repeatBtn').disabled=false;}
  }
  function draftChanged(){if(loaded&&loaded.id===$('sessionId').value)return loaded.transcript!==$('transcript').value.trim()||loaded.title!==$('title').value.trim()||loaded.reflection!==$('reflection').value.trim();return Boolean(blob||$('transcript').value.trim());}
  async function nextAttempt(row){
    if(recorder?.state==='recording')return toast('Stop the current recording first.');
    if(row&&draftChanged()){
      if(!confirm('Save the current capture before opening the next attempt?'))return;
      const saved=await saveCapture();if(!saved)return;if(saved.id===row.id)row=saved;
    }
    if(!row){row=await saveCapture();if(!row)return;}
    const group=row.groupId||row.id,rows=await all(),attempt=Math.max(Number(row.attempt)||1,...rows.filter(x=>(x.groupId||x.id)===group).map(x=>Number(x.attempt)||1))+1;
    const focus=row.aiReview?.drill?.instruction||row.aiReview?.nextPractice?.join(' ')||row.metrics?.practiceFocus||$('coachChallenge').textContent;
    reset();loaded=null;window.FluencyV23.activeTelegram=null;window.FluencyV23.wordTimestamps=[];
    $('sessionId').value=crypto.randomUUID();$('groupId').value=group;$('attemptNo').value=attempt;$('attemptBadge').textContent='Attempt '+attempt;
    $('title').value=row.title;$('context').value=row.context;$('audience').value=row.audience||'';$('tags').value=row.tags||'';
    $('practiceFocus').textContent=focus;$('practiceFocus').hidden=!focus;$('captureSaveStatus').textContent='Attempt '+attempt+' is ready. Your earlier attempt is saved.';
    $('reviewPanel').hidden=true;$('aiResult').hidden=true;$('repeatBtn').hidden=true;$('redoTranscriptBtn').hidden=true;
    $('timestampSegments').textContent='Word timestamps will appear after transcription.';tab('capture');jump('recorderSection');await compare(group);
    // The recorder is ready; microphone capture remains an explicit press of Start recording.
    $('recordBtn').focus();
  }
  async function edit(row){
    if(recorder?.state==='recording')return toast('Stop the current recording first.');
    if($('sessionId').value!==row.id&&draftChanged()){
      if(!confirm('Save the current capture before editing this transcript?'))return;
      if(!await saveCapture())return;
    }
    reset();loaded=row;window.FluencyV23.wordTimestamps=(row.wordTimestamps||[]).slice();window.FluencyV23.activeTelegram=row.source==='TELEGRAM'?row:null;
    ['title','context','audience','reflection','tags','transcript','timestampedTranscript'].forEach(k=>$(k).value=row[k]||'');
    $('sessionId').value=row.id;$('groupId').value=row.groupId||row.id;$('attemptNo').value=row.attempt||1;$('attemptBadge').textContent='Attempt '+(row.attempt||1);
    duration=Number(row.duration)||0;blob=row.audio||null;$('timer').textContent=time(duration);$('playback').hidden=!blob;
    if(blob)$('playback').src=URL.createObjectURL(blob);
    $('redoTranscriptBtn').hidden=!blob;$('practiceFocus').textContent=row.metrics?.practiceFocus||'';$('practiceFocus').hidden=!$('practiceFocus').textContent;
    $('timestampSegments').textContent=row.timestampedTranscript||'No timing evidence saved.';
    if(!blob&&row.audioRetained){$('redoTranscriptBtn').hidden=false;$('redoTranscriptBtn').textContent='Load retained audio & redo transcription';}
    $('transcript').dispatchEvent(new Event('input',{bubbles:true}));$('captureSaveStatus').textContent='Edit the transcript, then Save corrections. Original audio timing is retained.';
    tab('capture');if($('transcriptBody').hidden)$('transcriptBodyToggle').click();jump('transcriptSection');$('transcript').focus();
  }
  async function compare(group){
    const rows=(await all()).filter(x=>(x.groupId||x.id)===group).sort((a,b)=>a.attempt-b.attempt);$('comparePanel').hidden=rows.length<2;
    if(rows.length<2)return;
    $('compareContent').innerHTML=window.FluencyProgress?.comparison(rows.at(-2),rows.at(-1))||'';
  }
  function mount(){
    collapse($('transcriptBody'),'Transcript','transcript');collapse($('timestampSegments'),'Word-timestamped transcription','timestamps');
    const count=document.createElement('span');count.id='timestampSummary';count.className='note';$('timestampSegments').previousElementSibling.querySelector('h3').append(document.createElement('br'),count);
    document.querySelectorAll('body>nav [data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
    document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jump(b.dataset.jump));
    new MutationObserver(refreshShortcuts).observe($('reviewPanel'),{attributes:true,attributeFilter:['hidden']});new MutationObserver(refreshShortcuts).observe($('comparePanel'),{attributes:true,attributeFilter:['hidden']});refreshShortcuts();
    $('saveCorrectionsBtn').onclick=()=>saveCapture();$('practiceBtn').onclick=()=>nextAttempt();
    $('repeatBtn').onclick=()=>saveCapture(true);$('saveBtn').onclick=()=>saveCapture();
    $('recordBtn').onclick=async()=>{if(recorder?.state==='recording')return toggle();const saved=(await all()).find(x=>x.id===$('sessionId').value);if(saved){const row=await saveCapture();if(!row)return;await nextAttempt(row);}return toggle();};
    $('redoTranscriptBtn').onclick=async()=>{try{if(!blob){const payload=await window.FluencyCloud.jsonp('audio',{sessionId:$('sessionId').value},60000);blob=new Blob([Uint8Array.from(atob(payload.base64),c=>c.charCodeAt(0))],{type:payload.mimeType||'audio/ogg'});$('playback').src=URL.createObjectURL(blob);$('playback').hidden=false;}await transcribeRecordedAudio();}catch(e){toast('Audio unavailable: '+e.message)}};
    $('transcript').addEventListener('input',()=>{$('captureSaveStatus').textContent='Transcript changed. Save corrections before leaving.'});
  }
  document.addEventListener('DOMContentLoaded',mount);
  window.FluencyWorkflow={collapse,jump,tab,refreshShortcuts,revision,correctedMetrics,captureRow,saveCapture,nextAttempt,edit,compare};
})();
