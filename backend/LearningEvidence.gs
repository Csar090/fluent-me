/* Additive immutable snapshots. Sessions remain the authoritative attempt records. */
const LEARNING_EVIDENCE_HEADERS=['evidenceId','createdAt','sessionIdJson','groupIdJson','transcriptRevision','transcriptJson','snapshotJson'];
const LEARNING_ASSESSMENT_HEADERS=['assessmentId','createdAt','evidenceId','sessionIdJson','resultJson'];
function learningSheets_(){
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  return {evidence:learningSheet_(ss,'Learning Evidence',LEARNING_EVIDENCE_HEADERS),assessments:learningSheet_(ss,'Learning Assessments',LEARNING_ASSESSMENT_HEADERS)};
}
function learningSheet_(ss,name,headers){
  const existing=ss.getSheetByName(name);
  if(existing&&existing.getLastRow()>0){const actual=existing.getRange(1,1,1,headers.length).getValues()[0];if(JSON.stringify(actual)!==JSON.stringify(headers))throw Error(name+' has incompatible headers; no data was changed.');return existing;}
  return ensureSheet_(ss,name,headers);
}
function Learning_setup(){const lock=LockService.getScriptLock();lock.waitLock(30000);try{validateLearningRegistry_();learningSheets_();return{ok:true,version:LEARNING_REGISTRY.version,message:'Learning storage ready; existing data and triggers unchanged.'};}finally{lock.releaseLock()}}
function learningPractice_(session){
  const p=session.metrics&&session.metrics.learningPractice;
  if(!p)return null;
  const e=LEARNING_REGISTRY.exercises.find(x=>x.id===p.exerciseId);
  if(!e||p.exerciseVersion!==e.version||p.registryVersion!==LEARNING_REGISTRY.version||p.rubricVersion!==e.rubricVersion||!e.prompts.includes(p.prompt))throw Error('Exercise snapshot is incompatible with this registry. Start a new practice task.');
  if(!['independent','hint'].includes(p.assistance))throw Error('Invalid assistance snapshot.');
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(String(p.taskId||'')))throw Error('Invalid practice task ID.');
  const preparation=p.preparationElapsedSeconds;
  if(preparation!==null&&preparation!==undefined&&(!Number.isFinite(preparation)||preparation<0||preparation>86400))throw Error('Invalid preparation timing.');
  return {taskId:p.taskId,exerciseId:e.id,exerciseVersion:e.version,registryVersion:LEARNING_REGISTRY.version,rubricVersion:e.rubricVersion,prompt:p.prompt,assistance:p.assistance,hintShown:p.assistance==='hint'?e.hint:null,preparationSeconds:e.preparationSeconds,responseSeconds:e.responseSeconds,maxWords:e.maxWords,constraints:e.constraints,preparationElapsedSeconds:preparation??null,preparationTimingSource:preparation==null?'UNKNOWN':'BROWSER_ELAPSED_TO_READY',parentSessionId:String(p.parentSessionId||''),interventionId:String(p.interventionId||'')};
}
function learningSnapshot_(session,body){
  const transcript=String(session.transcript||'');if(!transcript.trim())throw Error('A transcript is required.');
  if(transcript.length>20000)throw Error('Cognitive training currently supports up to 20,000 characters per sample. The saved transcript remains intact.');
  const practice=learningPractice_(session),self=String(body.selfAssessment||'');
  if(self.length>3000)throw Error('Self-assessment must be at most 3,000 characters.');
  const metrics=session.metrics||{};
  return {schemaVersion:LEARNING_REGISTRY.schemaVersion,registryVersion:LEARNING_REGISTRY.version,rubricVersion:LEARNING_REGISTRY.rubricVersion,sessionId:session.id,groupId:session.groupId||session.id,attempt:Number(session.attempt)||1,transcriptRevision:Number(metrics.transcriptRevision)||1,transcript:transcript,practice:practice,selfAssessment:self,selfAssessmentSource:'SELF_REPORTED',context:String(session.context||''),audience:String(session.audience||''),source:String(session.source||'WEB'),wordCount:transcript.trim().split(/\s+/u).filter(Boolean).length,durationSeconds:Number(session.duration)||0,evidenceQuality:metrics.timingTranscriptMatches===false||!Number(metrics.wordTimestampCount)?'TRANSCRIPT_ONLY':'TRANSCRIPT_WITH_ORIGINAL_TIMING',limitations:['Internal cognitive explanations are hypotheses.','Text cannot establish vocal delivery, humour timing or when the speaker identified a point.','Browser preparation timing measures elapsed time to Ready, not verified thinking time.','Word count uses whitespace-separated tokens and is approximate for languages without spaces.'],assistance:practice?practice.assistance:'UNKNOWN'};
}
function learningEvidenceRows_(sheets){const s=sheets.evidence,n=s.getLastRow();return n<2?[]:s.getRange(2,1,n-1,LEARNING_EVIDENCE_HEADERS.length).getValues().map(r=>Object.assign(parse_(r[6],{}),{evidenceId:r[0],createdAt:dateText_(r[1]),sessionId:parse_(r[2],''),groupId:parse_(r[3],''),transcriptRevision:Number(r[4]),transcript:parse_(r[5],'')}));}
function learningHistory_(sessionId){
  const sessions=listSessions_(),session=sessions.find(s=>s.id===sessionId);if(!session)throw Error('Session not found.');
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')),e=ss.getSheetByName('Learning Evidence'),a=ss.getSheetByName('Learning Assessments');
  if(!e||!a)return{ok:true,entries:[],registryVersion:LEARNING_REGISTRY.version};
  const sheets=learningSheets_(),group=session.groupId||session.id,es=learningEvidenceRows_(sheets).filter(x=>x.groupId===group),byId={};es.forEach(x=>byId[x.evidenceId]=x);
  const n=a.getLastRow(),rows=n<2?[]:a.getRange(2,1,n-1,LEARNING_ASSESSMENT_HEADERS.length).getValues();
  const currentById={};sessions.forEach(x=>currentById[x.id]=x);
  return{ok:true,registryVersion:LEARNING_REGISTRY.version,entries:rows.filter(r=>byId[r[2]]).map(r=>{const evidence=byId[r[2]],current=currentById[evidence.sessionId],result=parse_(r[4],{});return{assessmentId:r[0],createdAt:dateText_(r[1]),evidence:evidence,result:result,current:!!current&&current.transcript===evidence.transcript&&Number(current.metrics.transcriptRevision||1)===evidence.transcriptRevision};})};
}
