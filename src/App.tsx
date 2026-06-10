import { useState } from 'react';
import { AppLayout, Stack, Field, Chip, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

const M: Meta = {
  id: 8, icon: '📜', title: '나이대별 한국사 학습·시험 앱', tagline: '연령에 맞춰 AI가 한국사 학습카드와 퀴즈를 만들고, 채점·오답복습까지 도와줘요',
  members: ['이유민'], color: '#9333ea', ai: true,
  problem:
    '한국사는 시대·인물·사건이 방대해 어디서 시작할지 막막하고, 같은 내용도 초등학생과 성인에게 같은 난도로 제공됩니다. ' +
    '본 앱은 연령대와 시대를 고르면 AI가 핵심 요약·연표가 담긴 학습카드를 만들고, 객관식 퀴즈를 출제해 즉시 채점하며 ' +
    '틀린 문제는 해설과 함께 복습하도록 도와 학습-평가-피드백을 한 흐름으로 연결합니다.',
  features: [
    { icon: '🃏', title: 'AI 학습카드', desc: '시대별 핵심 요약·키포인트·연표를 한 장으로 정리' },
    { icon: '📝', title: '자동 퀴즈 출제', desc: '연령 난도에 맞춘 객관식 문제를 즉석 생성' },
    { icon: '✅', title: '즉시 채점', desc: '제출하면 점수와 정·오답을 바로 확인' },
    { icon: '🔁', title: '오답 복습', desc: '틀린 문제만 해설과 함께 다시 보기' },
    { icon: '🕰️', title: '연표 시각화', desc: '주요 사건을 SVG 타임라인으로 한눈에' },
    { icon: '🏆', title: '점수 기록', desc: '응시 기록을 저장해 성장 추이를 확인' },
  ],
  howto: [
    '(선택) OpenAI API 키를 입력하면 실제 AI 출제가 켜집니다',
    '연령대·시대를 고르고 학습/시험 모드를 선택합니다',
    '학습카드로 핵심을 익히고, 시험으로 퀴즈를 풉니다',
    '제출 후 채점·해설로 오답을 복습합니다',
  ],
  facts: [
    { value: 'AI', label: '자동 출제' }, { value: '3', label: '연령 난도' }, { value: '연표', label: '시각화' },
    { value: '채점', label: '즉시 피드백' }, { value: '오답', label: '복습' }, { value: '무키', label: '폴백 동작' },
  ],
  info: [
    { title: '왜 연령별인가요?', body: '초등은 인물·이야기 중심, 중고등은 인과·흐름, 성인은 사료 해석까지 — 발달 단계에 맞춘 난도가 학습 효율을 높입니다.' },
    { title: '시험 효과(Testing Effect)', body: '읽기만 하는 것보다 스스로 떠올려 답하는 “인출 연습”이 장기 기억에 훨씬 효과적입니다. 그래서 학습 직후 퀴즈를 배치했습니다.' },
    { title: '오답에서 배우기', body: '틀린 문제를 해설과 함께 다시 보면 오개념이 교정됩니다. 본 앱은 오답만 모아 복습하도록 설계했습니다.' },
    { title: '정확성 주의', body: 'AI 출제는 연대·세부 사실에 오류가 있을 수 있습니다. 교과서·국사편찬위 자료로 교차 확인을 권합니다.' },
  ],
  pipeline: [
    '범위 설정 — 연령대·시대·모드(학습/시험)를 구조화',
    '콘텐츠 합성 — 연령 난도 규칙 + 한국사 맥락 + JSON 스키마',
    'GPT 호출 — 학습카드(요약·연표) 또는 퀴즈(보기·정답·해설) 수신',
    '검증·폴백 — 누락 시 내장 한국사 DB로 안전 제공',
    '평가 — 객관식 채점 + 점수 산출 + 오답 추출',
    '기록 — 응시 점수 localStorage 저장 → 추이 확인',
  ],
  techNotes: [
    { title: '난도 적응 출제', body: '연령에 따라 시스템 프롬프트의 어휘·인지수준 규칙을 바꿔 동일 시대도 다른 난도로 출제합니다.' },
    { title: '구조화 퀴즈', body: '문항을 {보기, 정답 인덱스, 해설} 스키마로 받아 채점·해설을 결정적으로 처리합니다.' },
    { title: 'SVG 연표', body: '연표 데이터를 정규화해 가로 타임라인으로 렌더, 외부 라이브러리 없이 시각화합니다.' },
    { title: '정적·오프라인', body: '내장 DB로 키 없이도 동작하며 응시 기록은 localStorage에 누적됩니다.' },
  ],
  targets: ['한국사를 처음 잡는 학습자', '연령별 난도로 배우고 싶은 학생·성인', '시험 대비로 퀴즈가 필요한 사람'],
  goals: [
    '연령·시대 맞춤 학습카드와 퀴즈로 학습-평가-피드백을 연결한다',
    '틀린 문제를 해설과 함께 복습하게 한다',
    'API 키가 없어도 내장 한국사 DB로 동작하게 한다',
  ],
  scenarios: [
    '연령대·시대·모드(학습/시험)를 고른다',
    '학습카드로 핵심을 익히고 퀴즈를 풀어 즉시 채점받는다',
    '오답을 해설로 복습하고 점수 추이를 확인한다',
  ],
  screens: [
    { name: '범위 설정', desc: '연령대·시대·학습/시험 모드 선택' },
    { name: '학습카드', desc: '시대별 핵심 요약·키포인트 + SVG 연표' },
    { name: '시험 (퀴즈)', desc: '연령 난도 객관식 출제 + 즉시 채점' },
    { name: '오답 복습', desc: '틀린 문제만 해설과 함께 다시 보기' },
    { name: '점수 기록', desc: '응시 기록을 저장해 성장 추이 확인' },
  ],
  pipelineDetail: [
    { step: '범위 설정', detail: '연령대·시대·모드(학습/시험)를 구조화한다.' },
    { step: '콘텐츠 합성 · 스키마 강제', detail: '연령 난도 규칙과 한국사 맥락을 system 프롬프트로 지시하고 JSON 스키마를 고정한다.' },
    { step: 'GPT 호출(json_object)', detail: '학습카드(요약·연표) 또는 퀴즈(보기·정답 인덱스·해설)를 수신한다.' },
    { step: '검증 · 폴백', detail: '누락 시 내장 한국사 DB로 안전 제공한다.' },
    { step: '평가', detail: '객관식 채점 + 점수 산출 + 오답 추출.' },
    { step: '기록', detail: '응시 점수를 localStorage(history.scores)에 저장해 추이를 확인한다.' },
  ],
  promptNotes: [
    '연령에 따라 system 프롬프트의 어휘·인지수준 규칙을 바꿔 동일 시대도 다른 난도로 출제한다.',
    '문항을 {보기, 정답 인덱스, 해설} 스키마로 강제해 채점·해설을 결정적으로 처리한다.',
    'API 키가 없으면 내장 한국사 DB로 동일 구조의 학습카드·퀴즈를 제공한다.',
  ],
  architecture:
    '백엔드 없는 React SPA. 공통 레이아웃·5탭은 src/ui.tsx, 학습·시험 기능은 src/App.tsx가 담당한다. ' +
    'OpenAI 호출은 src/lib/ai.ts, 연표는 SVG로 렌더하며, 응시 기록은 브라우저 localStorage에 누적한다.',
  structure: [
    { path: 'src/App.tsx', desc: '학습카드·퀴즈 출제·채점·오답복습 + 메타(M)' },
    { path: 'src/ui.tsx', desc: '공통 레이아웃·5탭·UI 헬퍼' },
    { path: 'src/lib/ai.ts', desc: 'OpenAI chat 헬퍼(ask/hasKey)' },
    { path: 'src/index.css', desc: '테마·카드/연표 스타일' },
  ],
  dataModel: [
    { name: 'Card', desc: '시대별 학습카드(요약·키포인트·연표)' },
    { name: 'Quiz', desc: '문항 보기·정답 인덱스·해설' },
    { name: '점수 기록', desc: '응시 점수. localStorage "history.scores"' },
  ],
  deploy:
    'Vite 빌드(base: "./") 후 GitHub Actions(deploy.yml)가 main push 시 GitHub Pages로 자동 배포 → aebonlee.github.io/project08/',
  stack: ['React 18', 'TypeScript', 'Vite', 'OpenAI GPT', 'SVG', 'localStorage'],
  links: [
    { label: '국사편찬위원회', url: 'https://www.history.go.kr' },
    { label: '우리역사넷', url: 'http://contents.history.go.kr' },
  ],
};

const AGES = [
  { key: 'elem', label: '초등', rule: '쉬운 어휘와 인물·이야기 중심, 보기는 짧고 명확하게.' },
  { key: 'mid', label: '중·고등', rule: '사건의 인과와 흐름 중심, 교과 수준 어휘.' },
  { key: 'adult', label: '성인', rule: '사료 해석·의의까지 포함한 심화 난도.' },
];
const ERAS = ['고조선·삼국', '통일신라·발해', '고려', '조선', '근현대'];

interface Quiz { q: string; choices: string[]; answer: number; explanation: string }
interface Card { summary: string; key_points: string[]; timeline: { year: string; event: string }[] }

const CARD_DB: Record<string, Card> = {
  조선: { summary: '1392년 이성계가 건국한 조선은 유교를 통치 이념으로 삼아 약 500년간 이어졌습니다. 세종대의 문화 융성과 임진·병자 양란, 후기 실학이 중요합니다.', key_points: ['유교적 통치와 과거제', '세종의 훈민정음·과학', '임진왜란·병자호란', '영정조 탕평과 실학'], timeline: [{ year: '1392', event: '조선 건국' }, { year: '1446', event: '훈민정음 반포' }, { year: '1592', event: '임진왜란' }, { year: '1796', event: '수원 화성 완공' }] },
};
const QUIZ_DB: Record<string, Quiz[]> = {
  조선: [
    { q: '훈민정음을 창제한 조선의 왕은?', choices: ['태조', '세종', '성종', '정조'], answer: 1, explanation: '세종대왕이 1443년 훈민정음을 창제하고 1446년 반포했습니다.' },
    { q: '임진왜란이 일어난 해는?', choices: ['1592년', '1636년', '1467년', '1392년'], answer: 0, explanation: '1592년 일본의 침입으로 임진왜란이 시작되었습니다.' },
    { q: '정조가 건설한 계획도시는?', choices: ['한양', '개경', '수원 화성', '평양'], answer: 2, explanation: '정조는 수원 화성을 축조해 개혁의 거점으로 삼았습니다.' },
  ],
};

function fallbackCard(era: string): Card { return CARD_DB[era] || { summary: `${era} 시대의 핵심을 살펴봅니다. (AI 키를 입력하면 더 풍부한 학습카드를 받을 수 있어요.)`, key_points: ['주요 정치 변화', '대표 인물', '문화·사회상'], timeline: [{ year: '—', event: '주요 사건을 시대순으로 정리해 보세요.' }] }; }
function fallbackQuiz(era: string): Quiz[] { return QUIZ_DB[era] || QUIZ_DB['조선']; }

async function getCard(era: string, age: typeof AGES[number]): Promise<Card> {
  if (!hasKey()) return fallbackCard(era);
  try {
    const out = await ask(
      `너는 한국사 교사야. ${age.rule} 반드시 JSON만: {"summary":"3~4문장","key_points":["핵심"],"timeline":[{"year":"연도","event":"사건"}]}`,
      `시대: ${era} / 대상: ${age.label}. 키포인트 4개, 연표 4~5개, 한국어.`,
      { json: true, temperature: 0.5, max_tokens: 900 },
    );
    const p = JSON.parse(out);
    if (!p.summary) return fallbackCard(era);
    return { summary: String(p.summary), key_points: (p.key_points || []).map(String), timeline: (p.timeline || []).map((t: Card['timeline'][number]) => ({ year: String(t.year || ''), event: String(t.event || '') })) };
  } catch { return fallbackCard(era); }
}

async function getQuiz(era: string, age: typeof AGES[number]): Promise<Quiz[]> {
  if (!hasKey()) return fallbackQuiz(era);
  try {
    const out = await ask(
      `너는 한국사 출제위원이야. ${age.rule} 객관식 4지선다. 반드시 JSON만: {"questions":[{"q":"","choices":["","","",""],"answer":0,"explanation":""}]}`,
      `시대: ${era} / 대상: ${age.label}. 5문항, answer는 정답 보기의 0-based 인덱스, 한국어.`,
      { json: true, temperature: 0.6, max_tokens: 1400 },
    );
    const p = JSON.parse(out);
    const qs = (p.questions || []).filter((q: Quiz) => Array.isArray(q.choices) && q.choices.length >= 2);
    if (!qs.length) return fallbackQuiz(era);
    return qs.map((q: Quiz) => ({ q: String(q.q || ''), choices: q.choices.map(String), answer: Math.max(0, Math.min(q.choices.length - 1, Number(q.answer) || 0)), explanation: String(q.explanation || '') }));
  } catch { return fallbackQuiz(era); }
}

function Timeline({ items, color }: { items: Card['timeline']; color: string }) {
  if (!items.length) return null;
  return (
    <div className="timeline-h">
      {items.map((t, i) => (
        <div key={i} className="tl-item"><span className="tl-dot" style={{ background: color }} /><b style={{ color }}>{t.year}</b><span>{t.event}</span></div>
      ))}
    </div>
  );
}

function Feature() {
  const [age, setAge] = useState(AGES[1]);
  const [era, setEra] = useState(ERAS[3]);
  const [mode, setMode] = useState<'study' | 'exam'>('study');
  const [card, setCard] = useState<Card | null>(null);
  const [quiz, setQuiz] = useState<Quiz[] | null>(null);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useLocalStorage<{ era: string; pct: number }[]>('history.scores', []);

  const run = async () => {
    setLoading(true); setSubmitted(false); setPicks({});
    if (mode === 'study') { setCard(await getCard(era, age)); setQuiz(null); }
    else { setQuiz(await getQuiz(era, age)); setCard(null); }
    setLoading(false);
    requestAnimationFrame(() => document.getElementById('out-top')?.scrollIntoView({ behavior: 'smooth' }));
  };
  const score = quiz ? quiz.reduce((a, q, i) => a + (picks[i] === q.answer ? 1 : 0), 0) : 0;
  const pct = quiz && quiz.length ? Math.round((score / quiz.length) * 100) : 0;
  const submit = () => { setSubmitted(true); if (quiz) setScores([{ era, pct }, ...scores].slice(0, 20)); };

  return (
    <Stack>
      <div className="studio">
        <div className="studio-row">
          <Field label="연령대"><div className="chips">{AGES.map((a) => <Chip key={a.key} active={age.key === a.key} color={M.color} onClick={() => setAge(a)}>{a.label}</Chip>)}</div></Field>
          <Field label="시대"><select value={era} onChange={(e) => setEra(e.target.value)}>{ERAS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="모드"><div className="chips">
          <Chip active={mode === 'study'} color={M.color} onClick={() => setMode('study')}>📖 학습</Chip>
          <Chip active={mode === 'exam'} color={M.color} onClick={() => setMode('exam')}>📝 시험</Chip>
        </div></Field>
        <button className="btn" style={{ background: M.color }} disabled={loading} onClick={run}>{loading ? '준비 중…' : mode === 'study' ? '📖 학습카드 만들기' : '📝 퀴즈 풀기'}</button>
      </div>

      <div id="out-top" />
      {loading && <div className="spinner" />}

      {card && !loading && (
        <Stack gap={14}>
          <div className="rcard"><h4 style={{ color: M.color }}>📜 {era} 핵심 요약</h4><p style={{ marginTop: 4, fontSize: 14.5, lineHeight: 1.85, color: 'var(--text)' }}>{card.summary}</p></div>
          {card.key_points.length > 0 && (
            <div className="learn"><h3 className="learn-h" style={{ color: M.color }}>🔑 키포인트</h3>
              <Stack gap={8}>{card.key_points.map((k, i) => <div key={i} className="qrow"><span className="qno" style={{ background: M.color }}>{i + 1}</span><span>{k}</span></div>)}</Stack>
            </div>
          )}
          {card.timeline.length > 0 && <div className="learn"><h3 className="learn-h" style={{ color: M.color }}>🕰️ 연표</h3><Timeline items={card.timeline} color={M.color} /></div>}
        </Stack>
      )}

      {quiz && !loading && (
        <Stack gap={12}>
          {quiz.map((q, i) => (
            <div key={i} className="rcard">
              <strong>Q{i + 1}. {q.q}</strong>
              <Stack gap={6} >
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.choices.map((c, ci) => {
                    const chosen = picks[i] === ci; const correct = submitted && ci === q.answer; const wrong = submitted && chosen && ci !== q.answer;
                    return (
                      <button key={ci} onClick={() => !submitted && setPicks({ ...picks, [i]: ci })}
                        className="choice" style={{ borderColor: correct ? '#16a34a' : wrong ? '#dc2626' : chosen ? M.color : 'var(--border)', background: correct ? '#16a34a18' : wrong ? '#dc262618' : chosen ? `${M.color}12` : 'var(--card)' }}>
                        {String.fromCharCode(9312 + ci)} {c} {correct && '✓'} {wrong && '✗'}
                      </button>
                    );
                  })}
                </div>
              </Stack>
              {submitted && q.explanation && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--sub)' }}>💡 {q.explanation}</p>}
            </div>
          ))}
          {!submitted ? (
            <button className="btn" style={{ background: M.color }} disabled={Object.keys(picks).length < quiz.length} onClick={submit}>제출하고 채점 ({Object.keys(picks).length}/{quiz.length})</button>
          ) : (
            <div className="callout-soft" style={{ background: `${M.color}12`, border: `1px solid ${M.color}40`, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>🏆</span>
              <p style={{ margin: 0, fontWeight: 700 }}>{quiz.length}문제 중 {score}개 정답 · {pct}점</p>
              <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12.5 }} onClick={run}>다시 풀기</button>
            </div>
          )}
        </Stack>
      )}

      {scores.length > 0 && (
        <div className="learn">
          <h3 className="learn-h" style={{ color: M.color }}>🏆 응시 기록</h3>
          <div className="chips">{scores.map((s, i) => <span key={i} className="tag" style={{ background: s.pct >= 80 ? '#16a34a' : s.pct >= 50 ? M.color : '#dc2626', fontSize: 12.5, padding: '5px 12px' }}>{s.era} {s.pct}점</span>)}</div>
        </div>
      )}
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
