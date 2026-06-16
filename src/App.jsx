import { useState } from "react";

// 2024–25 ATO tax brackets
const TAX_BRACKETS = [
  { min: 0,       max: 18200,  rate: 0,    base: 0 },
  { min: 18201,   max: 45000,  rate: 0.19, base: 0 },
  { min: 45001,   max: 120000, rate: 0.325,base: 5092 },
  { min: 120001,  max: 180000, rate: 0.37, base: 29467 },
  { min: 180001,  max: Infinity,rate: 0.45,base: 51667 },
];

// HECS repayment rates 2024–25
const HECS_RATES = [
  { min: 0,      max: 54435,  rate: 0 },
  { min: 54435,  max: 62851,  rate: 0.01 },
  { min: 62851,  max: 66621,  rate: 0.02 },
  { min: 66621,  max: 70619,  rate: 0.025 },
  { min: 70619,  max: 74856,  rate: 0.03 },
  { min: 74856,  max: 79347,  rate: 0.035 },
  { min: 79347,  max: 84108,  rate: 0.04 },
  { min: 84108,  max: 89155,  rate: 0.045 },
  { min: 89155,  max: 94504,  rate: 0.05 },
  { min: 94504,  max: 100175, rate: 0.055 },
  { min: 100175, max: 106186, rate: 0.06 },
  { min: 106186, max: 112557, rate: 0.065 },
  { min: 112557, max: 119310, rate: 0.07 },
  { min: 119310, max: 126468, rate: 0.075 },
  { min: 126468, max: 134057, rate: 0.08 },
  { min: 134057, max: 142101, rate: 0.085 },
  { min: 142101, max: 150629, rate: 0.09 },
  { min: 150629, max: 159664, rate: 0.095 },
  { min: 159664, max: Infinity,rate: 0.10 },
];

function calcIncomeTax(income) {
  const bracket = TAX_BRACKETS.findLast(b => income >= b.min);
  return bracket.base + (income - bracket.min + 1) * bracket.rate;
}

function calcMedicareLevy(income) {
  if (income <= 26000) return 0;
  if (income <= 32500) return (income - 26000) * 0.1; // phase-in
  return income * 0.02;
}

function calcLITO(income) {
  if (income <= 37500) return 700;
  if (income <= 45000) return 700 - (income - 37500) * 0.05;
  if (income <= 66667) return 325 - (income - 45000) * 0.015;
  return 0;
}

function calcHECS(income) {
  const bracket = HECS_RATES.findLast(b => income >= b.min);
  return income * bracket.rate;
}

const fmt = (n) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(Math.abs(n));

