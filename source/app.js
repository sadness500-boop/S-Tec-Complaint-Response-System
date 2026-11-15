/* =====================================================================
 * S-Tec Complaint Response System v1.4.0 — 앱 로직
 * 에스텍 그룹 고객사 Complaint 대응 프로그램
 * Program & Design by Rat Rae Choi (제작자 서명 — 하드코딩)
 * ===================================================================== */
const APP = {
  name: 'S-Tec Complaint Response System',
  ko: '고객사 Complaint 대응 프로그램',
  version: 'v1.4.0',
  build: '2026-11-14',
  shareUrl: 'https://sadness500-boop.github.io/S-Tec-Complaint-Response-System/',
  apkUrl: 'https://github.com/sadness500-boop/S-Tec-Complaint-Response-System/releases/download/app-latest/stcr-latest.apk',
  repo: 'https://github.com/sadness500-boop/S-Tec-Complaint-Response-System',
  maker: 'Rat Rae Choi',
  makerKo: '제작 · Rat Rae Choi',
  org: '에스텍 그룹',
  branch: '에스텍베스트 동부지사'
};
const K = { ink: '18224F', navy: '22348F', mute: '6B7385', line: 'E3E7EE', tint: 'F4F6FB', tintG: 'EEF7F1', red: 'C8553D', grn: '2E8B57', grn2: '3A9D6A', blu: '2B4C9B', blu2: '1F3A73', amber: 'D98E04' };
const C = { navy: '0B1F8F', navyD: '07124F', green: '1E8B3A', greenD: '17552F', brick: 'E34234', silver: 'C9CED6', silverL: 'EEF1F5', ink: '1C2333', gray: '5B6475', white: 'FFFFFF' };
const MAX_PICK = 5;
const state = { picked: [], plan: null, sigDataUrl: null, sigPx: 0, site: null };

/* ---------- 유틸 ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uniq = a => [...new Set(a.filter(Boolean))];
const pad = n => String(n).padStart(2, '0');
function kstNow() { const d = new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 540) * 60000); }
function parseD(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : kstNow(); }
const WK = ['日', '月', '火', '水', '木', '金', '土'];
const WKK = ['일', '월', '화', '수', '목', '금', '토'];
function fmtD(d) { return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}(${WKK[d.getDay()]})`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function b64ToU8(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function dataUrlB64(u) { return u.split(',')[1]; }
async function download(blob, name) {
  // 안드로이드 앱(APK, Capacitor): 파일을 만든 뒤 저장·보내기 창(근태관리 프로그램과 같은 방식)
  const P = window.Capacitor && window.Capacitor.Plugins;
  if (P && P.Filesystem) {
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
      const w = await P.Filesystem.writeFile({ path: name, data: b64, directory: 'CACHE' });
      if (P.Share) await P.Share.share({ title: name, files: [w.uri], dialogTitle: '파일 저장·보내기' });
      else toast('파일을 만들었습니다: ' + name);
      return;
    } catch (e) { if (e && /cancel/i.test(String(e.message || e))) return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), ms); }
function safeName(s) { return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40); }

/* ---------- 바닥글 서명: 실행일 날짜를 Dancing Script로 다시 그림 ---------- */
async function buildSignature(date) {
  const ff = new FontFace('DancingSig', `url(data:font/woff2;base64,${ASSET.dancing})`);
  try { await ff.load(); document.fonts.add(ff); } catch (e) { }
  const base = await loadImg(ASSET.sigBase);
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const txt = `${M[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const S = 4, cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  ctx.font = `${72 * S}px DancingSig`;
  const tw = ctx.measureText(txt).width / S;
  const W = Math.ceil(1389 + tw + 24), H = 210;
  cv.width = W * S; cv.height = H * S;
  ctx.drawImage(base, 0, 0, base.width * S, base.height * S);
  ctx.font = `${72 * S}px DancingSig`; ctx.fillStyle = '#8A1C34'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(txt, 1389 * S, 138 * S);
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(cv, 0, 0, W, H);
  state.sigDataUrl = out.toDataURL('image/png'); state.sigPx = W;
}
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

/* =====================================================================
 * 1) 화면 — 분류 트리 / 입력 / 추천
 * ===================================================================== */
function renderTree(filter = '') {
  const f = filter.trim();
  const box = $('#tree'); let h = '';
  TAX.forEach(L => {
    let lh = '';
    L.mids.forEach(M => {
      const smalls = M.smalls.filter(S => !f || (S.n + M.n + L.n + S.k.join(' ')).includes(f));
      if (!smalls.length) return;
      lh += `<details class="mid" ${f ? 'open' : ''}><summary><b>${M.c}</b> ${esc(M.n)} <i>${smalls.length}</i></summary><ul>` +
        smalls.map(S => `<li class="sm ${state.picked.includes(S.c) ? 'on' : ''}" data-c="${S.c}"><span class="sev s${S.s}">${SEV[S.s].label}</span><span class="nm">${esc(S.n)}</span><em>${S.c}</em></li>`).join('') + '</ul></details>';
    });
    if (lh) h += `<details class="big" ${f ? 'open' : ''}><summary><span class="ic">${L.e}</span><b>${L.c}.</b> ${esc(L.n)}</summary>${lh}</details>`;
  });
  box.innerHTML = h || '<p class="empty">검색 결과가 없습니다.</p>';
}
function findSmall(code) { for (const L of TAX) for (const M of L.mids) for (const S of M.smalls) if (S.c === code) return { L, M, S }; return null; }
function togglePick(code) {
  const i = state.picked.indexOf(code);
  if (i >= 0) state.picked.splice(i, 1);
  else { if (state.picked.length >= MAX_PICK) return toast(`Complaint 항목은 최대 ${MAX_PICK}개까지 선택할 수 있습니다.`); state.picked.push(code); }
  renderTree($('#q').value); renderPicked();
}
function renderPicked() {
  const box = $('#picked');
  if (!state.picked.length) { box.innerHTML = '<span class="hint">왼쪽 분류에서 소항목을 선택하거나, 내용을 입력한 뒤 [키워드 추천]을 누르세요.</span>'; $('#sevAuto').textContent = '-'; return; }
  box.innerHTML = state.picked.map(c => { const x = findSmall(c); return `<span class="chip s${x.S.s}" title="${esc(x.L.n + ' > ' + x.M.n)}">${x.S.c} ${esc(x.S.n)}<button data-x="${c}">×</button></span>`; }).join('');
  $('#sevAuto').textContent = SEV[autoSev()].label;
}
function autoSev() { const o = { S: 3, A: 2, B: 1 }; let best = 'B'; state.picked.forEach(c => { const s = findSmall(c).S.s; if (o[s] > o[best]) best = s; }); return best; }
function suggest() {
  const txt = ($('#f_content').value + ' ' + $('#f_demand').value + ' ' + $('#f_facts').value).toLowerCase();
  if (txt.trim().length < 2) return toast('Complaint 내용을 먼저 입력하세요.');
  const scored = kbFlatSmalls().map(x => ({ x, sc: x.S.k.reduce((a, k) => a + (txt.includes(k.toLowerCase()) ? (k.length >= 3 ? 2 : 1) : 0), 0) })).filter(o => o.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 8);
  const box = $('#sugg');
  if (!scored.length) { box.innerHTML = '<span class="hint">일치하는 항목이 없습니다. 분류 트리에서 직접 선택하세요.</span>'; return; }
  box.innerHTML = '<span class="lbl">추천</span>' + scored.map(o => `<button class="sg" data-c="${o.x.S.c}">${o.x.S.c} ${esc(o.x.S.n)} <small>${'●'.repeat(Math.min(3, o.sc))}</small></button>`).join('');
}

function readForm() {
  const g = id => ($('#' + id).value || '').trim();
  return {
    client: g('f_client'), site: g('f_site'), job: g('f_job'), recvDate: g('f_date'), occur: g('f_occur'), channel: g('f_channel'),
    raiser: g('f_raiser'), workers: g('f_workers'), author: g('f_author'), dept: g('f_dept') || APP.branch,
    content: g('f_content'), demand: g('f_demand'), facts: g('f_facts'),
    sev: g('f_sev') || autoSev(), mode: document.querySelector('input[name=mode]:checked').value,
    siteObj: state.site
  };
}

/* =====================================================================
 * 2) 대응방안 생성(Plan)
 * ===================================================================== */
function lines(s) { return String(s || '').split(/\n+/).map(x => x.replace(/^[\s\-•·○◦▪■□*]+/, '').trim()).filter(Boolean); }
function grpText(groups) { return groups.map(g => (g.title ? `■ ${g.title}\n` : '') + g.lines.map(l => `- ${l}`).join('\n')).join('\n\n'); }
function parseGrp(text) {
  const out = []; let cur = null;
  String(text || '').split('\n').forEach(raw => {
    const t = raw.trim(); if (!t) return;
    if (/^■/.test(t)) { cur = { title: t.replace(/^■\s*/, ''), lines: [] }; out.push(cur); return; }
    if (!cur) { cur = { title: '', lines: [] }; out.push(cur); }
    cur.lines.push(t.replace(/^[\-•·○◦▪*]\s*/, ''));
  });
  return out.filter(g => g.lines.length || g.title);
}
function buildPlan() {
  const f = readForm();
  if (!f.client) { toast('① 발생 사업장을 먼저 선택하세요(목록에 없으면 직접 입력).'); document.getElementById('siteCard').scrollIntoView({ behavior: 'smooth' }); return null; }
  if (!state.picked.length) { toast('Complaint 항목을 1개 이상 선택하세요.'); return null; }
  if (!f.content) { toast('Complaint 내용을 입력하세요.'); $('#f_content').focus(); return null; }
  const items = state.picked.map(findSmall);
  const multi = items.length > 1;
  const d0 = parseD(f.recvDate);
  const names = items.map(x => x.S.n);
  // 원인(4M) — 중분류 단위 병합
  const cats = ['인적', '절차', '설비', '관리'];
  const causeG = cats.map(cat => ({ title: cat + ' 요인' + ({ 인적: '(Man)', 절차: '(Method)', 설비: '(Machine·환경)', 관리: '(Management)' }[cat]), lines: uniq(items.flatMap(x => x.M.cause[cat] || [])) })).filter(g => g.lines.length);
  const grp = key => multi ? items.map(x => ({ title: `${x.S.c} ${x.S.n}`, lines: x.S[key] })) : [{ title: '', lines: items[0].S[key] }];
  const immG = [{ title: '공통 초동 조치', lines: COMMON.immediate }].concat(grp('i'));
  const factsG = [{ title: '', lines: lines(f.facts).length ? lines(f.facts) : ['(현장 확인 후 기재) 발생 일시·장소·관련자 및 경위', '(현장 확인 후 기재) CCTV·근무일지·출입기록 확인 결과'] }];
  const lawIds = uniq(items.flatMap(x => x.S.l));
  const discG = items.map(x => ({ title: `${x.S.c} ${x.S.n}`, lines: [x.S.d] }));
  const imm1 = items[0].S.i[0], prev = uniq(items.flatMap(x => x.S.p));
  const d7 = addDays(d0, 7), d30 = addDays(d0, 30);
  const raiser = f.raiser ? `${f.raiser}께서` : '귀사에서';
  const reply = [
    `귀사의 무궁한 발전을 기원합니다.`,
    `${fmtD(d0)} ${raiser} 지적하신 ${f.site ? f.site + ' ' : ''}「${names.join('」, 「')}」 관련 사항에 대하여 운영 책임사로서 깊이 사과드립니다.`,
    `당사는 접수 즉시 사실관계 확인에 착수하였으며, ${imm1.replace(/[.。]$/, '')} 등 임시 조치를 시행하였습니다.`,
    `아울러 개인의 문제에 그치지 않도록 ${causeG[1] ? causeG[1].lines[0].replace(/[.。]$/, '') : causeG[0].lines[0]} 등 구조적 원인을 개선하기 위해 ${prev.slice(0, 2).map(s => s.replace(/[.。]$/, '')).join(', ')}을(를) 추진하겠습니다.`,
    `개선 결과는 ${fmtD(d7)}까지 서면으로 보고드리고, ${fmtD(d30)}까지 재발 여부를 집중 관리하겠습니다. 다시 한번 심려를 끼쳐 드린 점 사과드립니다.`
  ].join('\n');
  const commits = uniq([items[0].S.i[0]].concat(items.map(x => x.S.sh[0]), prev.slice(0, 3))).slice(0, 6);
  const sev = f.sev;
  const st = f.siteObj;
  const summary = [
    `${st ? '[' + st.br + '지사] ' : ''}${f.client}${f.site ? ' ' + f.site : ''}에서 ${fmtD(d0)} 제기된 「${names.join('」·「')}」 Complaint에 대한 대응 방안`,
    `심각도 「${SEV[sev].label}」 — ${SEV[sev].desc}`,
    `즉시 조치: ${imm1}`,
    `재발방지: ${prev.slice(0, 2).join(' / ')}`,
    `일정: ${fmtD(d7)} 개선 결과 보고(D+7) → ${fmtD(d30)} 사후관리 종료(D+30)`
  ];
  const timeline = COMMON.timeline.map((t, i) => ({ ...t, date: fmtD(addDays(d0, [0, 1, 3, 7, 30][i])) }));
  const now = kstNow();
  const docNo = `STEC-CR-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return {
    f, items, sev, d0, docNo, made: now, names, site: st || null,
    summary: summary.join('\n'),
    facts: grpText(factsG), cause: grpText(causeG), imm: grpText(immG), short: grpText(grp('sh')), prev: grpText(grp('p')),
    disc: grpText(discG), reply, commits: commits.map(s => '- ' + s).join('\n'), follow: COMMON.followup.map(s => '- ' + s).join('\n'),
    lawIds, lawOn: Object.fromEntries(lawIds.map(id => [id, true])), timeline
  };
}

