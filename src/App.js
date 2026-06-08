import { useState, useEffect, useRef, useCallback } from "react";

const PINK = "#f472b6";
const GREEN_BG = "#dcfce7";
const GREEN_BORDER = "#16a34a";
const RED_BG = "#fee2e2";
const RED_BORDER = "#dc2626";

const S = {
  app: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    background: "#fafafa",
    minHeight: "100vh",
    color: "#111",
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 0 80px 0",
  },
  header: {
    borderBottom: "2px solid #111",
    padding: "14px 20px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    background: "#fff",
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: "#888" },
  nav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderTop: "1.5px solid #e0e0e0",
    display: "flex",
  },
  navBtn: (active) => ({
    flex: 1,
    padding: "11px 4px 9px",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#555",
    border: "none",
    borderRight: "1px solid #e0e0e0",
    fontSize: 10,
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.3,
  }),
  page: { padding: "20px 20px 0" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    borderBottom: "1.5px solid #111",
    paddingBottom: 6,
    marginBottom: 16,
    color: "#111",
  },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? "#111" : "#fff",
    color: variant === "primary" ? "#fff" : "#111",
    border: "1.5px solid #111",
    padding: "12px 24px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "block",
    width: "100%",
    marginBottom: 10,
    borderRadius: 10,
    letterSpacing: 0.3,
  }),
  btnSmall: (active = false, pink = false) => ({
    background: active ? (pink ? PINK : "#111") : "#fff",
    color: active ? "#fff" : "#111",
    border: `1.5px solid ${active && pink ? PINK : "#ddd"}`,
    padding: "7px 13px",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 8,
  }),
  input: {
    border: "1.5px solid #ddd",
    padding: "14px 16px",
    fontFamily: "inherit",
    fontSize: 28,
    fontWeight: 700,
    width: "100%",
    textAlign: "center",
    outline: "none",
    borderRadius: 10,
    boxSizing: "border-box",
    background: "#fff",
  },
  bigNumber: { fontSize: 68, fontWeight: 700, textAlign: "center", lineHeight: 1.1, padding: "16px 0" },
  bigLetter: { fontSize: 88, fontWeight: 700, textAlign: "center", lineHeight: 1, padding: "8px 0" },
  divider: { borderTop: "1px solid #e5e5e5", margin: "14px 0" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, color: "#555" },
  row: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 },
  stat: { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 },
  statVal: { fontWeight: 700 },
  progress: { height: 3, background: "#eee", marginBottom: 16, borderRadius: 2 },
  progressFill: (pct) => ({ height: 3, background: "#111", width: `${pct}%`, transition: "width 0.2s", borderRadius: 2 }),
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "14px 16px", marginBottom: 10 },
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatTime(s) { return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`; }
function today() { return new Date().toISOString().slice(0,10); }
function thisWeek() { const d = new Date(); const day = d.getDay()||7; d.setDate(d.getDate()-day+1); return d.toISOString().slice(0,10); }
function thisMonth() { return new Date().toISOString().slice(0,7); }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

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

function makeDecimalQCMAnswers(correct) {
  const answers = [correct];
  const shifts = [10, 100, 0.1, 0.01, 1000, 0.001];
  for (const s of shifts) {
    if (answers.length >= 4) break;
    const candidate = +(correct * s).toPrecision(2);
    if (candidate === correct || answers.includes(candidate) || candidate <= 0) continue;
    answers.push(candidate);
  }
  while (answers.length < 4) {
    const factor = randOf([10, 100, 0.1, 0.01]);
    const candidate = +(correct * factor * (0.9 + Math.random() * 0.2)).toPrecision(2);
    if (!answers.includes(candidate) && candidate > 0) answers.push(candidate);
  }
  return answers.sort(() => Math.random() - 0.5);
}

function makeQCMAnswers(correct) {
  const answers = [correct];
  let attempts = 0;
  while (answers.length < 4 && attempts < 200) {
    attempts++;
    const factor = 1.1 + Math.random() * 0.2;
    const ops = [correct * factor, correct / factor, correct * factor * factor, correct / (factor * factor)];
    const candidate = Math.round(randOf(ops) * 10000) / 10000;
    if (candidate === correct || candidate <= 0) continue;
    if (answers.some(a => Math.abs(a - candidate) / Math.abs(correct || 1) < 0.05)) continue;
    answers.push(candidate);
  }
  return answers.sort(() => Math.random() - 0.5);
}

function genCalcProblem(difficulty = "moyen") {
  const isEasy = difficulty === "facile";
  const isHard = difficulty === "débile";
  const types = isEasy
    ? ["add","sub","mul","div"]
    : isHard
    ? ["add","sub","mul","div","decimal_mul","decimal_div","decimal_add","fraction_mul"]
    : ["add","sub","mul","div","fraction_mul"];
  const type = randOf(types);

  if (type === "add") {
    const maxD = isEasy ? 3 : isHard ? 5 : 4;
    const d1 = rand(2, maxD), d2 = rand(2, Math.min(maxD, d1));
    const a = rand(10**(d1-1), 10**d1-1), b = rand(10**(d2-1), 10**d2-1);
    return { display: `${a} + ${b}`, answer: a+b, type:"calc", inputMode:"keyboard" };
  }
  if (type === "sub") {
    const maxD = isEasy ? 3 : isHard ? 5 : 4;
    const a = rand(10**(maxD-1), 10**maxD-1), b = rand(1, a);
    return { display: `${a} − ${b}`, answer: a-b, type:"calc", inputMode:"keyboard" };
  }
  if (type === "mul") {
    const a = isEasy ? rand(2,99) : rand(10,999), b = isEasy ? rand(2,9) : rand(10,99);
    return { display: `${a} × ${b}`, answer: a*b, type:"calc", inputMode:"keyboard" };
  }
  if (type === "div") {
    const b = rand(2, isEasy?9:99), result = rand(2, isEasy?20:99);
    return { display: `${b*result} ÷ ${b}`, answer: result, type:"calc", inputMode:"keyboard" };
  }
  if (type === "decimal_mul") {
    const gen = () => { const exp=rand(1,3),digits=rand(1,2); let val=0; for(let i=0;i<digits;i++) val+=rand(1,9)*Math.pow(10,-(exp-i)); return +val.toFixed(4); };
    const a=gen(),b=gen(),ans=+(a*b).toPrecision(3);
    return { display:`${a} × ${b}`, answer:ans, type:"calc", inputMode:"qcm", qcmAnswers:makeDecimalQCMAnswers(ans) };
  }
  if (type === "decimal_div") {
    const gen = () => { const exp=rand(1,3),digits=rand(1,2); let val=0; for(let i=0;i<digits;i++) val+=rand(1,9)*Math.pow(10,-(exp-i)); return +val.toFixed(4); };
    const b=gen(),result=gen(),a=+(b*result).toPrecision(4),ans=+result.toPrecision(3);
    return { display:`${a} ÷ ${b}`, answer:ans, type:"calc", inputMode:"qcm", qcmAnswers:makeDecimalQCMAnswers(ans) };
  }
  if (type === "decimal_add") {
    const gen = () => { let s="0."; for(let i=0;i<rand(2,4);i++) s+=rand(1,9); return parseFloat(s); };
    const a=gen(),b=gen(),ans=+(a+b).toFixed(4);
    return { display:`${a} + ${b}`, answer:ans, type:"calc", inputMode:"qcm", qcmAnswers:makeQCMAnswers(ans) };
  }
  if (type === "fraction_mul") {
    function randomFraction() { let n,d; do { n=rand(1,11); d=rand(2,12); } while(gcd(n,d)!==1||n>=d); return [n,d]; }
    const n=rand(2,3), fracs=Array.from({length:n},randomFraction);
    let rN=fracs.reduce((a,f)=>a*f[0],1), rD=fracs.reduce((a,f)=>a*f[1],1);
    const g=gcd(rN,rD); rN/=g; rD/=g;
    if (rD===1) return genCalcProblem(difficulty);
    const display=fracs.map(f=>`${f[0]}/${f[1]}`).join(" × ");
    const answerDisplay=`${rN}/${rD}`, answerFloat=rN/rD;
    const qcmAnswers=makeQCMAnswers(answerFloat).map(a => {
      if (Math.abs(a-answerFloat)<0.0001) return answerDisplay;
      const approxN=Math.round(a*rD), g2=gcd(Math.abs(approxN),rD);
      return `${approxN/g2}/${rD/g2}`;
    });
    return { display, answer:answerFloat, answerDisplay, type:"calc", inputMode:"qcm", qcmAnswers };
  }
  return genCalcProblem(difficulty);
}

function formatHMS(totalSeconds) {
  const h=Math.floor(totalSeconds/3600), m=Math.floor((totalSeconds%3600)/60), s=totalSeconds%60;
  if (h>0) return `${h}h ${m}min${s>0?` ${s}s`:""}`;
  if (m>0) return `${m}min${s>0?` ${s}s`:""}`;
  return `${s}s`;
}
function formatAnswer(val, unit) {
  const display = Number.isInteger(val) ? String(val) : String(Math.round(val*100)/100);
  return unit ? `${display} ${unit}` : display;
}

function makeQCMProblems(correct, unit) {
  const answers = [{ val:correct, display:formatAnswer(correct,unit) }];
  let attempts=0;
  while (answers.length<4 && attempts<300) {
    attempts++;
    const r=1.1+Math.random()*0.25;
    let candidate=randOf([correct*r,correct/r,correct+correct*0.15,correct-correct*0.15]);
    if (Math.abs(correct)<10) candidate=Math.round(candidate*100)/100;
    else if (Math.abs(correct)<100) candidate=Math.round(candidate*10)/10;
    else candidate=Math.round(candidate);
    if (candidate<=0) continue;
    if (answers.some(a=>Math.abs(a.val-candidate)/Math.abs(correct||1)<0.05)) continue;
    answers.push({ val:candidate, display:formatAnswer(candidate,unit) });
  }
  return answers.sort(()=>Math.random()-0.5);
}

function makeTimedQCM(correctSeconds) {
  const answers=[{val:correctSeconds,display:formatHMS(correctSeconds)}];
  for (const d of [300,600,900,1800,-300,-600,3600]) {
    if (answers.length>=4) break;
    const c=correctSeconds+d;
    if (c<=0||answers.some(a=>a.val===c)) continue;
    answers.push({val:c,display:formatHMS(c)});
  }
  return answers.sort(()=>Math.random()-0.5);
}

const problemTemplates = [
  ()=>{ const v=randOf([60,80,90,100,110,120]),t=randOf([0.5,1,1.5,2,2.5,3]),s=randOf(["Un train","Une voiture","Un TGV"]),ans=v*t; return {text:`${s} ${randOf(["roule","avance"])} à ${v} km/h pendant ${t<1?"30 minutes":t+" h"}. Distance parcourue ?`,answer:ans,unit:"km",qcmAnswers:makeQCMProblems(ans,"km")}; },
  ()=>{ const dist=randOf([60,80,100,120,150,200,300]),v=randOf([50,60,80,100,120]),tSec=Math.round(dist/v*3600); return {text:`Une voiture parcourt ${dist} km à ${v} km/h. Durée du trajet ?`,answer:tSec,unit:"hms",qcmAnswers:makeTimedQCM(tSec)}; },
  ()=>{ const qty=rand(2,8),price=rand(1,9)+0.5*rand(0,1),total=+(qty*price).toFixed(2); return {text:`${qty} ${randOf(["pommes","oranges","yaourts","stylos"])} coûtent ${total} €. Prix unitaire ?`,answer:price,unit:"€",qcmAnswers:makeQCMProblems(price,"€")}; },
  ()=>{ const base=randOf([50,80,100,120,150,200,250,400,500]),pct=randOf([5,10,15,20,25,30]),ans=base*(1+pct/100); return {text:`Un prix de ${base} € augmente de ${pct}%. Nouveau prix ?`,answer:ans,unit:"€",qcmAnswers:makeQCMProblems(ans,"€")}; },
  ()=>{ const base=randOf([80,100,120,150,200,250,300]),pct=randOf([5,10,15,20,25,30]),ans=base*(1-pct/100); return {text:`Un article à ${base} € est soldé −${pct}%. Prix final ?`,answer:ans,unit:"€",qcmAnswers:makeQCMProblems(ans,"€")}; },
  ()=>{ const old=randOf([50,80,100,150,200]),newVal=old+randOf([10,15,20,25,30]),ans=Math.round((newVal-old)/old*100*10)/10; return {text:`Un salaire passe de ${old} € à ${newVal} €. Hausse en % ?`,answer:ans,unit:"%",qcmAnswers:makeQCMProblems(ans,"%")}; },
  ()=>{ const total=randOf([24,36,48,60,80,100,120]); let num,den,part; do{num=rand(1,4);den=randOf([2,3,4,5,6]);part=(total*num)/den;}while(!Number.isInteger(part)||gcd(num,den)!==1); const ans=total-part; return {text:`${num}/${den} de ${total} kg sont vendus. Combien restent ?`,answer:ans,unit:"kg",qcmAnswers:makeQCMProblems(ans,"kg")}; },
  ()=>{ const v1=randOf([60,80,100]),h=rand(1,3)*10,v2=v1+randOf([10,20,30]),tSec=Math.round(h/(v2-v1)*3600); return {text:`Voiture A a ${h} km d'avance à ${v1} km/h. Voiture B roule à ${v2} km/h. Quand B rattrape-t-elle A ?`,answer:tSec,unit:"hms",qcmAnswers:makeTimedQCM(tSec)}; },
  ()=>{ const capital=randOf([1000,2000,5000,10000]),rate=randOf([2,3,4,5,6,8,10]),years=rand(1,5),ans=capital*rate/100*years; return {text:`${capital} € placés à ${rate}%/an pendant ${years} an${years>1?"s":""}. Intérêt simple ?`,answer:ans,unit:"€",qcmAnswers:makeQCMProblems(ans,"€")}; },
  ()=>{ const w=rand(3,8),d=rand(4,12),nw=w+rand(1,4),ans=Math.round(w*d/nw*10)/10; return {text:`${w} ouvriers finissent en ${d} jours. ${nw} ouvriers mettent combien de jours ?`,answer:ans,unit:"jours",qcmAnswers:makeQCMProblems(ans,"jours")}; },
];

