/* Shared, revision-aware prompt copying. No AI request or cloud write is made. */
(function(){
  const pending=new WeakSet();
  const instructions='Act as my communication coach, not a judge. Preserve my voice. Review this sample for clarity, structure, decisiveness, executive presence and impact. Separate objective observations from coaching inference. Give: (1) what worked, (2) key improvement, (3) executiveVersion, (4) punchyVersion, (5) a complete humorousVersion that preserves facts without a length limit, and (6) a next-practice drill.';
  function payload(row,options={}){
    const text=String(row.transcript||'');
    if(!text.trim())throw Error('Add or transcribe content before copying a review prompt.');
    const context={payloadVersion:'review-prompt-v1',sessionId:row.id||null,groupId:row.groupId||null,attempt:row.attempt||1,title:row.title||'',mode:row.context||'',audience:row.audience||'',transcriptRevision:options.draft?'UNSAVED DRAFT':Number(row.metrics?.transcriptRevision||1),perspective:options.perspective||'all',criteria:options.criteria||{},customInstruction:options.custom||'',learning:row.metrics?.learning||null};
    const metrics=Object.assign({},row.metrics||{});
    if(options.draft)delete metrics.transcriptRevision;
    return (options.instructions||instructions)+'\nDo not infer vocal delivery or psychological traits from text. Missing evidence is not a low score.\n'+(options.custom||'')+'\n\nReview context:\n'+JSON.stringify(context,null,2)+'\n\nMetrics:\n'+JSON.stringify(metrics,null,2)+'\n\nTranscript:\n'+text;
  }
  function manual(text){
    let dialog=$('manualCopyDialog');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='manualCopyDialog';
      const title=document.createElement('h2');title.id='manualCopyTitle';title.textContent='Copy manually';
      dialog.setAttribute('aria-labelledby',title.id);
      const note=document.createElement('p');note.className='note';note.textContent='Automatic copying was unavailable. Select the complete text below and copy it using your browser or keyboard. This has not been copied automatically.';
      const label=document.createElement('label');label.textContent='Complete AI review prompt';
      const field=document.createElement('textarea');field.id='manualCopyText';field.rows=12;field.readOnly=true;label.append(field);
      const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();
      dialog.addEventListener('close',()=>{field.value=''});
      dialog.append(title,note,label,close);document.body.append(dialog);
    }
    const field=$('manualCopyText');field.value=text;
    if(!dialog.open)dialog.showModal();field.focus();field.select();
  }
  async function copy({button,build,onStatus=toast}){
    if(pending.has(button))return {status:'BUSY'};
    pending.add(button);const disabled=button.disabled;button.disabled=true;
    try{
      if(!window.FluencyAccess?.isReady())throw Error('Sign in before copying a review prompt.');
      onStatus('Preparing review prompt…');const text=await build();
      if(!window.FluencyAccess.isReady())throw Error('Session locked. Sign in and retry.');
      if(!String(text||'').trim())throw Error('No review content is available.');
      try{
        if(!navigator.clipboard?.writeText)throw Error('Clipboard API unavailable.');
        await navigator.clipboard.writeText(text);
        if(!window.FluencyAccess.isReady())return {status:'LOCKED'};
        onStatus('Prompt copied—paste it into your AI assistant.');return {status:'COPIED',text};
      }catch(error){
        if(!window.FluencyAccess.isReady())throw Error('Session locked. Sign in and retry.');
        manual(text);onStatus('Automatic copy unavailable. Use the manual-copy field; the prompt has not been copied automatically.');return {status:'MANUAL',text};
      }
    }catch(error){onStatus('Copy unavailable: '+String(error.message||error));return {status:'ERROR'};}
    finally{pending.delete(button);button.disabled=disabled;}
  }
  async function capturePayload(){
    const id=$('sessionId').value,text=$('transcript').value;
    const row=await window.FluencyWorkflow.captureRow();
    if(id!==$('sessionId').value||text!==$('transcript').value)throw Error('The selected capture changed. Copy again.');
    row.transcript=text;const prior=(await all()).find(r=>r.id===id);
    if(id!==$('sessionId').value||text!==$('transcript').value)throw Error('The selected capture changed. Copy again.');
    const draft=!prior||prior.transcript!==text.trim();
    const rubric=window.FluencyCloud.rubric();
    return payload(row,{draft,criteria:rubric.criteria,custom:[rubric.custom,window.FluencyImport?.reviewInstruction(row)].filter(Boolean).join('\n')});
  }
  window.FluencyClipboard={copy,payload,capturePayload};
  new MutationObserver(()=>{if(document.documentElement.classList.contains('auth-locked')){const dialog=$('manualCopyDialog');if(dialog?.open)dialog.close();}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
})();
