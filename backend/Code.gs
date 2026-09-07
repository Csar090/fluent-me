const APP = {
  sessions: 'Sessions',
  jobs: 'AI_Jobs',
  database: 'Fluency OS Database',
  audioFolder: 'Fluency OS - Temporary Audio',
  defaultModel: 'gemini-3.5-flash-lite',
  headers: ['id','createdAt','groupId','attempt','title','context','audience','duration','transcript','timestampedTranscript','segmentsJson','reflection','tags','metricsJson','audioFileId','audioDeleteAfter','aiStatus','aiReview','updatedAt']
};

function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss = props.getProperty('SHEET_ID') ? SpreadsheetApp.openById(props.getProperty('SHEET_ID')) : SpreadsheetApp.create(APP.database);
  let folder = props.getProperty('FOLDER_ID') ? DriveApp.getFolderById(props.getProperty('FOLDER_ID')) : DriveApp.createFolder(APP.audioFolder);
  ensureSheet_(ss, APP.sessions, APP.headers);
  ensureSheet_(ss, APP.jobs, ['jobId','createdAt','status','result','error']);
  props.setProperties({
    SHEET_ID: ss.getId(),
    FOLDER_ID: folder.getId(),
    ACCESS_TOKEN: props.getProperty('ACCESS_TOKEN') || Utilities.getUuid() + Utilities.getUuid(),
    AUDIO_RETENTION_DAYS: props.getProperty('AUDIO_RETENTION_DAYS') || '7',
    GEMINI_MODEL: props.getProperty('GEMINI_MODEL') || APP.defaultModel
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
  if (!authorized_(p.token)) return jsonp_({ok:false,error:'UNAUTHORIZED'}, p.callback);
  try {
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
    if (!authorized_(body.token)) return json_({ok:false,error:'UNAUTHORIZED'});
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
      deleteAfter = new Date(Date.now() + Number(props.getProperty('AUDIO_RETENTION_DAYS') || 7) * 86400000).toISOString();
    }
  }
  const existing = findRow_(sheet, s.id);
  if (existing && !audioId) {
    audioId = sheet.getRange(existing, 15).getValue();
    deleteAfter = sheet.getRange(existing, 16).getValue();
  }
  const priorAi = existing ? sheet.getRange(existing,17,1,2).getValues()[0] : ['',''];
  const values = [s.id,s.createdAt||new Date().toISOString(),s.groupId||'',s.attempt||1,s.title||'',s.context||'',s.audience||'',s.duration||0,s.transcript||'',s.timestampedTranscript||'',JSON.stringify(s.segments||[]),s.reflection||'',s.tags||'',JSON.stringify(s.metrics||{}),audioId,deleteAfter,s.aiStatus||priorAi[0]||'',s.aiReview?JSON.stringify(s.aiReview):priorAi[1]||'',new Date().toISOString()];
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
  jobs.appendRow([jobId,new Date().toISOString(),'PROCESSING','','']);
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
  const system = [
    'You are the Fluency OS communication coach. Coach, do not judge. Preserve the speaker’s personality and intent.',
    'Evaluate only from the supplied transcript and objective metrics. Do not invent vocal qualities that text cannot prove.',
    'Return valid JSON only with this schema:',
    '{"summary":"string","scores":{"structure":0,"clarity":0,"articulation":0,"concision":0,"pacing":0,"fillerControl":0,"executivePresence":0,"authenticity":0},"strengths":["string"],"primaryLever":"string","evidence":["string"],"tighterVersion":"string","practiceChallenge":"string"}',
    'Scores are integers from 0 to 100. Distinguish observed evidence from inference.',
    'Enabled criteria: ' + JSON.stringify(rubric.criteria || {}),
    'Custom instruction: ' + String(rubric.custom || 'None')
  ].join('\n');
  const payload = {contents:[{role:'user',parts:[{text:system+'\n\nObjective metrics:\n'+JSON.stringify(metrics)+'\n\nTranscript:\n'+transcript}]}],generationConfig:{temperature:0.25,responseMimeType:'application/json'}};
  const request = {method:'post',contentType:'application/json',payload:JSON.stringify(payload),muteHttpExceptions:true};
  let response = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key),request);
  if (response.getResponseCode() === 404) {
    const available = listGenerateModels_(key);
    const fallback = available.indexOf(APP.defaultModel) >= 0 ? APP.defaultModel : available[0];
    if (fallback && fallback !== model) response = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(fallback)+':generateContent?key='+encodeURIComponent(key),request);
  }
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Gemini HTTP '+response.getResponseCode()+': '+response.getContentText().slice(0,500));
  const data = JSON.parse(response.getContentText()), text = data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini returned no review.');
  return parse_(String(text).replace(/^\`\`\`json\s*|\s*\`\`\`$/g,''),{summary:text});
}

function getJob_(id) {
  const sheet = sheet_(APP.jobs), row = findRow_(sheet,id);
  if (!row) return {ok:true,status:'PENDING'};
  const r = sheet.getRange(row,1,1,5).getValues()[0];
  return {ok:true,jobId:r[0],status:r[2],result:parse_(r[3],r[3]||null),error:r[4]||''};
}
function updateJob_(id,status,result,error) { const s=sheet_(APP.jobs),r=findRow_(s,id);if(r)s.getRange(r,3,1,3).setValues([[status,result,error]]); }
function updateSessionReview_(id,result) { const s=sheet_(APP.sessions),r=findRow_(s,id);if(r)s.getRange(r,17,1,3).setValues([['DONE',JSON.stringify(result),new Date().toISOString()]]); }
function updateSessionStatus_(id,status,message) { const s=sheet_(APP.sessions),r=findRow_(s,id);if(r)s.getRange(r,17,1,3).setValues([[status,message||s.getRange(r,18).getValue(),new Date().toISOString()]]); }

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

function health_() {
  const p=PropertiesService.getScriptProperties();
  const key=p.getProperty('GEMINI_API_KEY');
  return {ok:true,database:true,drive:true,geminiConfigured:Boolean(key),retentionDays:Number(p.getProperty('AUDIO_RETENTION_DAYS')||7),model:p.getProperty('GEMINI_MODEL')||APP.defaultModel,availableModels:key?listGenerateModels_(key):[]};
}
function listGenerateModels_(key){try{const r=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?key='+encodeURIComponent(key),{muteHttpExceptions:true});if(r.getResponseCode()!==200)return[];return(JSON.parse(r.getContentText()).models||[]).filter(m=>(m.supportedGenerationMethods||[]).indexOf('generateContent')>=0).map(m=>String(m.name||'').replace(/^models\//,''))}catch(e){return[]}}
function authorized_(token){const expected=PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN');return Boolean(expected&&token&&Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(token)).join(',')===Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(expected)).join(','))}
function sheet_(name){const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));return ss.getSheetByName(name)}
function ensureSheet_(ss,name,headers){let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0)s.appendRow(headers);return s}
function findRow_(sheet,id){if(!id||sheet.getLastRow()<2)return 0;const f=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext();return f?f.getRow():0}
function parse_(v,fallback){try{return typeof v==='string'?JSON.parse(v):v}catch(e){return fallback}}
function dateText_(v){return v instanceof Date?v.toISOString():String(v||'')}
function safe_(s){return String(s||'recording').replace(/[^a-z0-9_-]+/gi,'-').slice(0,80)}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function jsonp_(o,cb){const body=cb?String(cb).replace(/[^a-zA-Z0-9_.$]/g,'')+'('+JSON.stringify(o)+');':JSON.stringify(o);return ContentService.createTextOutput(body).setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON)}
