const APP = {
  sessions: 'Sessions',
  jobs: 'AI_Jobs',
  users: 'Users',
  database: 'Fluency OS Database',
  audioFolder: 'Fluency OS - Temporary Audio',
  defaultModel: 'gemini-3.5-flash-lite',
  headers: ['id','createdAt','groupId','attempt','title','context','audience','duration','transcript','timestampedTranscript','segmentsJson','reflection','tags','metricsJson','audioFileId','audioDeleteAfter','aiStatus','aiReview','updatedAt']
};

function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss = props.getProperty('SHEET_ID') ? SpreadsheetApp.openById(props.getProperty('SHEET_ID')) : SpreadsheetApp.create(APP.database);
  ss.setSpreadsheetTimeZone('Asia/Kolkata');
  let folder = props.getProperty('FOLDER_ID') ? DriveApp.getFolderById(props.getProperty('FOLDER_ID')) : DriveApp.createFolder(APP.audioFolder);
  ensureSheet_(ss, APP.sessions, APP.headers);
  ensureSheet_(ss, APP.jobs, ['jobId','createdAt','status','result','error']);
  ensureSheet_(ss, APP.users, ['email','status','createdAt','lastSeen','authVersion']);
  props.setProperties({
    SHEET_ID: ss.getId(),
    FOLDER_ID: folder.getId(),
    ACCESS_TOKEN: props.getProperty('ACCESS_TOKEN') || Utilities.getUuid() + Utilities.getUuid(),
    AUDIO_RETENTION_DAYS: props.getProperty('AUDIO_RETENTION_DAYS') || '7',
    GEMINI_MODEL: props.getProperty('GEMINI_MODEL') || APP.defaultModel,
    ALLOWED_EMAILS: props.getProperty('ALLOWED_EMAILS') || Session.getEffectiveUser().getEmail()
  }, false);
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'cleanupExpiredAudio').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('cleanupExpiredAudio').timeBased().everyDays(1).atHour(2).create();
  const result = {
    spreadsheetUrl: ss.getUrl(),
    audioFolderUrl: folder.getUrl(),
    accessToken: props.getProperty('ACCESS_TOKEN'),
    next: 'Add GEMINI_API_KEY in Project Settings → Script properties, then deploy as a web app.'
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function doGet(e) {
  const p = e && e.parameter || {};
  try {
    if (p.action === 'bootstrap') return jsonp_(bootstrap_(), p.callback);
    if (p.action === 'signinResult') return jsonp_(signinResult_(p.nonce), p.callback);
    if (!authorizedRequest_(p)) return jsonp_({ok:false,error:'UNAUTHORIZED'}, p.callback);
    if (p.action === 'health') return jsonp_(health_(), p.callback);
    if (p.action === 'list') return jsonp_({ok:true,sessions:listSessions_()}, p.callback);
    if (p.action === 'job') return jsonp_(getJob_(p.jobId), p.callback);
    return jsonp_({ok:false,error:'UNKNOWN_ACTION'}, p.callback);
  } catch (err) {
    return jsonp_({ok:false,error:String(err && err.message || err)}, p.callback);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents || '{}');
    if (body.action === 'signin') return json_(signin_(body));
    if (!authorizedRequest_(body)) return json_({ok:false,error:'UNAUTHORIZED'});
    if (body.action === 'save') return json_(saveSession_(body.session));
    if (body.action === 'analyze') return json_(analyzeJob_(body));
    if (body.action === 'config') return json_(setConfig_(body));
    return json_({ok:false,error:'UNKNOWN_ACTION'});
  } catch (err) {
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function saveSession_(s) {
  if (!s || !s.id || !s.transcript) throw new Error('Session id and transcript are required.');
  const props = PropertiesService.getScriptProperties(), sheet = sheet_(APP.sessions);
  let audioId = '', deleteAfter = '';
  if (s.audioDataUrl) {
    const match = String(s.audioDataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const bytes = Utilities.base64Decode(match[2]), ext = match[1].indexOf('mp4') >= 0 ? 'm4a' : 'webm';
      const file = DriveApp.getFolderById(props.getProperty('FOLDER_ID')).createFile(Utilities.newBlob(bytes, match[1], safe_(s.title) + '-' + s.id + '.' + ext));
      audioId = file.getId();
      deleteAfter = new Date(Date.now() + Number(props.getProperty('AUDIO_RETENTION_DAYS') || 7) * 86400000);
    }
  }
  const existing = findRow_(sheet, s.id);
  if (existing && !audioId) {
    audioId = sheet.getRange(existing, 15).getValue();
    deleteAfter = sheet.getRange(existing, 16).getValue();
  }
  const priorAi = existing ? sheet.getRange(existing,17,1,2).getValues()[0] : ['',''];
  const values = [s.id,toDate_(s.createdAt)||new Date(),s.groupId||'',s.attempt||1,s.title||'',s.context||'',s.audience||'',s.duration||0,s.transcript||'',s.timestampedTranscript||'',JSON.stringify(s.segments||[]),s.reflection||'',s.tags||'',JSON.stringify(s.metrics||{}),audioId,toDate_(deleteAfter)||'',s.aiStatus||priorAi[0]||'',s.aiReview?JSON.stringify(s.aiReview):priorAi[1]||'',new Date()];
  if (existing) sheet.getRange(existing,1,1,values.length).setValues([values]); else sheet.appendRow(values);
  return {ok:true,id:s.id,audioDeleteAfter:deleteAfter};
}

function listSessions_() {
  const sheet = sheet_(APP.sessions), last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2,1,last-1,APP.headers.length).getValues().map(r => ({
    id:r[0],createdAt:dateText_(r[1]),groupId:r[2],attempt:r[3],title:r[4],context:r[5],audience:r[6],duration:r[7],
    transcript:r[8],timestampedTranscript:r[9],segments:parse_(r[10],[]),reflection:r[11],tags:r[12],metrics:parse_(r[13],{}),
    audioRetained:Boolean(r[14]),audioDeleteAfter:dateText_(r[15]),aiStatus:r[16],aiReview:parse_(r[17],r[17]||null),updatedAt:dateText_(r[18])
  }));
}

function analyzeJob_(body) {
  const jobs = sheet_(APP.jobs), jobId = body.jobId || Utilities.getUuid();
  jobs.appendRow([jobId,new Date(),'PROCESSING','','']);
  if (body.sessionId) updateSessionStatus_(body.sessionId,'PROCESSING','');
  try {
    const result = callGemini_(body.transcript, body.metrics || {}, body.rubric || {});
    updateJob_(jobId,'DONE',JSON.stringify(result),'');
    if (body.sessionId) updateSessionReview_(body.sessionId,result);
    return {ok:true,jobId:jobId};
  } catch (err) {
    updateJob_(jobId,'ERROR','',String(err && err.message || err));
    if (body.sessionId) updateSessionStatus_(body.sessionId,'ERROR',String(err && err.message || err));
    return {ok:false,jobId:jobId,error:String(err && err.message || err)};
  }
}

function callGemini_(transcript, metrics, rubric) {
  const props = PropertiesService.getScriptProperties(), key = props.getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY is not configured in Script properties.');
  const model = rubric.model || props.getProperty('GEMINI_MODEL') || APP.defaultModel;
  const mode = String(rubric.mode || 'Professional Update');
  const words = Number(metrics.words || String(transcript).trim().split(/\s+/).filter(Boolean).length);
  const system = [
    'You are the Fluency OS communication coach. The product north star is CRISP, SHARP AND IMPACTFUL communication.',
    'CRISP means point-first, clear, hierarchical and easy to follow.',
    'SHARP means economical, precise, controlled and free of unnecessary qualification, repetition and side branches.',
    'IMPACTFUL means the listener retains a clear takeaway, implication, decision, recommendation or action.',
    'The coaching loop is: one recording -> one primary insight -> one better version -> one measurable drill.',
    'Coach observable communication behaviour; never judge personality or diagnose psychological traits.',
    'Communication mode: '+mode+'. Adapt strictness to this mode. Reflection may explore; executive briefing must be conclusion-first and economical.',
    'Use transcript and objective metrics only. Do not claim vocal tone, pitch, confidence or pause quality unless audio evidence was supplied.',
    'Do not reward sophisticated vocabulary when clarity is weak. Do not punish necessary technical detail when it serves the listener.',
    'Preserve factual meaning in rewrites and never invent facts.',
    words < 25 ? 'This is a low-evidence sample. Keep measurable metrics, set deep scores to null where evidence is insufficient, and explain insufficiency.' : 'Evidence is sufficient for a concise transcript-based coaching review.',
    'Return valid JSON only using this schema:',
    '{"analysisStatus":"COMPLETE or INSUFFICIENT_EVIDENCE","modeSelected":"string","modeInferred":"string or null","architecture":{"current":"string","better":"string"},"summary":"string","northStar":{"crisp":"band","sharp":"band","impactful":"band"},"scores":{"structure":0,"clarity":0,"articulation":null,"concision":0,"pacing":0,"fillerControl":0,"executivePresence":0,"authenticity":0,"compression":0,"decisiveness":0,"impact":0},"whatWorked":["maximum two observable positives"],"primaryLeak":"single concise label","secondaryObservation":"string or null","evidence":["maximum two concise excerpts with explanation"],"compression":{"assessment":"string","opportunityBand":"string","originalWords":0,"rewrittenWords":0,"rewrite":"string"},"executiveVersion":"string","punchyVersion":"string or null","drill":{"id":"short-id","name":"short label","instruction":"measurable instruction","successMeasure":"string"}}',
    'All numeric scores are integers 0-100 or null when evidence is insufficient. Compression opportunity should be a useful range, not false precision.',
    'Presence reflects command, economy, clarity, conviction, composure and professional authority, but mark its transcript-only limitation in the summary.',
    'Identify no more than one primary leak. If communication is already strong, name a refinement rather than manufacturing a defect.',
    'Enabled criteria: ' + JSON.stringify(rubric.criteria || {}),
    'Custom instruction: ' + String(rubric.custom || 'None')
  ].join('\n');
  const payload = {contents:[{role:'user',parts:[{text:system+'\n\nObjective metrics:\n'+JSON.stringify(metrics)+'\n\nTranscript:\n'+transcript}]}],generationConfig:{temperature:0.2,responseMimeType:'application/json'}};
  const request = {method:'post',contentType:'application/json',payload:JSON.stringify(payload),muteHttpExceptions:true};
  let usedModel=model;
  let response = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(usedModel)+':generateContent?key='+encodeURIComponent(key),request);
  if (response.getResponseCode() === 404) {
    const available = listGenerateModels_(key);
    const fallback = available.indexOf(APP.defaultModel) >= 0 ? APP.defaultModel : available[0];
    if (fallback && fallback !== usedModel) {
      usedModel=fallback;
      response = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(usedModel)+':generateContent?key='+encodeURIComponent(key),request);
    }
  }
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Gemini HTTP '+response.getResponseCode()+': '+response.getContentText().slice(0,500));
  const data = JSON.parse(response.getContentText()), text = data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini returned no review.');
  const result=parse_(String(text).replace(/^\`\`\`json\s*|\s*\`\`\`$/g,''),{summary:text});
  result.analysisVersion=String(rubric.analysisVersion||'2.0');
  result.rubricVersion=String(rubric.rubricVersion||'crisp-sharp-impactful-v1');
  result.modelUsed=usedModel;
  result.analyzedAt=new Date().toISOString();
  return result;
}

function getJob_(id) {
  const sheet = sheet_(APP.jobs), row = findRow_(sheet,id);
  if (!row) return {ok:true,status:'PENDING'};
  const r = sheet.getRange(row,1,1,5).getValues()[0];
  return {ok:true,jobId:r[0],status:r[2],result:parse_(r[3],r[3]||null),error:r[4]||''};
}
function updateJob_(id,status,result,error) { const s=sheet_(APP.jobs),r=findRow_(s,id);if(r)s.getRange(r,3,1,3).setValues([[status,result,error]]); }
function updateSessionReview_(id,result) { const s=sheet_(APP.sessions),r=findRow_(s,id);if(r)s.getRange(r,17,1,3).setValues([['DONE',JSON.stringify(result),new Date()]]); }
function updateSessionStatus_(id,status,message) { const s=sheet_(APP.sessions),r=findRow_(s,id);if(r)s.getRange(r,17,1,3).setValues([[status,message||s.getRange(r,18).getValue(),new Date()]]); }

function setConfig_(body) {
  const days = Math.max(1,Math.min(30,Number(body.retentionDays || 7)));
  const model = String(body.model || APP.defaultModel).trim();
  PropertiesService.getScriptProperties().setProperties({AUDIO_RETENTION_DAYS:String(days),GEMINI_MODEL:model},false);
  return {ok:true,retentionDays:days,model:model};
}
function cleanupExpiredAudio() {
  const sheet=sheet_(APP.sessions),last=sheet.getLastRow();if(last<2)return;
  const rows=sheet.getRange(2,1,last-1,APP.headers.length).getValues(),now=Date.now();
  rows.forEach((r,i)=>{const id=r[14],expiry=r[15]&&new Date(r[15]).getTime();if(id&&expiry&&expiry<=now){try{if(typeof Drive!=='undefined'&&Drive.Files)Drive.Files.remove(id);else DriveApp.getFileById(id).setTrashed(true)}catch(e){}sheet.getRange(i+2,15,1,2).setValues([['','DELETED']])}});
}

function repairTimestamps() {
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  ss.setSpreadsheetTimeZone('Asia/Kolkata');
  const sessions=ss.getSheetByName(APP.sessions);
  [2,16,19].forEach(col=>convertDateColumn_(sessions,col));
  convertDateColumn_(ss.getSheetByName(APP.jobs),2);
  if(sessions&&sessions.getLastRow()>1){[2,16,19].forEach(col=>sessions.getRange(2,col,sessions.getLastRow()-1,1).setNumberFormat('dd/MM/yyyy HH:mm:ss'))}
  const jobs=ss.getSheetByName(APP.jobs);if(jobs&&jobs.getLastRow()>1)jobs.getRange(2,2,jobs.getLastRow()-1,1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  console.log('Existing timestamps converted to India time display.');
}
function convertDateColumn_(sheet,col){if(!sheet||sheet.getLastRow()<2)return;const range=sheet.getRange(2,col,sheet.getLastRow()-1,1),values=range.getValues().map(r=>{const d=toDate_(r[0]);return[d||r[0]]});range.setValues(values)}

function health_() {
  const p=PropertiesService.getScriptProperties();
  const key=p.getProperty('GEMINI_API_KEY');
  return {ok:true,database:true,drive:true,geminiConfigured:Boolean(key),retentionDays:Number(p.getProperty('AUDIO_RETENTION_DAYS')||7),model:p.getProperty('GEMINI_MODEL')||APP.defaultModel,availableModels:key?listGenerateModels_(key):[]};
}
function listGenerateModels_(key){try{const r=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?key='+encodeURIComponent(key),{muteHttpExceptions:true});if(r.getResponseCode()!==200)return[];return(JSON.parse(r.getContentText()).models||[]).filter(m=>(m.supportedGenerationMethods||[]).indexOf('generateContent')>=0).map(m=>String(m.name||'').replace(/^models\//,''))}catch(e){return[]}}
function bootstrap_() {
  const p=PropertiesService.getScriptProperties();
  return {ok:true,authVersion:'google-v1',googleClientId:p.getProperty('GOOGLE_CLIENT_ID')||'',northStar:'Crisp • Sharp • Impactful'};
}
function signin_(body) {
  const cache=CacheService.getScriptCache(),nonce=String(body.nonce||'');
  if (!nonce || !/^[a-zA-Z0-9-]{16,80}$/.test(nonce)) return {ok:false,error:'INVALID_NONCE'};
  try {
    const user=verifyGoogleCredential_(body.credential);
    const sessionToken=Utilities.getUuid()+Utilities.getUuid(),expires=21600;
    cache.put('fluency-session-'+sessionToken,JSON.stringify({email:user.email}),expires);
    const result={ok:true,status:'DONE',email:user.email,sessionToken:sessionToken,expiresIn:expires};
    cache.put('fluency-signin-'+nonce,JSON.stringify(result),120);
    recordUser_(user.email);
    return {ok:true,status:'PROCESSING'};
  } catch(err) {
    cache.put('fluency-signin-'+nonce,JSON.stringify({ok:false,status:'ERROR',error:String(err&&err.message||err)}),120);
    return {ok:false,error:String(err&&err.message||err)};
  }
}
function signinResult_(nonce) {
  const raw=CacheService.getScriptCache().get('fluency-signin-'+String(nonce||''));
  return raw?parse_(raw,{ok:false,status:'ERROR',error:'Invalid sign-in response'}):{ok:true,status:'PENDING'};
}
function verifyGoogleCredential_(credential) {
  if(!credential)throw new Error('Google credential is missing.');
  const p=PropertiesService.getScriptProperties(),clientId=p.getProperty('GOOGLE_CLIENT_ID');
  if(!clientId)throw new Error('GOOGLE_CLIENT_ID is not configured.');
  const response=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential),{muteHttpExceptions:true});
  if(response.getResponseCode()!==200)throw new Error('Google could not verify this sign-in.');
  const data=JSON.parse(response.getContentText());
  if(data.aud!==clientId)throw new Error('Google sign-in was issued for another application.');
  if(String(data.email_verified)!=='true')throw new Error('Google email is not verified.');
  const email=String(data.email||'').toLowerCase(),allowed=String(p.getProperty('ALLOWED_EMAILS')||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  if(!email||allowed.indexOf(email)<0)throw new Error('This Gmail account is not approved for Fluency OS.');
  return {email:email};
}
function authorizedRequest_(request) {
  if(request&&request.sessionToken){
    const raw=CacheService.getScriptCache().get('fluency-session-'+String(request.sessionToken));
    if(raw)return true;
  }
  return authorized_(request&&request.token);
}
function recordUser_(email) {
  const s=sheet_(APP.users),last=s.getLastRow(),now=new Date();
  if(last>1){
    const found=s.getRange(2,1,last-1,1).createTextFinder(email).matchEntireCell(true).findNext();
    if(found){s.getRange(found.getRow(),2,1,4).setValues([['ACTIVE',s.getRange(found.getRow(),3).getValue()||now,now,'google-v1']]);return;}
  }
  s.appendRow([email,'ACTIVE',now,now,'google-v1']);
}

function authorized_(token){const expected=PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN');return Boolean(expected&&token&&Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(token)).join(',')===Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(expected)).join(','))}
function sheet_(name){const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));return ss.getSheetByName(name)}
function ensureSheet_(ss,name,headers){let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0)s.appendRow(headers);return s}
function findRow_(sheet,id){if(!id||sheet.getLastRow()<2)return 0;const f=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext();return f?f.getRow():0}
function parse_(v,fallback){try{return typeof v==='string'?JSON.parse(v):v}catch(e){return fallback}}
function dateText_(v){return v instanceof Date?v.toISOString():String(v||'')}
function toDate_(v){if(v instanceof Date&&!isNaN(v.getTime()))return v;if(!v)return null;const d=new Date(v);return isNaN(d.getTime())?null:d}
function safe_(s){return String(s||'recording').replace(/[^a-z0-9_-]+/gi,'-').slice(0,80)}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function jsonp_(o,cb){const body=cb?String(cb).replace(/[^a-zA-Z0-9_.$]/g,'')+'('+JSON.stringify(o)+');':JSON.stringify(o);return ContentService.createTextOutput(body).setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON)}
