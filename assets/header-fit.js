// Measure the full, unwrapped pill, including font/spacing preferences and translated labels.
window.bqHeaderFits=function(h){
  if(window.innerWidth<1000)return false;
  var p=h.querySelector('.bqh-pill');h.classList.add('bqh-measuring');
  try{
    var r=p.getBoundingClientRect(),s=getComputedStyle(p),right=r.right-parseFloat(s.paddingRight||0),left=r.left+parseFloat(s.paddingLeft||0);
    return Array.from(p.querySelectorAll('.bqh-logo,.bqh-link,.bqh-end > *')).every(function(e){var b=e.getBoundingClientRect();return !b.width||(b.left>=left-1&&b.right<=right+1);})&&p.scrollWidth<=p.clientWidth+1;
  }finally{h.classList.remove('bqh-measuring');}
};
