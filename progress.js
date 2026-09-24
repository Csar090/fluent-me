/* Progress dashboard: interpretable coaching trends with evidence discipline. */
(function(){
  const dimensions={
    structure:{label:'Structure',help:'Logical flow: headline, supporting points and close.'},
    clarity:{label:'Clarity',help:'How easy the message is to understand without re-reading.'},
    decisiveness:{label:'Decisiveness',help:'Strength and directness of conclusions, recommendations and next steps.'},
    executivePresence:{label:'Executive presence',help:'Authority and confidence conveyed by the language. Transcript evidence only.'},
    impact:{label:'Impact',help:'How memorable, relevant and action-oriented the message is.'},
    northStar:{label:'Overall effectiveness',help:'Overall communication effectiveness across the reviewed evidence.'}
  };
  let selected='northStar';
  function scores(row){
    const out={},revision=Number(row.metrics?.transcriptRevision||1);
    for(const review of window.FluencyReviews.reviews(row)){
      if(Number(review.transcriptRevision||1)!==revision)continue;
      for(const key of Object.keys(dimensions)){
        if(review.perspective&&review.perspective!=='all'&&review.perspective!==key)continue;
        const value=review.scores?.[key];
        if(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100)out[key]=Math.round(value);
      }
    }
    return out;
  }
  const band=v=>v>=85?'Strong':v>=70?'Effective':v>=55?'Developing':'Needs focus';
  function deltaText(d){return d==null?'Baseline not available':(d>0?'+':'')+d+' vs first reviewed attempt'}
  function trend(points,key){
    if(points.length<2)return 'Need at least 2 reviewed attempts';
    const recent=points.slice(-5),first=recent[0].scores[key],last=recent.at(-1).scores[key],d=last-first;
    return Math.abs(d)<3?'Broadly stable over recent attempts':d>0?'Improving over recent attempts':'Lower than recent baseline';
  }
  function comparison(a,b){const sa=scores(a),sb=scores(b);return '<div class="table-scroll"><table><thead><tr><th>Dimension</th><th>Attempt '+esc(a.attempt||1)+'</th><th>Attempt '+esc(b.attempt||1)+'</th><th>Change</th></tr></thead><tbody>'+Object.entries(dimensions).map(([k,o])=>{const delta=sa[k]!=null&&sb[k]!=null?sb[k]-sa[k]:null;return '<tr><td>'+o.label+'</td><td>'+(sa[k]??'Not reviewed')+'</td><td>'+(sb[k]??'Not reviewed')+'</td><td>'+(delta==null?'—':(delta>0?'+':'')+delta)+'</td></tr>'}).join('')+'</tbody></table></div><p class="note">Scores are coaching estimates from the current transcript revision. Compare like-for-like communication modes where possible.</p>';}
  function render(rows){
    const target=$('dimensionProgress');if(!target)return;
    const ordered=[...new Map(rows.map(r=>[r.id,r])).values()].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    const evidence=ordered.map(row=>({row,scores:scores(row)}));
    const reviewed=evidence.filter(x=>Object.keys(x.scores).length);
    const latest=reviewed.at(-1),latestScores=latest?.scores||{},available=Object.entries(latestScores).filter(([k])=>dimensions[k]);
    const strongest=available.length?[...available].sort((a,b)=>b[1]-a[1])[0]:null,focus=available.length?[...available].sort((a,b)=>a[1]-b[1])[0]:null;
    let html='<section class="progress-explainer"><b>How to read Progress</b><span>Each point = one AI-reviewed speaking attempt. Horizontal axis = attempts over time. Vertical axis = coaching score from 0–100. Select a dimension below to inspect its trend.</span></section>';
    if(latest){
      html+='<div class="progress-insights"><div><span>Latest reviewed</span><b>'+esc(latest.row.title||'Speaking attempt')+'</b><small>'+esc(new Date(latest.row.createdAt).toLocaleDateString('en-IN'))+' • Attempt '+esc(latest.row.attempt||1)+'</small></div><div><span>Current strength</span><b>'+(strongest?dimensions[strongest[0]].label+' · '+strongest[1]:'—')+'</b><small>'+(strongest?band(strongest[1]):'Awaiting evidence')+'</small></div><div><span>Development focus</span><b>'+(focus?dimensions[focus[0]].label+' · '+focus[1]:'—')+'</b><small>'+(focus?dimensions[focus[0]].help:'Complete an AI review to establish it.')+'</small></div></div>';
    }else html+='<div class="progress-empty"><b>No scored communication evidence yet.</b><span>Open a saved sample in Library and run a Complete communication review. Progress will then build one evidence point per attempt.</span></div>';
    html+='<div class="progress-dimensions">'+Object.entries(dimensions).map(([key,o])=>{const points=evidence.filter(x=>x.scores[key]!=null),first=points[0]?.scores[key],last=points.at(-1)?.scores[key],delta=points.length>1?last-first:null;return '<button data-dimension="'+key+'" class="'+(key===selected?'selected':'')+'" aria-pressed="'+(key===selected)+'" title="'+esc(o.help)+'"><span>'+o.label+'</span><strong>'+(last??'—')+'</strong><small>'+(last!=null?band(last)+' • ':'')+points.length+' reviewed'+(delta==null?'':' • '+(delta>0?'+':'')+delta)+'</small></button>'}).join('')+'</div>';
    target.innerHTML=html;
    const points=evidence.filter(x=>x.scores[selected]!=null),o=dimensions[selected];
    if(points.length){
      const width=700,height=260,left=54,right=670,top=22,bottom=195,x=i=>left+(points.length===1?(right-left)/2:i*(right-left)/(points.length-1)),y=v=>bottom-(v/100)*(bottom-top);
      const guides=[100,75,50,25,0];
      target.innerHTML+='<section class="trend-card"><div class="trend-heading"><div><h3>'+o.label+' trend</h3><p>'+esc(o.help)+'</p></div><div class="trend-status"><b>'+points.at(-1).scores[selected]+'/100 · '+band(points.at(-1).scores[selected])+'</b><span>'+trend(points,selected)+'</span></div></div><div class="chart-wrap"><svg class="score-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+o.label+' coaching scores from 0 to 100 over reviewed attempts">'+guides.map(g=>'<line x1="'+left+'" y1="'+y(g)+'" x2="'+right+'" y2="'+y(g)+'" class="chart-grid"/><text x="'+(left-10)+'" y="'+(y(g)+4)+'" text-anchor="end">'+g+'</text>').join('')+'<polyline points="'+points.map((p,i)=>x(i)+','+y(p.scores[selected])).join(' ')+'" class="chart-line"/>'+points.map((p,i)=>'<g><circle cx="'+x(i)+'" cy="'+y(p.scores[selected])+'" r="6" class="chart-point"><title>'+esc(p.row.title)+' • '+esc(new Date(p.row.createdAt).toLocaleDateString('en-IN'))+' • Attempt '+esc(p.row.attempt||1)+' • '+p.scores[selected]+'/100</title></circle><text x="'+x(i)+'" y="'+(y(p.scores[selected])-11)+'" text-anchor="middle" class="chart-value">'+p.scores[selected]+'</text><text x="'+x(i)+'" y="220" text-anchor="middle" class="chart-attempt">A'+esc(p.row.attempt||1)+'</text></g>').join('')+'<text x="'+((left+right)/2)+'" y="250" text-anchor="middle" class="chart-axis-label">Reviewed speaking attempts →</text></svg></div><div class="trend-foot"><span><b>Latest:</b> '+points.at(-1).scores[selected]+'/100</span><span><b>From baseline:</b> '+deltaText(points.length>1?points.at(-1).scores[selected]-points[0].scores[selected]:null)+'</span><span><b>Evidence:</b> '+points.length+' reviewed attempt'+(points.length===1?'':'s')+'</span></div></section>';
      target.innerHTML+='<details class="progress-evidence"><summary>View score evidence</summary><div class="table-scroll"><table><thead><tr><th>Recording</th><th>Date</th><th>Attempt</th><th>Score</th><th>Interpretation</th></tr></thead><tbody>'+points.slice().reverse().map(p=>'<tr><td>'+esc(p.row.title)+'</td><td>'+esc(new Date(p.row.createdAt).toLocaleDateString('en-IN'))+'</td><td>'+esc(p.row.attempt||1)+'</td><td><b>'+p.scores[selected]+'</b>/100</td><td>'+band(p.scores[selected])+'</td></tr>').join('')+'</tbody></table></div></details>';
    }else target.innerHTML+='<div class="progress-empty"><b>No current '+o.label.toLowerCase()+' score.</b><span>Run a Complete communication review, or review this dimension specifically. Unreviewed dimensions are intentionally left blank rather than estimated.</span></div>';
    target.querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>{selected=b.dataset.dimension;render(rows)});
  }
  window.FluencyProgress={scores,comparison,render};
})();