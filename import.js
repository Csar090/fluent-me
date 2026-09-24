/* Pasted-transcript ingestion for Fluency OS. Shared by English and multilingual URLs. */
(function(){
  let importMeta=null;
  const parseDate=id=>{const v=$(id)?.value;if(!v)return null;const d=new Date(v);return Number.isFinite(d.getTime())?d:null};
  function durationSeconds(){
    const start=parseDate('importStartTime'),end=parseDate('importEndTime');
    if(start&&end){const s=Math.round((end-start)/1000);if(s<=0)throw Error('End time must be after start time.');return s}
    const mins=Number($('importDurationMinutes')?.value||0);
    if(mins>0)return Math.round(mins*60);
    throw Error('Add start and end time, or enter the duration in minutes.');
  }
  function clearImport(){
    ['importStartTime','importEndTime','importDurationMinutes','importTranscript'].forEach(id=>{if($(id))$(id).value=''});
    $('importStatus').textContent='';
  }
  function openImport(){ $('pasteImportPanel').hidden=false;$('pasteImportBtn').setAttribute('aria-expanded','true');$('importTranscript').focus(); }
  function closeImport(){ $('pasteImportPanel').hidden=true;$('pasteImportBtn').setAttribute('aria-expanded','false'); }
  function applyImport(){
    try{
      const text=$('importTranscript').value.trim();if(!text)throw Error('Paste the speech transcript first.');
      const seconds=durationSeconds(),start=parseDate('importStartTime'),end=parseDate('importEndTime');
      importMeta={source:'PASTED',importedAt:new Date().toISOString(),spokenStartAt:start?start.toISOString():'',spokenEndAt:end?end.toISOString():'',durationSource:start&&end?'START_END':'MANUAL_DURATION',hasAudioEvidence:false,hasTimingEvidence:false};
      duration=seconds;blob=null;$('timer').textContent=time(seconds);$('status').textContent='Pasted transcript ready';
      $('transcript').value=text;$('timestampedTranscript').value='';$('timestampSegments').textContent='No word-level timing evidence: this session was imported from pasted text.';
      $('playback').hidden=true;$('redoTranscriptBtn').hidden=true;$('retainAudio').checked=false;
      $('support').textContent='Imported transcript • '+time(seconds)+' duration • transcript evidence only. Vocal delivery, pronunciation and pauses are not scored.';
      $('transcript').dispatchEvent(new Event('input',{bubbles:true}));
      $('importStatus').textContent='Imported. Review the transcript, then Save sample or Review with Gemini AI.';
      closeImport();window.FluencyWorkflow?.jump('transcriptSection');
    }catch(e){$('importStatus').textContent=e.message}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('pasteImportBtn').onclick=openImport;$('pasteImportBtn').setAttribute('aria-expanded','false');
    $('applyImportBtn').onclick=applyImport;$('cancelImportBtn').onclick=closeImport;
    const oldCapture=window.FluencyWorkflow?.captureRow;
    if(oldCapture)window.FluencyWorkflow.captureRow=async function(){
      const row=await oldCapture();
      if(importMeta){
        Object.assign(row,importMeta,{duration:Number(duration)||row.duration,transcriptionStatus:'IMPORTED'});
        row.timestampedTranscript='';row.wordTimestamps=[];row.audio=null;
        row.metrics=Object.assign({},row.metrics,{evidenceType:'TRANSCRIPT_ONLY',hasAudioEvidence:false,hasTimingEvidence:false,pacingEvidence:false,pauseEvidence:false,pronunciationEvidence:false,deliveryEvidence:false});
      }
      return row;
    };
    const oldRubric=window.FluencyCloud?.rubric;
    if(oldRubric)window.FluencyCloud.rubric=function(){
      const r=oldRubric();
      if(importMeta)r.custom=[r.custom,'SOURCE: PASTED TRANSCRIPT. Duration was supplied by the user. Assess transcript evidence and derived WPM only. Do not infer vocal tone, pronunciation, pause quality, pace variation or other audio-only behaviour. Return null / insufficient evidence for audio-dependent scores. Provide the normal distinct rewrites/versions while preserving facts and meaning.'].filter(Boolean).join('\n');
      return r;
    };
    document.addEventListener('fluency-import-reset',()=>{importMeta=null;clearImport();closeImport()});
  });
})();