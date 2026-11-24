/* =====================================================================
 * S-Tec Complaint Response System — 상단 기능 · 사업장 선정
 * (Attendance Management Software 상단 기능과 동일: 담당 지정 · 다운로드 QR · 친구 추천 · 내 계정 · 주간/야간/시스템)
 * Designed & Developed by Rat Rae Choi
 * ===================================================================== */
const UI_KEY = 'stcr_ui';
let UI = { theme: 'system', manager: null, br: '' };
try { UI = Object.assign(UI, JSON.parse(localStorage.getItem(UI_KEY) || '{}')); } catch (e) { }
function saveUI() { try { localStorage.setItem(UI_KEY, JSON.stringify(UI)); } catch (e) { } }   // 로그인 시 여러 기기 동기화(auth 모듈이 감쌈)

/* ---------- 테마: 주간 / 야간 / 시스템 ---------- */
const MQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme(t) {
  if (!['light', 'dark', 'system'].includes(t)) t = 'system';
  const dark = t === 'dark' || (t === 'system' && MQ && MQ.matches);
  document.body.classList.toggle('dark', dark);
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  UI.theme = t; saveUI();
  document.querySelectorAll('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
}
if (MQ && MQ.addEventListener) MQ.addEventListener('change', () => { if (UI.theme === 'system') applyTheme('system'); });

/* ---------- 모달 ---------- */
function closeModal() { document.querySelectorAll('.modal-bg').forEach(n => n.remove()); }
function openModal(html, bind) {
  closeModal(); const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}<div class="m-sign">Designed &amp; Developed by Rat Rae Choi</div></div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeModal(); }); bg.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.body.appendChild(bg); const md = bg.querySelector('.modal'); bind && bind(md);
}
function copyText(t, ok) {
  const done = () => toast(ok || '복사했습니다');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  function fallback() { const x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('복사하지 못했습니다'); } x.remove(); }
}