function genProblem() { let p=null; while(!p){p=randOf(problemTemplates)();} return {...p,type:"problem"}; }

function NumericKeyboard({ value, onChange, onSubmit }) {
  const keys = [["7","8","9"],["4","5","6"],["1","2","3"],[".","0","⌫"]];
  function handleKey(k) {
    if (k==="⌫") { onChange(value.slice(0,-1)); return; }
    if (k==="."&&value.includes(".")) return;
    onChange(value+k);
  }
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key>="0"&&e.key<="9") handleKey(e.key);
      else if (e.key===".") handleKey(".");
      else if (e.key==="Backspace") handleKey("⌫");
      else if (e.key==="Enter") onSubmit();
    }
    window.addEventListener("keydown",onKeyDown);
    return ()=>window.removeEventListener("keydown",onKeyDown);
  },[value]);
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:8,gap:8}}>
        <button style={{...S.btn("secondary"),flex:"0 0 auto",width:"auto",padding:"10px 16px",marginBottom:0,color:PINK,borderColor:PINK}} onClick={()=>onChange("")}>AC</button>
        <div style={{...S.input,flex:1,fontSize:24,padding:"10px 14px",minHeight:48,display:"flex",alignItems:"center",justifyContent:"center"}}>{value||<span style={{color:"#ccc"}}>?</span>}</div>
        <button style={{...S.btn(),flex:"0 0 auto",width:"auto",padding:"10px 16px",marginBottom:0}} onClick={onSubmit}>→</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {keys.flat().map((k,i)=>(
          <button key={i} style={{padding:"16px 0",fontSize:20,fontWeight:600,fontFamily:"inherit",background:k==="⌫"?"#f5f5f5":"#fff",border:"1px solid #e0e0e0",borderRadius:10,cursor:"pointer",color:k==="⌫"?"#666":"#111"}} onClick={()=>handleKey(k)}>{k}</button>
        ))}
      </div>
      <button style={{...S.btn(),marginTop:10}} onClick={onSubmit}>VALIDER</button>
    </div>
  );
}

