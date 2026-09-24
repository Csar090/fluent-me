/* Fluency OS multilingual overlay: Hindi / English / Hinglish. Root English app is untouched. */
(function(){
  const getMode=()=>document.getElementById('languageMode')?.value||localStorage.getItem('fluency-language-mode')||'auto';
  const getScript=()=>document.getElementById('transcriptScript')?.value||localStorage.getItem('fluency-transcript-script')||'natural';
  const speechLang=()=>getMode()==='hi-IN'?'hi-IN':getMode()==='en-IN'?'en-IN':getMode()==='hinglish'?'hi-IN':'hi-IN';
  const modelFor=()=>getMode()==='en-IN'?'Xenova/whisper-tiny.en':'Xenova/whisper-tiny';
  const tokenize=text=>String(text||'').normalize('NFKC').match(/[\p{L}\p{M}\p{N}\u2019']+/gu)||[];
  const countPhrase=(text,phrase)=>{
    const hay=' '+String(text||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{M}\p{N}\u2019']+/gu,' ').replace(/\s+/g,' ').trim()+' ';
    const needle=' '+String(phrase||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{M}\p{N}\u2019']+/gu,' ').replace(/\s+/g,' ').trim()+' ';
    if(needle.trim()==='')return 0;let n=0,p=0;while((p=hay.indexOf(needle,p))>=0){n++;p+=needle.length-1}return n;
  };
  window.FluencyLanguage={mode:getMode,script:getScript,speechLang,modelFor,tokenize};

  analyze=function(){
    const text=$('transcript').value,words=tokenize(text),fs=$('fillerWords').value.split(',').map(x=>x.trim()).filter(Boolean);
    let fillers=0;fs.forEach(f=>fillers+=countPhrase(text,f));
    return{words:words.length,fillers,rate:words.length?Math.round(fillers*1000/words.length)/10:0,wpm:duration?Math.round(words.length/(duration/60)):0};
  };
  metrics=function(){const m=analyze();$('metrics').innerHTML='<span>'+m.words+' words</span><span>'+m.fillers+' fillers ('+m.rate+'/100)</span><span>'+(m.wpm||'—')+' WPM</span>'};

  loadTranscriber=async function(){
    const wanted=modelFor();
    if(transcriber&&transcriber.__fluencyModel===wanted)return transcriber;
    transcriber=null;transcriberLoading=(async()=>{const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');env.allowLocalModels=false;env.useBrowserCache=true;const t=await pipeline('automatic-speech-recognition',wanted,{quantized:true});t.__fluencyModel=wanted;return t})();
    try{transcriber=await transcriberLoading;return transcriber}catch(e){transcriberLoading=null;throw e}
  };

  const baseStartSpeech=startSpeech;
  startSpeech=function(){
    if(!$('liveTranscript').checked){$('support').textContent='Audio recording active; live transcription is switched off.';return}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('support').textContent='Audio recording works, but this browser has no live transcription service.';return}
    speechWanted=true;speechCommitted='';speechPrefix=$('transcript').value.trim();const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    recognition=new SR();recognition.continuous=!mobile;recognition.interimResults=true;recognition.maxAlternatives=1;recognition.lang=speechLang();
    recognition.onstart=()=>{$('support').textContent='Live '+(getMode()==='hinglish'?'Hinglish':getMode()==='hi-IN'?'Hindi':getMode()==='en-IN'?'English':'multilingual')+' transcription listening…'};
    recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript.trim();if(e.results[i].isFinal)speechCommitted+=(speechCommitted?' ':'')+t;else interim+=(interim?' ':'')+t} $('transcript').value=[speechPrefix,speechCommitted,interim].filter(Boolean).join(' ');metrics()};
    recognition.onerror=e=>{$('support').textContent='Live transcription: '+e.error+'. Audio recording continues.';if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error))speechWanted=false};
    recognition.onend=()=>{if(speechWanted&&recorder?.state==='recording')speechRestartTimer=setTimeout(()=>{try{recognition.start()}catch(e){}},250)};
    try{recognition.start()}catch(e){$('support').textContent='Live transcription could not start: '+e.message}
  };

  document.addEventListener('DOMContentLoaded',()=>{
    const mode=$('languageMode'),script=$('transcriptScript'),hint=$('languageHint');
    mode.value=localStorage.getItem('fluency-language-mode')||'auto';script.value=localStorage.getItem('fluency-transcript-script')||'natural';
    const apply=()=>{localStorage.setItem('fluency-language-mode',mode.value);localStorage.setItem('fluency-transcript-script',script.value);hint.textContent=mode.value==='hinglish'?'Hinglish mode preserves natural Hindi–English code-switching and evaluates it without treating normal switching as an error.':mode.value==='hi-IN'?'Hindi mode uses Hindi recognition and Hindi-aware coaching.':mode.value==='en-IN'?'English mode uses Indian English recognition and the existing communication rubric.':'Auto mode uses the multilingual local model and preserves Hindi–English code-switching.';transcriber=null;transcriberLoading=null};
    mode.onchange=apply;script.onchange=apply;apply();
    setTimeout(()=>{
      if(window.FluencyCloud?.rubric){const old=window.FluencyCloud.rubric;window.FluencyCloud.rubric=function(){const r=old();const m=getMode(),s=getScript();r.languageMode=m;r.transcriptScript=s;r.custom=[r.custom,'LANGUAGE MODE: '+m+'. Transcript preference: '+s+'. Evaluate communication in the language actually used. For Hindi, assess natural Hindi communication; for Hinglish, preserve and assess natural code-switching and do not penalize English/Hindi mixing by itself. Distinguish communication weakness from language choice. Rewrites should remain in the speaker’s dominant language/mix unless explicitly requested otherwise.'].filter(Boolean).join('\n');return r}};
      }
      if(window.FluencyWorkflow?.captureRow){const oldCapture=window.FluencyWorkflow.captureRow;window.FluencyWorkflow.captureRow=async function(){const row=await oldCapture();row.languageMode=getMode();row.transcriptScript=getScript();row.metrics=Object.assign({},row.metrics,{languageMode:getMode()});return row}};
    },0);
  });
})();