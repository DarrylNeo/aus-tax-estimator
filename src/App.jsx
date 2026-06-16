import { useState, useEffect } from "react";

const TAX_BRACKETS = [
  { min: 0,      max: 18200,     rate: 0,     base: 0 },
  { min: 18201,  max: 45000,     rate: 0.19,  base: 0 },
  { min: 45001,  max: 120000,    rate: 0.325, base: 5092 },
  { min: 120001, max: 180000,    rate: 0.37,  base: 29467 },
  { min: 180001, max: Infinity,  rate: 0.45,  base: 51667 },
];

const HECS_RATES = [
  { min: 0,       max: 54435,   rate: 0 },
  { min: 54435,   max: 62851,   rate: 0.01 },
  { min: 62851,   max: 66621,   rate: 0.02 },
  { min: 66621,   max: 70619,   rate: 0.025 },
  { min: 70619,   max: 74856,   rate: 0.03 },
  { min: 74856,   max: 79347,   rate: 0.035 },
  { min: 79347,   max: 84108,   rate: 0.04 },
  { min: 84108,   max: 89155,   rate: 0.045 },
  { min: 89155,   max: 94504,   rate: 0.05 },
  { min: 94504,   max: 100175,  rate: 0.055 },
  { min: 100175,  max: 106186,  rate: 0.06 },
  { min: 106186,  max: 112557,  rate: 0.065 },
  { min: 112557,  max: 119310,  rate: 0.07 },
  { min: 119310,  max: 126468,  rate: 0.075 },
  { min: 126468,  max: 134057,  rate: 0.08 },
  { min: 134057,  max: 142101,  rate: 0.085 },
  { min: 142101,  max: 150629,  rate: 0.09 },
  { min: 150629,  max: 159664,  rate: 0.095 },
  { min: 159664,  max: Infinity, rate: 0.10 },
];

function calcIncomeTax(income) {
  const bracket = [...TAX_BRACKETS].reverse().find(b => income >= b.min);
  return bracket.base + (income - bracket.min + (bracket.min === 0 ? 0 : 1)) * bracket.rate;
}

function calcMedicareLevy(income) {
  if (income <= 26000) return 0;
  if (income <= 32500) return (income - 26000) * 0.1;
  return income * 0.02;
}

function calcLITO(income) {
  if (income <= 37500) return 700;
  if (income <= 45000) return 700 - (income - 37500) * 0.05;
  if (income <= 66667) return 325 - (income - 45000) * 0.015;
  return 0;
}

function calcHECS(income) {
  const bracket = [...HECS_RATES].reverse().find(b => income >= b.min);
  return income * bracket.rate;
}

const fmt = (n) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD", maximumFractionDigits: 0,
  }).format(Math.abs(n));

const parseNum = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;