export default function App() {
  const [salary, setSalary] = useState("");
  const [hasHECS, setHasHECS] = useState(false);
  const [withheld, setWithheld] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const income = parseFloat(salary.replace(/,/g, ""));
    if (!income || income < 0) return;

    const incomeTax = calcIncomeTax(income);
    const medicare = calcMedicareLevy(income);
    const lito = calcLITO(income);
    const hecs = hasHECS ? calcHECS(income) : 0;
    const totalTax = Math.max(0, incomeTax - lito) + medicare;
    const taxWithheld = parseFloat(withheld.replace(/,/g, "")) || 0;
    const refundOrBill = taxWithheld - totalTax;

    setResult({ incomeTax, medicare, lito, hecs, totalTax, refundOrBill, taxWithheld });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.flag}>🇦🇺</span>
          <h1 style={styles.title}>Tax Return Estimator</h1>
          <p style={styles.subtitle}>2024–25 Financial Year</p>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Annual Salary (before tax)</label>
          <div style={styles.inputWrap}>
            <span style={styles.prefix}>$</span>
            <input style={styles.input} type="text" placeholder="85,000"
              value={salary} onChange={e => setSalary(e.target.value)} />
          </div>

          <label style={styles.label}>Tax Withheld by Employer (optional)</label>
          <div style={styles.inputWrap}>
            <span style={styles.prefix}>$</span>
            <input style={styles.input} type="text" placeholder="Leave blank to estimate"
              value={withheld} onChange={e => setWithheld(e.target.value)} />
          </div>

          <label style={styles.checkRow}>
            <input type="checkbox" checked={hasHECS}
              onChange={e => setHasHECS(e.target.checked)} style={styles.check} />
            <span>I have a HECS/HELP debt</span>
          </label>

          <button style={styles.btn} onClick={calculate}>Calculate</button>
        </div>

        {result && (
          <div style={styles.results}>
            <h2 style={styles.resultTitle}>Your Estimate</h2>
            <div style={styles.breakdown}>
              <Row label="Gross Income" value={fmt(parseFloat(salary.replace(/,/g,"")))} />
              <Row label="Income Tax" value={`−${fmt(result.incomeTax)}`} muted />
              <Row label="Low Income Tax Offset" value={`+${fmt(result.lito)}`} green />
              <Row label="Medicare Levy (2%)" value={`−${fmt(result.medicare)}`} muted />
              {hasHECS && <Row label="HECS Repayment" value={`−${fmt(result.hecs)}`} muted />}
              <div style={styles.divider} />
              <Row label="Total Tax Payable" value={fmt(result.totalTax)} bold />
              {result.taxWithheld > 0 && (
                <>
                  <Row label="Tax Withheld" value={fmt(result.taxWithheld)} />
                  <div style={{
                    ...styles.refundBox,
                    background: result.refundOrBill >= 0 ? "#d1fae5" : "#fee2e2",
                    borderColor: result.refundOrBill >= 0 ? "#6ee7b7" : "#fca5a5",
                  }}>
                    <span style={styles.refundLabel}>
                      {result.refundOrBill >= 0 ? "Estimated Refund 🎉" : "Estimated Tax Bill ⚠️"}
                    </span>
                    <span style={styles.refundAmount}>
                      {result.refundOrBill >= 0 ? "+" : "−"}{fmt(result.refundOrBill)}
                    </span>
                  </div>
                </>
              )}
            </div>
            <p style={styles.disclaimer}>
              ⚠️ Estimate only. Based on ATO 2024–25 rates. Does not account for deductions, offsets, or individual circumstances. Use the <a href="https://www.ato.gov.au" target="_blank" rel="noreferrer">ATO website</a> for official calculations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, muted, green, bold }) {
  return (
    <div style={styles.row}>
      <span style={{ ...styles.rowLabel, opacity: muted ? 0.65 : 1 }}>{label}</span>
      <span style={{
        ...styles.rowValue,
        color: green ? "#059669" : muted ? "#6b7280" : "#111",
        fontWeight: bold ? 700 : 500,
      }}>{value}</span>
    </div>
  );
}

const styles = {
  page: { minHeight:"100vh", background:"#f0f4f8", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"system-ui,sans-serif" },
  card: { background:"#fff", borderRadius:"16px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", maxWidth:"480px", width:"100%", overflow:"hidden" },
  header: { background:"#00843d", color:"#fff", padding:"28px 32px", textAlign:"center" },
  flag: { fontSize:"2rem" },
  title: { margin:"8px 0 4px", fontSize:"1.5rem", fontWeight:700 },
  subtitle: { margin:0, opacity:0.85, fontSize:"0.9rem" },
  form: { padding:"28px 32px", display:"flex", flexDirection:"column", gap:"16px" },
  label: { fontWeight:600, fontSize:"0.85rem", color:"#374151", marginBottom:"-8px" },
  inputWrap: { display:"flex", alignItems:"center", border:"1.5px solid #d1d5db", borderRadius:"8px", overflow:"hidden", background:"#f9fafb" },
  prefix: { padding:"0 12px", color:"#9ca3af", fontWeight:600, fontSize:"1rem" },
  input: { border:"none", outline:"none", background:"transparent", padding:"12px 12px 12px 0", fontSize:"1rem", width:"100%" },
  checkRow: { display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", fontSize:"0.95rem", fontWeight:500 },
  check: { width:"18px", height:"18px", accentColor:"#00843d" },
  btn: { background:"#00843d", color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"1rem", fontWeight:700, cursor:"pointer", marginTop:"4px" },
  results: { padding:"0 32px 28px", borderTop:"1px solid #f3f4f6" },
  resultTitle: { fontSize:"1.1rem", fontWeight:700, marginBottom:"16px", marginTop:"24px" },
  breakdown: { display:"flex", flexDirection:"column", gap:"10px" },
  row: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  rowLabel: { fontSize:"0.9rem", color:"#374151" },
  rowValue: { fontSize:"0.95rem" },
  divider: { borderTop:"1.5px dashed #e5e7eb", margin:"4px 0" },
  refundBox: { border:"1.5px solid", borderRadius:"10px", padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"8px" },
  refundLabel: { fontWeight:600, fontSize:"0.95rem" },
  refundAmount: { fontWeight:800, fontSize:"1.2rem" },
  disclaimer: { fontSize:"0.75rem", color:"#9ca3af", marginTop:"20px", lineHeight:1.5 },
};