/* 편집 패널 */
const EDIT_FIELDS = [
  ['summary', '□ 주요 보고내용', 5], ['facts', 'Ⅱ. 사실관계 확인', 4], ['cause', 'Ⅲ. 원인 분석(4M)', 9],
  ['imm', 'Ⅳ-1. 즉시 조치(D+0)', 9], ['short', 'Ⅳ-2. 단기 개선(D+1~D+7)', 7], ['prev', 'Ⅳ-3. 재발방지 대책', 7],
  ['disc', 'Ⅵ. 근무자 조치 기준(내부 보고용에만 출력)', 5], ['commits', '고객사 약속사항(PPT)', 5], ['follow', '사후관리(D+30)', 3], ['reply', 'Ⅷ. 고객사 회신(안)', 7]
];
function renderEditor(p) {
  const L = p.lawIds.map(id => { const x = LAWS[id]; return `<label class="law"><input type="checkbox" data-law="${id}" ${p.lawOn[id] ? 'checked' : ''}> <b>${esc(x.law)} ${esc(x.art)}</b> ${esc(x.title)}<small>${esc(x.sum)}</small></label>`; }).join('');
  $('#editor').innerHTML = `<div class="ed-head"><div><b>${esc(p.f.client)}</b> · ${esc(p.names.join(', '))}</div><span class="sevbig s${p.sev}">${SEV[p.sev].label}</span></div>
   <p class="ed-tip">생성된 대응방안을 그대로 쓰거나 고쳐서 출력하세요. <b>■</b>로 시작하는 줄은 소제목, <b>-</b>로 시작하는 줄은 항목입니다.</p>` +
    EDIT_FIELDS.map(([k, t, r]) => `<div class="ed ${k === 'disc' && p.f.mode === 'client' ? 'muted' : ''}"><label>${t}</label><textarea data-k="${k}" rows="${r}">${esc(p[k])}</textarea></div>`).join('') +
    `<div class="ed"><label>Ⅴ. 법적 검토 — 출력할 법령 선택</label><div class="laws">${L}</div></div>`;
  $('#outPanel').classList.add('ready');
}
function syncEditor() {
  const p = state.plan; if (!p) return null;
  document.querySelectorAll('#editor textarea[data-k]').forEach(t => p[t.dataset.k] = t.value);
  document.querySelectorAll('#editor input[data-law]').forEach(c => p.lawOn[c.dataset.law] = c.checked);
  p.f.mode = document.querySelector('input[name=mode]:checked').value;
  return p;
}
function docTitle(p) { return p.f.mode === 'client' ? 'Complaint 대응 및 개선 계획서' : 'Complaint 대응 방안 보고서'; }
function fileBase(p) { const d = p.made; return `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${safeName(p.f.client)}_Complaint_대응방안${p.f.mode === 'client' ? '(제출용)' : '(내부)'}`; }

/* =====================================================================
 * 3) Word — docx 본문 생성 + stec-header-footer 머리글·바닥글 주입
 * ===================================================================== */
const W_FONT = { ascii: '맑은 고딕', eastAsia: '맑은 고딕', hAnsi: '맑은 고딕', cs: '맑은 고딕' };
const CW = 9638; // A4 본문폭(twips)
function R(text, o = {}) { return new docx.TextRun({ text, font: W_FONT, size: o.size || 20, bold: o.bold, color: o.color || C.ink, italics: o.it }); }
function P(children, o = {}) {
  return new docx.Paragraph({ children: Array.isArray(children) ? children : [children], alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 60, line: o.line || 288 },
    indent: o.indent, keepNext: o.keepNext, border: o.border, shading: o.shading });
}
function noB() { const n = { style: docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' }; return { top: n, bottom: n, left: n, right: n }; }
function bAll(color = 'B8C0CC', size = 4) { const b = { style: docx.BorderStyle.SINGLE, size, color }; return { top: b, bottom: b, left: b, right: b }; }
function cell(paras, o = {}) {
  return new docx.TableCell({ children: paras, width: { size: o.w, type: docx.WidthType.DXA }, columnSpan: o.span, verticalAlign: o.va || docx.VerticalAlign.CENTER,
    shading: o.fill ? { fill: o.fill, type: docx.ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 }, borders: o.borders || bAll() });
}
function table(rows, widths, o = {}) {
  return new docx.Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: docx.WidthType.DXA }, columnWidths: widths, rows: rows.map((r, i) => new docx.TableRow({ cantSplit: true, tableHeader: o.header && i === 0, children: r })) });
}
function H1(t) {
  return P([R(t, { size: 26, bold: true, color: C.navy })], { before: 280, after: 120, keepNext: true,
    border: { left: { style: docx.BorderStyle.SINGLE, size: 36, color: C.green, space: 8 }, bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: 'B8C0CC', space: 3 } } });
}
function H2(t) { return P([R('▶ ', { size: 21, bold: true, color: C.green }), R(t, { size: 21, bold: true, color: C.greenD })], { before: 160, after: 60, keepNext: true }); }
function bullets(groups, o = {}) {
  const out = [];
  groups.forEach(g => {
    if (g.title) out.push(P([R('■ ', { size: 20, color: C.navy, bold: true }), R(g.title, { size: 20, bold: true, color: C.navy })], { before: 80, after: 40, keepNext: true }));
    g.lines.forEach(l => out.push(P([R('○ ', { size: 20, color: C.green }), R(l, { size: 20 })], { indent: { left: 400, hanging: 260 }, after: 40 })));
  });
  return out;
}
function imgPara(src, wIn, caption, dims) {
  const d = dims || [16, 9], h = wIn * d[1] / d[0];
  const out = [new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, spacing: { before: 80, after: 30 }, keepNext: !!caption,
    children: [new docx.ImageRun({ type: 'jpg', data: b64ToU8(dataUrlB64(src)), transformation: { width: Math.round(wIn * 96), height: Math.round(h * 96) } })] })];
  if (caption) out.push(P([R(caption, { size: 16, color: C.gray, it: true })], { align: docx.AlignmentType.CENTER, after: 100 }));
  return out;
}
function boxPara(paras, fill = 'F2F7F3', color = C.green) {
  const b = { style: docx.BorderStyle.SINGLE, size: 12, color };
  return table([[cell(paras, { w: CW, fill, borders: { top: b, bottom: b, left: b, right: b } })]], [CW]);
}
function th(t, w) { return cell([P([R(t, { bold: true, color: C.white, size: 19 })], { align: docx.AlignmentType.CENTER, after: 0 })], { w, fill: C.navy }); }
function td(t, w, o = {}) { const ls = String(t).split('\n'); return cell(ls.map(x => P([R(x, { size: o.size || 19, bold: o.bold, color: o.color })], { align: o.align, after: 0 })), { w, fill: o.fill, va: o.va }); }

