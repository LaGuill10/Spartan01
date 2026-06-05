import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "Arial, sans-serif",
    background: "#fff",
    minHeight: "100vh",
    color: "#000",
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 0 80px 0",
    position: "relative",
  },
  header: {
    borderBottom: "2px solid #000",
    padding: "14px 20px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: 1 },
  subtitle: { fontSize: 12, color: "#666" },
  nav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderTop: "2px solid #000",
    display: "flex",
  },
  navBtn: (active) => ({
    flex: 1,
    padding: "12px 4px 10px",
    background: active ? "#000" : "#fff",
    color: active ? "#fff" : "#000",
    border: "none",
    borderRight: "1px solid #000",
    fontSize: 11,
    fontFamily: "Arial, sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.5,
  }),
  page: { padding: "20px 20px 0" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottom: "1px solid #000",
    paddingBottom: 6,
    marginBottom: 16,
  },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? "#000" : "#fff",
    color: variant === "primary" ? "#fff" : "#000",
    border: "2px solid #000",
    padding: "12px 24px",
    fontFamily: "Arial, sans-serif",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "block",
    width: "100%",
    marginBottom: 10,
    letterSpacing: 0.5,
  }),
  btnSmall: (active = false) => ({
    background: active ? "#000" : "#fff",
    color: active ? "#fff" : "#000",
    border: "1px solid #000",
    padding: "8px 14px",
    fontFamily: "Arial, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 6,
    marginBottom: 6,
  }),
  input: {
    border: "2px solid #000",
    padding: "14px 16px",
    fontFamily: "Arial, sans-serif",
    fontSize: 28,
    fontWeight: 700,
    width: "100%",
    textAlign: "center",
    outline: "none",
    boxSizing: "border-box",
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.1,
    padding: "20px 0",
  },
  bigLetter: {
    fontSize: 96,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1,
    padding: "10px 0",
  },
  divider: { borderTop: "1px solid #000", margin: "16px 0" },
  label: { fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  row: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  resultBox: (ok) => ({
    background: ok ? "#000" : "#fff",
    color: ok ? "#fff" : "#000",
    border: "2px solid #000",
    padding: 16,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
  }),
  stat: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e0e0e0",
    fontSize: 14,
  },
  statVal: { fontWeight: 700 },
  progress: {
    height: 4,
    background: "#e0e0e0",
    marginBottom: 20,
  },
  progressFill: (pct) => ({
    height: 4,
    background: "#000",
    width: `${pct}%`,
    transition: "width 0.2s",
  }),
  problem: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.5,
    padding: "20px 10px",
    minHeight: 100,
  },
};

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatTime(s) { return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`; }
function today() { return new Date().toISOString().slice(0,10); }
function thisWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0,10);
}
function thisMonth() { return new Date().toISOString().slice(0,7); }

// ─────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
function getStats() { return store.get("spartan_stats") || []; }
function addStat(entry) {
  const stats = getStats();
  stats.push({ ...entry, date: today(), week: thisWeek(), month: thisMonth(), ts: Date.now() });
  store.set("spartan_stats", stats.slice(-2000));
}

// ─────────────────────────────────────────────
//  GENERATORS — CALCUL PUR
// ─────────────────────────────────────────────
function genCalcProblem(difficulty = "medium") {
  const types = ["add","sub","mul","div","decimal","fraction_mul"];
  const type = randOf(types);

  if (type === "add") {
    const d = difficulty === "easy" ? [1,2] : difficulty === "medium" ? [2,3] : [3,4];
    const digits = randOf(d);
    const a = rand(10**(digits-1), 10**digits - 1);
    const b = rand(10**(digits-1), 10**digits - 1);
    return { display: `${a} + ${b}`, answer: a + b, type: "calc" };
  }
  if (type === "sub") {
    const digits = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
    const a = rand(10**(digits-1), 10**digits - 1);
    const b = rand(1, a);
    return { display: `${a} − ${b}`, answer: a - b, type: "calc" };
  }
  if (type === "mul") {
    const pairs = difficulty === "easy" ? [[1,2],[2,2]] : difficulty === "medium" ? [[2,2],[2,3]] : [[2,3],[3,3]];
    const [d1,d2] = randOf(pairs);
    const a = rand(10**(d1-1), 10**d1 - 1);
    const b = rand(10**(d2-1), 10**d2 - 1);
    return { display: `${a} × ${b}`, answer: a * b, type: "calc" };
  }
  if (type === "div") {
    const b = rand(2, difficulty === "easy" ? 9 : difficulty === "medium" ? 25 : 99);
    const result = rand(2, difficulty === "easy" ? 20 : 100);
    const a = b * result;
    return { display: `${a} ÷ ${b}`, answer: result, type: "calc" };
  }
  if (type === "decimal") {
    const ops = [
      () => { const a = rand(1,9)*0.001; const b = rand(1,9)*0.01; return { display: `${a.toFixed(3)} × ${b.toFixed(2)}`, answer: +(a*b).toPrecision(3) }; },
      () => { const a = rand(1,99)*100; const b = (rand(1,9)*0.001).toFixed(3); return { display: `${a} ÷ ${b}`, answer: +(a/parseFloat(b)).toFixed(4) }; },
      () => { const a = rand(1,9)*1000; const b = rand(1,9)*0.01; return { display: `${a} × ${b.toFixed(2)}`, answer: +(a*b) }; },
      () => { const a = rand(10,999); const b = rand(1,9)*0.01; return { display: `${a} × ${b.toFixed(2)}`, answer: +(a*b).toFixed(2) }; },
    ];
    const op = randOf(ops)();
    return { display: op.display, answer: op.answer, type: "calc" };
  }
  if (type === "fraction_mul") {
    function gcd(a,b) { return b===0?a:gcd(b,a%b); }
    const numFracs = rand(2,3);
    const fracs = Array.from({length: numFracs}, () => [rand(1,12), rand(2,12)]);
    let num = fracs.reduce((acc,f) => acc*f[0], 1);
    let den = fracs.reduce((acc,f) => acc*f[1], 1);
    const g = gcd(num, den);
    num /= g; den /= g;
    const display = fracs.map(f => `${f[0]}/${f[1]}`).join(" × ");
    const answerDisplay = den === 1 ? `${num}` : `${num}/${den}`;
    return { display, answer: +(num/den).toFixed(6), answerDisplay, isFraction: true, type: "calc" };
  }
  return genCalcProblem(difficulty);
}

// ─────────────────────────────────────────────
//  GENERATORS — PROBLÈMES
// ─────────────────────────────────────────────
const problemTemplates = [
  () => {
    const v = randOf([60,80,90,100,110,120]);
    const t = randOf([0.5,1,1.5,2,2.5,3]);
    const subject = randOf(["Un train","Une voiture","Un cycliste professionnel","Un TGV"]);
    return {
      text: `${subject} ${randOf(["roule","avance","se déplace"])} à ${v} km/h pendant ${t < 1 ? "30 minutes" : t + " heure" + (t>1?"s":"")}. Quelle distance a-t-il parcourue ?`,
      answer: v * t, unit: "km",
    };
  },
  () => {
    const dist = randOf([60,80,100,120,150,200,300]);
    const v = randOf([50,60,80,100,120]);
    return {
      text: `Une voiture parcourt ${dist} km à ${v} km/h. Combien de temps dure le trajet ? (répondre en heures, arrondir à 2 décimales)`,
      answer: +(dist/v).toFixed(2), unit: "h",
    };
  },
  () => {
    const qty = rand(2,8);
    const price = rand(1,9) + 0.5 * rand(0,1);
    const total = qty * price;
    return {
      text: `${qty} ${randOf(["pommes","oranges","yaourts","stylos","cahiers"])} coûtent ${total.toFixed(2)} €. Quel est le prix d'une unité ?`,
      answer: +price.toFixed(2), unit: "€",
    };
  },
  () => {
    const workers = rand(3,8);
    const days = rand(4,12);
    const newWorkers = workers + rand(1,4);
    return {
      text: `${workers} ouvriers terminent un travail en ${days} jours. En combien de jours ${newWorkers} ouvriers feront-ils le même travail ? (arrondir à 1 décimale)`,
      answer: +((workers * days) / newWorkers).toFixed(1), unit: "jours",
    };
  },
  () => {
    const base = randOf([50,80,100,120,150,200,250,400,500,1000]);
    const pct = randOf([5,10,15,20,25,30,40,50]);
    return {
      text: `Un prix de ${base} € ${randOf(["augmente","grimpe","progresse"])} de ${pct}%. Quel est le nouveau prix ?`,
      answer: base * (1 + pct/100), unit: "€",
    };
  },
  () => {
    const base = randOf([80,100,120,150,200,250,300,400,500]);
    const pct = randOf([5,10,15,20,25,30,40,50]);
    return {
      text: `Un article coûte ${base} €. Il est soldé à −${pct}%. Quel est son prix final ?`,
      answer: base * (1 - pct/100), unit: "€",
    };
  },
  () => {
    const old = randOf([50,80,100,150,200]);
    const newVal = old + randOf([10,15,20,25,30,40,50]);
    return {
      text: `Un salaire passe de ${old} € à ${newVal} €. Quelle est la hausse en pourcentage ? (arrondir à 1 décimale)`,
      answer: +((newVal - old) / old * 100).toFixed(1), unit: "%",
    };
  },
  () => {
    const total = randOf([24,36,48,60,80,100,120]);
    const num = rand(1,4);
    const den = randOf([2,3,4,5,6]);
    const part = (total * num) / den;
    if (!Number.isInteger(part)) return null;
    return {
      text: `${num}/${den} de ${total} kg de marchandises sont vendus. Combien de kg restent ?`,
      answer: total - part, unit: "kg",
    };
  },
  () => {
    const km = randOf([1.5, 2, 2.5, 3, 5, 7.5, 10]);
    return { text: `Convertis ${km} km en mètres.`, answer: km * 1000, unit: "m" };
  },
  () => {
    const litres = randOf([0.5, 1, 1.5, 2, 2.5, 5]);
    return {
      text: `Convertis ${litres} litre${litres>1?"s":""} en centilitres.`,
      answer: litres * 100, unit: "cL",
    };
  },
  () => {
    const v1 = randOf([60, 80, 100]);
    const headstart = rand(1,3) * 10;
    const v2 = v1 + randOf([10,20,30,40]);
    return {
      text: `Voiture A a ${headstart} km d'avance et roule à ${v1} km/h. Voiture B roule à ${v2} km/h. Dans combien d'heures B rattrape-t-elle A ? (arrondir à 2 déc.)`,
      answer: +(headstart / (v2 - v1)).toFixed(2), unit: "h",
    };
  },
  () => {
    const q1 = rand(2,6), c1 = randOf([10,20,30,40,50]);
    const q2 = rand(2,6), c2 = randOf([10,20,30,40,50]);
    return {
      text: `On mélange ${q1}L d'une solution à ${c1}% avec ${q2}L à ${c2}%. Quelle est la concentration du mélange ? (arrondir à 1 déc.)`,
      answer: +((q1*c1 + q2*c2)/(q1+q2)).toFixed(1), unit: "%",
    };
  },
  () => {
    const capital = randOf([1000,2000,5000,10000]);
    const rate = randOf([2,3,4,5,6,8,10]);
    const years = rand(1,5);
    return {
      text: `Un capital de ${capital} € est placé à ${rate}% par an pendant ${years} an${years>1?"s":""}. Quel est l'intérêt simple total ?`,
      answer: capital * rate/100 * years, unit: "€",
    };
  },
];

