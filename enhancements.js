(function(){
  let segments=[],lastMetrics=null;
  const originalTranscribe=transcribeRecordedAudio;
  transcribeRecordedAudio=async function(){await originalTranscribe();parseSegments();enhanceReview()};

  function parseClock(s){const p=s.split(':').map(Number);return (p[0]||0)*60+(p[1]||0)}
  function parseSegments(){
    segments=String($('timestampedTranscript').value||'').split('\n').map(function(line){
      const m=line.match(/^\[(\d+:\d+)–(\d+:\d+|…)\]\s*(.*)$/);
      return m?{start:parseClock(m[1]),end:m[2]==='…'?null:parseClock(m[2]),text:m[3]}:null;
    }).filter(Boolean);
    const box=$('timestampSegments');box.classList.toggle('empty',!segments.length);
    box.innerHTML=segments.length?segments.map(function(s){return '<button class="segment" data-start="'+s.start+'"><b>'+time(s.start)+'–'+(s.end==null?'…':time(s.end))+'</b><span>'+esc(s.text)+'</span></button>'}).join(''):'Timestamped speech segments will appear here.';
    box.querySelectorAll('.segment').forEach(function(b){b.onclick=function(){$('playback').currentTime=Number(b.dataset.start);$('playback').play()}});
  }
  function extendedMetrics(){
    const base=analyze(),threshold=Number($('pauseThreshold').value)||1,pauses=[];
    for(let i=0;i<segments.length-1;i++){if(segments[i].end!=null){const gap=segments[i+1].start-segments[i].end;if(gap>=threshold)pauses.push({at:segments[i].end,duration:gap})}}
    const text=$('transcript').value.toLowerCase(),counts={};
    $('fillerWords').value.toLowerCase().split(',').map(x=>x.trim()).filter(Boolean).forEach(function(f){const q=f.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');const n=((' '+text.replace(/[^a-z0-9’']+/g,' ')+' ').match(new RegExp('\\b'+q+'\\b','g'))||[]).length;if(n)counts[f]=n});
    return Object.assign({},base,{fillerRate:base.rate,fillerCounts:counts,longPauses:pauses.length,longestPause:pauses.length?Math.max.apply(null,pauses.map(p=>p.duration)):0,pauses:pauses});
  }
  function highlight(){
    let html=esc($('transcript').value),fillers=$('fillerWords').value.split(',').map(x=>x.trim()).filter(Boolean).sort((a,b)=>b.length-a.length);
    fillers.forEach(function(f){const q=f.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');html=html.replace(new RegExp('\\b('+q+')\\b','gi'),'<mark>$1</mark>')});
    $('highlightedTranscript').classList.toggle('empty',!html);$('highlightedTranscript').innerHTML=html||'Filler highlighting appears here after transcription.';
  }
  function enhanceReview(){
    lastMetrics=extendedMetrics();highlight();$('metrics').innerHTML='<span>'+lastMetrics.words+' words</span><span>'+lastMetrics.fillers+' fillers ('+lastMetrics.fillerRate+'/100)</span><span>'+(lastMetrics.wpm||'—')+' WPM</span><span>'+lastMetrics.longPauses+' long pauses</span>';
    $('reviewPanel').hidden=!lastMetrics.words;if(!lastMetrics.words)return;
    $('reviewSnapshot').innerHTML='<div><b>'+(lastMetrics.wpm||'—')+'</b><span>WPM</span></div><div><b>'+lastMetrics.fillerRate+'</b><span>fillers / 100</span></div><div><b>'+lastMetrics.longPauses+'</b><span>long pauses</span></div><div><b>'+lastMetrics.longestPause.toFixed(1)+'s</b><span>longest pause</span></div>';
    const top=Object.entries(lastMetrics.fillerCounts).sort((a,b)=>b[1]-a[1])[0];
    $('coachStrength').textContent=lastMetrics.wpm>=100&&lastMetrics.wpm<=160?'Your pace was conversational and easy to follow.':lastMetrics.words>=40?'You sustained and developed the thought.':'You completed a concise speaking sample.';
    $('coachFocus').textContent=top?'Replace “'+top[0]+'” ('+top[1]+' uses) with a deliberate pause.':lastMetrics.longPauses>2?'Link each point with a clear transition.':'State the conclusion first, then support it.';
    $('coachChallenge').textContent=top?'Re-record with no more than '+Math.max(0,top[1]-1)+' uses of “'+top[0]+'”.':'Re-record in 20% fewer words while preserving the message.';
    $('repeatBtn').hidden=false;
  }
  $('transcript').addEventListener('input',enhanceReview);
  $('copyCoachBtn').onclick=async function(){const p='Act as my communication coach, not a judge. Preserve my voice. Review this sample for clarity, structure, executive presence and concision. Separate objective observations from coaching inference. Give: (1) what worked, (2) one primary lever, (3) a tighter version, and (4) one re-recording challenge.\n\nMetrics: '+JSON.stringify(lastMetrics)+'\nTranscript:\n'+$('transcript').value;await navigator.clipboard.writeText(p);toast('Coaching prompt copied—paste it into ChatGPT.')};

  const oldSave=save;
  $('saveBtn').onclick=function(){saveEnhanced(false)};
  $('repeatBtn').onclick=function(){saveEnhanced(true)};
  async function saveEnhanced(repeat){
    if(!$('title').value.trim())return toast('Add a title.');if(!blob&&!$('transcript').value.trim())return toast('Record audio or add a transcript.');
    enhanceReview();const keep=$('retainAudio').checked,group=$('groupId').value||crypto.randomUUID(),attempt=Number($('attemptNo').value)||1;
    const row={id:crypto.randomUUID(),groupId:group,attempt:attempt,createdAt:new Date().toISOString(),title:$('title').value.trim(),context:$('context').value,audience:$('audience').value.trim(),duration:duration,transcript:$('transcript').value.trim(),timestampedTranscript:$('timestampedTranscript').value.trim(),segments:segments,reflection:$('reflection').value.trim(),tags:$('tags').value.trim(),metrics:lastMetrics,audio:keep?blob:null,audioType:keep&&blob?blob.type:''};
    await put(row);toast('Sample saved on this device');await renderEnhanced();
    const defaults={title:row.title,context:row.context,audience:row.audience};reset();segments=[];$('reviewPanel').hidden=true;$('repeatBtn').hidden=true;parseSegments();
    if(repeat){$('title').value=defaults.title;$('context').value=defaults.context;$('audience').value=defaults.audience;$('groupId').value=group;$('attemptNo').value=attempt+1;$('attemptBadge').textContent='Attempt '+(attempt+1);await compareGroup(group)}else{$('groupId').value=crypto.randomUUID();$('attemptNo').value=1;$('attemptBadge').textContent='Attempt 1'}
  }
  async function compareGroup(group){const rows=(await all()).filter(r=>r.groupId===group).sort((a,b)=>a.attempt-b.attempt),p=$('comparePanel');if(rows.length<2){p.hidden=true;return}const a=rows[rows.length-2],b=rows[rows.length-1];p.hidden=false;$('compareContent').innerHTML=compareTable(a,b)}
  function change(a,b,lower){const d=(b||0)-(a||0),good=lower?d<0:d>0;return '<span class="'+(d===0?'same':good?'good':'bad')+'">'+(d>0?'+':'')+(Math.round(d*10)/10)+'</span>'}
  function compareTable(a,b){return '<table><thead><tr><th>Measure</th><th>Attempt '+a.attempt+'</th><th>Attempt '+b.attempt+'</th><th>Change</th></tr></thead><tbody><tr><td>WPM</td><td>'+a.metrics.wpm+'</td><td>'+b.metrics.wpm+'</td><td>'+change(a.metrics.wpm,b.metrics.wpm,false)+'</td></tr><tr><td>Fillers / 100</td><td>'+a.metrics.fillerRate+'</td><td>'+b.metrics.fillerRate+'</td><td>'+change(a.metrics.fillerRate,b.metrics.fillerRate,true)+'</td></tr><tr><td>Long pauses</td><td>'+(a.metrics.longPauses||0)+'</td><td>'+(b.metrics.longPauses||0)+'</td><td>'+change(a.metrics.longPauses,b.metrics.longPauses,true)+'</td></tr><tr><td>Words</td><td>'+a.metrics.words+'</td><td>'+b.metrics.words+'</td><td>'+change(a.metrics.words,b.metrics.words,true)+'</td></tr></tbody></table>'}

  const oldRender=render;render=renderEnhanced;
  async function renderEnhanced(){
    const rows=(await all()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),q=($('librarySearch').value||'').toLowerCase(),ctx=$('libraryContext').value;
    const filtered=rows.filter(r=>(!ctx||r.context===ctx)&&(!q||[r.title,r.context,r.audience,r.tags,r.transcript].join(' ').toLowerCase().includes(q)));
    $('samples').innerHTML=filtered.length?filtered.map(r=>'<div class="item"><b>'+esc(r.title)+' <em>Attempt '+(r.attempt||1)+'</em></b><small>'+new Date(r.createdAt).toLocaleString('en-IN')+' • '+esc(r.context)+' • '+time(r.duration||0)+' • '+(r.metrics.fillers||0)+' fillers</small><p>'+esc((r.transcript||'').slice(0,180))+((r.transcript||'').length>180?'…':'')+'</p><div class="button-row"><button data-view="'+r.id+'">Open</button><button data-audio="'+r.id+'">Audio</button><button data-delete="'+r.id+'">Delete</button></div></div>').join(''):'<p class="note">No matching samples.</p>';
    $('samples').querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewSession(b.dataset.view));$('samples').querySelectorAll('[data-audio]').forEach(b=>b.onclick=()=>downloadAudio(b.dataset.audio));$('samples').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeOne(b.dataset.delete));
    $('sampleCount').textContent=rows.length;$('totalMinutes').textContent=Math.round(rows.reduce((s,r)=>s+(r.duration||0),0)/60);const words=rows.reduce((s,r)=>s+(r.metrics.words||0),0),fill=rows.reduce((s,r)=>s+(r.metrics.fillers||0),0);$('avgFillers').textContent=words?Math.round(fill*1000/words)/10:'—';draw(rows.slice().reverse());renderWeekly(rows);
  }
  $('librarySearch').oninput=renderEnhanced;$('libraryContext').onchange=renderEnhanced;
  async function viewSession(id){const r=(await all()).find(x=>x.id===id);if(!r)return;$('sessionDetail').innerHTML='<h2>'+esc(r.title)+'</h2><p class="note">'+new Date(r.createdAt).toLocaleString('en-IN')+' • '+esc(r.context)+' • Attempt '+(r.attempt||1)+'</p>'+(r.audio?'<audio controls src="'+URL.createObjectURL(r.audio)+'"></audio>':'')+'<h3>Metrics</h3><div class="metrics"><span>'+r.metrics.words+' words</span><span>'+r.metrics.wpm+' WPM</span><span>'+(r.metrics.fillerRate??r.metrics.rate)+'/100 fillers</span><span>'+(r.metrics.longPauses||0)+' long pauses</span></div><h3>Transcript</h3><p class="detail-text">'+esc(r.transcript)+'</p><h3>Timestamps</h3><pre>'+esc(r.timestampedTranscript||'Not available for this earlier session.')+'</pre><h3>Reflection</h3><p>'+esc(r.reflection||'—')+'</p>';$('sessionDialog').showModal()}
  $('closeDialog').onclick=()=>$('sessionDialog').close();
  async function downloadAudio(id){const r=(await all()).find(x=>x.id===id);if(!r?.audio)return toast('This session has no retained audio.');download(r.audio,(r.title||'recording').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.'+(r.audio.type.includes('mp4')?'m4a':'webm'))}
  function renderWeekly(rows){const recent=rows.filter(r=>new Date(r.createdAt).getTime()>Date.now()-7*864e5),words=recent.reduce((s,r)=>s+(r.metrics.words||0),0),fill=recent.reduce((s,r)=>s+(r.metrics.fillers||0),0);$('weeklySummary').innerHTML='<div><b>'+recent.length+'</b><span>sessions</span></div><div><b>'+Math.round(recent.reduce((s,r)=>s+(r.duration||0),0)/6)/10+'</b><span>minutes</span></div><div><b>'+(words?Math.round(fill*1000/words)/10:'—')+'</b><span>fillers / 100</span></div><div><b>'+recent.filter(r=>(r.attempt||1)>1).length+'</b><span>repeat attempts</span></div>'}

  async function blobToData(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b)})}
  function dataToBlob(url){const p=url.split(','),mime=(p[0].match(/:(.*?);/)||[])[1]||'application/octet-stream',bin=atob(p[1]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}
  async function fullBackup(){const rows=await all(),packed=[];for(const r of rows)packed.push(Object.assign({},r,{audio:r.audio?await blobToData(r.audio):null}));download(new Blob([JSON.stringify({app:'Fluency OS',version:'1.5.0',exportedAt:new Date().toISOString(),samples:packed},null,2)],{type:'application/json'}),'fluency-os-full-backup.json');toast('Full backup downloaded')}
  $('exportBtn').onclick=fullBackup;$('fullBackupBtn').onclick=fullBackup;$('restoreBtn').onclick=()=>$('restoreInput').click();
  $('restoreInput').onchange=async function(e){const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.samples))throw Error('Invalid backup');for(const r of d.samples)await put(Object.assign({},r,{audio:typeof r.audio==='string'?dataToBlob(r.audio):null}));toast(d.samples.length+' sessions restored');await renderEnhanced()}catch(err){toast('Restore failed: '+err.message)}e.target.value=''};
  $('groupId').value=crypto.randomUUID();$('attemptNo').value=1;enhanceReview();
  document.addEventListener('DOMContentLoaded',function(){
    $('saveBtn').onclick=function(){saveEnhanced(false)};
    $('repeatBtn').onclick=function(){saveEnhanced(true)};
    $('copyCoachBtn').onclick=async function(){const p='Act as my communication coach, not a judge. Preserve my voice. Review this sample for clarity, structure, executive presence and concision. Separate objective observations from coaching inference. Give: (1) what worked, (2) one primary lever, (3) a tighter version, and (4) one re-recording challenge.\n\nMetrics: '+JSON.stringify(lastMetrics)+'\nTranscript:\n'+$('transcript').value;await navigator.clipboard.writeText(p);toast('Coaching prompt copied—paste it into ChatGPT.')};
    $('librarySearch').oninput=renderEnhanced;$('libraryContext').onchange=renderEnhanced;
    $('exportBtn').onclick=fullBackup;$('fullBackupBtn').onclick=fullBackup;
    $('restoreBtn').onclick=function(){$('restoreInput').click()};
  });
})();
