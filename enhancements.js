(function(){
  let segments=[],lastMetrics=null;
  const originalTranscribe=transcribeRecordedAudio;
  transcribeRecordedAudio=async function(){await originalTranscribe();parseSegments();enhanceReview();$('redoTranscriptBtn').hidden=!blob};

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
    return Object.assign({},base,{fillerRate:base.rate,fillerCounts:counts,longPauses:base.wordTimestampCount?base.longPauses:pauses.length,longestPause:base.wordTimestampCount?base.longestPause:(pauses.length?Math.max.apply(null,pauses.map(p=>p.duration)):0),pauses:pauses});
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
    $('coachStrength').textContent='Your transcript is ready for evidence-based communication review.';
    $('coachFocus').textContent='Practice structure, clarity, decisiveness, presence and impact. Request AI review for feedback specific to this sample.';
    $('coachChallenge').textContent='Lead with your main point, explain the supporting reasons, and finish with a clear takeaway or next step.';
    $('repeatBtn').hidden=false;
  }
  $('transcript').addEventListener('input',enhanceReview);
  $('copyCoachBtn').onclick=async function(){const p='Act as my communication coach, not a judge. Preserve my voice. Review this sample for clarity, structure, decisiveness, executive presence and impact. Separate objective observations from coaching inference. Give: (1) what worked, (2) key improvement, (3) executiveVersion, (4) punchyVersion, (5) a complete humorousVersion that preserves facts without a length limit, and (6) a next-practice drill.\n\nMetrics: '+JSON.stringify(lastMetrics)+'\nTranscript:\n'+$('transcript').value;await navigator.clipboard.writeText(p);toast('Coaching prompt copied—paste it into ChatGPT.')};

  const oldRender=render;render=renderEnhanced;
  async function renderEnhanced(){
    const rows=(await all()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),q=($('librarySearch').value||'').toLowerCase(),ctx=$('libraryContext').value;
    const filtered=rows.filter(r=>(!ctx||r.context===ctx)&&(!q||[r.title,r.context,r.audience,r.tags,r.transcript].join(' ').toLowerCase().includes(q)));
    $('samples').innerHTML=filtered.length?filtered.map(r=>'<div class="item"><b>'+esc(r.title)+' <em>Attempt '+(r.attempt||1)+'</em></b><small>'+new Date(r.createdAt).toLocaleString('en-IN')+' • '+esc(r.context)+' • '+time(r.duration||0)+' • '+(r.metrics.fillers||0)+' fillers</small><p>'+esc((r.transcript||'').slice(0,180))+((r.transcript||'').length>180?'…':'')+'</p><div class="button-row"><button data-view="'+r.id+'">Open</button><button data-review="'+esc(r.id)+'">AI review / perspectives</button><button data-audio="'+r.id+'">Audio</button><button data-delete="'+r.id+'">Delete</button></div></div>').join(''):'<p class="note">No matching samples.</p>';
    $('samples').querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>viewSession(b.dataset.review));$('samples').querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewSession(b.dataset.view));$('samples').querySelectorAll('[data-audio]').forEach(b=>b.onclick=()=>downloadAudio(b.dataset.audio));$('samples').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeOne(b.dataset.delete));
    $('sampleCount').textContent=rows.length;$('totalMinutes').textContent=Math.round(rows.reduce((s,r)=>s+(r.duration||0),0)/60);const words=rows.reduce((s,r)=>s+(r.metrics.words||0),0),fill=rows.reduce((s,r)=>s+(r.metrics.fillers||0),0);$('avgFillers').textContent=words?Math.round(fill*1000/words)/10:'—';window.FluencyProgress?.render(rows);renderWeekly(rows);
  }
  $('librarySearch').oninput=renderEnhanced;$('libraryContext').onchange=renderEnhanced;
  async function viewSession(id){const row=(await all()).find(x=>x.id===id);if(row)window.FluencyReviews.open(row)}
  $('closeDialog').onclick=()=>$('sessionDialog').close();
  async function downloadAudio(id){const r=(await all()).find(x=>x.id===id);if(!r?.audio)return toast('This session has no retained audio.');download(r.audio,(r.title||'recording').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.'+(r.audio.type.includes('mp4')?'m4a':'webm'))}
  function renderWeekly(rows){const recent=rows.filter(r=>new Date(r.createdAt).getTime()>Date.now()-7*864e5),words=recent.reduce((s,r)=>s+(r.metrics.words||0),0),fill=recent.reduce((s,r)=>s+(r.metrics.fillers||0),0);$('weeklySummary').innerHTML='<div><b>'+recent.length+'</b><span>sessions</span></div><div><b>'+Math.round(recent.reduce((s,r)=>s+(r.duration||0),0)/6)/10+'</b><span>minutes</span></div><div><b>'+(words?Math.round(fill*1000/words)/10:'—')+'</b><span>fillers / 100</span></div><div><b>'+recent.filter(r=>(r.attempt||1)>1).length+'</b><span>repeat attempts</span></div>'}

  async function blobToData(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b)})}
  function dataToBlob(url){const p=url.split(','),mime=(p[0].match(/:(.*?);/)||[])[1]||'application/octet-stream',bin=atob(p[1]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}
  async function fullBackup(){const rows=await all(),packed=[];for(const r of rows)packed.push(Object.assign({},r,{audio:r.audio?await blobToData(r.audio):null}));download(new Blob([JSON.stringify({app:'Fluency OS',version:'1.5.0',exportedAt:new Date().toISOString(),samples:packed},null,2)],{type:'application/json'}),'fluency-os-full-backup.json');toast('Full backup downloaded')}
  $('exportBtn').onclick=fullBackup;$('fullBackupBtn').onclick=fullBackup;$('restoreBtn').onclick=()=>$('restoreInput').click();
  $('restoreInput').onchange=async function(e){const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.samples))throw Error('Invalid backup');for(const r of d.samples)await put(Object.assign({},r,{audio:typeof r.audio==='string'?dataToBlob(r.audio):null}));toast(d.samples.length+' sessions restored');await renderEnhanced()}catch(err){toast('Restore failed: '+err.message)}e.target.value=''};
  $('sessionId').value=crypto.randomUUID();$('groupId').value=crypto.randomUUID();$('attemptNo').value=1;enhanceReview();
  document.addEventListener('DOMContentLoaded',function(){
    $('copyCoachBtn').onclick=async function(){const p='Act as my communication coach, not a judge. Preserve my voice. Review this sample for clarity, structure, decisiveness, executive presence and impact. Separate objective observations from coaching inference. Give: (1) what worked, (2) key improvement, (3) executiveVersion, (4) punchyVersion, (5) a complete humorousVersion that preserves facts without a length limit, and (6) a next-practice drill.\n\nMetrics: '+JSON.stringify(lastMetrics)+'\nTranscript:\n'+$('transcript').value;await navigator.clipboard.writeText(p);toast('Coaching prompt copied—paste it into ChatGPT.')};
    $('librarySearch').oninput=renderEnhanced;$('libraryContext').onchange=renderEnhanced;
    $('exportBtn').onclick=fullBackup;$('fullBackupBtn').onclick=fullBackup;
    $('restoreBtn').onclick=function(){$('restoreInput').click()};
    $('redoTranscriptBtn').onclick=async function(){if(!blob)return toast('The recording is no longer available. Record again or open retained audio from the Library.');$('transcript').value='';$('timestampedTranscript').value='';await transcribeRecordedAudio()};
  });
})();
