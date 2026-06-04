import { useState } from 'react';
import { Hero, Stack, Chip, Pill, type Meta } from './ui';

const M: Meta = { id: 8, icon: '📜', title: '나이대별 한국사 학습·시험 앱', tagline: '연령대별 난이도로 학습하고 시험까지', members: ['이유민'], color: '#9333ea' };

type Level = 'kid' | 'teen' | 'adult';
const LEVELS: { key: Level; label: string }[] = [{ key: 'kid', label: '어린이' }, { key: 'teen', label: '청소년' }, { key: 'adult', label: '성인' }];

const CARDS: Record<Level, { title: string; body: string }[]> = {
  kid: [
    { title: '단군 이야기', body: '우리나라 최초의 나라는 고조선이에요. 단군왕검이 세웠다고 전해져요.' },
    { title: '세종대왕', body: '한글(훈민정음)을 만들어 백성이 글을 쉽게 읽고 쓰게 해주셨어요.' },
    { title: '이순신 장군', body: '거북선으로 바다에서 나라를 지킨 훌륭한 장군이에요.' },
  ],
  teen: [
    { title: '삼국 시대', body: '고구려·백제·신라가 경쟁했고, 신라가 삼국을 통일했습니다.' },
    { title: '조선 건국', body: '1392년 이성계가 조선을 세우고 한양을 도읍으로 삼았습니다.' },
    { title: '임진왜란', body: '1592년 일본의 침략에 맞서 이순신과 의병이 활약했습니다.' },
  ],
  adult: [
    { title: '갑오개혁', body: '1894년 신분제 폐지 등 근대적 제도 개혁이 추진되었습니다.' },
    { title: '3·1 운동', body: '1919년 전국적 비폭력 독립운동으로 임시정부 수립의 계기가 되었습니다.' },
    { title: '산업화와 민주화', body: '20세기 후반 압축 성장과 1987년 민주화를 거쳐 오늘에 이릅니다.' },
  ],
};

const QUIZ: Record<Level, { q: string; opts: string[]; a: number }[]> = {
  kid: [
    { q: '한글을 만든 왕은?', opts: ['세종대왕', '단군', '이순신'], a: 0 },
    { q: '우리나라 최초의 나라는?', opts: ['신라', '고조선', '조선'], a: 1 },
  ],
  teen: [
    { q: '삼국을 통일한 나라는?', opts: ['고구려', '백제', '신라'], a: 2 },
    { q: '조선을 건국한 인물은?', opts: ['이성계', '왕건', '주몽'], a: 0 },
  ],
  adult: [
    { q: '3·1 운동이 일어난 해는?', opts: ['1910', '1919', '1945'], a: 1 },
    { q: '신분제가 폐지된 개혁은?', opts: ['갑오개혁', '갑신정변', '병자호란'], a: 0 },
  ],
};

export default function App() {
  const [level, setLevel] = useState<Level>('teen');
  const [mode, setMode] = useState<'learn' | 'test'>('learn');
  const [ans, setAns] = useState<Record<number, number>>({});
  const quiz = QUIZ[level];
  const score = quiz.reduce((s, q, i) => s + (ans[i] === q.a ? 1 : 0), 0);
  const allDone = Object.keys(ans).length === quiz.length;

  return (
    <div className="wrap">
      <Hero m={M} />
      <main style={{ marginTop: 22 }}>
        <Stack>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{LEVELS.map((l) => <Chip key={l.key} active={level === l.key} color={M.color} onClick={() => { setLevel(l.key); setAns({}); }}>{l.label}</Chip>)}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['learn', '📖 학습'], ['test', '✏️ 시험']].map(([k, l]) => (
              <button key={k} className="btn" onClick={() => { setMode(k as 'learn' | 'test'); setAns({}); }} style={{ background: mode === k ? M.color : 'transparent', color: mode === k ? '#fff' : 'var(--primary)', border: mode === k ? 'none' : '1px solid var(--border)' }}>{l}</button>
            ))}
          </div>

          {mode === 'learn' ? (
            <Stack gap={10}>
              {CARDS[level].map((c, i) => (
                <div key={i} className="box"><strong style={{ color: M.color }}>{c.title}</strong><p style={{ margin: '6px 0 0', fontSize: 14.5, lineHeight: 1.8 }}>{c.body}</p></div>
              ))}
            </Stack>
          ) : (
            <Stack gap={12}>
              {quiz.map((q, qi) => (
                <div key={qi} className="box">
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{qi + 1}. {q.q}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.opts.map((o, oi) => {
                      const picked = ans[qi] === oi; const correct = oi === q.a; const answered = ans[qi] !== undefined;
                      const bg = !answered ? 'var(--card)' : correct ? '#d1fae5' : picked ? '#fee2e2' : 'var(--card)';
                      return <button key={oi} disabled={answered} onClick={() => setAns((p) => ({ ...p, [qi]: oi }))} style={{ textAlign: 'left', padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border)', background: bg, cursor: answered ? 'default' : 'pointer', color: 'var(--text)', fontSize: 14 }}>{o}</button>;
                    })}
                  </div>
                </div>
              ))}
              {allDone && <div className="box" style={{ textAlign: 'center' }}><Pill color={M.color}>점수</Pill><div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{score} / {quiz.length}</div></div>}
            </Stack>
          )}
        </Stack>
      </main>
    </div>
  );
}