function genProblem() {
  let p = null;
  while (!p) { p = randOf(problemTemplates)(); }
  return p;
}

// ─────────────────────────────────────────────
//  ATTENTION — N-BACK T-2
// ─────────────────────────────────────────────
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");
function genLetterSequence(count) {
  const seq = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) { seq.push(randOf(LETTERS)); continue; }
    seq.push(Math.random() < 0.4 && i >= 2 ? seq[i-2] : randOf(LETTERS));
  }
  return seq;
}
function genNumberSequence(count) { return Array.from({length: count}, () => rand(1, 19)); }

const DURATION_OPTIONS = [30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,510,540,570,600];
const COUNT_OPTIONS = [5,10,20,30,40,50,75,100,200,300];

// ─────────────────────────────────────────────
//  COMPONENT — ATTENTION MODE (N-BACK)
// ─────────────────────────────────────────────
function AttentionMode({ onBack }) {
  const TOTAL_DURATION = 50;
  const SHOW_DURATION = 3;
  const HIDE_DURATION = 5;
  const CYCLE = SHOW_DURATION + HIDE_DURATION;
  const MAX_PAIRS = Math.floor(TOTAL_DURATION / CYCLE);

  const [phase, setPhase] = useState("intro");
  const [elapsed, setElapsed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [letters, setLetters] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [letterAnswers, setLetterAnswers] = useState([]);
  const [visible, setVisible] = useState(false);
  const [sumInput, setSumInput] = useState("");
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  function start() {
    const seq = genLetterSequence(MAX_PAIRS);
    const nums = genNumberSequence(MAX_PAIRS);
    setLetters(seq);
    setNumbers(nums);
    setLetterAnswers(Array(MAX_PAIRS).fill(null));
    setCurrentIdx(0);
    setElapsed(0);
    setVisible(true);
    setPhase("running");
  }

  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 0.1;
        if (next >= TOTAL_DURATION) {
          clearInterval(timerRef.current);
          setVisible(false);
          setPhase("sum_input");
          return TOTAL_DURATION;
        }
        const cyclePos = next % CYCLE;
        setCurrentIdx(Math.floor(next / CYCLE));
        setVisible(cyclePos < SHOW_DURATION);
        return next;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function answerLetter(same) {
    if (currentIdx < 2) return;
    setLetterAnswers(prev => {
      const copy = [...prev];
      copy[currentIdx] = same;
      return copy;
    });
  }

  function submitSum() {
    const correctSum = numbers.reduce((a,b) => a+b, 0);
    const userSum = parseInt(sumInput, 10);
    const correctLetters = letters.map((l, i) => i < 2 ? null : l === letters[i-2]);
    let letterScore = 0, letterTotal = 0;
    for (let i = 2; i < letters.length; i++) {
      letterTotal++;
      if (letterAnswers[i] === correctLetters[i]) letterScore++;
    }
    setResult({ correctSum, userSum, letterScore, letterTotal, numbers, letters, correctLetters });
    addStat({ mode: "attention", letterScore, letterTotal, sumCorrect: userSum === correctSum, correctSum, userSum });
    setPhase("result");
  }

  if (phase === "intro") return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Division d'Attention</div>
      <p style={{fontSize:14, lineHeight:1.7, marginBottom:20}}>
        <b>Règle :</b> Une lettre (haut) et un nombre (bas) apparaissent ensemble pendant <b>3 secondes</b>,
        disparaissent pendant <b>5 secondes</b>. Durée totale : <b>50 secondes</b>.
        <br/><br/>
        • À partir de la <b>3e lettre</b> : indique si elle est identique à celle d'<b>il y a 2 tours</b> (t−2).
        <br/>• Mémorise la <b>somme des nombres</b> — tu devras la donner à la fin.
      </p>
      <button style={S.btn()} onClick={start}>COMMENCER</button>
      <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
    </div>
  );

  if (phase === "running") {
    const pct = (elapsed / TOTAL_DURATION) * 100;
    const canAnswer = currentIdx >= 2 && visible;
    const alreadyAnswered = letterAnswers[currentIdx] !== null;
    return (
      <div style={S.page}>
        <div style={S.progressFill(pct)} />
        <div style={{...S.progress, marginTop: 0}} />
        <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:20}}>
          <span>Tour {currentIdx+1}/{MAX_PAIRS}</span>
          <span style={{fontVariantNumeric:"tabular-nums"}}>{(TOTAL_DURATION - elapsed).toFixed(0)}s</span>
        </div>
        <div style={{border:"2px solid #000", marginBottom:12, minHeight:120, display:"flex", alignItems:"center", justifyContent:"center"}}>
          {visible ? <div style={S.bigLetter}>{letters[currentIdx]}</div> : <div style={{color:"#ccc", fontSize:48}}>—</div>}
        </div>
        <div style={{border:"2px solid #000", marginBottom:20, minHeight:100, display:"flex", alignItems:"center", justifyContent:"center"}}>
          {visible ? <div style={S.bigNumber}>{numbers[currentIdx]}</div> : <div style={{color:"#ccc", fontSize:48}}>—</div>}
        </div>
        {currentIdx >= 2 && (
          <div>
            <div style={{...S.label, textAlign:"center"}}>Cette lettre = lettre de t−2 ?</div>
            <div style={{display:"flex", gap:10}}>
              <button
                style={{...S.btn(alreadyAnswered && letterAnswers[currentIdx]===true ? "primary":"secondary"), flex:1, marginBottom:0, opacity: canAnswer?1:0.4}}
                onClick={() => canAnswer && answerLetter(true)}
              >OUI</button>
              <button
                style={{...S.btn(alreadyAnswered && letterAnswers[currentIdx]===false ? "primary":"secondary"), flex:1, marginBottom:0, opacity: canAnswer?1:0.4}}
                onClick={() => canAnswer && answerLetter(false)}
              >NON</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "sum_input") return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Quelle est la somme des nombres ?</div>
      <p style={{fontSize:13, color:"#666", marginBottom:20}}>Tu as vu {numbers.length} nombres entre 1 et 19. Leur somme ?</p>
      <input style={S.input} type="number" value={sumInput} onChange={e => setSumInput(e.target.value)} autoFocus placeholder="?" />
      <button style={{...S.btn(), marginTop:16}} onClick={submitSum} disabled={!sumInput}>VALIDER</button>
    </div>
  );

  if (phase === "result" && result) {
    const sumOk = result.userSum === result.correctSum;
    const letterPct = result.letterTotal > 0 ? Math.round(result.letterScore/result.letterTotal*100) : 0;
    return (
      <div style={S.page}>
        <div style={S.sectionTitle}>Résultat</div>
        <div style={S.resultBox(letterPct === 100)}>
          Lettres : {result.letterScore}/{result.letterTotal} correct ({letterPct}%)
        </div>
        <div style={S.resultBox(sumOk)}>
          Somme : tu as répondu <b>{result.userSum}</b> — correct : <b>{result.correctSum}</b>{sumOk ? " ✓" : " ✗"}
        </div>
        <div style={S.divider} />
        <div style={{fontSize:12, marginBottom:20}}>
          <div style={S.label}>Détail des lettres (à partir du tour 3)</div>
          {result.letters.map((l, i) => {
            if (i < 2) return null;
            const expected = result.correctLetters[i];
            const given = letterAnswers[i];
            const ok = given === expected;
            return (
              <div key={i} style={{...S.stat, color: ok?"#000":"#999"}}>
                <span>Tour {i+1} : {l} {expected ? "= t−2 (OUI)" : "≠ t−2 (NON)"}</span>
                <span style={{fontWeight:700}}>{given === null ? "—" : given ? "OUI" : "NON"} {ok?"✓":"✗"}</span>
              </div>
            );
          })}
          <div style={S.divider} />
          <div style={S.label}>Nombres affichés</div>
          <div style={{fontSize:14}}>{result.numbers.join(" + ")} = <b>{result.correctSum}</b></div>
        </div>
        <button style={S.btn()} onClick={start}>REJOUER</button>
        <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────
//  COMPONENT — SHELL GAME (BONNETEAU)
// ─────────────────────────────────────────────
function ShellGame({ onBack }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const totalRounds = 8;
  const [animating, setAnimating] = useState(false);
  const [guessed, setGuessed] = useState(false);
  const [lastGuessOk, setLastGuessOk] = useState(null);
  const [currentBall, setCurrentBall] = useState(0);
  const [revealing, setRevealing] = useState(false);

  function startGame() {
    const ball = rand(0,2);
    setCurrentBall(ball);
    setRound(1);
    setScore(0);
    setRevealing(true);
    setPhase("running");
    setTimeout(() => { setRevealing(false); startShuffle(ball); }, 1500);
  }

  function startShuffle(ball) {
    setGuessed(false);
    setLastGuessOk(null);
    const numSwaps = 3 + rand(0,3);
    let delay = 0;
    let cb = ball;
    for (let i = 0; i < numSwaps; i++) {
      const a = rand(0,2);
      let c = rand(0,2);
      while (c === a) c = rand(0,2);
      delay += 400;
      const _a=a, _c=c;
      setTimeout(() => {
        setCurrentBall(prev => {
          if (prev === _a) return _c;
          if (prev === _c) return _a;
          return prev;
        });
      }, delay);
    }
    setTimeout(() => setAnimating(false), delay + 100);
    setAnimating(true);
  }

  function guess(cupIdx) {
    if (animating || guessed) return;
    const ok = cupIdx === currentBall;
    setLastGuessOk(ok);
    if (ok) setScore(s => s+1);
    setGuessed(true);
    setRevealing(true);
    setTimeout(() => {
      setRevealing(false);
      if (round >= totalRounds) {
        setPhase("result");
        addStat({ mode:"shell", score: score+(ok?1:0), total: totalRounds });
      } else {
        const newBall = rand(0,2);
        setCurrentBall(newBall);
        setRound(r => r+1);
        setRevealing(true);
        setTimeout(() => { setRevealing(false); startShuffle(newBall); }, 1500);
      }
    }, 1200);
  }

  const CUP_LABELS = ["A","B","C"];

  if (phase === "intro") return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Bonneteau</div>
      <p style={{fontSize:14, lineHeight:1.7, marginBottom:20}}>
        Une balle est cachée sous un verre. Les verres bougent — suis la balle avec les yeux. Indique sous quel verre elle se trouve à la fin.
        <br/><br/><b>{totalRounds} manches.</b>
      </p>
      <button style={S.btn()} onClick={startGame}>COMMENCER</button>
      <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
    </div>
  );

  if (phase === "running") return (
    <div style={S.page}>
      <div style={{...S.stat, border:"none", marginBottom:16}}>
        <span>Manche {round}/{totalRounds}</span>
        <span style={S.statVal}>Score : {score}</span>
      </div>
      <div style={{display:"flex", gap:16, marginBottom:24, justifyContent:"center"}}>
        {[0,1,2].map(i => (
          <div key={i} style={{flex:1, textAlign:"center"}}>
            <div
              style={{
                height:80, border:"3px solid #000",
                background: revealing && currentBall===i ? "#e0e0e0" : "#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:32, fontWeight:700,
                cursor: (!animating && !guessed)?"pointer":"default",
                transition:"background 0.2s",
              }}
              onClick={() => guess(i)}
            >
              {revealing && currentBall === i ? "●" : CUP_LABELS[i]}
            </div>
            {lastGuessOk !== null && guessed && i === currentBall && <div style={{fontSize:11, fontWeight:700, marginTop:3}}>BALLE</div>}
          </div>
        ))}
      </div>
      {animating && <div style={{textAlign:"center", fontSize:13, color:"#666"}}>Regarde...</div>}
      {!animating && !guessed && <div style={{textAlign:"center", fontSize:14, fontWeight:700}}>Où est la balle ?</div>}
      {guessed && (
        <div style={{...S.resultBox(lastGuessOk === true), marginTop:16}}>
          {lastGuessOk ? "✓ Bien vu !" : "✗ Raté"}
        </div>
      )}
    </div>
  );

  if (phase === "result") return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Résultat</div>
      <div style={S.resultBox(score >= totalRounds*0.7)}>
        {score} / {totalRounds} ({Math.round(score/totalRounds*100)}%)
      </div>
      <button style={{...S.btn(), marginTop:16}} onClick={startGame}>REJOUER</button>
      <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
    </div>
  );
  return null;
}

// ─────────────────────────────────────────────
//  COMPONENT — CALCUL MODE
// ─────────────────────────────────────────────
function CalcMode({ onBack }) {
  const [configured, setConfigured] = useState(false);
  const [mode, setMode] = useState("duration");
  const [duration, setDuration] = useState(60);
  const [countTarget, setCountTarget] = useState(20);
  const [subMode, setSubMode] = useState("calc");
  const [difficulty, setDifficulty] = useState("medium");
  const [phase, setPhase] = useState("waiting");
  const [current, setCurrent] = useState(null);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [stats, setStats] = useState({ correct:0, wrong:0, total:0 });
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);

  function nextQuestion() {
    let q;
    if (subMode === "calc") q = genCalcProblem(difficulty);
    else if (subMode === "problem") q = genProblem();
    else q = Math.random() < 0.5 ? genCalcProblem(difficulty) : genProblem();
    setCurrent(q);
    setAnswer("");
  }

  function startGame() {
    setPhase("running");
    setStats({correct:0, wrong:0, total:0});
    setHistory([]);
    setTimeLeft(duration);
    nextQuestion();
    if (mode === "duration") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase("result"); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  }

  function submit() {
    if (!answer.trim() || !current) return;
    const userAns = parseFloat(answer.replace(",","."));
    if (isNaN(userAns)) return;
    const tol = Math.abs(current.answer) < 1 ? 0.0001 : 0.01;
    const ok = Math.abs(userAns - current.answer) <= tol * Math.max(1, Math.abs(current.answer));
    const newStats = { correct: stats.correct+(ok?1:0), wrong: stats.wrong+(ok?0:1), total: stats.total+1 };
    setStats(newStats);
    setHistory(prev => [...prev, {
      q: current.display || current.text,
      userAns: answer,
      correct: current.answerDisplay || String(current.answer),
      ok,
    }]);
    if (mode === "count" && newStats.total >= countTarget) {
      addStat({ mode:"calc", subMode, correct:newStats.correct, total:countTarget, difficulty });
      setPhase("result");
    } else {
      nextQuestion();
    }
  }

  useEffect(() => {
    if (phase === "result" && mode === "duration") {
      clearInterval(timerRef.current);
      addStat({ mode:"calc", subMode, correct:stats.correct, total:stats.total, difficulty });
    }
  }, [phase]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (!configured) return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Calcul / Problèmes</div>
      <div style={S.label}>Type d'exercice</div>
      <div style={S.row}>
        {[["calc","Calcul pur"],["problem","Problèmes"],["mixed","Mixte"]].map(([v,l]) => (
          <button key={v} style={S.btnSmall(subMode===v)} onClick={() => setSubMode(v)}>{l}</button>
        ))}
      </div>
      <div style={S.label}>Difficulté</div>
      <div style={S.row}>
        {[["easy","Facile"],["medium","Moyen"],["hard","Difficile"]].map(([v,l]) => (
          <button key={v} style={S.btnSmall(difficulty===v)} onClick={() => setDifficulty(v)}>{l}</button>
        ))}
      </div>
      <div style={S.divider} />
      <div style={S.label}>Mode</div>
      <div style={S.row}>
        <button style={S.btnSmall(mode==="duration")} onClick={() => setMode("duration")}>Durée</button>
        <button style={S.btnSmall(mode==="count")} onClick={() => setMode("count")}>Nb de calculs</button>
      </div>
      {mode === "duration" && (<>
        <div style={S.label}>Durée</div>
        <div style={{...S.row, flexWrap:"wrap"}}>
          {DURATION_OPTIONS.map(d => (
            <button key={d} style={S.btnSmall(duration===d)} onClick={() => setDuration(d)}>{formatTime(d)}</button>
          ))}
        </div>
      </>)}
      {mode === "count" && (<>
        <div style={S.label}>Nombre de calculs</div>
        <div style={{...S.row, flexWrap:"wrap"}}>
          {COUNT_OPTIONS.map(c => (
            <button key={c} style={S.btnSmall(countTarget===c)} onClick={() => setCountTarget(c)}>{c}</button>
          ))}
        </div>
      </>)}
      <button style={S.btn()} onClick={() => { setConfigured(true); startGame(); }}>LANCER</button>
      <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
    </div>
  );

  if (phase === "running" && current) {
    const pct = mode === "duration" ? (timeLeft / duration) * 100 : (stats.total / countTarget) * 100;
    return (
      <div style={S.page}>
        <div style={S.progressFill(mode==="duration"?pct:100-pct)} />
        <div style={{...S.progress, marginTop:0}} />
        <div style={{display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:20}}>
          {mode === "duration"
            ? <span style={{fontVariantNumeric:"tabular-nums", fontWeight:700}}>{formatTime(timeLeft)}</span>
            : <span>{stats.total}/{countTarget}</span>}
          <span>✓ {stats.correct} &nbsp;✗ {stats.wrong}</span>
        </div>
        {current.type === "calc" ? (
          <div style={S.problem}>{current.display}</div>
        ) : (
          <div style={{...S.problem, fontSize:16, fontWeight:400, textAlign:"left"}}>
            {current.text}
            {current.unit && <span style={{fontSize:12, color:"#666"}}> (répondre en {current.unit})</span>}
          </div>
        )}
        <input
          style={S.input}
          type="number"
          step="any"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter") submit(); }}
          autoFocus
          placeholder="?"
        />
        <button style={{...S.btn(), marginTop:12}} onClick={submit}>VALIDER →</button>
        {history.length > 0 && (
          <div style={{marginTop:16, fontSize:12}}>
            {history.slice(-3).reverse().map((h,i) => (
              <div key={i} style={{...S.stat, color: h.ok?"#000":"#999"}}>
                <span style={{flex:1, marginRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{h.q}</span>
                <span>{h.ok?"✓":` ✗ ${h.correct}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (phase === "result") return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Résultat</div>
      <div style={S.resultBox(stats.correct/Math.max(1,stats.total) >= 0.8)}>
        {stats.correct}/{stats.total} — {Math.round(stats.correct/Math.max(1,stats.total)*100)}%
      </div>
      <div style={{fontSize:13, marginBottom:20}}>
        {mode === "duration" && <div style={S.stat}><span>Durée</span><span style={S.statVal}>{formatTime(duration)}</span></div>}
        {mode === "count" && <div style={S.stat}><span>Objectif</span><span style={S.statVal}>{countTarget} calculs</span></div>}
        <div style={S.stat}><span>Corrects</span><span style={S.statVal}>{stats.correct}</span></div>
        <div style={S.stat}><span>Erreurs</span><span style={S.statVal}>{stats.wrong}</span></div>
        <div style={S.stat}><span>Calculs/min</span><span style={S.statVal}>{mode==="duration"?Math.round(stats.total/duration*60):"—"}</span></div>
      </div>
      <div style={{fontSize:12, marginBottom:20}}>
        <div style={S.label}>Historique</div>
        {history.slice(-20).reverse().map((h,i) => (
          <div key={i} style={{...S.stat, color:h.ok?"#000":"#999"}}>
            <span style={{flex:1, marginRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{h.q}</span>
            <span style={{whiteSpace:"nowrap"}}>{h.userAns} {h.ok?"✓":`✗ (${h.correct})`}</span>
          </div>
        ))}
      </div>
      <button style={S.btn()} onClick={() => { setConfigured(false); setPhase("waiting"); setStats({correct:0,wrong:0,total:0}); }}>REJOUER</button>
      <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────
//  COMPONENT — HOME
// ─────────────────────────────────────────────
function Home({ setTab }) {
  const stats = getStats();
  const todayStats = stats.filter(s => s.date === today());
  const calcToday = todayStats.filter(s=>s.mode==="calc").reduce((a,s)=>a+(s.total||0),0);
  return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Spartan 01</div>
      <div style={{fontSize:13, color:"#666", marginBottom:24}}>Entraînement calcul mental</div>
      <div style={S.label}>Modes d'entraînement</div>
      <button style={S.btn()} onClick={() => setTab("attention")}>Division d'attention</button>
      <button style={S.btn()} onClick={() => setTab("calc")}>Calcul mental / Problèmes</button>
      <div style={S.divider} />
      <div style={S.label}>Aujourd'hui</div>
      <div style={S.stat}><span>Sessions</span><span style={S.statVal}>{todayStats.length}</span></div>
      <div style={S.stat}><span>Calculs effectués</span><span style={S.statVal}>{calcToday}</span></div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  COMPONENT — STATS
// ─────────────────────────────────────────────
function StatsPage() {
  const all = getStats();
  const wk = thisWeek();
  const mo = thisMonth();
  const td = today();

  function calcBlock(label, items) {
    const ci = items.filter(s=>s.mode==="calc");
    const total = ci.reduce((a,s)=>a+(s.total||0),0);
    const correct = ci.reduce((a,s)=>a+(s.correct||0),0);
    const pct = total > 0 ? Math.round(correct/total*100) : null;
    return (
      <div style={{marginBottom:20}}>
        <div style={S.label}>{label}</div>
        <div style={S.stat}><span>Sessions</span><span style={S.statVal}>{items.length}</span></div>
        <div style={S.stat}><span>Calculs effectués</span><span style={S.statVal}>{total}</span></div>
        {pct !== null && <div style={S.stat}><span>Taux de réussite</span><span style={S.statVal}>{pct}%</span></div>}
        <div style={S.stat}><span>Sessions Attention</span><span style={S.statVal}>{items.filter(s=>s.mode==="attention").length}</span></div>
        <div style={S.stat}><span>Sessions Bonneteau</span><span style={S.statVal}>{items.filter(s=>s.mode==="shell").length}</span></div>
      </div>
    );
  }

  const days = Array.from({length:14}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i); return d.toISOString().slice(0,10);
  });
  const dayData = days.map(d => ({
    label: d.slice(5),
    n: all.filter(s=>s.date===d&&s.mode==="calc").reduce((a,s)=>a+(s.total||0),0),
  }));
  const maxN = Math.max(1, ...dayData.map(d=>d.n));

  return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Statistiques</div>
      {calcBlock("Aujourd'hui", all.filter(s=>s.date===td))}
      <div style={S.divider} />
      {calcBlock("Cette semaine", all.filter(s=>s.date>=wk))}
      <div style={S.divider} />
      {calcBlock("Ce mois", all.filter(s=>s.date&&s.date.startsWith(mo)))}
      <div style={S.divider} />
      {calcBlock("Total", all)}
      <div style={S.divider} />
      <div style={S.label}>Calculs / jour (14 derniers jours)</div>
      <div style={{display:"flex", alignItems:"flex-end", gap:2, height:80, marginBottom:4}}>
        {dayData.map((d,i) => (
          <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
            <div style={{background:"#000", width:"100%", height: d.n===0?1:Math.round(d.n/maxN*70)}} />
          </div>
        ))}
      </div>
      <div style={{display:"flex", gap:2}}>
        {dayData.map((d,i) => (
          <div key={i} style={{flex:1, fontSize:8, textAlign:"center", color:"#666"}}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  COMPONENT — ATTENTION HUB
// ─────────────────────────────────────────────
function AttentionHub({ onBack }) {
  const [sub, setSub] = useState(null);
  if (sub === "nback") return <AttentionMode onBack={() => setSub(null)} />;
  if (sub === "shell") return <ShellGame onBack={() => setSub(null)} />;
  return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Division d'Attention</div>
      <div style={{fontSize:13, color:"#666", marginBottom:20}}>Choisis un exercice</div>
      <button style={S.btn()} onClick={() => setSub("nback")}>Lettres + Somme (N-back t−2)</button>
      <button style={S.btn()} onClick={() => setSub("shell")}>Bonneteau (balle sous verre)</button>
      <button style={S.btn("secondary")} onClick={onBack}>← Retour</button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");

  let content;
  if (tab === "home") content = <Home setTab={setTab} />;
  else if (tab === "attention") content = <AttentionHub onBack={() => setTab("home")} />;
  else if (tab === "calc") content = <CalcMode onBack={() => setTab("home")} />;
  else if (tab === "stats") content = <StatsPage />;

  return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.title}>SPARTAN 01</span>
        <span style={S.subtitle}>calcul mental</span>
      </div>
      <div>{content}</div>
      <nav style={S.nav}>
        {[["home","ACCUEIL"],["attention","ATTENTION"],["calc","CALCUL"],["stats","STATS"]].map(([id,label]) => (
          <button key={id} style={S.navBtn(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}