async function makeDocx(p) {
  const f = p.f, isClient = f.mode === 'client';
  const ch = [];
  // 제목
  ch.push(P([R(isClient ? '고객사 제출용' : '내부 보고용', { size: 18, bold: true, color: isClient ? C.green : C.brick })], { align: docx.AlignmentType.RIGHT, after: 40 }));
  ch.push(P([R(docTitle(p), { size: 40, bold: true, color: C.navy })], { align: docx.AlignmentType.CENTER, before: 120, after: 60 }));
  ch.push(P([R(`${f.client}${f.site ? ' · ' + f.site : ''}  |  ${p.names.join(' / ')}`, { size: 21, color: C.gray })], { align: docx.AlignmentType.CENTER, after: 80 }));
  ch.push(P([R(`문서번호 ${p.docNo}   ·   작성일 ${fmtD(p.made)}   ·   작성 ${f.dept}${f.author ? ' ' + f.author : ''}`, { size: 17, color: C.gray })],
    { align: docx.AlignmentType.CENTER, after: 200, border: { bottom: { style: docx.BorderStyle.DOUBLE, size: 6, color: C.navy, space: 6 } } }));
  // 주요 보고내용
  ch.push(boxPara([P([R('□ 주요 보고내용', { size: 22, bold: true, color: C.greenD })], { after: 80 })]
    .concat(lines(p.summary).map(l => P([R('· ', { bold: true, color: C.green }), R(l, { size: 20 })], { indent: { left: 240, hanging: 200 }, after: 30 })))));
  // Ⅰ 개요
  ch.push(H1('Ⅰ. Complaint 접수 개요'));
  const kv = [['고객사', f.client, '발생 장소', f.site || '-'], ['업종', f.job || '-', '접수 경로', f.channel || '-'], ['접수일', fmtD(p.d0), '발생 일시', f.occur || '-'], ['제기자', f.raiser || '-', '관련 근무자', f.workers || '-']];
  ch.push(table(kv.map(r => [td(r[0], 1500, { fill: C.silverL, bold: true, align: docx.AlignmentType.CENTER }), td(r[1], 3319), td(r[2], 1500, { fill: C.silverL, bold: true, align: docx.AlignmentType.CENTER }), td(r[3], 3319)]), [1500, 3319, 1500, 3319]));
  ch.push(P([R('')], { after: 60 }));
  if (p.site) {
    const s2 = p.site, w4 = [1500, 3319, 1500, 3319];
    ch.push(H2('발생 사업장 정보 (에스텍베스트 사업장 목록 기준)'));
    const rows = [['사업장명', s2.name, '관할 지사', s2.br + '지사'], ['주소', s2.addr || '-', null, null], ['계약일', s2.since || '-', '사업장 유형', s2.type || '-'],
      ['계약 업종', s2.work || '-', '근무형태', s2.shift || '-'], ['계약 인원', `총 ${s2.total}명 (남 ${s2.m} · 여 ${s2.f})`, '업종별 인원', `보안 ${s2.sec} · 미화 ${s2.cln} · 기타 ${s2.etc}`],
      ['현장 책임자', [s2.pos, s2.mgr].filter(Boolean).join(' ') + (s2.mtel ? ` (${s2.mtel})` : '') || '-', '사업장 전화', s2.stel || '-']];
    if (s2.note) rows.push(['비고', s2.note, null, null]);
    const fk = figName('dio', jobKey(p));
    const lab = t => td(t, 1500, { fill: 'E8F5EC', bold: true, align: docx.AlignmentType.CENTER, color: C.greenD });
    const w5 = [1300, 2550, 1300, 2550, 1938];
    const imgCell = new docx.TableCell({ rowSpan: rows.length, width: { size: w5[4], type: docx.WidthType.DXA }, verticalAlign: docx.VerticalAlign.CENTER, borders: bAll(), margins: { top: 60, bottom: 60, left: 60, right: 60 },
      children: [new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: [new docx.ImageRun({ type: 'jpg', data: b64ToU8(dataUrlB64(ASSET.fig[fk])), transformation: { width: 112, height: Math.round(112 * ASSET.figDim[fk][1] / ASSET.figDim[fk][0]) } })] }),
        P([R(`${JOB_NAME[jobKey(p)]} 현장`, { size: 15, color: C.gray })], { align: docx.AlignmentType.CENTER, after: 0 })] });
    const lab5 = t => td(t, 1300, { fill: 'E8F5EC', bold: true, align: docx.AlignmentType.CENTER, color: C.greenD });
    ch.push(new docx.Table({ width: { size: 9638, type: docx.WidthType.DXA }, columnWidths: w5, rows: rows.map((r, i) => new docx.TableRow({ cantSplit: true, children:
      (r[2] === null ? [lab5(r[0]), cell([P([R(r[1], { size: 19 })], { after: 0 })], { w: 6400, span: 3 })] : [lab5(r[0]), td(r[1], 2550), lab5(r[2]), td(r[3], 2550)])
        .concat(i === 0 ? [imgCell] : []) })) }));
    ch.push(P([R('')], { after: 60 }));
  }
  const cw2 = [2000, 2600, 3638, 1400];
  ch.push(table([[th('대분류', cw2[0]), th('중분류', cw2[1]), th('소분류(Complaint 항목)', cw2[2]), th('심각도', cw2[3])]].concat(
    p.items.map(x => [td(`${x.L.c}. ${x.L.n}`, cw2[0]), td(`${x.M.c} ${x.M.n}`, cw2[1]), td(`${x.S.c} ${x.S.n}`, cw2[2], { bold: true }), td(SEV[x.S.s].label, cw2[3], { align: docx.AlignmentType.CENTER, bold: true, color: SEV[x.S.s].color })])), cw2, { header: true }));
  // Ⅱ 내용·사실관계
  ch.push(H1('Ⅱ. Complaint 내용 및 사실관계'));
  ch.push(H2('고객사 제기 내용'));
  ch.push(boxPara(lines(f.content).map(l => P([R(l, { size: 20 })], { after: 30 })), 'F4F6FA', C.navy));
  if (f.demand) { ch.push(H2('고객사 요구사항')); ch.push(...bullets([{ title: '', lines: lines(f.demand) }])); }
  ch.push(H2('사실관계 확인'));
  ch.push(...bullets(parseGrp(p.facts)));
  // Ⅲ 원인
  ch.push(H1('Ⅲ. 원인 분석 (4M)'));
  ch.push(P([R('개인의 과실에 앞서 절차·기록·물리적 통제의 구조적 공백을 먼저 확인하였습니다.', { size: 19, color: C.gray, it: true })], { after: 80 }));
  const cg = parseGrp(p.cause);
  ch.push(table([[th('구분', 2400), th('원인', 7238)]].concat(cg.map(g => [td(g.title || '-', 2400, { fill: C.silverL, bold: true, color: C.navy }), td(g.lines.map(l => '· ' + l).join('\n'), 7238)])), [2400, 7238], { header: true }));
  // Ⅳ 대응방안
  ch.push(H1('Ⅳ. 대응 방안'));
  ch.push(H2('1. 즉시 조치 (D+0)')); ch.push(...bullets(parseGrp(p.imm)));
  ch.push(H2('2. 단기 개선 (D+1 ~ D+7)')); ch.push(...bullets(parseGrp(p.short)));
  { const v = VIDEO_OF[jobKey(p)]; ch.push(...imgPara(ASSET.poster[v], 3.6, `▶ 현장 재교육 자료: ${VIDEO_TITLE[v]} (고객사 대응 PPT에서 재생)`, [16, 9])); }
  ch.push(H2('3. 재발방지 대책 (구조 개선)')); ch.push(...bullets(parseGrp(p.prev)));
  // Ⅴ 법적 검토
  ch.push(H1('Ⅴ. 법적 검토'));
  const laws = p.lawIds.filter(id => p.lawOn[id]).map(id => LAWS[id]);
  const lw = [1900, 2000, 5738];
  ch.push(table([[th('법령', lw[0]), th('조항', lw[1]), th('주요 내용 및 적용', lw[2])]].concat(laws.map(x => [td(x.law, lw[0], { bold: true, color: C.navy }), td(`${x.art}\n${x.title}`, lw[1], { size: 17, align: docx.AlignmentType.CENTER }), td(x.sum, lw[2], { size: 18 })])), lw, { header: true }));
  ch.push(H2('대응 원칙'));
  ch.push(...bullets([{ title: '', lines: isClient ? COMMON.principles.slice(0, 3) : COMMON.principles }]));
  // Ⅵ 근무자 조치 (내부)
  let n = 6;
  const roman = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ'];
  if (!isClient) {
    ch.push(H1(`${roman[n++]}. 근무자 조치 기준 (내부)`));
    ch.push(boxPara([P([R('3대 중대위반: ', { bold: true, color: C.brick }), R(COMMON.majorViolations.join(' · ') + ' — 위반 시 자동 중징계 검토', { size: 19 })], { after: 30 }),
      P([R('징계는 취업규칙 근거 + 사실 확인(경위서·증빙) + 소명 기회 부여 + 서면 통지의 절차를 반드시 거칠 것.', { size: 18, color: C.gray })], { after: 0 })], 'FDF1EF', C.brick));
    ch.push(...bullets(parseGrp(p.disc)));
  }
  // 일정
  ch.push(H1(`${roman[n++]}. 실행 일정 및 사후관리`));
  const tw = [1100, 1900, 2300, 4338];
  ch.push(table([[th('단계', tw[0]), th('일자', tw[1]), th('구분', tw[2]), th('주요 내용', tw[3])]].concat(p.timeline.map((t, i) => [td(t.d, tw[0], { bold: true, align: docx.AlignmentType.CENTER, color: C.white, fill: i === 0 ? C.brick : (i === 4 ? C.greenD : C.green) }), td(t.date, tw[1], { align: docx.AlignmentType.CENTER }), td(t.t, tw[2], { bold: true }), td(t.a, tw[3])])), tw, { header: true }));
  ch.push(H2('사후관리')); ch.push(...bullets(parseGrp(p.follow)));
  // 회신
  ch.push(H1(`${roman[n++]}. 고객사 회신(안)`));
  ch.push(boxPara(lines(p.reply).map(l => P([R(l, { size: 20 })], { after: 60, line: 300 })).concat([P([R(`${f.dept} 드림`, { size: 20, bold: true })], { align: docx.AlignmentType.RIGHT, before: 60, after: 0 })]), 'FFFFFF', C.navy));
  ch.push(...imgPara(ASSET.fig.team, 2.3, 'The Best Choice, S-Tec — 에스텍 그룹이 약속드립니다', ASSET.figDim.team));
  ch.push(P([R('- 끝 -', { size: 20, bold: true })], { align: docx.AlignmentType.CENTER, before: 200, after: 120 }));
  ch.push(P([R(`※ 법령 요약은 실무 참고용입니다. 적용 전 국가법령정보센터(law.go.kr) 원문 및 노무 자문으로 확인하십시오.  |  ${APP.name} ${APP.version}`, { size: 15, color: '8A93A3' })], { align: docx.AlignmentType.CENTER }));

  return await packDocx(ch, docTitle(p));
}
async function packDocx(ch, title) {
  const doc = new docx.Document({
    creator: APP.maker, title, description: `${APP.name} ${APP.version}`,
    styles: { default: { document: { run: { font: W_FONT, size: 20 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1850, bottom: 1831, left: 1134, right: 1134, header: 1020, footer: 973 } } }, children: ch }]
  });
  const blob = await docx.Packer.toBlob(doc);
  return await applyHeaderFooter(blob);
}

