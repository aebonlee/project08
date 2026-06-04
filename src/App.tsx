import { useState } from 'react';
import { AppLayout, Stack, Chip, Pill, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

const M: Meta = {
  id: 8, icon: '📜', title: '나이대별 한국사 학습·시험 앱', tagline: '연령대별 난이도로 학습하고 시험까지', members: ['이유민'], color: '#9333ea', ai: true,
  problem: '한국사는 같은 사건도 연령·수준에 따라 설명이 달라야 합니다. 어린이·청소년·성인 난이도로 학습 카드와 시험을 제공하고, AI 튜터가 궁금한 역사 질문에 눈높이에 맞춰 답합니다.',
  features: [
    { icon: '🎚️', title: '연령별 난이도', desc: '어린이·청소년·성인 3단계 학습 카드' },
    { icon: '✏️', title: '시험 모드', desc: '단계별 퀴즈로 학습 점검·채점' },
    { icon: '🤖', title: 'AI 역사 튜터', desc: 'OpenAI가 눈높이에 맞춰 역사 질문에 답변' },
    { icon: '📈', title: '점수 확인', desc: '맞힌 개수로 즉시 결과 확인' },
  ],
  howto: ['연령대(어린이/청소년/성인)를 골라요', '학습 카드로 공부하고 시험을 봐요', 'AI 튜터에게 궁금한 역사를 물어봐요'],
  facts: [{ value: '3', label: '난이도' }, { value: 'GPT', label: 'AI 튜터' }, { value: '9', label: '학습 카드' }, { value: '6', label: '시험 문항' }],
  info: [
    { title: '한국사의 큰 흐름', body: '고조선 → 삼국·통일신라 → 고려 → 조선 → 근대 → 현대로 이어집니다. 시대의 순서와 대표 사건을 먼저 잡으면 이해가 쉽습니다.' },
    { title: '연령별 학습법', body: '어린이는 인물·이야기 중심, 청소년은 사건·인과 중심, 성인은 사회·제도 변화 중심으로 접근하면 효과적입니다.' },
    { title: '한국사능력검정시험', body: '국사편찬위원회가 시행하며 기본·심화로 나뉩니다. 흐름 이해 후 연표·사료 학습으로 확장하세요.' },
  ],
  stack: ['React', 'TypeScript', 'OpenAI API', 'Vite'],
  links: [{ label: '우리역사넷(국사편찬위)', url: 'http://contents.history.go.kr' }],
};

type Level = 'kid' | 'teen' | 'adult';
const LEVELS: { key: Level; label: string }[] = [{ key: 'kid', label: '어린이' }, { key: 'teen', label: '청소년' }, { key: 'adult', label: '성인' }];
const CARDS: Record<Level, { title: string; body: string }[]> = {
  kid: [{ title: '단군 이야기', body: '우리나라 최초의 나라는 고조선이에요. 단군왕검이 세웠다고 전해져요.' }, { title: '세종대왕', body: '한글(훈민정음)을 만들어 백성이 글을 쉽게 읽고 쓰게 해주셨어요.' }, { title: '이순신 장군', body: '거북선으로 바다에서 나라를 지킨 장군이에요.' }],
  teen: [{ title: '삼국 시대', body: '고구려·백제·신라가 경쟁했고, 신라가 삼국을 통일했습니다.' }, { title: '조선 건국', body: '1392년 이성계가 조선을 세우고 한양을 도읍으로 삼았습니다.' }, { title: '임진왜란', body: '1592년 일본의 침략에 맞서 이순신과 의병이 활약했습니다.' }],
  adult: [{ title: '갑오개혁', body: '1894년 신분제 폐지 등 근대적 제도 개혁이 추진되었습니다.' }, { title: '3·1 운동', body: '1919년 전국적 비폭력 독립운동으로 임시정부 수립의 계기가 됐습니다.' }, { title: '산업화와 민주화', body: '압축 성장과 1987년 민주화를 거쳐 오늘에 이릅니다.' }],
};
const QUIZ: Record<Level, { q: string; opts: string[]; a: number }[]> = {
  kid: [{ q: '한글을 만든 왕은?', opts: ['세종대왕', '단군', '이순신'], a: 0 }, { q: '우리나라 최초의 나라는?', opts: ['신라', '고조선', '조선'], a: 1 }],
  teen: [{ q: '삼국을 통일한 나라는?', opts: ['고구려', '백제', '신라'], a: 2 }, { q: '조선을 건국한 인물은?', opts: ['이성계', '왕건', '주몽'], a: 0 }],
  adult: [{ q: '3·1 운동이 일어난 해는?', opts: ['1910', '1919', '1945'], a: 1 }, { q: '신분제가 폐지된 개혁은?', opts: ['갑오개혁', '갑신정변', '병자호란'], a: 0 }],
};

function Feature() {
  const [level, setLevel] = useState<Level>('teen');
  const [mode, setMode] = useState<'learn' | 'test'>('learn');
  const [ans, setAns] = useState<Record<number, number>>({});
  const [q, setQ] = useState(''); const [tutor, setTutor] = useState(''); const [loading, setLoading] = useState(false);
  const quiz = QUIZ[level];
  const score = quiz.reduce((s, x, i) => s + (ans[i] === x.a ? 1 : 0), 0);
  const allDone = Object.keys(ans).length === quiz.length;

  const askTutor = async () => {
    if (!q.trim()) return; setLoading(true); setTutor('');
    const lv = LEVELS.find((l) => l.key === level)?.label;
    try { const r = await ask(`너는 한국사 선생님이야. ${lv} 눈높이에 맞춰 쉽고 정확하게 3~5문장으로 설명해.`, q, { temperature: 0.5, max_tokens: 400 }); setTutor(r); }
    catch { setTutor(hasKey() ? '답변 생성 실패. 다시 시도해 주세요.' : '상단에서 OpenAI API 키를 입력하면 AI 튜터가 켜집니다.'); }
    setLoading(false);
  };

  return (
    <Stack>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{LEVELS.map((l) => <Chip key={l.key} active={level === l.key} color={M.color} onClick={() => { setLevel(l.key); setAns({}); }}>{l.label}</Chip>)}</div>
      <div style={{ display: 'flex', gap: 8 }}>{[['learn', '📖 학습'], ['test', '✏️ 시험']].map(([k, l]) => <button key={k} className="btn" onClick={() => { setMode(k as 'learn' | 'test'); setAns({}); }} style={{ background: mode === k ? M.color : 'transparent', color: mode === k ? '#fff' : 'var(--primary)', border: mode === k ? 'none' : '1px solid var(--border)' }}>{l}</button>)}</div>
      {mode === 'learn' ? (
        <Stack gap={10}>{CARDS[level].map((c, i) => <div key={i} className="box"><strong style={{ color: M.color }}>{c.title}</strong><p style={{ margin: '6px 0 0', fontSize: 14.5, lineHeight: 1.8 }}>{c.body}</p></div>)}</Stack>
      ) : (
        <Stack gap={12}>
          {quiz.map((x, qi) => (<div key={qi} className="box"><div style={{ fontWeight: 700, marginBottom: 8 }}>{qi + 1}. {x.q}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{x.opts.map((o, oi) => { const picked = ans[qi] === oi, correct = oi === x.a, answered = ans[qi] !== undefined; const bg = !answered ? 'var(--card)' : correct ? '#d1fae5' : picked ? '#fee2e2' : 'var(--card)'; return <button key={oi} disabled={answered} onClick={() => setAns((p) => ({ ...p, [qi]: oi }))} style={{ textAlign: 'left', padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border)', background: bg, cursor: answered ? 'default' : 'pointer', color: 'var(--text)', fontSize: 14 }}>{o}</button>; })}</div></div>))}
          {allDone && <div className="box" style={{ textAlign: 'center' }}><Pill color={M.color}>점수</Pill><div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{score} / {quiz.length}</div></div>}
        </Stack>
      )}
      <div className="box">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>🤖 AI 역사 튜터</div>
        <div style={{ display: 'flex', gap: 8 }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 임진왜란이 왜 중요해요?" onKeyDown={(e) => e.key === 'Enter' && askTutor()} /><button className="btn" style={{ background: M.color }} disabled={loading} onClick={askTutor}>{loading ? '…' : '질문'}</button></div>
        {tutor && <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{tutor}</p>}
      </div>
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