const LEVELS = ["facile","moyen","débile"];
function DifficultySlider({ value, onChange }) {
  const idx = LEVELS.indexOf(value);
  return (
    <div style={{marginBottom:16}}>
      <div style={S.label}>Niveau</div>
      <div style={{display:"flex",border:"1.5px solid #ddd",borderRadius:10,overflow:"hidden"}}>
        {LEVELS.map((l,i)=>(
          <button key={l} style={{flex:1,padding:"9px 4px",background:i===idx?"#111":"#fff",color:i===idx?"#fff":"#555",border:"none",borderRight:i<2?"1px solid #ddd":"none",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}} onClick={()=>onChange(l)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

const DURATION_STEPS = [30,60,90,120,150,180,210,240,270,300,360,420,480,540,600];
const COUNT_OPTIONS = [5,10,20,30,40,50,75,100,200,300];

function DurationSlider({ value, onChange }) {
  const idx = DURATION_STEPS.indexOf(value)===-1 ? 1 : DURATION_STEPS.indexOf(value);
  return (
    <div style={{marginBottom:16}}>
      <div style={{...S.label,display:"flex",justifyContent:"space-between"}}><span>Durée</span><span style={{color:PINK,fontWeight:700}}>{formatTime(value)}</span></div>
      <input type="range" min={0} max={DURATION_STEPS.length-1} step={1} value={idx} onChange={e=>onChange(DURATION_STEPS[parseInt(e.target.value)])} style={{width:"100%",accentColor:"#111"}} />
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#999",marginTop:2}}><span>30s</span><span>5min</span><span>10min</span></div>
    </div>
  );
}

function QCMButtons({ options, selected, onSelect, revealed }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      {options.map((opt,i)=>{
        const isCorrect=opt.isCorrect, isSelected=selected===i;
        let bg="#fff",border="1.5px solid #ddd",color="#111";
        if (revealed) {
          if (isCorrect){bg=GREEN_BG;border=`1.5px solid ${GREEN_BORDER}`;color=GREEN_BORDER;}
          else if (isSelected){bg=RED_BG;border=`1.5px solid ${RED_BORDER}`;color=RED_BORDER;}
        } else if (isSelected) { bg="#f5f5f5";border="1.5px solid #111"; }
        return <button key={i} style={{padding:"14px 8px",background:bg,border,color,borderRadius:10,fontFamily:"inherit",fontSize:15,fontWeight:600,cursor:revealed?"default":"pointer"}} onClick={()=>!revealed&&onSelect(i)}>{opt.display}</button>;
      })}
    </div>
  );
}

function CalcMode({ onHome }) {
  const [configured,setConfigured]=useState(false);
  const [mode,setMode]=useState("duration");
  const [duration,setDuration]=useState(60);
  const [countTarget,setCountTarget]=useState(20);
  const [subMode,setSubMode]=useState("calc");
  const [difficulty,setDifficulty]=useState("moyen");
  const [phase,setPhase]=useState("waiting");
  const [current,setCurrent]=useState(null);
  const [answer,setAnswer]=useState("");
  const [qcmSelected,setQcmSelected]=useState(null);
  const [qcmRevealed,setQcmRevealed]=useState(false);
  const [timeLeft,setTimeLeft]=useState(0);
  const [stats,setStats]=useState({correct:0,wrong:0,total:0});
  const [history,setHistory]=useState([]);
  const timerRef=useRef(null);

  function nextQuestion() {
    let q;
    if (subMode==="calc") q=genCalcProblem(difficulty);
    else if (subMode==="problem") q=genProblem();
    else q=Math.random()<0.5?genCalcProblem(difficulty):genProblem();
    setCurrent(q); setAnswer(""); setQcmSelected(null); setQcmRevealed(false);
  }

  function startGame() {
    setPhase("running"); setStats({correct:0,wrong:0,total:0}); setHistory([]); setTimeLeft(duration); nextQuestion();
    if (mode==="duration") {
      timerRef.current=setInterval(()=>{
        setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);setPhase("result");return 0;}return t-1;});
      },1000);
    }
  }

  function submitKeyboard() {
    if (!answer.trim()||!current) return;
    const userAns=parseFloat(answer.replace(",","."));
    if (isNaN(userAns)) return;
    const tol=Math.abs(current.answer)<1?0.0001:0.01;
    const ok=Math.abs(userAns-current.answer)<=tol*Math.max(1,Math.abs(current.answer));
    recordAnswer(ok,answer,current.answerDisplay||String(current.answer));
  }

  function submitQCM(idx) {
    if (!current||qcmRevealed) return;
    setQcmSelected(idx); setQcmRevealed(true);
    const opts=current.qcmAnswers;
    const selectedVal=typeof opts[idx]==="object"?opts[idx].val:opts[idx];
    const ok=Math.abs(selectedVal-current.answer)/Math.max(1,Math.abs(current.answer))<0.05;
    setTimeout(()=>recordAnswer(ok,String(selectedVal),current.answerDisplay||String(current.answer)),800);
  }

  function recordAnswer(ok,userAns,correct) {
    const ns={correct:stats.correct+(ok?1:0),wrong:stats.wrong+(ok?0:1),total:stats.total+1};
    setStats(ns);
    setHistory(prev=>[...prev,{q:current.display||current.text,userAns,correct,ok}]);
    if (mode==="count"&&ns.total>=countTarget){addStat({mode:"calc",subMode,correct:ns.correct,total:countTarget,difficulty});setPhase("result");}
    else nextQuestion();
  }

  useEffect(()=>{if(phase==="result"&&mode==="duration"){clearInterval(timerRef.current);addStat({mode:"calc",subMode,correct:stats.correct,total:stats.total,difficulty});}},[phase]);
  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  if (!configured) return (
    <div style={S.page}>
      <div style={S.sectionTitle}>Calcul / Problèmes</div>
      <div style={S.label}>Type</div>
      <div style={S.row}>{[["calc","Calcul pur"],["problem","Problèmes"],["mixed","Mixte"]].map(([v,l])=><button key={v} style={S.btnSmall(subMode===v,subMode===v)} onClick={()=>setSubMode(v)}>{l}</button>)}</div>
      <DifficultySlider value={difficulty} onChange={setDifficulty} />
      <div style={S.divider}/>
      <div style={S.label}>Mode</div>
      <div style={S.row}>
        <button style={S.btnSmall(mode==="duration")} onClick={()=>setMode("duration")}>Durée</button>
        <button style={S.btnSmall(mode==="count")} onClick={()=>setMode("count")}>Nb de calculs</button>
      </div>
      {mode==="duration"&&<DurationSlider value={duration} onChange={setDuration}/>}
      {mode==="count"&&<><div style={S.label}>Nombre de calculs</div><div style={{...S.row,flexWrap:"wrap"}}>{COUNT_OPTIONS.map(c=><button key={c} style={S.btnSmall(countTarget===c)} onClick={()=>setCountTarget(c)}>{c}</button>)}</div></>}
      <button style={S.btn()} onClick={()=>{setConfigured(true);startGame();}}>LANCER</button>
      <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
    </div>
  );

  if (phase==="running"&&current) {
    const pct=mode==="duration"?(timeLeft/duration)*100:(stats.total/countTarget)*100;
    const isQCM=current.inputMode==="qcm";
    const qcmOpts=current.qcmAnswers?current.qcmAnswers.map(a=>{
      const val=typeof a==="object"?a.val:a;
      const display=typeof a==="object"?a.display:String(a);
      const isCorrect=Math.abs(val-current.answer)/Math.max(1,Math.abs(current.answer))<0.05;
      return {val,display,isCorrect};
    }):[];
    return (
      <div style={S.page}>
        <div style={S.progressFill(mode==="duration"?pct:100-pct)}/>
        <div style={{...S.progress,marginTop:0}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:16}}>
          {mode==="duration"?<span style={{fontVariantNumeric:"tabular-nums",fontWeight:700}}>{formatTime(timeLeft)}</span>:<span>{stats.total}/{countTarget}</span>}
          <span>✓ {stats.correct} &nbsp;✗ {stats.wrong}</span>
        </div>
        {current.type==="calc"
          ?<div style={{fontSize:26,fontWeight:700,textAlign:"center",padding:"16px 8px",minHeight:70}}>{current.display}</div>
          :<div style={{fontSize:15,fontWeight:400,lineHeight:1.6,padding:"12px 8px",minHeight:70}}>{current.text}</div>
        }
        {isQCM
          ?<QCMButtons options={qcmOpts} selected={qcmSelected} onSelect={submitQCM} revealed={qcmRevealed}/>
          :<NumericKeyboard value={answer} onChange={setAnswer} onSubmit={submitKeyboard}/>
        }
        {history.length>0&&<div style={{marginTop:12,fontSize:12}}>{history.slice(-3).reverse().map((h,i)=><div key={i} style={{...S.stat,color:h.ok?"#111":"#bbb"}}><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{h.q}</span><span>{h.ok?"✓":`✗ ${h.correct}`}</span></div>)}</div>}
      </div>
    );
  }

  if (phase==="result") {
    const pct=Math.round(stats.correct/Math.max(1,stats.total)*100);
    return (
      <div style={S.page}>
        <div style={S.sectionTitle}>Résultat</div>
        <div style={{...S.card,textAlign:"center",background:pct>=80?GREEN_BG:"#fff",border:`1.5px solid ${pct>=80?GREEN_BORDER:"#ddd"}`}}>
          <div style={{fontSize:36,fontWeight:700}}>{stats.correct}/{stats.total}</div>
          <div style={{fontSize:16,color:"#555"}}>{pct}%</div>
        </div>
        <div style={{fontSize:13,marginBottom:16}}>
          {mode==="duration"&&<div style={S.stat}><span>Durée</span><span style={S.statVal}>{formatTime(duration)}</span></div>}
          <div style={S.stat}><span>Corrects</span><span style={S.statVal}>{stats.correct}</span></div>
          <div style={S.stat}><span>Erreurs</span><span style={S.statVal}>{stats.wrong}</span></div>
          {mode==="duration"&&<div style={S.stat}><span>Calculs/min</span><span style={S.statVal}>{Math.round(stats.total/duration*60)}</span></div>}
        </div>
        <div style={{fontSize:12,marginBottom:16}}>
          <div style={S.label}>Historique</div>
          {history.slice(-20).reverse().map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:8,marginBottom:4,background:h.ok?GREEN_BG:RED_BG,border:`1px solid ${h.ok?GREEN_BORDER:RED_BORDER}`,fontSize:12}}>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{h.q}</span>
              <span style={{fontWeight:700,color:h.ok?GREEN_BORDER:RED_BORDER}}>{h.ok?"✓":`✗ (${h.correct})`}</span>
            </div>
          ))}
        </div>
        <button style={S.btn()} onClick={()=>{setConfigured(false);setPhase("waiting");setStats({correct:0,wrong:0,total:0});}}>REJOUER</button>
        <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
      </div>
    );
  }
  return null;
}