/* stec-header-footer 스킬(apply_header_footer.py)과 동일한 주입 로직 — JS 이식판 */
async function applyHeaderFooter(blob) {
  const zip = await JSZip.loadAsync(blob);
  const EMU_PER_PX = 2520000 / 1860; // 원본 서명 1860px = 2520000 EMU
  const cx = Math.round(state.sigPx * EMU_PER_PX);
  let ftr = HF_FOOTER_XML.replace(/cx="2520000"/g, `cx="${cx}"`);
  zip.file('word/stecHeader.xml', HF_HEADER_XML);
  zip.file('word/stecFooter.xml', ftr);
  zip.file('word/media/stec-header-thebestchoice.png', b64ToU8(dataUrlB64(ASSET.headerTbc)));
  zip.file('word/media/stec-footer-signature.png', b64ToU8(dataUrlB64(state.sigDataUrl)));
  const rel = (id, t) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${t}"/></Relationships>`;
  zip.file('word/_rels/stecHeader.xml.rels', rel('rId1', 'media/stec-header-thebestchoice.png'));
  zip.file('word/_rels/stecFooter.xml.rels', rel('rId2', 'media/stec-footer-signature.png'));
  let ct = await zip.file('[Content_Types].xml').async('string');
  if (!/Extension="png"/i.test(ct)) ct = ct.replace(/(<Types[^>]*>)/, '$1<Default Extension="png" ContentType="image/png"/>');
  [['stecHeader.xml', 'header'], ['stecFooter.xml', 'footer']].forEach(([pt, k]) => { const ov = `<Override PartName="/word/${pt}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${k}+xml"/>`; if (!ct.includes(ov)) ct = ct.replace('</Types>', ov + '</Types>'); });
  zip.file('[Content_Types].xml', ct);
  let rl = await zip.file('word/_rels/document.xml.rels').async('string');
  rl = rl.replace('</Relationships>', '<Relationship Id="rIdStecHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="stecHeader.xml"/><Relationship Id="rIdStecFtr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="stecFooter.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', rl);
  let d = await zip.file('word/document.xml').async('string');
  const refs = ['default', 'first', 'even'].map(t => `<w:headerReference w:type="${t}" r:id="rIdStecHdr"/><w:footerReference w:type="${t}" r:id="rIdStecFtr"/>`).join('');
  d = d.replace(/<w:sectPr[^>]*>[\s\S]*?<\/w:sectPr>|<w:sectPr[^>]*\/>/g, s => {
    s = s.replace(/<w:(header|footer)Reference[^>]*\/>/g, '');
    if (/\/>$/.test(s) && !/<\/w:sectPr>/.test(s)) s = s.replace(/\/>$/, '>') + '</w:sectPr>';
    return s.replace(/(<w:sectPr[^>]*>)/, '$1' + refs);
  });
  if (!/xmlns:r=/.test(d.slice(0, 2000))) d = d.replace('<w:document ', '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
  zip.file('word/document.xml', d);
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}

/* =====================================================================
 * 4) 슬라이드 모델 — 하나의 모델을 PPT(pptxgenjs)와 PDF(html2canvas)로 동시 렌더
 *    13.333 × 7.5 in (16:9), 96 px/in
 * ===================================================================== */
const SW = 13.333, SH = 7.5, DPI = 96, PT = 96 / 72;
const SFONT = "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR','Noto Sans CJK KR',sans-serif";
const MCTX = document.createElement('canvas').getContext('2d');
function wrapCount(text, px, maxW, bold) {
  MCTX.font = `${bold ? '700 ' : '400 '}${px}px ${SFONT}`;
  let n = 0;
  String(text).split('\n').forEach(seg => {
    const words = seg.split(/(\s+)/); let line = ''; n++;
    words.forEach(w => {
      const t = line + w;
      if (MCTX.measureText(t).width <= maxW || !line.trim()) {
        if (MCTX.measureText(t).width > maxW) { // 긴 단어 글자 단위 분할
          let cur = line; for (const ch of w) { if (MCTX.measureText(cur + ch).width > maxW && cur) { n++; cur = ch; } else cur += ch; } line = cur;
        } else line = t;
      } else { n++; line = w.trimStart(); }
    });
  });
  return n;
}
/* paras: [{text,bold,color,size(배수),indent(in)}] */
function fit(paras, w, h, maxPt, minPt = 9, lh = 1.22, gapPt = 3) {
  for (let pt = maxPt; pt >= minPt; pt -= 0.5) {
    let H = 0;
    paras.forEach((p, i) => { const s = pt * (p.size || 1); const n = wrapCount(p.text, s * PT, (w - (p.indent || 0)) * DPI * 0.93, p.bold); H += n * s * PT * lh + (i < paras.length - 1 ? (p.gap ?? gapPt) * PT : 0); });
    if (H <= h * DPI * 0.97) return { pt, ok: true };
  }
  return { pt: minPt, ok: false };
}
function T(x, y, w, h, paras, o = {}) {
  if (typeof paras === 'string') paras = [{ text: paras }];
  const r = o.pt ? { pt: o.pt, ok: true } : fit(paras, w, h, o.max || 16, o.min || 9, o.lh || 1.22, o.gap ?? 3);
  return { t: 'text', x, y, w, h, paras, pt: r.pt, ok: r.ok, color: o.color || C.ink, bold: o.bold, align: o.align || 'left', valign: o.valign || 'top', lh: o.lh || 1.22, gap: o.gap ?? 3, font: o.font };
}
const Rc = (x, y, w, h, fill, o = {}) => ({ t: 'shape', k: o.k || 'rect', x, y, w, h, fill, line: o.line, lw: o.lw, alpha: o.alpha });
const Im = (x, y, w, h, src) => ({ t: 'img', x, y, w, h, src });

function gradient(w, h, stops, dir = 'h') {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const gr = dir === 'h' ? g.createLinearGradient(0, 0, w, 0) : dir === 'd' ? g.createLinearGradient(0, 0, w, h) : g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); return cv.toDataURL('image/png');
}
let GR = null;
function grads() {
  if (GR) return GR;
  GR = {
    navy: gradient(640, 360, [[0, '#0E2AA8'], [0.55, '#0B1F8F'], [1, '#050C3E']], 'd'),
    silver: gradient(400, 40, [[0, '#F7F8FA'], [0.5, '#E3E7EC'], [1, '#C9CED6']], 'h'),
    silverV: gradient(40, 400, [[0, '#FFFFFF'], [0.6, '#F1F3F6'], [1, '#DDE2E8']], 'v'),
    green: gradient(400, 40, [[0, '#2BA24A'], [1, '#17552F']], 'h'),
    fade: gradient(600, 20, [[0, 'rgba(30,139,58,1)'], [1, 'rgba(30,139,58,0)']], 'h'),
    fadeN: gradient(600, 20, [[0, 'rgba(11,31,143,1)'], [1, 'rgba(11,31,143,0)']], 'h')
  };
  return GR;
}