/* ---------- QR (qrcode-generator, 내장 — 인터넷 없이 동작) ---------- */
function makeQR(el, text, size) {
  el.innerHTML = '';
  try {
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), cell = Math.max(2, Math.floor(size / (n + 4)));
    const img = new Image(); img.alt = 'QR'; img.src = q.createDataURL(cell, cell * 2); img.style.width = size + 'px'; img.style.height = size + 'px'; img.style.imageRendering = 'pixelated';
    el.appendChild(img);
  } catch (e) { el.innerHTML = '<b style="color:#0b1757">QR</b>'; }
}
const shareUrl = () => APP.shareUrl;
function urlBox(id, v) { return `<div class="urlbox"><input id="${id}" readonly value="${esc(v || shareUrl())}" aria-label="주소"><button class="btn" data-copy="${id}">주소 복사</button></div>`; }
function bindCopies(md) { md.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => copyText(md.querySelector('#' + b.dataset.copy).value, '복사했습니다')); }
function openQR() {
  let mode = 'web';
  const draw = md => {
    const url = mode === 'web' ? shareUrl() : APP.apkUrl;
    makeQR(md.querySelector('#qrBig'), url, 240); md.querySelector('#qrUrl').value = url;
    md.querySelectorAll('[data-qm]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.qm === mode)));
    md.querySelector('#qrTip').innerHTML = mode === 'web' ? '북마크: PC는 Ctrl+D · 휴대폰은 브라우저 메뉴 → 홈 화면에 추가' : '안드로이드 앱(APK) 설치 파일입니다. 내려받은 뒤 "출처를 알 수 없는 앱 설치"를 허용하고 설치하세요. Play 프로텍트 경고가 뜨면 "무시하고 설치"를 누릅니다.';
  };
  openModal(`<h2>다운로드 QR</h2><div class="sub">휴대폰 카메라로 찍으면 바로 열립니다.</div>
    <div class="subtabs" role="group" aria-label="QR 종류"><button data-qm="web" aria-pressed="true">웹 버전 (사이트 주소)</button><button data-qm="apk" aria-pressed="false">안드로이드 앱 (APK)</button></div>
    <div class="qrbig" id="qrBig"></div>${urlBox('qrUrl')}<p class="hint" id="qrTip"></p>
    <div class="mrow"><button class="btn pri" id="mClose">닫기</button></div>`, md => {
    bindCopies(md); md.querySelector('#mClose').onclick = closeModal;
    md.querySelectorAll('[data-qm]').forEach(b => b.onclick = () => { mode = b.dataset.qm; draw(md); }); draw(md);
  });
}
function openRef() {
  const mg = UI.manager || {};
  const msg = `[에스텍 그룹] S-Tec Complaint Response System ${APP.version}\n고객사 Complaint를 대·중·소로 분류하면 대응방안을 Word·PPT·PDF로 바로 만들어 주는 프로그램입니다.\n${shareUrl()}${mg.name ? `\n추천: ${mg.name}${mg.title ? ' ' + mg.title : ''}${mg.org ? ' (' + mg.org + ')' : ''}` : ''}`;
  openModal(`<h2>친구 추천</h2><div class="sub">QR을 보여주거나 주소·추천 메시지를 복사해 카카오톡·문자로 보내세요.</div>
    <div class="qrbig" id="refQr"></div>${urlBox('refUrl')}
    <div class="field"><label for="refMsg">추천 메시지</label><textarea id="refMsg" rows="5">${esc(msg)}</textarea></div>
    <div class="mrow"><button class="btn" data-copy="refMsg">메시지 복사</button><button class="btn pri" id="mClose">닫기</button></div>`, md => {
    makeQR(md.querySelector('#refQr'), shareUrl(), 220); bindCopies(md); md.querySelector('#mClose').onclick = closeModal;
  });
}

/* ---------- Complaint 담당 (지정되어야 프로그램 구동) ---------- */
function readPhoto(file, cb) {
  const rd = new FileReader();
  rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const z = 128; c.width = c.height = z; const g = c.getContext('2d'); const mm = Math.min(img.width, img.height); g.drawImage(img, (img.width - mm) / 2, (img.height - mm) / 2, mm, mm, 0, 0, z, z); cb(c.toDataURL('image/jpeg', .85)); }; img.onerror = () => toast('사진을 읽을 수 없습니다. JPG나 PNG를 선택하세요'); img.src = rd.result; };
  rd.readAsDataURL(file);
}
function mgrFormHtml() {
  const m = UI.manager || { name: '', title: '', org: APP.branch, phone: '', photo: '', br: '' };
  return `<div class="avatar-edit"><div class="av" id="mgAv">${m.photo ? `<img src="${m.photo}" alt="">` : esc((m.name || '담')[0])}</div>
    <div><label class="btn sm" for="mgFile">사진 선택</label><input type="file" id="mgFile" accept="image/*" hidden> <button class="btn sm" id="mgNoPh" type="button">사진 빼기</button></div></div>
    <div class="grid2"><div class="field"><label for="mgName">성명 (필수)</label><input id="mgName" value="${esc(m.name)}" autocomplete="name"></div>
    <div class="field"><label for="mgTitle">직책</label><input id="mgTitle" value="${esc(m.title)}" placeholder="예: 지사장, 과장"></div></div>
    <div class="grid2"><div class="field"><label for="mgBr">담당 지사 (사업장 목록을 이 지사로 시작)</label><select id="mgBr"><option value="">회사 전체</option>${BRANCHES.map(b => `<option value="${b.key}" ${b.key === m.br ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="mgOrg">소속</label><input id="mgOrg" value="${esc(m.org)}"></div></div>
    <div class="field"><label for="mgPhone">연락처</label><input id="mgPhone" value="${esc(m.phone)}" inputmode="tel"></div>
    <div class="err" id="mgErr"></div>`;
}
function bindMgrForm(root, done) {
  let photo = (UI.manager && UI.manager.photo) || '';
  root.querySelector('#mgFile').onchange = ev => { const f = ev.target.files[0]; if (f) readPhoto(f, d => { photo = d; root.querySelector('#mgAv').innerHTML = `<img src="${d}" alt="">`; }); };
  root.querySelector('#mgNoPh').onclick = () => { photo = ''; root.querySelector('#mgAv').textContent = (root.querySelector('#mgName').value || '담')[0]; };
  return () => {
    const name = root.querySelector('#mgName').value.trim();
    if (!name) { root.querySelector('#mgErr').textContent = 'Complaint 담당 성명을 입력해야 프로그램이 시작됩니다.'; root.querySelector('#mgName').focus(); return false; }
    UI.manager = { name, title: root.querySelector('#mgTitle').value.trim(), br: root.querySelector('#mgBr').value, org: root.querySelector('#mgOrg').value.trim(), phone: root.querySelector('#mgPhone').value.trim(), photo, since: (UI.manager && UI.manager.since) || fmtD(kstNow()) };
    UI.br = UI.manager.br; saveUI(); applyManager(); renderHeader(); renderSites(); done && done(); return true;
  };
}
function openMgr() {
  openModal(`<h2>Complaint 담당 지정</h2><div class="sub">Complaint 담당이 지정되어 있어야 프로그램이 구동됩니다.</div>${mgrFormHtml()}
    <div class="mrow"><span id="mgCf"></span>${UI.manager ? '<button class="btn warn" id="mgOff">담당 해제</button>' : ''}<button class="btn" id="mClose">취소</button><button class="btn pri" id="mgOk">저장</button></div>`, md => {
    const commit = bindMgrForm(md, () => { closeModal(); toast('Complaint 담당을 저장했습니다'); });
    md.querySelector('#mgOk').onclick = commit; md.querySelector('#mClose').onclick = closeModal;
    const off = md.querySelector('#mgOff');
    if (off) off.onclick = () => {
      md.querySelector('#mgCf').innerHTML = `<span class="confirm">해제하면 프로그램이 잠깁니다. <button class="btn sm warn" id="mgY">해제</button></span>`;
      md.querySelector('#mgY').onclick = () => { UI.manager = null; saveUI(); closeModal(); renderHeader(); showGate(); };
    };
  });
}
function applyManager() {   // 작성자·작성 부서 기본값
  const m = UI.manager; if (!m) return;
  const a = $('#f_author'), d = $('#f_dept');
  if (a && !a.dataset.touched) a.value = [m.title, m.name].filter(Boolean).join(' ');
  if (d && !d.dataset.touched && m.org) d.value = m.org;
}
function renderHeader() {
  const m = UI.manager;
  $('#mgrPh').innerHTML = m && m.photo ? `<img src="${m.photo}" alt="">` : `<b style="color:#14267e;font-size:19px">${esc(m ? m.name[0] : '?')}</b>`;
  $('#mgrName').innerHTML = m ? `<em>${esc(m.name)}</em> ${esc(m.title || '')}` : '미지정';
  $('#mgrOrg').textContent = m ? ((m.br ? m.br + '지사 담당 · ' : '전체 통합 관리 · ') + (m.org || '')) : '눌러서 지정';
  makeQR($('#qrMini'), shareUrl(), 42);
}
function showGate() {
  const gt = $('#mgrGate');
  if (UI.manager) { gt.classList.add('hidden'); document.body.classList.remove('gate-locked'); return; }
  gt.classList.remove('hidden'); document.body.classList.add('gate-locked');
  $('#gateForm').innerHTML = mgrFormHtml() + '<button class="btn pri" id="gateGo" style="width:100%;padding:11px;font-size:15px">Complaint 담당 지정하고 시작</button>';
  const commit = bindMgrForm($('#gateForm'), () => { showGate(); toast('Complaint 대응 프로그램을 시작합니다'); });
  $('#gateGo').onclick = commit;
  $('#mgName').addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
}

/* =====================================================================
 * ① 발생 사업장 선정 — 에스텍 그룹 사업장 목록
 * ===================================================================== */
function siteMatches(st, q) { return !q || (st.name + ' ' + st.addr + ' ' + st.work + ' ' + st.type + ' ' + (st.mgr || '')).toLowerCase().includes(q); }
function renderSites() {
  const q = ($('#sq').value || '').trim().toLowerCase(), br = UI.br || '';
  document.querySelectorAll('#brChips button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.br || '') === br)));
  const allow = (window.APP_ACCESS && APP_ACCESS.branches && APP_ACCESS.branches.length) ? APP_ACCESS.branches : null;   // 프로그램별 권한 · 관리 범위(지사)
  const list = SITES.filter(st => (!allow || allow.includes(st.br)) && (!br || st.br === br) && siteMatches(st, q));
  state.siteList = list; if (typeof drawPins === 'function') drawPins();
  $('#siteCnt').textContent = `${list.length}곳 · ${list.reduce((a, s) => a + (s.total || 0), 0)}명`;
  $('#siteList').innerHTML = list.length ? list.map(st => `<li class="st ${state.site && state.site.id === st.id ? 'on' : ''}" data-id="${st.id}">
      <span class="brb b-${st.br}">${st.br}</span><span class="nm">${esc(st.name)}<small>${esc(st.addr)}</small></span>
      <span class="wk">${esc(st.work)}<b>${st.total}명</b></span></li>`).join('') : '<li class="empty">검색 결과가 없습니다. 아래 [직접 입력]을 쓰세요.</li>';
}
function selectSite(st, silent) {
  state.site = st;
  $('#f_client').value = st.name; $('#f_job').value = st.work || '';
  renderSiteInfo(); renderSites();
  if (!silent) { toast(`발생 사업장: ${st.name} (${st.br}지사)`); if (innerWidth < 1250) $('#formCard').scrollIntoView({ behavior: 'smooth' }); }
}
function manualSite() {
  state.site = null; renderSiteInfo(); renderSites();
  $('#f_client').value = ''; $('#f_client').focus(); toast('고객사명(사업장명)을 직접 입력하세요.');
}
function renderSiteInfo() {
  const st = state.site, box = $('#siteInfo');
  if (!st) {
    box.className = 'siteinfo empty';
    box.innerHTML = `<b>① 발생 사업장</b><span>${$('#f_client').value ? '직접 입력: <em>' + esc($('#f_client').value) + '</em> (사업장 목록 정보 없이 출력됩니다)' : '왼쪽 「① 발생 사업장 선정」에서 Complaint가 발생한 사업장을 고르세요.'}</span>`;
    return;
  }
  box.className = 'siteinfo';
  box.innerHTML = `<div class="si-h"><span class="brb b-${st.br}">${st.br}지사</span><b>${esc(st.name)}</b><button class="btn sm" id="siClear" type="button">변경</button></div>
    <div class="si-g">
      <span><i>주소</i>${esc(st.addr || '-')}</span>
      <span><i>계약일</i>${esc(st.since || '-')}</span><span><i>유형</i>${esc(st.type || '-')}</span>
      <span><i>계약 업종</i>${esc(st.work || '-')}</span><span><i>근무형태</i>${esc(st.shift || '-')}</span>
      <span><i>계약 인원</i>총 <b>${st.total}</b>명 (남 ${st.m} · 여 ${st.f})</span><span><i>업종별</i>보안 ${st.sec} · 미화 ${st.cln} · 기타 ${st.etc}</span>
      <span><i>현장 책임자</i>${esc([st.pos, st.mgr].filter(Boolean).join(' ') || '-')} ${esc(st.mtel || '')}</span><span><i>사업장 전화</i>${esc(st.stel || '-')}</span>
    </div>`;
  $('#siClear').onclick = () => { $('#siteCard').scrollIntoView({ behavior: 'smooth' }); $('#sq').focus(); };
}

function uiInit() {
  $('#appIcon').src = ASSET.icon; $('#gateLogo').src = ASSET.logo;
  $('#ver').textContent = APP.version;
  const chips = () => { const allow = (window.APP_ACCESS && APP_ACCESS.branches && APP_ACCESS.branches.length) ? APP_ACCESS.branches : null;
    $('#brChips').innerHTML = `<button data-br="">${allow ? '담당 전체' : '전체'}</button>` + BRANCHES.filter(b => !allow || allow.includes(b.key)).map(b => `<button data-br="${b.key}">${b.key}</button>`).join('');
    if (allow && UI.br && !allow.includes(UI.br)) UI.br = ''; };
  chips();
  window.addEventListener('app-access', () => { chips(); renderSites(); });
  $('#brChips').onclick = e => { const b = e.target.closest('button'); if (!b) return; UI.br = b.dataset.br; saveUI(); renderSites(); };
  $('#sq').addEventListener('input', renderSites);
  $('#siteList').onclick = e => { const li = e.target.closest('li.st'); if (li) selectSite(SITES.find(x => x.id === +li.dataset.id)); };
  $('#siteManual').onclick = manualSite;
  $('#f_client').addEventListener('input', () => { if (state.site && $('#f_client').value !== state.site.name) { state.site = null; renderSites(); } renderSiteInfo(); });
  ['f_author', 'f_dept'].forEach(id => $('#' + id).addEventListener('input', e => e.target.dataset.touched = '1'));
  $('#mgrCard').onclick = openMgr; $('#qrCard').onclick = openQR; $('#refCard').onclick = openRef;
  document.querySelectorAll('[data-theme-set]').forEach(b => b.onclick = () => applyTheme(b.dataset.themeSet));
  applyTheme(UI.theme); renderHeader(); renderSites(); renderSiteInfo(); applyManager(); showGate(); initMap(); initVidStage(); initIntake(); fitTree(); setTimeout(fitTree, 400); addEventListener('resize', fitTree);
}

/* =====================================================================
 * 사업장 위치 지도 — 카카오맵 (회사 공용 JavaScript 키 · 등록 도메인 sadness500-boop.github.io)
 * 웹 주소·안드로이드 앱에서 표시, 그 밖(PC에 내려받은 HTML 등)에서는 「카카오맵에서 열기」 바로가기
 * ===================================================================== */
const KAKAO_KEY = '8453c0a68310133484b3b92ed0f0a1f7';
const BR_COLOR = { 동부: '#1E8B3A', 서부: '#0B1F8F', 남부: '#C2410C', 중부: '#6D28D9' };
const MAP = { ready: null, map: null, pins: [] };
function mapCanLoad() { return (location.protocol === 'https:' && /(^|\.)sadness500-boop\.github\.io$/.test(location.hostname)) || !!window.Capacitor; }
function loadKakao() {
  if (MAP.ready) return MAP.ready;
  MAP.ready = new Promise((res, rej) => {
    if (window.kakao && kakao.maps) { kakao.maps.load(res); return; }
    const s = document.createElement('script'); s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    s.onload = () => { try { kakao.maps.load(res); } catch (e) { rej(e); } }; s.onerror = rej; document.head.appendChild(s);
    setTimeout(() => rej(new Error('timeout')), 10000);
  });
  return MAP.ready;
}
async function initMap() {
  if (!mapCanLoad()) { mapFallback('지도는 웹 주소(sadness500-boop.github.io) 또는 안드로이드 앱에서 표시됩니다.'); return; }
  try {
    await loadKakao(); const k = kakao.maps, box = $('#siteMap'); box.classList.remove('nomap'); box.innerHTML = '';
    MAP.map = new k.Map(box, { center: new k.LatLng(35.55, 128.95), level: 11 });
    MAP.map.addControl(new k.ZoomControl(), k.ControlPosition.RIGHT);
    drawPins();
  } catch (e) { MAP.ready = null; mapFallback('카카오맵을 불러오지 못했습니다(인터넷 연결을 확인하세요).'); }
}
function mapFallback(msg) {
  const box = $('#siteMap'); box.classList.add('nomap');
  box.innerHTML = `<div class="nomap-in"><b>🗺 사업장 위치</b><span>${esc(msg)}</span><span id="mapLink"></span></div>`; updMapLink();
}
function updMapLink() {
  const l = $('#mapLink'), st = state.site;
  const html = st && st.lat ? `<a href="https://map.kakao.com/link/map/${encodeURIComponent(st.name)},${st.lat},${st.lng}" target="_blank" rel="noopener">📍 ${esc(st.name)} — 카카오맵에서 열기</a>` : '사업장을 고르면 카카오맵 바로가기가 나타납니다.';
  if (l) l.innerHTML = html;
  const cap = $('#mapCap'); if (cap) cap.innerHTML = st && st.lat ? `📍 <b>${esc(st.name)}</b> · ${esc(st.addr)} <a href="https://map.kakao.com/link/to/${encodeURIComponent(st.name)},${st.lat},${st.lng}" target="_blank" rel="noopener">길찾기</a>` : '지도의 점을 누르면 그 사업장이 선택됩니다.';
}
function drawPins() {
  updMapLink();
  if (!MAP.map) return;
  const k = kakao.maps; MAP.pins.forEach(o => o.setMap(null)); MAP.pins = [];
  const list = state.siteList || SITES, bounds = new k.LatLngBounds(); let n = 0;
  list.forEach(st => {
    if (!st.lat) return; const pos = new k.LatLng(st.lat, st.lng); bounds.extend(pos); n++;
    const on = state.site && state.site.id === st.id;
    const el = document.createElement('div'); el.className = 'kpin' + (on ? ' on' : ''); el.style.setProperty('--c', BR_COLOR[st.br] || '#333'); el.title = `${st.name} (${st.br}지사)`;
    el.innerHTML = on ? `<i></i><span>${esc(st.name)}</span>` : '<i></i>';
    el.addEventListener('click', () => selectSite(st, true));
    const ov = new k.CustomOverlay({ position: pos, content: el, xAnchor: on ? 0.08 : 0.5, yAnchor: 0.5, zIndex: on ? 10 : 1, clickable: true }); ov.setMap(MAP.map); MAP.pins.push(ov);
  });
  MAP.map.relayout();
  if (state.site && state.site.lat) { MAP.map.setLevel(6); MAP.map.panTo(new k.LatLng(state.site.lat, state.site.lng)); }
  else if (n) MAP.map.setBounds(bounds, 30, 30, 30, 30);
}

/* ===== 메인 화면 Complaint 사례 영상 (모자이크 전환) — Designed & Developed by Rat Rae Choi ===== */
const VCASES = [   /* 하루 근무 흐름 순서 · 같은 장소·직종이 이어지지 않도록 배치 */
  { f: 'cmp8', t: '출근 지각·교대 시간 미준수', s: '교대 시간이 지나 허둥지둥 출입 게이트를 통과 — 앞 근무자 퇴근 지연·초소 공백', job: '보안', codes: ['A3-01', 'C4-03'] },
  { f: 'cmp5', t: '주차 관리소 근무 중 휴대폰 사용', s: '주차 관리소에 앉아 휴대폰만 보며 출입 차량 확인·안내를 소홀히 함', job: '주차', codes: ['A2-02', 'F1-01'] },
  { f: 'cmp3', t: '상황실 근무 중 졸음', s: 'CCTV 관제 중 졸음으로 모니터 감시 공백 발생', job: '보안', codes: ['A2-01'] },
  { f: 'cmp1', t: '미화 근무 중 고객 물품 부주의 취급', s: '사무실 청소 중 책상 위 물품을 함부로 다루고 정리 기준을 지키지 않음', job: '미화', codes: ['E1-02', 'B1-01'] },
  { f: 'cmp2', t: '방문객 응대 중 신체 접촉·고압적 태도', s: '로비 경비원이 방문객을 손으로 밀며 응대 — 불친절·마찰 민원', job: '보안', codes: ['B1-01', 'B3-01'] },
  { f: 'cmp6', t: '기계실 근무 중 흡연', s: '전기·기계 설비가 있는 기계실 안에서 담배를 피움 — 화재 위험·금연구역 위반', job: '시설', codes: ['A2-04', 'D1-02'] },
  { f: 'cmp9', t: '상황실 근무 중 휴대폰 게임', s: '관제 모니터는 보지 않고 휴대폰 게임에 몰두 — 이상 상황 놓침', job: '보안', codes: ['A2-02', 'C2-01'] },
  { f: 'cmp7', t: '주차장 근무지 이탈·휴대폰 사용', s: '관리소·차단기를 비워 두고 휴대폰을 보며 주차장을 돌아다님', job: '주차', codes: ['A1-01', 'A2-02'] },
  { f: 'cmp4', t: '상황실 근무 중 유튜브 시청', s: '관제 모니터로 개인 영상을 시청하며 감시 업무 소홀', job: '보안', codes: ['A2-02'] },
  { f: 'cmp12', t: '물류창고 지게차 부주의 운전·적재물 충돌', s: '전방 주시 없이 지게차를 몰다 랙에 부딪혀 적재 화물이 무너짐 — 고객사 물품 파손·안전사고', job: '물류', codes: ['D2-02', 'C4-01'] },
  { f: 'cmp10', t: '행사장 경비 중 공연 관람·과격한 관중 통제', s: '공연에 정신이 팔려 춤추다가, 몰린 관중을 펜스 너머로 거칠게 밀고 고성으로 무전', job: '보안', codes: ['B1-02', 'B3-01'] },
  { f: 'cmp11', t: '상황실 근무 중 음주', s: '관제 책상에 술병을 두고 마시며 근무 — 졸고 비틀거리며 감시 공백', job: '보안', codes: ['A2-03', 'C2-01'] }
];
const VST = { i: 0, busy: false, muted: true, paused: false };
function vSrc(f, ext) { const rel = `media/main/${f}.${ext}`; return location.protocol === 'file:' ? APP.shareUrl + rel : rel; }
function initVidStage() {
  const box = document.getElementById('vStage'); if (!box || box.dataset.ready) return; box.dataset.ready = '1';
  box.innerHTML = `<video id="vA" muted playsinline preload="auto"></video><video id="vB" muted playsinline preload="auto"></video><canvas id="vFx"></canvas>
    <div class="vtop"><span class="vbadge" id="vBadge"></span><span class="vrec"><i></i>근무 중 영상</span></div>
    <div class="vbot" id="vBot"><div class="vt" id="vT"></div><div class="vs" id="vS"></div>
      <div class="vrow"><span id="vChips"></span><button class="vbtn" id="vUse" title="이 사례의 Complaint 항목을 ② 분류에 선택">이 사례로 작성 ▸</button>
      <button class="vbtn g" id="vSnd" title="소리">🔇</button><button class="vbtn g" id="vPlay" title="일시정지">❚❚</button><span class="vdots" id="vDots"></span></div></div>`;
  VST.v = [box.querySelector('#vA'), box.querySelector('#vB')]; VST.cv = box.querySelector('#vFx'); VST.box = box; VST.cur = 0;
  VST.small = document.createElement('canvas');
  $('#vDots').innerHTML = VCASES.map((_, k) => `<button data-k="${k}" aria-label="사례 ${k + 1}"><b></b></button>`).join('');
  $('#vDots').onclick = e => { const b = e.target.closest('button'); if (b) vGo(+b.dataset.k); };
  $('#vUse').onclick = () => { const c = VCASES[VST.i]; let n = 0; c.codes.forEach(code => { if (!state.picked.includes(code) && state.picked.length < MAX_PICK) { state.picked.push(code); n++; } });
    renderTree($('#q').value); renderPicked(); toast(n ? `「${c.t}」 사례 항목 ${n}개를 선택했습니다. ③에 내용을 적어 주세요.` : '이미 선택된 항목입니다.');
    const fc = $('#formCard'); if (fc) fc.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  $('#vSnd').onclick = () => { VST.muted = !VST.muted; VST.v.forEach(v => v.muted = VST.muted); $('#vSnd').textContent = VST.muted ? '🔇' : '🔊'; };
  $('#vPlay').onclick = () => { VST.paused = !VST.paused; const v = VST.v[VST.cur]; VST.paused ? v.pause() : v.play().catch(() => {}); $('#vPlay').textContent = VST.paused ? '▶' : '❚❚'; };
  VST.v.forEach((v, k) => {
    v.addEventListener('timeupdate', () => { if (k !== VST.cur || VST.busy) return; vProg(v); if (v.duration && v.duration - v.currentTime < 0.6) vGo((VST.i + 1) % VCASES.length); });
    v.addEventListener('ended', () => { if (k === VST.cur && !VST.busy) vGo((VST.i + 1) % VCASES.length); });
    v.addEventListener('error', () => { if (k === VST.cur && !VST.busy) setTimeout(() => vGo((VST.i + 1) % VCASES.length), 1500); });
  });
  vLoad(VST.v[0], 0); VST.v[0].classList.add('on'); vCap(0); VST.v[0].play().catch(() => {});
  document.addEventListener('visibilitychange', () => { const v = VST.v && VST.v[VST.cur]; if (!v || !v.isConnected) return; document.hidden ? v.pause() : (!VST.paused && v.play().catch(() => {})); });
}
function vLoad(v, i) { v.poster = vSrc(VCASES[i].f, 'jpg'); v.src = vSrc(VCASES[i].f, 'mp4'); v.muted = VST.muted; v.load(); }
function vProg(v) { const b = $('#vDots button.on b'); if (b && v.duration) b.style.width = (100 * v.currentTime / v.duration) + '%'; }
function vCap(i) {
  const c = VCASES[i]; $('#vBadge').textContent = `고객 불만 유발 사례 ${i + 1}/${VCASES.length} · ${c.job}`; $('#vT').textContent = c.t; $('#vS').textContent = c.s;
  $('#vChips').innerHTML = c.codes.map(code => { const x = kbFlatSmalls().find(o => o.S.c === code); return x ? `<span class="vchip">${code} ${esc(x.S.n)}</span>` : ''; }).join(' ');
  document.querySelectorAll('#vDots button').forEach((b, k) => { b.classList.toggle('on', k === i); b.querySelector('b').style.width = k < i ? '100%' : '0'; });
}
function vGo(next) {
  if (!VST.box || !VST.box.isConnected || VST.busy || next === VST.i) return;
  VST.busy = true; const oldV = VST.v[VST.cur], nk = 1 - VST.cur, newV = VST.v[nk];
  vLoad(newV, next); newV.currentTime = 0; if (!VST.paused) newV.play().catch(() => {});
  const cv = VST.cv, sm = VST.small, ctx = cv.getContext('2d'), sx = sm.getContext('2d');
  const r = VST.box.getBoundingClientRect(), W = cv.width = Math.max(320, Math.round(r.width)), H = cv.height = Math.round(W * 9 / 16);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, D = reduce ? 300 : 1100, t0 = performance.now();
  $('#vBot').classList.add('fade'); cv.classList.add('on'); let swapped = false;
  const step = now => {
    const t = Math.min(1, (now - t0) / D), half = t < 0.5, src = half ? oldV : newV;
    const e = Math.sin(Math.PI * t), blk = reduce ? 1 : Math.max(1, Math.round(2 + 54 * e * e));
    if (!half && !swapped) { swapped = true; oldV.classList.remove('on'); newV.classList.add('on'); VST.cur = nk; VST.i = next; vCap(next); }
    const w = Math.max(2, Math.round(W / blk)), h = Math.max(2, Math.round(H / blk)); sm.width = w; sm.height = h;
    try { sx.drawImage(src, 0, 0, w, h); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.drawImage(sm, 0, 0, W, H);
      if (!reduce) { ctx.globalAlpha = 0.18 * e; ctx.fillStyle = '#0b1f8f'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } } catch (_) { }
    if (t < 1) requestAnimationFrame(step);
    else { cv.classList.remove('on'); $('#vBot').classList.remove('fade'); oldV.pause(); VST.busy = false; }
  };
  requestAnimationFrame(step);
}

/* ② Complaint 분류가 첫 화면 안에 보이도록 — 트리 높이를 화면 아래 끝에 맞춤 */
function fitTree() {
  const t = document.getElementById('tree'); if (!t) return;
  if (innerWidth <= 820) { t.style.maxHeight = ''; return; }
  const top = t.getBoundingClientRect().top + scrollY, foot = (document.querySelector('.foot') || {}).offsetHeight || 0;
  t.style.maxHeight = Math.max(360, Math.round(innerHeight - top - 66 - (getComputedStyle(document.querySelector('.foot') || document.body).position === 'fixed' ? foot : 0))) + 'px';
}
