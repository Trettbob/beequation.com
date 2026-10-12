(function(){
  var d=document.getElementById('bq-a11y');if(!d)return;
  var s=window.bqA11y,opener=null,root=document.documentElement;
  function sync(){d.querySelectorAll('[data-a11y]').forEach(function(c){var k=c.dataset.a11y;if(c.type==='checkbox')c.checked=s[k];else c.value=String(s[k]);});}
  function place(){
    if(!d.open||!opener)return;
    var anchor=opener;if(!anchor.getClientRects().length){var wide=document.querySelector('.bqh-pill [data-bq-a11y-open]');if(wide&&wide.getClientRects().length)anchor=wide;}
    var r=anchor.getBoundingClientRect(),sheet=window.innerWidth<600||!anchor.getClientRects().length;
    d.setAttribute('data-placement',sheet?'sheet':'anchor');
    if(sheet){d.style.top='';d.style.left='';d.style.maxHeight='';return;}
    var top=Math.min(r.bottom+8,window.innerHeight-100),width=d.getBoundingClientRect().width;
    d.style.top=top+'px';d.style.left=Math.max(12,Math.min(r.right-width,window.innerWidth-width-12))+'px';d.style.maxHeight=Math.max(88,window.innerHeight-top-12)+'px';
  }
  window.addEventListener('resize',place);window.addEventListener('scroll',place,{passive:true});
  function save(){window.bqApplyA11y();try{if(localStorage.getItem('bq-consent')!=='no')localStorage.setItem('bq-a11y',JSON.stringify(s));else localStorage.removeItem('bq-a11y');}catch(e){}document.dispatchEvent(new Event('bq-a11y'));place();}
  document.querySelectorAll('[data-bq-a11y-open]').forEach(function(b){b.addEventListener('click',function(){opener=b;sync();d.inert=false;d.showModal();place();d.querySelector('select').focus();});});
  d.addEventListener('change',function(e){var c=e.target,k=c.dataset.a11y;if(!k)return;s[k]=c.type==='checkbox'?c.checked:Number(c.value);save();});
  d.querySelector('[data-a11y-reset]').addEventListener('click',function(){s.text=100;s.font=s.spacing=s.contrast=false;s.motion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);sync();save();});
  d.querySelector('[data-a11y-close]').addEventListener('click',function(){d.close();});
  d.addEventListener('close',function(){var back=opener&&opener.isConnected&&opener.getClientRects().length?opener:document.querySelector('.bqh-pill [data-bq-a11y-open]');if(!back||!back.getClientRects().length)back=document.querySelector('.bqh-hive');if(!back||!back.getClientRects().length)back=document.querySelector('.bqh-logo');if(back)back.focus();d.inert=root.classList.contains('bqm-open');});
  d.addEventListener('cancel',function(e){e.preventDefault();d.close();});
  // A native modal makes the background inert. Keep Tab cycling inside the controls as well.
  d.addEventListener('keydown',function(e){if(e.key==='Escape'||e.key==='Esc'){e.preventDefault();e.stopPropagation();d.close();return;}if(e.key!=='Tab')return;
    var f=Array.from(d.querySelectorAll('button,select,input')).filter(function(c){return !c.disabled&&c.getClientRects().length;});var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  });
  document.addEventListener('bq-consent',function(){try{if(localStorage.getItem('bq-consent')==='no')localStorage.removeItem('bq-a11y');}catch(e){}});
  window.addEventListener('storage',function(e){if(e.key==='bq-consent'&&e.newValue==='no'){try{localStorage.removeItem('bq-a11y');}catch(x){}}});
  var m=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');if(m&&m.addEventListener)m.addEventListener('change',function(e){if(e.matches){s.motion=true;sync();save();}});
  sync();
})();