/* 공통 프레임: 상단 제목바 + 하단 바 */
/* ---------- 현장 사진·영상 (★ Project Resources) ---------- */
const VIDEO_OF = { sec: 'sec1', cln: 'cln', prk: 'prk', fac: 'fac', info: 'off', grd: 'grd', san: 'san1', spc: 'spc', off: 'off2' };
const JOB_NAME = { sec: '보안', cln: '미화', prk: '주차', fac: '시설관리', info: '안내', grd: '경호', san: '소독방역', spc: '특수직군', off: '사무관리' };
const VIDEO_TITLE = { sec1: '보안근무 영상', cln: '미화근무 영상', prk: '주차근무 영상', fac: '시설근무 영상', off2: '사무관리 영상', grd: '경호근무 영상', san1: '세니텍(소독방역) 근무 영상', spc: '특수직군 근무 영상' };
function jobKey(p) {
  const t = ((p.site && p.site.work) || '') + ' ' + (p.f.job || '');
  const order = [['경호', 'grd'], ['소독', 'san'], ['방역', 'san'], ['미화', 'cln'], ['주차', 'prk'], ['시설', 'fac'], ['안내', 'info'], ['특수', 'spc'], ['조리', 'off'], ['사무', 'off'], ['보안', 'sec'], ['경비', 'sec']];
  const L = p.items[0].L.c, M = p.items[0].M.c;
  const byCat = L === 'E' ? 'cln' : M === 'F1' ? 'prk' : M === 'F2' ? 'fac' : (['A', 'B', 'C', 'D'].includes(L) ? 'sec' : null);
  const found = order.filter(([w]) => t.includes(w)).map(x => x[1]);
  if (byCat && found.includes(byCat)) return byCat;
  return found[0] || byCat || 'off';
}
function figName(kind, key) { const alt = { grd: 'sec', spc: 'fac', san: 'fac' }; return ASSET.fig[kind + '_' + key] ? kind + '_' + key : kind + '_' + (alt[key] || 'sec'); }
function figBox(name, x, y, maxW, maxH, align) {
  const d = ASSET.figDim[name] || [600, 760]; const r = Math.min(maxW / d[0], maxH / d[1]); const w = d[0] * r, h = d[1] * r;
  return Im(align === 'left' ? x : x + (maxW - w) / 2, y + (maxH - h) / 2, w, h, ASSET.fig[name]);
}
const Vd = (x, y, w, h, key) => ({ t: 'video', x, y, w, h, key, src: ASSET.poster[key] });
async function fetchVideo(k) {
  for (const u of ['media/videos/' + k + '.mp4', APP.shareUrl + 'media/videos/' + k + '.mp4']) {
    try { const r = await fetch(u); if (r.ok) { const b = await r.blob(); if (b.size > 10000) return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(b); }); } } catch (e) { }
  }
  return null;
}
async function toPng(u) { const im = await loadImg(u); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/png'); }
/* 현장 재교육 영상 슬라이드 (공통) */
function videoSlide(p, no, title, sub, foot, points, key) {
  const v = VIDEO_OF[key] || 'sec1', o = frame(title, sub, no, p, foot);
  o.push(Rc(0.6, 1.62, 7.5, 4.3, '0F1530'));
  o.push(Vd(0.65, 1.67, 7.4, 4.2, v));
  o.push(T(0.6, 6.0, 7.5, 0.35, `▶ ${VIDEO_TITLE[v] || '현장 근무 영상'} — PPT 파일에서 바로 재생됩니다 (PDF는 대표 장면)`, { pt: 10.5, color: K.mute }));
  o.push(Rc(8.35, 1.62, 4.4, 4.75, 'FAFBFC', { line: K.line })); o.push(Rc(8.35, 1.62, 4.4, 0.06, C.green));
  o.push(figBox(figName('cute', key), 8.5, 1.8, 1.35, 1.75));
  o.push(T(9.95, 1.85, 2.7, 1.6, [{ text: '현장 재교육', bold: true, color: C.greenD }, { text: `${JOB_NAME[key] || ''} 근무 기준`, size: 0.85, color: K.ink, bold: true }, { text: '교육 후 전 근무자 서명 · 사진 기록', size: 0.75, color: K.mute }], { max: 15, min: 9, gap: 3 }));
  o.push(Rc(8.6, 3.62, 3.9, 0.012, K.line));
  o.push(T(8.6, 3.72, 3.95, 2.55, points.slice(0, 5).map(t => ({ text: '•  ' + t })), { max: 12, min: 8.5 }));
  return o;
}
function frame(title, sub, no, p, foot) {
  const E = [];
  E.push(Rc(0, 0, SW, SH, C.white));
  E.push(Rc(0, 0, 0.12, SH, K.ink));                       // 좌측 얇은 세로 띠
  E.push(Rc(0.12, 0, 0.05, SH, C.green));
  [0, 1, 2].forEach(i => E.push(Rc(0.62 - i * 0.05, 0.42 + i * 0.13, 0.42 + i * 0.04, 0.08, i === 1 ? K.grn2 : C.green, { k: 'para' })));
  E.push(T(1.3, 0.3, 9.4, 0.6, [{ text: title, bold: true }], { pt: 24, color: K.ink, valign: 'middle' }));
  if (sub) E.push(T(1.3, 0.86, 9.6, 0.3, sub, { pt: 11.5, color: K.mute }));
  E.push(Im(SW - 1.95, 0.36, 1.45, 1.45 * 340 / 900, ASSET.logo));
  E.push(Rc(0.6, 1.3, 1.1, 0.04, C.green));
  E.push(Rc(1.7, 1.315, SW - 2.2, 0.012, K.line));
  // 하단: 가는 선 + 회색 문구 + 쪽번호
  E.push(Rc(0.6, SH - 0.48, SW - 1.1, 0.012, K.line));
  E.push(T(0.6, SH - 0.44, 8.5, 0.32, foot || `${APP.org} · ${p.f.client} ${docTitle(p)}`, { pt: 9.5, color: '8A93A3', valign: 'middle' }));
  E.push(Rc(SW - 0.95, SH - 0.36, 0.1, 0.1, C.green));
  E.push(T(SW - 0.82, SH - 0.44, 0.4, 0.32, String(no).padStart(2, '0'), { pt: 11, color: K.ink, bold: true, valign: 'middle' }));
  return E;
}
/* 세련된 표지(공통) */
function coverSlide(o) {
  const c = [];
  c.push(Rc(0, 0, SW, SH, C.white));
  c.push(Rc(7.75, 0, SW - 7.75, SH, 'F3F5F8'));
  c.push(Rc(7.75, 0, 0.04, SH, K.line));
  if (o.fig) c.push(figBox(o.fig, 8.1, 0.55, 4.95, 5.55)); else c.push(Im(8.45, 0.95, 4.2, 4.2 * (o.ratio || 1046 / 1024), o.img || ASSET.cube));
  c.push(Rc(0, 0, 0.12, SH, K.ink)); c.push(Rc(0.12, 0, 0.05, SH, C.green));
  c.push(Im(0.85, 0.75, 2.1, 2.1 * 340 / 900, ASSET.logo));
  c.push(Rc(0.85, 2.55, 0.5, 0.05, C.green));
  c.push(T(0.85, 2.7, 6.6, 0.4, o.eyebrow, { pt: 13, color: C.green, bold: true }));
  c.push(T(0.85, 3.1, 6.7, 1.25, [{ text: o.title, bold: true }], { max: 36, min: 24, color: K.ink, lh: 1.15 }));
  c.push(T(0.85, 4.45, 6.6, 0.95, o.lines.map((t, i) => ({ text: t, size: i ? 0.8 : 1, color: i ? K.mute : '3A4366', bold: !i })), { max: 17, min: 10.5, gap: 4 }));
  c.push(Rc(0.85, 5.65, 6.4, 0.012, K.line));
  c.push(T(0.85, 5.75, 6.6, 0.4, o.meta, { pt: 10.5, color: K.mute }));
  if (o.badge) { c.push(Rc(0.85, 6.3, 1.7, 0.36, o.badgeColor || K.ink, { k: 'para' })); c.push(T(0.85, 6.3, 1.7, 0.36, o.badge, { pt: 10.5, bold: true, color: C.white, align: 'center', valign: 'middle' })); }
  c.push(sigEl(SW - 4.25, SH - 0.62, 0.4));
  return c;
}
/* 맺음(공통) */
function closingSlide(o) {
  const e = [];
  e.push(Rc(0, 0, SW, SH, C.white));
  e.push(Rc(0, SH - 1.15, SW, 1.15, 'F3F5F8'));
  e.push(Rc(0, 0, 0.12, SH, K.ink)); e.push(Rc(0.12, 0, 0.05, SH, C.green));
  e.push(Im(0.75, 0.55, 1.75, 1.75 * 340 / 900, ASSET.logo));
  e.push(figBox(o.fig || 'team', SW / 2 - 2.6, 0.75, 5.2, 3.3));
  e.push(T(1, 4.15, SW - 2, 0.6, [{ text: 'The Best Choice, S-Tec', bold: true }], { pt: 28, color: K.ink, align: 'center' }));
  e.push(T(1, 4.75, SW - 2, 0.42, o.tag, { pt: 13.5, color: K.mute, align: 'center' }));
  e.push(Rc(SW / 2 - 0.6, 5.3, 1.2, 0.04, C.green));
  e.push(T(1, 5.4, SW - 2, 0.36, o.org, { pt: 11, color: K.mute, align: 'center' }));
  e.push(Im(0.85, SH - 0.88, 1.5, 1.5 * 53 / 127, ASSET.sanitec));
  e.push(sigEl(SW - 4.25, SH - 0.7, 0.4));
  return e;
}
function sigEl(x, y, h) { return Im(x, y, h * state.sigPx / 210, h, state.sigDataUrl); }
function listParas(groups, o = {}) {
  const out = [];
  groups.forEach((g, gi) => {
    if (g.title) out.push({ text: g.title, bold: true, color: o.hcolor || C.navy, gap: 2 });
    g.lines.forEach((l, i) => out.push({ text: `•  ${l}`, indent: 0, color: C.ink, gap: (i === g.lines.length - 1 && gi < groups.length - 1) ? 7 : 3 }));
  });
  return out;
}
/* 문단을 여러 장으로 분할 */
function paginate(paras, w, h, minPt = 12) {
  const pages = []; let cur = [];
  paras.forEach(p => { const test = cur.concat([p]); if (cur.length && !fit(test, w, h, minPt, minPt).ok) { pages.push(cur); cur = p.bold ? [p] : [p]; } else cur = test; });
  if (cur.length) pages.push(cur);
  return pages;
}

function buildSlides(p) {
  const f = p.f, isClient = f.mode === 'client', S = [], g = grads();
  let no = 1;
  /* 1. 표지 */
  S.push(coverSlide({ eyebrow: `${APP.org}  ·  ${isClient ? '고객사 제출용' : '내부 보고용'}`, title: docTitle(p),
    lines: [`${f.client}${f.site ? ' · ' + f.site : ''}`, p.names.join(' / ')], meta: `${fmtD(p.made)}   |   ${f.dept}${f.author ? ' ' + f.author : ''}   |   ${p.docNo}`,
    badge: `심각도 ${SEV[p.sev].label}`, badgeColor: SEV[p.sev].color, fig: figName('dio', jobKey(p)) })); no++;

  /* 2. 목차 */
  const toc = [p.site ? 'Complaint 접수 개요 · 발생 사업장' : 'Complaint 접수 개요', '제기 내용 및 사실관계', '원인 분석 (4M)', '대응 방안 로드맵', '법적 검토'].concat(isClient ? [] : ['근무자 조치 기준']).concat(['실행 일정 및 사후관리', '고객사 약속사항']);
  const t2 = frame('목차', 'CONTENTS', no, p);
  const colN = Math.ceil(toc.length / 2);
  toc.forEach((t, i) => {
    const col = i < colN ? 0 : 1, row = col ? i - colN : i, x = 1.2 + col * 5.9, y = 1.95 + row * 1.12;
    t2.push(Rc(x, y, 0.95, 0.72, i % 2 ? K.tint : K.tintG, { k: 'para' }));
    t2.push(T(x, y, 0.95, 0.72, String(i + 1).padStart(2, '0'), { pt: 22, bold: true, color: i % 2 ? K.navy : C.green, align: 'center', valign: 'middle' }));
    t2.push(T(x + 1.15, y, 4.4, 0.72, [{ text: t, bold: true }], { pt: 19, color: C.ink, valign: 'middle' }));
    t2.push(Rc(x + 1.15, y + 0.74, 4.3, 0.015, C.silver));
  });
  S.push(t2); no++;

  /* 3. 개요 */
  const o3 = frame('01  Complaint 접수 개요', '접수 정보와 분류·심각도', no, p);
  const kv = [['고객사', f.client], ['발생 장소', f.site || '-'], ['업종', f.job || '-'], ['접수일', fmtD(p.d0)], ['발생 일시', f.occur || '-'], ['접수 경로', f.channel || '-'], ['제기자', f.raiser || '-'], ['관련 근무자', f.workers || '-']];
  kv.forEach((r, i) => {
    const y = 1.7 + i * 0.6;
    o3.push(Rc(0.6, y, 1.7, 0.52, K.tint));
    o3.push(T(0.6, y, 1.7, 0.52, r[0], { pt: 12.5, bold: true, color: K.navy, align: 'center', valign: 'middle' }));
    o3.push(Rc(2.3, y, 4.4, 0.52, C.white, { line: K.line }));
    o3.push(T(2.45, y, 4.15, 0.52, r[1], { max: 13, min: 9, valign: 'middle' }));
  });
  o3.push(Rc(7.1, 1.7, 5.65, 4.72, 'FAFBFC', { line: K.line }));
  o3.push(Rc(7.1, 1.7, 5.65, 0.08, C.green));
  o3.push(T(7.35, 1.9, 3.2, 0.4, [{ text: '심각도', bold: true }], { pt: 14, color: C.gray }));
  o3.push(Rc(10.35, 1.88, 2.15, 0.62, SEV[p.sev].color, { k: 'para' }));
  o3.push(T(10.35, 1.88, 2.15, 0.62, [{ text: SEV[p.sev].label, bold: true }], { pt: 20, color: C.white, align: 'center', valign: 'middle' }));
  o3.push(T(7.35, 2.6, 5.2, 0.4, SEV[p.sev].desc, { max: 12, min: 9, color: C.gray }));
  const ih = Math.min(0.9, 3.25 / p.items.length);
  p.items.forEach((x, i) => {
    const y = 3.1 + i * ih;
    o3.push(Rc(7.35, y, 0.12, ih - 0.12, SEV[x.S.s].color));
    o3.push(T(7.6, y, 4.95, ih - 0.08, [{ text: `${x.S.c}  ${x.S.n}`, bold: true }, { text: `${x.L.n} › ${x.M.n}`, size: 0.82, color: C.gray }], { max: 15, min: 9, gap: 1 }));
  });
  S.push(o3); no++;

  /* 3-1. 발생 사업장 현황 (사업장 목록 기준) */
  if (p.site) {
    const st = p.site, o = frame('01  발생 사업장 현황', `에스텍베스트 사업장 목록 기준 · ${st.br}지사 관할`, no, p);
    o.push(Rc(0.6, 1.7, 7.2, 4.72, C.white, { line: K.line }));
    o.push(Rc(0.6, 1.7, 7.2, 1.05, K.tint)); o.push(Rc(0.6, 1.7, 0.07, 1.05, C.green));
    o.push(Rc(0.85, 1.88, 1.25, 0.42, C.green, { k: 'para' }));
    o.push(T(0.85, 1.88, 1.25, 0.42, st.br + '지사', { pt: 12.5, bold: true, color: C.white, align: 'center', valign: 'middle' }));
    o.push(T(2.25, 1.78, 5.4, 0.9, [{ text: st.name, bold: true }], { max: 24, min: 14, color: K.ink, valign: 'middle' }));
    const kv2 = [['주소', st.addr || '-'], ['계약일', st.since || '-'], ['사업장 유형', st.type || '-'], ['계약 업종', st.work || '-'], ['근무형태', st.shift || '-'],
      ['현장 책임자', ([st.pos, st.mgr].filter(Boolean).join(' ') || '-') + (st.mtel ? `  ${st.mtel}` : '')], ['사업장 전화', st.stel || '-']];
    kv2.forEach((r, i) => {
      const y = 2.92 + i * 0.49;
      o.push(T(0.85, y, 1.55, 0.44, r[0], { pt: 12.5, bold: true, color: C.greenD, valign: 'middle' }));
      o.push(T(2.45, y, 5.2, 0.44, r[1], { max: 13, min: 9, valign: 'middle' }));
      if (i < kv2.length - 1) o.push(Rc(0.85, y + 0.46, 6.75, 0.012, 'E3E7ED'));
    });
    // 인원 구성
    o.push(Rc(8.05, 1.7, 4.7, 4.72, 'FAFBFC', { line: K.line }));
    o.push(T(8.3, 1.8, 4.2, 0.4, [{ text: '계약 인원 구성', bold: true }], { pt: 15, color: C.navy }));
    o.push(T(8.3, 2.2, 2.2, 0.9, [{ text: String(st.total || 0), bold: true }], { pt: 46, color: C.navy }));
    o.push(T(9.75, 2.55, 1.3, 0.45, '명 (총원)', { pt: 14, color: C.gray }));
    o.push(figBox(figName('cute', jobKey(p)), 11.05, 1.75, 1.6, 1.7));
    const bar = (y, label, val, tot, col) => {
      o.push(T(8.3, y, 1.0, 0.36, label, { pt: 12, bold: true, valign: 'middle' }));
      o.push(Rc(9.3, y + 0.06, 2.75, 0.24, 'E1E5EC'));
      if (val > 0) o.push(Rc(9.3, y + 0.06, Math.max(0.06, 2.75 * val / Math.max(1, tot)), 0.24, col));
      o.push(T(12.1, y, 0.6, 0.36, String(val), { pt: 12.5, bold: true, color: col, align: 'right', valign: 'middle' }));
    };
    const T0 = Math.max(1, st.total || 0);
    o.push(T(8.3, 3.25, 4, 0.3, '성별', { pt: 11, color: C.gray }));
    bar(3.55, '남', st.m || 0, T0, '5B7BD5'); bar(3.95, '여', st.f || 0, T0, 'C46A8E');
    o.push(T(8.3, 4.45, 4, 0.3, '업종별', { pt: 11, color: C.gray }));
    bar(4.75, '보안', st.sec || 0, T0, K.blu); bar(5.15, '미화', st.cln || 0, T0, K.grn); bar(5.55, '기타', st.etc || 0, T0, K.amber);
    if (st.note) o.push(T(8.3, 5.95, 4.3, 0.42, '비고: ' + st.note, { max: 11, min: 8.5, color: C.gray }));
    S.push(o); no++;
  }

  /* 4. 내용·사실관계 */
  const o4 = frame('02  제기 내용 및 사실관계', '고객사 원문 요지와 확인 사항', no, p);
  o4.push(Rc(0.6, 1.7, 6.0, 4.75, K.tint, { line: K.line }));
  o4.push(Rc(0.6, 1.7, 0.07, 4.75, K.navy));
  o4.push(T(0.9, 1.78, 3, 0.7, [{ text: '“', bold: true }], { pt: 44, color: C.green }));
  o4.push(T(0.9, 2.4, 5.5, 3.95, lines(f.content).map(t => ({ text: t })), { max: 16, min: 9, lh: 1.35, gap: 6 }));
  const rightP = (f.demand ? [{ text: '고객사 요구사항', bold: true, color: C.green }].concat(lines(f.demand).map(t => ({ text: '•  ' + t }))).concat([{ text: ' ', size: 0.5 }]) : [])
    .concat([{ text: '사실관계 확인', bold: true, color: C.navy }]).concat(listParas(parseGrp(p.facts)));
  o4.push(T(7.0, 1.75, 5.75, 4.7, rightP, { max: 15, min: 9 }));
  S.push(o4); no++;

  /* 5. 원인 4M */
  const o5 = frame('03  원인 분석 (4M)', '개인 과실 이전에 구조적 공백을 먼저 본다', no, p);
  const cg = parseGrp(p.cause), cols = [K.blu, K.grn, '5B7BD5', K.blu2];
  cg.slice(0, 4).forEach((gx, i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.7 + Math.floor(i / 2) * 2.4;
    o5.push(Rc(x, y, 5.95, 2.25, C.white, { line: K.line }));
    o5.push(Rc(x, y, 5.95, 0.06, cols[i]));
    o5.push(T(x + 0.25, y + 0.1, 5.5, 0.45, [{ text: gx.title, bold: true }], { pt: 14.5, color: cols[i], valign: 'middle' }));
    o5.push(T(x + 0.25, y + 0.62, 5.5, 1.55, gx.lines.map(l => ({ text: '•  ' + l })), { max: 14, min: 9 }));
  });
  S.push(o5); no++;

  /* 6. 대응 로드맵 — 3단 → 넘치면 단계별 분할 */
  const phases = [['즉시 조치', 'D+0', p.imm, K.red], ['단기 개선', 'D+1 ~ D+7', p.short, K.grn], ['재발방지 대책', '구조 개선', p.prev, K.blu]];
  const colW = 3.95, colH = 4.05;
  const fitsAll = phases.every(ph => fit(listParas(parseGrp(ph[2]), { hcolor: ph[3] }), colW - 0.35, colH - 0.2, 13, 11).ok);
  if (fitsAll) {
    const o6 = frame('04  대응 방안 로드맵', '즉시 조치 → 단기 개선 → 재발방지', no, p);
    phases.forEach((ph, i) => {
      const x = 0.6 + i * 4.1;
      o6.push(Rc(x, 1.7, colW, 0.72, ph[3], { k: 'homePlate' }));
      o6.push(T(x + 0.2, 1.7, colW - 0.6, 0.72, [{ text: ph[0], bold: true }, { text: ph[1], size: 0.75 }], { pt: 17, color: C.white, valign: 'middle', gap: 0 }));
      o6.push(Rc(x, 2.5, colW, colH, 'FAFBFC', { line: K.line }));
      o6.push(T(x + 0.18, 2.62, colW - 0.35, colH - 0.2, listParas(parseGrp(ph[2]), { hcolor: ph[3] }), { max: 13, min: 10 }));
    });
    S.push(o6); no++;
  } else {
    phases.forEach((ph, i) => {
      const pages = paginate(listParas(parseGrp(ph[2]), { hcolor: ph[3] }), 11.6, 4.25, 12);
      pages.forEach((pg, j) => {
        const o = frame(`04  대응 방안 — ${ph[0]}${pages.length > 1 ? ` (${j + 1}/${pages.length})` : ''}`, ph[1], no, p);
        o.push(Rc(0.6, 1.7, 0.18, 4.7, ph[3]));
        o.push(T(1.0, 1.75, 11.7, 4.6, pg, { max: 16, min: 11 }));
        S.push(o); no++;
      });
    });
  }

  /* 6-1. 현장 재교육 영상 */
  { const jk = jobKey(p); S.push(videoSlide(p, no, '04  현장 개선 실행 — 근무 기준 재교육', `${JOB_NAME[jk]} 근무 기준 · 현장 영상 교육 (D+1 ~ D+7)`, null,
      uniq(parseGrp(p.short).flatMap(g => g.lines).concat(parseGrp(p.prev).flatMap(g => g.lines))), jk)); no++; }

  /* 7. 법적 검토 (표 분할) */
  const laws = p.lawIds.filter(id => p.lawOn[id]).map(id => LAWS[id]);
  const per = 5;
  for (let k = 0; k < Math.max(1, Math.ceil(laws.length / per)); k++) {
    const chunk = laws.slice(k * per, k * per + per);
    const o = frame(`05  법적 검토${laws.length > per ? ` (${k + 1}/${Math.ceil(laws.length / per)})` : ''}`, '관련 법령과 적용 포인트 — 적용 전 원문 확인', no, p);
    o.push(Rc(0.6, 1.65, 12.15, 0.48, K.tint)); o.push(Rc(0.6, 2.11, 12.15, 0.025, K.navy));
    o.push(T(0.75, 1.65, 3.3, 0.48, [{ text: '법령 · 조항', bold: true }], { pt: 12.5, color: K.navy, valign: 'middle' }));
    o.push(T(4.25, 1.65, 8.3, 0.48, [{ text: '주요 내용 및 적용', bold: true }], { pt: 12.5, color: K.navy, valign: 'middle' }));
    const rh = 4.2 / per;
    chunk.forEach((x, i) => {
      const y = 2.18 + i * rh;
      o.push(Rc(0.6, y, 12.15, rh - 0.05, i % 2 ? 'FAFBFC' : C.white, { line: K.line }));
      o.push(Rc(0.6, y, 0.08, rh - 0.05, C.green));
      o.push(T(0.8, y + 0.05, 3.3, rh - 0.15, [{ text: x.law, bold: true, color: C.navy }, { text: `${x.art} ${x.title}`, size: 0.85, color: C.gray }], { max: 13, min: 9, gap: 1, valign: 'middle' }));
      o.push(T(4.25, y + 0.05, 8.35, rh - 0.15, x.sum, { max: 12.5, min: 9, valign: 'middle' }));
    });
    S.push(o); no++;
  }

  /* 8. 근무자 조치 (내부) */
  if (!isClient) {
    const o = frame('06  근무자 조치 기준 (내부)', '고객사 제출 시 제외되는 내부 검토 사항', no, p);
    o.push(Rc(0.6, 1.65, 12.15, 0.95, 'FDF1EF', { line: 'F2B8AE' }));
    o.push(T(0.85, 1.7, 11.7, 0.85, [{ text: '3대 중대위반  —  ' + COMMON.majorViolations.join('  ·  '), bold: true, color: C.brick }, { text: '징계는 취업규칙 근거 · 사실 확인 · 소명 기회 · 서면 통지 절차를 반드시 거칠 것', size: 0.85, color: C.gray }], { max: 15, min: 10, gap: 2 }));
    o.push(T(0.75, 2.8, 11.9, 3.65, listParas(parseGrp(p.disc)), { max: 14, min: 9 }));
    S.push(o); no++;
  }

  /* 9. 실행 일정 */
  const o9 = frame(`${isClient ? '06' : '07'}  실행 일정 및 사후관리`, `접수일 ${fmtD(p.d0)} 기준`, no, p);
  const tcol = [K.red, K.grn, K.grn2, K.blu, K.blu2];
  o9.push(Rc(0.8, 2.48, 11.8, 0.03, K.line));
  p.timeline.forEach((t, i) => {
    const x = 0.6 + i * 2.45;
    o9.push(Rc(x, 1.75, 2.35, 0.7, tcol[i], { k: 'chevron' }));
    o9.push(T(x + 0.25, 1.75, 1.85, 0.7, [{ text: t.d, bold: true }], { pt: 17, color: C.white, align: 'center', valign: 'middle' }));
    o9.push(Rc(x + 1.05, 2.38, 0.24, 0.24, tcol[i], { k: 'ellipse' }));
    o9.push(T(x, 2.7, 2.35, 0.35, t.date, { pt: 11.5, bold: true, color: C.navy, align: 'center' }));
    o9.push(Rc(x + 0.05, 3.08, 2.25, 1.6, 'FAFBFC', { line: K.line }));
    o9.push(T(x + 0.18, 3.15, 2.0, 1.48, [{ text: t.t, bold: true, color: tcol[i] }, { text: t.a, size: 0.88 }], { max: 13, min: 9, gap: 3 }));
  });
  o9.push(Rc(0.6, 4.88, 12.15, 1.55, K.tintG, { line: 'CFE6D7' }));
  o9.push(T(0.85, 4.95, 11.7, 1.42, [{ text: '사후관리 (D+30)', bold: true, color: C.greenD }].concat(listParas(parseGrp(p.follow))), { max: 13, min: 9 }));
  S.push(o9); no++;

  /* 10. 고객사 약속사항 + 회신 요지 */
  const o10 = frame(`${isClient ? '07' : '08'}  고객사 약속사항`, '당사가 이행하고 보고드릴 사항', no, p);
  const cm = parseGrp(p.commits).flatMap(gx => gx.lines).slice(0, 6);
  cm.forEach((t, i) => {
    const x = 0.6 + (i % 2) * 3.55, y = 1.7 + Math.floor(i / 2) * 1.55;
    o10.push(Rc(x, y, 3.4, 1.42, C.white, { line: K.line }));
    o10.push(Rc(x, y, 3.4, 0.05, i % 2 ? K.blu : C.green));
    o10.push(T(x + 0.15, y + 0.15, 0.7, 0.5, String(i + 1).padStart(2, '0'), { pt: 20, bold: true, color: i % 2 ? K.blu : C.green }));
    o10.push(T(x + 0.15, y + 0.6, 3.1, 0.78, t, { max: 12.5, min: 8.5 }));
  });
  o10.push(Rc(7.85, 1.7, 4.9, 4.72, K.tint, { line: K.line })); o10.push(Rc(7.85, 1.7, 0.07, 4.72, K.navy));
  o10.push(T(8.15, 1.82, 4.4, 0.45, [{ text: '회신 요지', bold: true }], { pt: 15, color: K.navy }));
  const mg = (typeof UI !== 'undefined' && UI.manager) || null, mph = mg && mg.photo ? mg.photo : (mg && /최민영/.test(mg.name) ? ASSET.fig.mgr : null);
  o10.push(T(8.15, 2.3, 4.45, mg ? 2.85 : 4.0, lines(p.reply).slice(1).map(t => ({ text: t })), { max: 12.5, min: 8, color: '2A3150', lh: 1.3, gap: 4 }));
  if (mg) {
    o10.push(Rc(8.15, 5.3, 4.4, 0.012, K.line));
    if (mph) o10.push(mph === ASSET.fig.mgr ? figBox('mgr', 8.15, 5.38, 0.95, 0.95) : Im(8.15, 5.38, 0.95, 0.95, mph));
    o10.push(T(mph ? 9.25 : 8.15, 5.4, 3.3, 0.9, [{ text: '대응 책임자', size: 0.8, color: K.mute }, { text: `${mg.title || ''} ${mg.name}`.trim(), bold: true, color: K.ink }, { text: mg.org || f.dept, size: 0.8, color: K.mute }], { max: 14, min: 9, gap: 1 }));
  }
  S.push(o10); no++;

  /* 11. 맺음 */
  S.push(closingSlide({ fig: 'team', tag: '고객의 목소리를 구조로 개선합니다 — 재발 없는 현장을 약속드립니다.', org: `${APP.org}  ·  ${f.dept}` }));
  return S;
}

/* ---------- PPT 렌더 (pptxgenjs) ---------- */
async function makePptx(p, slidesIn, titleIn) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = APP.maker; pptx.company = APP.org; pptx.title = titleIn || docTitle(p);
  const SHP = { rect: pptx.ShapeType.rect, para: pptx.ShapeType.parallelogram, chevron: pptx.ShapeType.chevron, homePlate: pptx.ShapeType.homePlate, ellipse: pptx.ShapeType.ellipse };
  const slides = slidesIn || buildSlides(p);
  const vids = {}, covers = {};
  for (const el of slides.flat()) if (el.t === 'video' && !(el.key in vids)) { vids[el.key] = await fetchVideo(el.key); covers[el.key] = await toPng(el.src); }
  slides.forEach(els => {
    const s = pptx.addSlide();
    els.forEach(e => {
      if (e.t === 'img') s.addImage({ data: e.src, x: e.x, y: e.y, w: e.w, h: e.h });
      else if (e.t === 'video') {
        if (vids[e.key]) s.addMedia({ type: 'video', data: 'video/mp4;base64,' + vids[e.key], cover: covers[e.key], x: e.x, y: e.y, w: e.w, h: e.h, extn: 'mp4' });
        else { s.addImage({ data: e.src, x: e.x, y: e.y, w: e.w, h: e.h }); s.addText('영상은 웹 주소·앱에서 만들면 PPT에 함께 들어갑니다', { x: e.x, y: e.y + e.h - 0.45, w: e.w, h: 0.4, fontSize: 11, color: 'FFFFFF', fill: { color: '000000', transparency: 45 }, align: 'center', fontFace: '맑은 고딕' }); }
      }
      else if (e.t === 'shape') s.addShape(SHP[e.k], { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: e.fill }, line: e.line ? { color: e.line, width: e.lw || 0.75 } : { type: 'none' } });
      else if (e.t === 'text') {
        const runs = e.paras.map((q, i) => ({ text: q.text, options: { bold: q.bold ?? e.bold, color: q.color || e.color, fontSize: +(e.pt * (q.size || 1)).toFixed(1), breakLine: i < e.paras.length - 1, paraSpaceAfter: i < e.paras.length - 1 ? (q.gap ?? e.gap) : 0 } }));
        s.addText(runs, { x: e.x, y: e.y, w: e.w, h: e.h, fontFace: '맑은 고딕', fontSize: e.pt, color: e.color, align: e.align, valign: e.valign, margin: 0, lineSpacingMultiple: e.lh, wrap: true, fit: 'none' });
      }
    });
  });
  return await pptx.write({ outputType: 'blob' });
}

