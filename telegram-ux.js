/* Fluency OS Telegram UX: never make the ingestion option look blocked by backend polling. */
document.addEventListener('DOMContentLoaded',function(){
  const showReadyState=function(){
    const list=document.getElementById('telegramInboxList');
    if(!list)return;
    const text=String(list.textContent||'').trim();
    if(!text||/^Checking/i.test(text)){
      list.innerHTML='<div class="telegram-ready"><b>Telegram ingestion</b><span class="note">Ready. Send a voice note to the bot, then tap Refresh to check for it.</span></div>';
    }
  };
  showReadyState();
  setTimeout(showReadyState,150);
  setTimeout(showReadyState,900);
});
