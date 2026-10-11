'use strict';
const $=s=>document.querySelector(s);
const topics={T1:'데이터·근거 설계',T2:'Agent·아키텍처',T3:'업무 규칙 설계'};
const KEY='agent-casebook-v1';
let data,active=1,savedOnly=false,visible=[],toastTimer;
let state={saved:[],done:[],font:0,last:1};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){for(const k of ['saved','done'])state[k]=Array.isArray(s[k])?[...new Set(s[k].filter(n=>Number.isInteger(n)&&n>=1&&n<=30))]:[];state.font=[0,1,2].includes(s.font)?s.font:0;state.last=s.last>=1&&s.last<=30?s.last:1;}}catch{}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('이 브라우저에서는 읽기 기록을 저장할 수 없어요.');}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function num(n){return String(n).padStart(2,'0');}
function setFont(){document.documentElement.style.setProperty('--font',(16+state.font*2)+'px');}
const mobileQuery=window.matchMedia('(max-width:760px)');
function syncNav(){const opened=$('body').classList.contains('nav-open');$('#sidebar').inert=mobileQuery.matches&&!opened;}
function closeNav(){$('body').classList.remove('nav-open');$('#open-nav').setAttribute('aria-expanded','false');syncNav();}
function navigate(id,scroll=true){
 if(!data.cases.some(c=>c.id===id))return;
 active=id;state.last=id;persist();
 history.replaceState(null,'','#case-'+num(id));
 renderList();renderCase();closeNav();
 if(scroll)window.scrollTo({top:0,behavior:'auto'});
}
function filter(){
 const q=$('#search').value.trim().toLowerCase(),t=$('#topic').value,i=$('#industry').value;
 visible=data.cases.filter(c=>(!q||c.search.includes(q))&&(!t||c.topic===t)&&(!i||c.industry===i)&&(!savedOnly||state.saved.includes(c.id)));
 $('#result-count').textContent=visible.length+'개 사례';
 if(visible.length&&!visible.some(c=>c.id===active)){active=visible[0].id;state.last=active;history.replaceState(null,'','#case-'+num(active));}
 renderList();renderCase();
}
function renderList(){
 const root=$('#case-list');root.innerHTML='';
 for(const c of visible){
  const b=document.createElement('button');b.className='case-link'+(c.id===active?' active':'');
  b.setAttribute('aria-label',num(c.id)+'. '+c.title+(state.done.includes(c.id)?', 읽음':''));
  if(c.id===active)b.setAttribute('aria-current','page');
  b.innerHTML='<span class="case-no">'+num(c.id)+'</span><span class="case-name">'+esc(c.title)+'<span class="case-tags">'+esc(c.industry)+' · '+topics[c.topic]+'</span></span><span class="case-state" aria-hidden="true">'+(state.done.includes(c.id)?'✓':state.saved.includes(c.id)?'◆':'')+'</span>';
  b.onclick=()=>navigate(c.id);root.appendChild(b);
 }
 if(!visible.length){const p=document.createElement('p');p.className='loading';p.textContent='조건에 맞는 사례가 없어요.';root.appendChild(p);}
 $('#progress-count').textContent=state.done.length+' / 30';$('#progress').value=state.done.length;
 $('#mobile-count').textContent=num(active)+' / 30 CASES';
}
function toggleSaved(id){const k=state.saved.indexOf(id);if(k<0)state.saved.push(id);else state.saved.splice(k,1);persist();if(savedOnly)filter();else{renderList();updateTools();}toast(k<0?'사례를 저장했어요.':'저장을 해제했어요.');}
function toggleDone(id){const k=state.done.indexOf(id);if(k<0)state.done.push(id);else state.done.splice(k,1);persist();renderList();updateTools();toast(k<0?'읽음으로 표시했어요.':'읽음 표시를 해제했어요.');}
function updateTools(){
 const s=state.saved.includes(active),d=state.done.includes(active);
 const b=$('#save-case');if(b){b.setAttribute('aria-pressed',String(s));b.textContent=s?'◆ 저장됨':'◇ 사례 저장';}
 const m=$('#done-case');if(m){m.setAttribute('aria-pressed',String(d));m.textContent=d?'✓ 읽음':'○ 읽음 표시';}
 const bot=$('#done-bottom');if(bot){bot.setAttribute('aria-pressed',String(d));bot.textContent=d?'✓ 읽기 완료':'읽기 완료 표시';}
}
function renderCase(){
 const root=$('#case-content');
 if(!visible.length){root.innerHTML='<div class="empty"><span class="eyebrow">NO MATCHES</span><h2>조건에 맞는 사례가 없어요.</h2><p>검색어 또는 필터를 바꿔보세요.</p><button id="reset-filters">필터 초기화</button></div>';$('#reset-filters').onclick=()=>{$('#search').value='';$('#topic').value='';$('#industry').value='';savedOnly=false;$('#saved-filter').setAttribute('aria-pressed','false');filter();};return;}
 const c=data.cases.find(c=>c.id===active),idx=visible.findIndex(c=>c.id===active);
 root.innerHTML='<header class="case-head"><div><div class="case-kicker"><span class="number">CASE '+num(c.id)+'</span><span class="pill industry">'+c.industry+'</span><span class="pill">'+topics[c.topic]+'</span></div><h2>'+esc(c.title)+'</h2></div><span class="case-ordinal" aria-hidden="true">'+num(c.id)+'</span></header>'+
 '<div class="reading-tools"><button class="tool" id="save-case"></button><button class="tool" id="done-case"></button><button class="tool" id="copy-case">↗ 내용 복사</button><button class="tool font-tool" id="font-size" aria-label="본문 글자 크기 변경">가 <b>가</b> ＋</button></div>'+
 '<section class="scenario" aria-labelledby="scene-label"><h3 id="scene-label" class="section-label">상황 살펴보기</h3><div class="prose">'+c.scene+'</div></section>'+
 '<section class="questions" aria-labelledby="question-label"><h3 id="question-label" class="section-label">검토할 질문</h3><div class="prose">'+c.questions+'</div></section>'+
 '<section class="answers" aria-labelledby="answer-label"><div class="answer-heading"><h3 id="answer-label" class="section-label">설계 답안</h3><button id="toggle-answers">답안 모두 펼치기 ＋</button></div><div class="prose answer-lead">'+c.lead+'</div>'+
 c.answers.map(a=>'<details class="answer-card"><summary data-num="'+num(a.n)+'">'+esc(a.title)+'</summary><div class="prose answer-body">'+a.html+'</div></details>').join('')+'</section>'+
 '<section class="points" aria-labelledby="points-label"><h3 id="points-label" class="section-label">설계에서 짚어볼 점</h3><div class="prose">'+c.points+'</div></section>'+
 '<nav class="bottom-nav" aria-label="사례 이동"><button id="prev-case" '+(idx===0?'disabled':'')+'>← 이전 사례</button><button class="done-bottom" id="done-bottom"></button><button id="next-case" '+(idx===visible.length-1?'disabled':'')+'>다음 사례 →</button></nav>';
 $('#save-case').onclick=()=>toggleSaved(c.id);$('#done-case').onclick=()=>toggleDone(c.id);$('#done-bottom').onclick=()=>toggleDone(c.id);
 $('#font-size').onclick=()=>{state.font=(state.font+1)%3;setFont();persist();toast('본문 크기 '+(16+state.font*2)+'px');};
 $('#copy-case').onclick=async()=>{try{await navigator.clipboard.writeText(c.md);toast('문제와 답안을 복사했어요.');}catch{toast('복사가 지원되지 않아요. MD 내려받기를 이용해주세요.');}};
 $('#toggle-answers').onclick=()=>{const ds=[...document.querySelectorAll('.answer-card')],open=!ds.every(d=>d.open);ds.forEach(d=>d.open=open);};
 document.querySelectorAll('.answer-card').forEach(d=>d.addEventListener('toggle',()=>{$('#toggle-answers').textContent=[...document.querySelectorAll('.answer-card')].every(d=>d.open)?'답안 모두 접기 −':'답안 모두 펼치기 ＋';}));
 $('#prev-case').onclick=()=>{if(idx>0)navigate(visible[idx-1].id);};$('#next-case').onclick=()=>{if(idx<visible.length-1)navigate(visible[idx+1].id);};
 document.title=num(c.id)+'. '+c.title+' | AI Agent 설계 사례집';
 updateTools();
}
function openReference(anchor){
 const d=$('#reference-dialog');if(!d.open)d.showModal();
 if(anchor)requestAnimationFrame(()=>{const e=document.getElementById(anchor);if(e)e.scrollIntoView({block:'start'});});
 else d.scrollTop=0;
}
document.addEventListener('click',e=>{
 const link=e.target.closest('a[href^="#s"]');
 if(link&&/^#s[1-9]$/.test(link.getAttribute('href'))){e.preventDefault();openReference(link.getAttribute('href').slice(1));}
});
$('#references').onclick=()=>openReference();$('#close-reference').onclick=()=>$('#reference-dialog').close();
$('#reference-dialog').addEventListener('click',e=>{if(e.target===$('#reference-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#open-nav').setAttribute('aria-expanded','false');$('#open-nav').setAttribute('aria-controls','sidebar');
$('#open-nav').onclick=()=>{$('body').classList.add('nav-open');$('#open-nav').setAttribute('aria-expanded','true');syncNav();$('#search').focus();};
$('#close-nav').onclick=closeNav;$('#shade').onclick=closeNav;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#reference-dialog').open){e.preventDefault();if(window.matchMedia('(max-width:760px)').matches)$('#open-nav').click();else $('#search').focus();}});
$('#search').addEventListener('input',()=>data&&filter());$('#topic').onchange=()=>data&&filter();$('#industry').onchange=()=>data&&filter();
$('#saved-filter').onclick=()=>{savedOnly=!savedOnly;$('#saved-filter').setAttribute('aria-pressed',String(savedOnly));if(data)filter();};
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#case-(\d+)$/);if(data&&m){const id=Number(m[1]);if(!visible.some(c=>c.id===id)){$('#search').value='';$('#topic').value='';$('#industry').value='';savedOnly=false;$('#saved-filter').setAttribute('aria-pressed','false');visible=data.cases;}navigate(id);$('#result-count').textContent=visible.length+'개 사례';}});
window.addEventListener('beforeprint',()=>document.querySelectorAll('.answer-card').forEach(d=>d.open=true));
mobileQuery.addEventListener('change',syncNav);syncNav();setFont();
fetch('data.json').then(r=>{if(!r.ok)throw Error('data');return r.json();}).then(d=>{
 data=d;visible=d.cases;$('#reference-content').innerHTML=d.reference;
 $('#reference-content').querySelectorAll('a[href^="https:"]').forEach(a=>{a.target='_blank';a.rel='noopener noreferrer';});
 const m=location.hash.match(/^#case-(\d+)$/);const id=m?Number(m[1]):state.last;active=d.cases.some(c=>c.id===id)?id:1;
 navigate(active,false);
}).catch(()=>{$('#case-list').innerHTML='<p class="loading">사례를 불러오지 못했어요.</p>';$('#case-content').innerHTML='<div class="empty"><h2>잠시 후 다시 시도해주세요.</h2><p>페이지를 새로고침하거나 Markdown으로 읽을 수 있어요.</p><a href="agent-casebook.md" download>MD 내려받기</a></div>';});