/* ---------- PDF 렌더 (같은 슬라이드 모델 → HTML → 이미지 → PDF) ---------- */
function slideDom(els) {
  const d = document.createElement('div'); d.className = 'slide';
  els.forEach(e => {
    const n = document.createElement('div'); n.style.cssText = `position:absolute;left:${e.x * DPI}px;top:${e.y * DPI}px;width:${e.w * DPI}px;height:${e.h * DPI}px;`;
    if (e.t === 'img' || e.t === 'video') { const im = document.createElement('img'); im.src = e.src; im.style.cssText = 'width:100%;height:100%;display:block;object-fit:cover'; n.appendChild(im);
      if (e.t === 'video') { const pl = document.createElement('div'); pl.style.cssText = 'position:absolute;left:50%;top:50%;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:rgba(15,21,48,.72);box-shadow:0 0 0 4px rgba(255,255,255,.85)'; pl.innerHTML = '<div style="position:absolute;left:36px;top:26px;width:0;height:0;border-left:30px solid #fff;border-top:20px solid transparent;border-bottom:20px solid transparent"></div>'; n.appendChild(pl); } }
    else if (e.t === 'shape') {
      n.style.background = '#' + e.fill; if (e.line) n.style.boxShadow = `inset 0 0 0 1px #${e.line}`;
      const o = Math.min(e.w, e.h) * DPI, W = e.w * DPI;
      if (e.k === 'para') n.style.clipPath = `polygon(${o * 0.25}px 0,100% 0,${W - o * 0.25}px 100%,0 100%)`;
      if (e.k === 'chevron') n.style.clipPath = `polygon(0 0,${W - o * 0.5}px 0,100% 50%,${W - o * 0.5}px 100%,0 100%,${o * 0.5}px 50%)`;
      if (e.k === 'homePlate') n.style.clipPath = `polygon(0 0,${W - o * 0.5}px 0,100% 50%,${W - o * 0.5}px 100%,0 100%)`;
      if (e.k === 'ellipse') n.style.borderRadius = '50%';
    } else {
      n.style.display = 'flex'; n.style.flexDirection = 'column'; n.style.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[e.valign];
      n.style.textAlign = e.align; n.style.fontFamily = SFONT; n.style.wordBreak = 'keep-all'; n.style.overflowWrap = 'anywhere';
      e.paras.forEach((q, i) => {
        const pdv = document.createElement('div'); pdv.textContent = q.text;
        pdv.style.cssText = `font-size:${e.pt * (q.size || 1) * PT}px;line-height:${e.lh};color:#${q.color || e.color};font-weight:${(q.bold ?? e.bold) ? 700 : 400};margin-bottom:${i < e.paras.length - 1 ? (q.gap ?? e.gap) * PT : 0}px;white-space:pre-wrap`;
        n.appendChild(pdv);
      });
    }
    d.appendChild(n);
  });
  return d;
}
async function makePdf(p, onProgress, slidesIn, titleIn) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [SW, SH], compress: true });
  const host = $('#render'); host.innerHTML = '';
  const slides = slidesIn || buildSlides(p);
  for (let i = 0; i < slides.length; i++) {
    onProgress && onProgress(i + 1, slides.length);
    const d = slideDom(slides[i]); host.innerHTML = ''; host.appendChild(d);
    await Promise.all([...d.querySelectorAll('img')].map(im => im.decode ? im.decode().catch(() => { }) : null));
    const cv = await html2canvas(d, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
    if (i) pdf.addPage([SW, SH], 'landscape');
    pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, SW, SH);
  }
  host.innerHTML = '';
  pdf.setProperties({ title: titleIn || docTitle(p), author: APP.maker, creator: `${APP.name} ${APP.version}` });
  return pdf.output('blob');
}