function AnimatedNumber({ value, prefix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 600;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span>{prefix}{new Intl.NumberFormat("en-AU").format(display)}</span>;
}

export default function App() {
  const [salary, setSalary] = useState("");
  const [withheld, setWithheld] = useState("");
  const [hasHECS, setHasHECS] = useState(false);
  const [result, setResult] = useState(null);
  const [calculated, setCalculated] = useState(false);

  const calculate = () => {
    const income = parseNum(salary);
    if (!income || income <= 0) return;
    const incomeTax = calcIncomeTax(income);
    const medicare = calcMedicareLevy(income);
    const lito = calcLITO(income);
    const hecs = hasHECS ? calcHECS(income) : 0;
    const totalTax = Math.max(0, incomeTax - lito) + medicare;
    const taxWithheld = parseNum(withheld);
    const effectiveRate = ((totalTax / income) * 100).toFixed(1);
    const refundOrBill = taxWithheld > 0 ? taxWithheld - totalTax : null;
    setResult({ income, incomeTax, medicare, lito, hecs, totalTax, taxWithheld, effectiveRate, refundOrBill });
    setCalculated(true);
  };

  const handleKey = (e) => { if (e.key === "Enter") calculate(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #0a0f1e;
          min-height: 100vh;
          color: #e2e8f0;
        }

        .bg {
          min-height: 100vh;
          background: radial-gradient(ellipse at 20% 50%, rgba(0,132,61,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(0,80,200,0.1) 0%, transparent 50%),
                      #0a0f1e;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 16px 80px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,132,61,0.15);
          border: 1px solid rgba(0,132,61,0.3);
          color: #4ade80;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 24px;
        }

        .dot {
          width: 6px; height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: #f8fafc;
          text-align: center;
          line-height: 1.1;
          margin-bottom: 12px;
          letter-spacing: -0.03em;
        }

        h1 span { color: #4ade80; }

        .subtitle {
          color: #64748b;
          font-size: 1rem;
          text-align: center;
          margin-bottom: 48px;
        }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 520px;
          backdrop-filter: blur(12px);
        }

        .field { margin-bottom: 24px; }

        .field label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          transition: border-color 0.2s;
        }

        .input-wrap:focus-within {
          border-color: #4ade80;
          background: rgba(74,222,128,0.05);
        }

        .input-prefix {
          padding: 0 14px;
          color: #4ade80;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .input-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f1f5f9;
          font-size: 1.05rem;
          font-family: 'Inter', sans-serif;
          padding: 14px 14px 14px 0;
          font-weight: 500;
        }

        .input-wrap input::placeholder { color: #334155; }

        .toggle-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 16px 18px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          margin-bottom: 32px;
        }

        .toggle-wrap:hover { border-color: rgba(74,222,128,0.3); }
        .toggle-wrap.active { border-color: rgba(74,222,128,0.4); background: rgba(74,222,128,0.05); }

        .toggle-text { font-size: 0.95rem; font-weight: 500; color: #cbd5e1; }
        .toggle-text small { display: block; font-size: 0.78rem; color: #475569; margin-top: 2px; font-weight: 400; }

        .toggle-switch {
          width: 44px; height: 24px;
          background: #1e293b;
          border-radius: 100px;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .toggle-switch.on { background: #16a34a; }

        .toggle-knob {
          position: absolute;
          top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .toggle-switch.on .toggle-knob { transform: translateX(20px); }

        .calc-btn {
          width: 100%;
          padding: 16px;
          background: #16a34a;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.1s;
          position: relative;
          overflow: hidden;
        }

        .calc-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
        }

        .calc-btn:hover { background: #15803d; transform: translateY(-1px); }
        .calc-btn:active { transform: translateY(0); }

        .results {
          margin-top: 32px;
          animation: fadeUp 0.4s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .effective-rate {
          background: linear-gradient(135deg, rgba(0,132,61,0.2), rgba(0,80,200,0.1));
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 24px;
        }

        .rate-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
        .rate-value { font-size: 3rem; font-weight: 800; color: #4ade80; letter-spacing: -0.04em; line-height: 1; }
        .rate-sub { font-size: 0.82rem; color: #475569; margin-top: 6px; }

        .breakdown {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .b-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .b-row:last-child { border-bottom: none; }
        .b-row.total { background: rgba(255,255,255,0.03); }

        .b-label { font-size: 0.88rem; color: #64748b; }
        .b-label.bold { color: #cbd5e1; font-weight: 600; }

        .b-val { font-size: 0.92rem; font-weight: 600; color: #94a3b8; }
        .b-val.red { color: #f87171; }
        .b-val.green { color: #4ade80; }
        .b-val.white { color: #f1f5f9; font-weight: 700; }

        .refund-box {
          border-radius: 14px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .refund-box.refund { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25); }
        .refund-box.bill   { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); }

        .refund-label { font-size: 0.9rem; font-weight: 600; color: #cbd5e1; }
        .refund-label small { display: block; font-size: 0.75rem; font-weight: 400; color: #64748b; margin-top: 2px; }
        .refund-amount { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; }
        .refund-amount.green { color: #4ade80; }
        .refund-amount.red   { color: #f87171; }

        .disclaimer {
          font-size: 0.72rem;
          color: #334155;
          line-height: 1.6;
          text-align: center;
          padding-top: 8px;
        }

        .disclaimer a { color: #475569; }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-top: 32px;
          max-width: 520px;
          width: 100%;
        }

        .stat {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .stat-val { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
        .stat-lbl { font-size: 0.7rem; color: #475569; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>

      <div className="bg">
        <div className="badge"><div className="dot" /> 2024–25 ATO Rates</div>

        <h1>Australian Tax<br /><span>Return Estimator</span></h1>
        <p className="subtitle">Free · Instant · No sign-up required</p>

        <div className="card">
          <div className="field">
            <label>Annual Salary</label>
            <div className="input-wrap">
              <span className="input-prefix">$</span>
              <input
                type="text" placeholder="85,000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                onKeyDown={handleKey}
              />
            </div>
          </div>

          <div className="field">
            <label>Tax Withheld by Employer <span style={{color:"#334155",fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
            <div className="input-wrap">
              <span className="input-prefix">$</span>
              <input
                type="text" placeholder="Leave blank to estimate"
                value={withheld}
                onChange={e => setWithheld(e.target.value)}
                onKeyDown={handleKey}
              />
            </div>
          </div>

          <div
            className={`toggle-wrap ${hasHECS ? "active" : ""}`}
            onClick={() => setHasHECS(!hasHECS)}
          >
            <div className="toggle-text">
              I have a HECS/HELP debt
              <small>Affects repayment threshold from $54,435</small>
            </div>
            <div className={`toggle-switch ${hasHECS ? "on" : ""}`}>
              <div className="toggle-knob" />
            </div>
          </div>

          <button className="calc-btn" onClick={calculate}>
            Calculate My Tax →
          </button>

          {calculated && result && (
            <div className="results">
              <div className="effective-rate">
                <div className="rate-label">Effective Tax Rate</div>
                <div className="rate-value">{result.effectiveRate}%</div>
                <div className="rate-sub">on {fmt(result.income)} annual income</div>
              </div>

              <div className="breakdown">
                <div className="b-row">
                  <span className="b-label">Gross Income</span>
                  <span className="b-val white">{fmt(result.income)}</span>
                </div>
                <div className="b-row">
                  <span className="b-label">Income Tax</span>
                  <span className="b-val red">−{fmt(result.incomeTax)}</span>
                </div>
                <div className="b-row">
                  <span className="b-label">Low Income Tax Offset</span>
                  <span className="b-val green">+{fmt(result.lito)}</span>
                </div>
                <div className="b-row">
                  <span className="b-label">Medicare Levy (2%)</span>
                  <span className="b-val red">−{fmt(result.medicare)}</span>
                </div>
                {hasHECS && (
                  <div className="b-row">
                    <span className="b-label">HECS/HELP Repayment</span>
                    <span className="b-val red">−{fmt(result.hecs)}</span>
                  </div>
                )}
                <div className="b-row total">
                  <span className="b-label bold">Total Tax Payable</span>
                  <span className="b-val white">{fmt(result.totalTax)}</span>
                </div>
              </div>

              {result.refundOrBill !== null && (
                <div className={`refund-box ${result.refundOrBill >= 0 ? "refund" : "bill"}`}>
                  <div className="refund-label">
                    {result.refundOrBill >= 0 ? "Estimated Refund" : "Estimated Tax Bill"}
                    <small>{result.refundOrBill >= 0 ? "You may receive this back" : "You may owe this amount"}</small>
                  </div>
                  <div className={`refund-amount ${result.refundOrBill >= 0 ? "green" : "red"}`}>
                    {result.refundOrBill >= 0 ? "+" : "−"}{fmt(result.refundOrBill)}
                  </div>
                </div>
              )}

              <p className="disclaimer">
                Estimate only · Based on ATO 2024–25 rates · Does not account for deductions or individual offsets ·{" "}
                <a href="https://www.ato.gov.au" target="_blank" rel="noreferrer">ato.gov.au</a> for official calculations
              </p>
            </div>
          )}
        </div>

        {calculated && result && (
          <div className="stats">
            <div className="stat">
              <div className="stat-val"><AnimatedNumber value={Math.round(result.totalTax / 12)} prefix="$" /></div>
              <div className="stat-lbl">Tax / Month</div>
            </div>
            <div className="stat">
              <div className="stat-val"><AnimatedNumber value={Math.round((result.income - result.totalTax) / 52)} prefix="$" /></div>
              <div className="stat-lbl">Take-home / Week</div>
            </div>
            <div className="stat">
              <div className="stat-val"><AnimatedNumber value={Math.round(result.income - result.totalTax - result.hecs)} prefix="$" /></div>
              <div className="stat-lbl">Net Annual</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}