const LETTERS_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");
function genLetterSeq(n) {
  const seq=[];
  for(let i=0;i<n;i++){if(i<2){seq.push(randOf(LETTERS_POOL));continue;}seq.push(Math.random()<0.4?seq[i-2]:randOf(LETTERS_POOL));}
  return seq;
}
function genNumSeq(n) { return Array.from({length:n},()=>rand(1,9)); }

function T3AMode({ onHome }) {
  const TOTAL=50,SHOW=4,HIDE=4.5,CYCLE=8.5;
  const MAX=Math.floor(TOTAL/CYCLE);
  const [phase,setPhase]=useState("intro");
  const [elapsed,setElapsed]=useState(0);
  const [idx,setIdx]=useState(0);
  const [letters,setLetters]=useState([]);
  const [numbers,setNumbers]=useState([]);
  const [letterAnss,setLetterAnss]=useState([]);
  const [visible,setVisible]=useState(false);
  const [sumInput,setSumInput]=useState("");
  const [result,setResult]=useState(null);
  const timerRef=useRef(null);

  function start() {
    setLetters(genLetterSeq(MAX));setNumbers(genNumSeq(MAX));
    setLetterAnss(Array(MAX).fill(null));setIdx(0);setElapsed(0);setVisible(true);setPhase("running");
  }

  useEffect(()=>{
    if(phase!=="running")return;
    timerRef.current=setInterval(()=>{
      setElapsed(e=>{
        const next=e+0.1;
        if(next>=TOTAL){clearInterval(timerRef.current);setVisible(false);setPhase("sum_input");return TOTAL;}
        setIdx(Math.floor(next/CYCLE));
        setVisible((next%CYCLE)<SHOW);
        return next;
      });
    },100);
    return()=>clearInterval(timerRef.current);
  },[phase]);

  function answerLetter(same) {
    setLetterAnss(prev=>{const c=[...prev];c[idx]=same;return c;});
  }

  useEffect(()=>{
    function handleKey(e){
      if(phase!=="running")return;
      if(e.key==="7")answerLetter(true);
      if(e.key==="8")answerLetter(false);
    }
    window.addEventListener("keydown",handleKey);
    return()=>window.removeEventListener("keydown",handleKey);
  },[phase,idx]);

  function submitSum() {
    const correctSum=numbers.reduce((a,b)=>a+b,0);
    const userSum=parseInt(sumInput,10);
    const correctLetters=letters.map((l,i)=>i<2?null:l===letters[i-2]);
    let ls=0,lt=0;
    for(let i=2;i<letters.length;i++){lt++;if(letterAnss[i]===correctLetters[i])ls++;}
    setResult({correctSum,userSum,letterScore:ls,letterTotal:lt});
    addStat({mode:"t3a",letterScore:ls,letterTotal:lt,sumCorrect:userSum===correctSum});
    setPhase("result");
  }

  if(phase==="intro")return(
    <div style={S.page}>
      <div style={S.sectionTitle}>T3A</div>
      <p style={{fontSize:14,lineHeight:1.7,marginBottom:20}}>
        Une lettre (haut) et un nombre (bas) apparaissent <b>4s</b>, disparaissent <b>4,5s</b>. Durée : <b>50s</b>.<br/><br/>
        • À partir du 3e tour : appuie sur <b>7</b> si la lettre = celle d'il y a 2 tours, <b>8</b> sinon.<br/>
        • Mémorise la <b>somme des nombres</b>.
      </p>
      <button style={S.btn()} onClick={start}>COMMENCER</button>
      <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
    </div>
  );

  if(phase==="running"){
    const pct=(elapsed/TOTAL)*100;
    const canAns=idx>=2&&visible;
    const alr=letterAnss[idx]!==null;
    return(
      <div style={S.page}>
        <div style={S.progressFill(pct)}/>
        <div style={{...S.progress,marginTop:0}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:16}}>
          <span>Tour {idx+1}/{MAX}</span>
          <span style={{fontVariantNumeric:"tabular-nums"}}>{(TOTAL-elapsed).toFixed(0)}s</span>
        </div>
        <div style={{border:"1.5px solid #ddd",borderRadius:12,marginBottom:10,minHeight:110,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff"}}>
          {visible?<div style={S.bigLetter}>{letters[idx]}</div>:<div style={{color:"#ddd",fontSize:44}}>—</div>}
        </div>
        <div style={{border:"1.5px solid #ddd",borderRadius:12,marginBottom:16,minHeight:90,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff"}}>
          {visible?<div style={S.bigNumber}>{numbers[idx]}</div>:<div style={{color:"#ddd",fontSize:44}}>—</div>}
        </div>
        {idx>=2&&(
          <div style={{display:"flex",gap:10}}>
            <button style={{flex:1,padding:"18px 0",fontSize:28,fontWeight:700,fontFamily:"inherit",background:alr&&letterAnss[idx]===true?"#111":"#fff",color:alr&&letterAnss[idx]===true?"#fff":"#111",border:"1.5px solid #ddd",borderRadius:12,cursor:"pointer",opacity:canAns?1:0.4}} onClick={()=>canAns&&answerLetter(true)}>7</button>
            <button style={{flex:1,padding:"18px 0",fontSize:28,fontWeight:700,fontFamily:"inherit",background:alr&&letterAnss[idx]===false?"#111":"#fff",color:alr&&letterAnss[idx]===false?"#fff":"#111",border:"1.5px solid #ddd",borderRadius:12,cursor:"pointer",opacity:canAns?1:0.4}} onClick={()=>canAns&&answerLetter(false)}>8</button>
          </div>
        )}
      </div>
    );
  }

  if(phase==="sum_input")return(
    <div style={S.page}>
      <div style={S.sectionTitle}>Somme des nombres ?</div>
      <p style={{fontSize:13,color:"#888",marginBottom:16}}>{MAX} nombres entre 1 et 9.</p>
      <NumericKeyboard value={sumInput} onChange={setSumInput} onSubmit={submitSum}/>
    </div>
  );

  if(phase==="result"&&result){
    const sumOk=result.userSum===result.correctSum;
    const lPct=result.letterTotal>0?Math.round(result.letterScore/result.letterTotal*100):0;
    return(
      <div style={S.page}>
        <div style={S.sectionTitle}>Résultat T3A</div>
        <div style={{...S.card,background:"#f9f9f9",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:"#555",marginBottom:4}}>LETTRES</div>
          <div style={{fontSize:28,fontWeight:700}}>{result.letterScore} / {result.letterTotal}</div>
          <div style={{fontSize:13,color:"#888"}}>{lPct}%</div>
        </div>
        <div style={{...S.card,background:sumOk?GREEN_BG:RED_BG,border:`1.5px solid ${sumOk?GREEN_BORDER:RED_BORDER}`,marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,color:sumOk?GREEN_BORDER:RED_BORDER,marginBottom:4}}>SOMME</div>
          <div style={{fontSize:28,fontWeight:700,color:sumOk?GREEN_BORDER:RED_BORDER}}>{result.correctSum}</div>
          {!sumOk&&result.userSum&&<div style={{fontSize:13,color:"#bbb",textDecoration:"line-through",marginTop:4}}>{result.userSum}</div>}
        </div>
        <div style={{fontSize:12,color:"#888",marginBottom:16}}>{numbers.join(" + ")} = {result.correctSum}</div>
        <button style={S.btn()} onClick={start}>REJOUER</button>
        <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
      </div>
    );
  }
  return null;
}

const DIRECTIONS=["NORD","SUD","EST","OUEST"];
const DIR_KEYS={"ArrowUp":"NORD","ArrowDown":"SUD","ArrowRight":"EST","ArrowLeft":"OUEST"};

function DirectionsGame({ onHome }) {
  const TOTAL_ROUNDS=20;
  const [phase,setPhase]=useState("intro");
  const [round,setRound]=useState(0);
  const [score,setScore]=useState(0);
  const [current,setCurrent]=useState(null);
  const [feedback,setFeedback]=useState(null);
  const [history,setHistory]=useState([]);

  function startGame(){setRound(1);setScore(0);setHistory([]);setCurrent(randOf(DIRECTIONS));setFeedback(null);setPhase("running");}

  function answer(dir){
    if(feedback!==null)return;
    const ok=dir===current;
    setFeedback(ok?"ok":"bad");
    if(ok)setScore(s=>s+1);
    setHistory(prev=>[...prev,{dir:current,answer:dir,ok}]);
    setTimeout(()=>{
      if(round>=TOTAL_ROUNDS){addStat({mode:"directions",score:score+(ok?1:0),total:TOTAL_ROUNDS});setPhase("result");}
      else{setRound(r=>r+1);setCurrent(randOf(DIRECTIONS));setFeedback(null);}
    },600);
  }

  useEffect(()=>{
    function handleKey(e){if(phase!=="running"||feedback!==null)return;const dir=DIR_KEYS[e.key];if(dir)answer(dir);}
    window.addEventListener("keydown",handleKey);
    return()=>window.removeEventListener("keydown",handleKey);
  },[phase,current,feedback,round,score]);

  if(phase==="intro")return(
    <div style={S.page}>
      <div style={S.sectionTitle}>Directions</div>
      <p style={{fontSize:14,lineHeight:1.7,marginBottom:20}}>Une direction s'affiche. Clique sur la bonne flèche.<br/><br/><b>{TOTAL_ROUNDS} rounds.</b> Touches directionnelles aussi.</p>
      <button style={S.btn()} onClick={startGame}>COMMENCER</button>
      <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
    </div>
  );

  if(phase==="running")return(
    <div style={S.page}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:16}}><span>Round {round}/{TOTAL_ROUNDS}</span><span style={{fontWeight:700}}>Score : {score}</span></div>
      <div style={{border:"1.5px solid #ddd",borderRadius:16,marginBottom:24,minHeight:120,display:"flex",alignItems:"center",justifyContent:"center",background:feedback==="ok"?GREEN_BG:feedback==="bad"?RED_BG:"#fff",transition:"background 0.2s"}}>
        <div style={{fontSize:52,fontWeight:700,letterSpacing:2}}>{current}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,maxWidth:240,margin:"0 auto"}}>
        <div/>
        <button style={{padding:"20px 0",fontSize:32,background:"#fff",border:"1.5px solid #ddd",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>answer("NORD")}>↑</button>
        <div/>
        <button style={{padding:"20px 0",fontSize:32,background:"#fff",border:"1.5px solid #ddd",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>answer("OUEST")}>←</button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#ccc"}}>●</div>
        <button style={{padding:"20px 0",fontSize:32,background:"#fff",border:"1.5px solid #ddd",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>answer("EST")}>→</button>
        <div/>
        <button style={{padding:"20px 0",fontSize:32,background:"#fff",border:"1.5px solid #ddd",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>answer("SUD")}>↓</button>
        <div/>
      </div>
      {feedback&&<div style={{textAlign:"center",fontSize:20,fontWeight:700,marginTop:16,color:feedback==="ok"?GREEN_BORDER:RED_BORDER}}>{feedback==="ok"?"✓":"✗"}</div>}
    </div>
  );

  if(phase==="result")return(
    <div style={S.page}>
      <div style={S.sectionTitle}>Résultat</div>
      <div style={{...S.card,textAlign:"center",background:score>=TOTAL_ROUNDS*0.8?GREEN_BG:"#fff",border:`1.5px solid ${score>=TOTAL_ROUNDS*0.8?GREEN_BORDER:"#ddd"}`}}>
        <div style={{fontSize:36,fontWeight:700}}>{score}/{TOTAL_ROUNDS}</div>
        <div style={{fontSize:16,color:"#555"}}>{Math.round(score/TOTAL_ROUNDS*100)}%</div>
      </div>
      <div style={{fontSize:12,marginTop:12,marginBottom:16}}>
        {history.map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 10px",borderRadius:8,marginBottom:3,background:h.ok?GREEN_BG:RED_BG,border:`1px solid ${h.ok?GREEN_BORDER:RED_BORDER}`}}><span>{h.dir}</span><span style={{fontWeight:700,color:h.ok?GREEN_BORDER:RED_BORDER}}>{h.ok?"✓":`✗ (${h.answer})`}</span></div>)}
      </div>
      <button style={S.btn()} onClick={startGame}>REJOUER</button>
      <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
    </div>
  );
  return null;
}

function AttentionHub({ onHome }) {
  const [sub,setSub]=useState(null);
  if(sub==="t3a")return <T3AMode onHome={onHome}/>;
  if(sub==="dirs")return <DirectionsGame onHome={onHome}/>;
  return(
    <div style={S.page}>
      <div style={S.sectionTitle}>Division d'Attention</div>
      <button style={S.btn()} onClick={()=>setSub("t3a")}>T3A — Lettres + Somme</button>
      <button style={S.btn()} onClick={()=>setSub("dirs")}>Directions N/S/E/O</button>
      <button style={S.btn("secondary")} onClick={onHome}>← Accueil</button>
    </div>
  );
}

function Home({ setTab }) {
  const stats=getStats();
  const todayStats=stats.filter(s=>s.date===today());
  const calcToday=todayStats.filter(s=>s.mode==="calc").reduce((a,s)=>a+(s.total||0),0);
  return(
    <div style={S.page}>
      <div style={S.sectionTitle}>Spartan 01</div>
      <div style={{fontSize:13,color:"#888",marginBottom:20}}>Entraînement calcul mental</div>
      <button style={S.btn()} onClick={()=>setTab("attention")}>Division d'attention</button>
      <button style={S.btn()} onClick={()=>setTab("calc")}>Calcul mental / Problèmes</button>
      <div style={S.divider}/>
      <div style={S.label}>Aujourd'hui</div>
      <div style={S.stat}><span>Sessions</span><span style={S.statVal}>{todayStats.length}</span></div>
      <div style={S.stat}><span>Calculs</span><span style={S.statVal}>{calcToday}</span></div>
    </div>
  );
}

function StatsPage() {
  const all=getStats();
  const wk=thisWeek(),mo=thisMonth(),td=today();
  function calcBlock(label,items){
    const ci=items.filter(s=>s.mode==="calc");
    const total=ci.reduce((a,s)=>a+(s.total||0),0);
    const correct=ci.reduce((a,s)=>a+(s.correct||0),0);
    const pct=total>0?Math.round(correct/total*100):null;
    return(<div style={{marginBottom:16}}>
      <div style={S.label}>{label}</div>
      <div style={S.stat}><span>Sessions</span><span style={S.statVal}>{items.length}</span></div>
      <div style={S.stat}><span>Calculs</span><span style={S.statVal}>{total}</span></div>
      {pct!==null&&<div style={S.stat}><span>Réussite</span><span style={S.statVal}>{pct}%</span></div>}
      <div style={S.stat}><span>Sessions T3A</span><span style={S.statVal}>{items.filter(s=>s.mode==="t3a").length}</span></div>
      <div style={S.stat}><span>Sessions Directions</span><span style={S.statVal}>{items.filter(s=>s.mode==="directions").length}</span></div>
    </div>);
  }
  const days=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return d.toISOString().slice(0,10);});
  const dayData=days.map(d=>({label:d.slice(5),n:all.filter(s=>s.date===d&&s.mode==="calc").reduce((a,s)=>a+(s.total||0),0)}));
  const maxN=Math.max(1,...dayData.map(d=>d.n));
  return(
    <div style={S.page}>
      <div style={S.sectionTitle}>Statistiques</div>
      {calcBlock("Aujourd'hui",all.filter(s=>s.date===td))}
      <div style={S.divider}/>
      {calcBlock("Cette semaine",all.filter(s=>s.date>=wk))}
      <div style={S.divider}/>
      {calcBlock("Ce mois",all.filter(s=>s.date&&s.date.startsWith(mo)))}
      <div style={S.divider}/>
      {calcBlock("Total",all)}
      <div style={S.divider}/>
      <div style={S.label}>Calculs / jour (14j)</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:2,height:70,marginBottom:4}}>
        {dayData.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{background:"#111",width:"100%",height:d.n===0?1:Math.round(d.n/maxN*64),borderRadius:2}}/></div>)}
      </div>
      <div style={{display:"flex",gap:2}}>
        {dayData.map((d,i)=><div key={i} style={{flex:1,fontSize:8,textAlign:"center",color:"#aaa"}}>{d.label}</div>)}
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab]=useState("home");
  const goHome=()=>setTab("home");
  let content;
  if(tab==="home")content=<Home setTab={setTab}/>;
  else if(tab==="attention")content=<AttentionHub onHome={goHome}/>;
  else if(tab==="calc")content=<CalcMode onHome={goHome}/>;
  else if(tab==="stats")content=<StatsPage/>;
  return(
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.title}>SPARTAN <span style={{color:PINK}}>01</span></span>
        <span style={S.subtitle}>calcul mental</span>
      </div>
      <div>{content}</div>
      <nav style={S.nav}>
        {[["home","ACCUEIL"],["attention","ATTENTION"],["calc","CALCUL"],["stats","STATS"]].map(([id,label])=>(
          <button key={id} style={S.navBtn(tab===id)} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}