/* =====================================================================
 * 5) 이벤트 / 기록
 * ===================================================================== */
function busy(on, msg) { $('#busy').classList.toggle('on', on); if (msg) $('#busyMsg').textContent = msg; }
async function run(kind) {
  const p = syncEditor(); if (!p) return toast('먼저 [대응방안 생성]을 누르세요.');
  try {
    const base = fileBase(p);
    if (kind === 'docx' || kind === 'all') { busy(true, 'Word 문서 생성 중…'); await download(await makeDocx(p), base + '.docx'); }
    if (kind === 'pptx' || kind === 'all') { busy(true, 'PPT 생성 중…'); await download(await makePptx(p), base + '.pptx'); }
    if (kind === 'pdf' || kind === 'all') { await download(await makePdf(p, (i, n) => busy(true, `PDF 변환 중… ${i}/${n}`)), base + '.pdf'); }
    saveHistory(p); toast('출력 완료 — 다운로드 폴더를 확인하세요.');
  } catch (e) { console.error(e); toast('생성 오류: ' + e.message, 5000); }
  finally { busy(false); }
}
function saveHistory(p) {
  try {
    const h = readHist();
    const f2 = Object.assign({}, p.f); delete f2.siteObj;
    h.unshift({ at: fmtD(kstNow()), client: p.f.client, names: p.names, f: f2, siteId: p.site ? p.site.id : null, picked: p.items.map(x => x.S.c) });
    storeHistory(h.slice(0, 20)); renderHistory();
  } catch (e) { }
}
function storeHistory(h) { localStorage.setItem('stcr_hist', JSON.stringify(h)); }   // 로그인 시 서버 동기화(auth 모듈이 이 함수를 감쌈)
function readHist() { try { return JSON.parse(localStorage.getItem('stcr_hist') || '[]'); } catch (e) { return []; } }
const HSEL = new Set();
function renderHistory() {
  const h = readHist();
  [...HSEL].forEach(i => { if (i >= h.length) HSEL.delete(i); });
  $('#histTools').innerHTML = h.length ? `<label class="hchk"><input type="checkbox" id="hAll" ${HSEL.size && HSEL.size === h.length ? 'checked' : ''}> 전체 선택</label>
    <span class="hcnt">${h.length}건${HSEL.size ? ` · ${HSEL.size}건 선택` : ''}</span>
    <button class="btn l" id="hDelSel" ${HSEL.size ? '' : 'disabled'}>🗑 선택 삭제</button><button class="btn l" id="hDelAll">전체 삭제</button>` : '';
  $('#hist').innerHTML = h.length ? h.map((x, i) => `<li data-i="${i}" class="${HSEL.has(i) ? 'sel' : ''}"><input type="checkbox" class="hsel" data-i="${i}" ${HSEL.has(i) ? 'checked' : ''} aria-label="선택">
      <div class="hb"><b>${esc(x.client)}</b><span>${esc((x.names || []).join(', '))}</span><em>${esc(x.at)}</em></div>
      <button class="hdel" data-del="${i}" title="이 기록 삭제">🗑</button></li>`).join('') : '<li class="empty">출력 기록이 없습니다.</li>';
  if (!h.length) return;
  $('#hAll').onchange = e => { HSEL.clear(); if (e.target.checked) h.forEach((_, i) => HSEL.add(i)); renderHistory(); };
  $('#hDelSel').onclick = () => confirmDel(`선택한 ${HSEL.size}건을 삭제할까요?`, () => { storeHistory(readHist().filter((_, i) => !HSEL.has(i))); HSEL.clear(); renderHistory(); toast('선택한 기록을 삭제했습니다'); });
  $('#hDelAll').onclick = () => confirmDel(`출력 기록 ${h.length}건을 모두 삭제할까요?`, () => { storeHistory([]); HSEL.clear(); renderHistory(); toast('출력 기록을 모두 삭제했습니다'); });
}
function confirmDel(msg, ok) {
  openModal(`<h2>기록 삭제</h2><div class="sub">${esc(msg)}<br>삭제한 기록은 되살릴 수 없습니다. (로그인 시 다른 기기에서도 함께 지워집니다)</div>
    <div class="mrow"><button class="btn" id="mClose">취소</button><button class="btn pri" id="dOk" style="background:#C62828">삭제</button></div>`, md => {
    md.querySelector('#mClose').onclick = closeModal; md.querySelector('#dOk').onclick = () => { closeModal(); ok(); };
  });
}
function histClick(e) {
  const del = e.target.closest('[data-del]');
  if (del) { const i = +del.dataset.del, h = readHist(); confirmDel(`「${h[i] ? h[i].client : ''}」 기록을 삭제할까요?`, () => { const hh = readHist(); hh.splice(i, 1); HSEL.clear(); storeHistory(hh); renderHistory(); toast('기록을 삭제했습니다'); }); return; }
  const cb = e.target.closest('.hsel');
  if (cb) { const i = +cb.dataset.i; cb.checked ? HSEL.add(i) : HSEL.delete(i); renderHistory(); return; }
  const li = e.target.closest('li[data-i]'); if (li) loadHistory(+li.dataset.i);
}
function loadHistory(i) {
  const h = readHist()[i]; if (!h) return;
  const map = { client: 'f_client', site: 'f_site', job: 'f_job', recvDate: 'f_date', occur: 'f_occur', channel: 'f_channel', raiser: 'f_raiser', workers: 'f_workers', author: 'f_author', dept: 'f_dept', content: 'f_content', demand: 'f_demand', facts: 'f_facts' };
  Object.entries(map).forEach(([k, id]) => $('#' + id).value = h.f[k] || '');
  if (h.siteId) { const st = SITES.find(x => x.id === h.siteId); if (st) selectSite(st, true); }
  state.picked = h.picked.filter(findSmall); renderTree(); renderPicked(); toast('불러왔습니다. [대응방안 생성]을 눌러 주세요.');
}
function sample() {
  const tcc = SITES.find(x => x.id === 25); if (tcc) selectSite(tcc);
  const v = { f_site: '본사 정문 초소', f_occur: '11/12(목) 02:10 ~ 02:55', f_channel: '공문', f_raiser: '총무팀 이사', f_workers: '야간 경비원 1명',
    f_content: '야간 근무 중 경비원이 초소를 비워 화재경보가 울렸으나 약 20분간 확인되지 않았고, 복귀 후에는 현장 확인 없이 수신기를 임의로 복구하였음.\n같은 근무자가 근무 중 휴대폰으로 유튜브를 시청하는 모습이 CCTV로 수차례 확인됨.',
    f_demand: '해당 근무자 교체 및 재발방지 대책 서면 제출\n화재경보 처리 절차를 문서로 정비하여 7일 내 보고',
    f_facts: 'CCTV 확인 결과 02:10~02:55 초소 공석(45분)\n수신기 이력상 02:32 경보 발생, 02:53 복구 — 현장 확인 기록 없음\n근무자 경위서 징구 완료(11/13)' };
  Object.entries(v).forEach(([k, x]) => $('#' + k).value = x);
  state.picked = ['A1-01', 'D1-01', 'A2-02']; renderTree(); renderPicked(); toast('예시 사례를 채웠습니다.');
}

