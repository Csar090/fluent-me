/* One evidence point per recording, never one point per review request. */
(function(){
  const dimensions={structure:'Structure',clarity:'Clarity',decisiveness:'Decisiveness',executivePresence:'Executive presence',impact:'Impact',northStar:'North Star'};
  let selected='structure';
  function scores(row){
    const out={},revision=Number(row.metrics?.transcriptRevision||1);
    for(const review of window.FluencyReviews.reviews(row)){
      if(Number(review.transcriptRevision||1)!==revision)continue;
      for(const key of Object.keys(dimensions)){
        if(review.perspective&&review.perspective!=='all'&&review.perspective!==key)continue;
        const value=review.scores?.[key];
        if(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100)out[key]=value;
      }
    }
    return out;
  }
  function comparison(a,b){const sa=scores(a),sb=scores(b);return '<div class="table-scroll"><table><thead><tr><th>Dimension</th><th>Attempt '+esc(a.attempt||1)+'</th><th>Attempt '+esc(b.attempt||1)+'</th><th>Change</th></tr></thead><tbody>'+Object.entries(dimensions).map(([k,label])=>{const delta=sa[k]!=null&&sb[k]!=null?sb[k]-sa[k]:null;return '<tr><td>'+label+'</td><td>'+(sa[k]??'Not reviewed')+'</td><td>'+(sb[k]??'Not reviewed')+'</td><td>'+(delta==null?'—':(delta>0?'+':'')+delta)+'</td></tr>'}).join('')+'</tbody></table></div><p class="note">Scores are transcript-based coaching estimates on a 0–100 scale. Compare samples with similar context and review criteria.</p>';}
  function render(rows){
    const target=$('dimensionProgress');if(!target)return;
    const ordered=[...new Map(rows.map(r=>[r.id,r])).values()].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    const evidence=ordered.map(row=>({row,scores:scores(row)}));
    target.innerHTML='<div class="progress-dimensions">'+Object.entries(dimensions).map(([key,label])=>{const points=evidence.filter(x=>x.scores[key]!=null),first=points[0]?.scores[key],last=points.at(-1)?.scores[key],delta=points.length>1?last-first:null;return '<button data-dimension="'+key+'" class="'+(key===selected?'selected':'')+'" aria-pressed="'+(key===selected)+'"><span>'+label+'</span><strong>'+(last??'—')+'</strong><small>'+points.length+' reviewed attempt(s)'+(delta==null?'':' • '+(delta>0?'+':'')+delta+' from baseline')+'</small></button>'}).join('')+'</div>';
    const points=evidence.filter(x=>x.scores[selected]!=null);
    if(points.length){
      const width=660,height=180,x=i=>45+(points.length===1?285:i*570/(points.length-1)),y=v=>155-v*1.3;
      target.innerHTML+='<h3>'+dimensions[selected]+'</h3><svg class="score-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+dimensions[selected]+' scores; exact values are listed below"><path d="M45 20V155H630" fill="none" stroke="#c6cbd4"/><text x="5" y="28">100</text><text x="20" y="155">0</text><polyline points="'+points.map((p,i)=>x(i)+','+y(p.scores[selected])).join(' ')+'" fill="none" stroke="#2d7ab7" stroke-width="3"/>'+points.map((p,i)=>'<circle cx="'+x(i)+'" cy="'+y(p.scores[selected])+'" r="5" fill="#17233c"/>').join('')+'</svg><div class="table-scroll"><table><thead><tr><th>Recording</th><th>Date</th><th>Attempt</th><th>Score</th></tr></thead><tbody>'+points.map(p=>'<tr><td>'+esc(p.row.title)+'</td><td>'+esc(new Date(p.row.createdAt).toLocaleDateString())+'</td><td>'+esc(p.row.attempt||1)+'</td><td>'+p.scores[selected]+'</td></tr>').join('')+'</tbody></table></div>';
    }else target.innerHTML+='<p class="note">No current '+dimensions[selected].toLowerCase()+' review yet. Open a saved sample in Library and select this perspective or a complete review.</p>';
    target.querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>{selected=b.dataset.dimension;render(rows)});
  }
  window.FluencyProgress={scores,comparison,render};
})();
