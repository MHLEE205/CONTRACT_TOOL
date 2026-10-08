'use strict';
/* A-01 v2.0 정합성 테스트 — 함수 존재/형태 + 초기 상태 결과 확인 */
const {JSDOM} = require('jsdom');
const fs = require('fs');

const v20html = fs.readFileSync(__dirname+'/index.html','utf8');
const commonJs = fs.readFileSync('C:\\Users\\李明鎬\\Documents\\LEENAI_COMMON\\v1\\leenai-common.js','utf8');

function extractBody(html){
  const m=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m?m[1].replace(/<script[\s\S]*?<\/script>/gi,''):'';
}
function extractLastJs(html){
  const m=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  return m.length?m[m.length-1][1]:'';
}

const dom=new JSDOM('<!DOCTYPE html><html data-theme="dark"><head></head><body>'+extractBody(v20html)+'</body></html>',
  {url:'https://mhlee205.github.io/CONTRACT_TOOL/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;
const def=(k,v)=>Object.defineProperty(w,k,{value:v,writable:true,configurable:true});
def('crypto',{subtle:{digest:async()=>new ArrayBuffer(32)},getRandomValues:(a)=>{for(let i=0;i<a.length;i++)a[i]=i;return a;}});
def('sessionStorage',{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=v;},removeItem(k){delete this._d[k];}});
def('localStorage',{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=v;},removeItem(k){delete this._d[k];}});
def('history',{replaceState:()=>{}});
def('requestAnimationFrame',(cb)=>setTimeout(cb,0));
def('scrollTo',()=>{});
def('alert',()=>{});
w.HTMLElement.prototype.scrollIntoView=function(){};

w.eval(commonJs);
w.eval(extractLastJs(v20html));

let passed=0,failed=0;
function ok(label,cond){
  if(cond){console.log('  ✔ '+label);passed++;}
  else{console.error('  ✖ FAIL: '+label);failed++;}
}

(async()=>{
  console.log('\n[TEST] A-01 CONTRACT_TOOL v2.0 구조·함수 확인');
  await new Promise(r=>setTimeout(r,50));

  // 1. LEENAI 공통 함수 연동
  ok('LEENAI.loading.show 존재', typeof w.LEENAI.loading.show==='function');
  ok('LEENAI.auth.token 존재', typeof w.LEENAI.auth.token==='function');
  ok('LEENAI.VERSION v1.7', w.LEENAI.VERSION==='v1.7');

  // 2. 비즈니스 함수 존재
  ok('buildContractJson 함수 존재', typeof w.buildContractJson==='function');
  ok('renderStep14_Preview 함수 존재', typeof w.renderStep14_Preview==='function');
  ok('doGenerateExcel 함수 존재', typeof w.doGenerateExcel==='function');
  ok('startTool 함수 존재', typeof w.startTool==='function');
  ok('dvGet 함수 존재', typeof w.dvGet==='function');
  ok('suggestNo 함수 존재', typeof w.suggestNo==='function');
  ok('loadAllData 함수 존재', typeof w.loadAllData==='function');

  // 3. 삭제된 함수 없음
  ok('toggleTheme 없음', typeof w.toggleTheme==='undefined');
  ok('startLogin 없음', typeof w.startLogin==='undefined');
  ok('handleCallback 없음', typeof w.handleCallback==='undefined');
  ok('b64url 없음', typeof w.b64url==='undefined');

  // 4. DOM 구조
  ok('#app 존재', !!w.document.getElementById('app'));
  ok('#tabsBar 존재', !!w.document.getElementById('tabsBar'));
  ok('#tab-wizard 존재', !!w.document.getElementById('tab-wizard'));
  ok('#tab-history 존재', !!w.document.getElementById('tab-history'));
  ok('#tab-master 존재', !!w.document.getElementById('tab-master'));
  ok('자체 헤더(.header) 없음', !w.document.querySelector('.header'));
  ok('로그인 카드(.login-card) 없음', !w.document.querySelector('.login-card'));
  ok('로딩 오버레이(.loading-overlay) 없음', !w.document.querySelector('.loading-overlay'));

  // 5. buildContractJson 기본 구조 확인 (빈 상태)
  const j=w.buildContractJson();
  ok('buildContractJson.meta.source', j.meta.source==='LEENAI_CONTRACT_TOOL');
  ok('buildContractJson.contract 존재', !!j.contract);
  ok('buildContractJson.contract.details 배열', Array.isArray(j.contract.details));

  // 6. renderStep0_Mode 출력에 STEP 1 포함
  const step0=w.renderStep0_Mode();
  ok('renderStep0_Mode에 STEP 1 포함', step0.includes('STEP 1'));
  ok('renderStep0_Mode에 新規 포함', step0.includes('新規'));

  // 7. showLoading/hideLoading가 LEENAI에 위임
  let loadingShown=false;
  def('LEENAI', Object.assign({},w.LEENAI,{loading:{show:()=>{loadingShown=true;},update:()=>{},hide:()=>{}}}));
  w.showLoading('テスト');
  ok('showLoading が LEENAI.loading に委譲', loadingShown);

  console.log('\n─────────────────');
  console.log('결과: PASS '+passed+' / FAIL '+failed);
  process.exit(failed>0?1:0);
})();