async function init() {
  if ($('#logo2')) $('#logo2').src = ASSET.logo;
  $('#jobList').innerHTML = JOBS.map(j => `<option value="${j}">`).join('');
  $('#f_sev').innerHTML = '<option value="">자동 판정</option>' + Object.entries(SEV).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
  const t = kstNow(); $('#f_date').value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  $('#f_dept').value = APP.branch;
  uiInit();
  let nS = 0, nM = 0; TAX.forEach(L => { nM += L.mids.length; L.mids.forEach(M => nS += M.smalls.length); });
  $('#stat').textContent = `대분류 ${TAX.length} · 중분류 ${nM} · 소분류 ${nS} · 법령 ${Object.keys(LAWS).length - 1}`;
  renderTree(); renderPicked(); renderHistory();
  $('#q').addEventListener('input', e => renderTree(e.target.value));
  $('#tree').addEventListener('click', e => { const li = e.target.closest('li.sm'); if (li) togglePick(li.dataset.c); });
  $('#picked').addEventListener('click', e => { const b = e.target.closest('button[data-x]'); if (b) togglePick(b.dataset.x); });
  $('#sugg').addEventListener('click', e => { const b = e.target.closest('button.sg'); if (b && !state.picked.includes(b.dataset.c)) togglePick(b.dataset.c); });
  $('#btnSugg').onclick = suggest;
  $('#btnSample').onclick = sample;
  $('#btnGen').onclick = () => { const p = buildPlan(); if (!p) return; state.plan = p; renderEditor(p); renderWorkerForm(); toast('대응방안이 생성되었습니다. 검토 후 출력하세요.'); if (innerWidth < 1100) $('#outPanel').scrollIntoView({ behavior: 'smooth' }); };
  document.querySelectorAll('input[name=mode]').forEach(r => r.onchange = () => { if (state.plan) { syncEditor(); renderEditor(state.plan); } });
  $('#btnDocx').onclick = () => run('docx'); $('#btnPptx').onclick = () => run('pptx'); $('#btnPdf').onclick = () => run('pdf'); $('#btnAll').onclick = () => run('all');
  $('#hist').addEventListener('click', histClick);
  await buildSignature(kstNow());
  $('#sigImg').src = state.sigDataUrl;
}
window.addEventListener('DOMContentLoaded', init);
