(function(){
  var r=document.documentElement,s={},m=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
  try{if(localStorage.getItem('bq-consent')!=='no')s=JSON.parse(localStorage.getItem('bq-a11y')||'{}')||{};}catch(e){}
  window.bqA11y={text:s.text===125||s.text===150?s.text:100,font:s.font===true,spacing:s.spacing===true,contrast:s.contrast===true,motion:typeof s.motion==='boolean'?s.motion:!!(m&&m.matches)};
  window.bqApplyA11y=function(){var s=window.bqA11y;[125,150].forEach(function(n){r.classList.toggle('bq-text-'+n,s.text===n);});['font','spacing','contrast','motion'].forEach(function(k){r.classList.toggle('bq-'+k,s[k]);});};
  window.bqApplyA11y();
})();
