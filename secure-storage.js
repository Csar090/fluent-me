/* IndexedDB holds encrypted session records. The key is released only after server authorization. */
(function(){
  let key=null,verified=false,generation=0;
  const rawPut=put,rawAll=all;
  const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  function base64(a){let s='';for(const b of a)s+=String.fromCharCode(b);return btoa(s)}
  async function encode(row){const copy={...row};if(row.audio){const audioBytes=new Uint8Array(await row.audio.arrayBuffer());copy.audio={data:base64(audioBytes),type:row.audio.type}}const iv=crypto.getRandomValues(new Uint8Array(12)),body=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(copy)));return{id:row.id,sealed:1,iv:base64(iv),body:base64(new Uint8Array(body))}}
  async function decode(row){if(!row.sealed)return row;const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(row.iv)},key,bytes(row.body)),value=JSON.parse(new TextDecoder().decode(plain));if(value.audio?.data)value.audio=new Blob([bytes(value.audio.data)],{type:value.audio.type});return value}
  put=async function(row){if(!verified)throw Error('Sign in with your approved Google account first.');const epoch=generation,sealed=await encode(row);if(epoch!==generation||!verified)throw Error('Session expired. Sign in again.');return rawPut(sealed)};
  all=async function(){if(!verified)return[];const epoch=generation,rows=await rawAll(),decoded=[];for(const row of rows)decoded.push(await decode(row));return verified&&epoch===generation?decoded:[]};
  window.FluencyAccess={
    isReady:()=>verified,
    async unlock(storageKey){key=await crypto.subtle.importKey('raw',bytes(storageKey),{name:'AES-GCM'},false,['encrypt','decrypt']);while(!db)await new Promise(r=>setTimeout(r,20));const rows=await rawAll();for(const row of rows)if(!row.sealed)await rawPut(await encode(row));verified=true;document.documentElement.classList.remove('auth-locked');},
    lock(message){generation++;verified=false;key=null;document.documentElement.classList.add('auth-locked');const status=$('loginStatus');if(status)status.textContent=message||'Sign in with an approved Google account to open your workspace.';if($('sessionDialog').open)$('sessionDialog').close();}
  };
})();
