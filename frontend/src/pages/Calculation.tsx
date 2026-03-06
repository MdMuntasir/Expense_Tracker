import { useState } from 'react'
import { Calculator, Target, CreditCard, Users, Percent, TrendingUp } from 'lucide-react'

type CalcTab = 'daily-budget' | 'savings-goal' | 'emi' | 'split' | 'percentage' | 'net-worth'

const tabs: { id: CalcTab; label: string; mobileLabel: string; icon: React.ElementType }[] = [
  { id: 'daily-budget', label: 'Daily Budget', mobileLabel: 'Daily', icon: Calculator },
  { id: 'savings-goal', label: 'Savings Goal', mobileLabel: 'Savings', icon: Target },
  { id: 'emi', label: 'EMI / Loan', mobileLabel: 'EMI', icon: CreditCard },
  { id: 'split', label: 'Bill Split', mobileLabel: 'Split', icon: Users },
  { id: 'percentage', label: 'Percentage', mobileLabel: '%', icon: Percent },
  { id: 'net-worth', label: 'Net Worth', mobileLabel: 'Net Worth', icon: TrendingUp },
]

function fmt(n: number) {
  return '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ResultBox({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'number', min, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  min?: string; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        placeholder={placeholder}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}

// ── Daily Budget ─────────────────────────────────────────────────────────────
function DailyBudget() {
  const today = new Date().toISOString().split('T')[0]
  const [balance, setBalance] = useState('')
  const [salaryDate, setSalaryDate] = useState('')
  const [fixedMonthly, setFixedMonthly] = useState('')

  const compute = () => {
    const bal = parseFloat(balance)
    const fixed = parseFloat(fixedMonthly) || 0
    if (!bal || !salaryDate) return null
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const target = new Date(salaryDate); target.setHours(0, 0, 0, 0)
    const days = Math.ceil((target.getTime() - now.getTime()) / 86400000)
    if (days <= 0) return null
    const available = bal - fixed
    const daily = available / days
    return { days, available, daily }
  }

  const result = compute()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Daily Budget Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Find out how much you can safely spend each day until your next salary.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Current Balance (৳)" value={balance} onChange={setBalance} placeholder="e.g. 15000" />
        <InputField label="Next Salary Date" value={salaryDate} onChange={setSalaryDate} type="date" min={today} />
        <InputField
          label="Fixed Monthly Expenses (৳)"
          value={fixedMonthly}
          onChange={setFixedMonthly}
          placeholder="e.g. 5000"
          hint="Rent, subscriptions, bills — deducted before splitting"
        />
      </div>
      {result ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ResultBox label="Days Until Salary" value={`${result.days} days`} />
          <ResultBox label="Spendable Balance" value={fmt(result.available)} />
          <ResultBox label="Daily Budget" value={fmt(result.daily)} highlight />
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Enter your balance and salary date to see results.</p>
      )}
      {result && result.daily < 0 && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Your fixed expenses exceed your balance. Consider reducing them.</p>
      )}
    </div>
  )
}

// ── Savings Goal ─────────────────────────────────────────────────────────────
function SavingsGoal() {
  const [goal, setGoal] = useState('')
  const [current, setCurrent] = useState('')
  const [monthly, setMonthly] = useState('')

  const remaining = parseFloat(goal) - (parseFloat(current) || 0)
  const months = remaining > 0 && parseFloat(monthly) > 0 ? Math.ceil(remaining / parseFloat(monthly)) : null

  const monthsToDate = (m: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() + m)
    return d.toLocaleDateString('en-BD', { month: 'long', year: 'numeric' })
  }

  const requiredMonthly = (months: number) => {
    if (!goal || !months) return null
    return remaining / months
  }

  const [targetMonths, setTargetMonths] = useState('')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Savings Goal Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Calculate how long to reach a goal, or how much to save monthly.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Savings Goal (৳)" value={goal} onChange={setGoal} placeholder="e.g. 100000" />
        <InputField label="Current Savings (৳)" value={current} onChange={setCurrent} placeholder="e.g. 20000" />
      </div>

      {/* Mode A: how long? */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How long will it take?</p>
        <InputField label="Monthly Saving (৳)" value={monthly} onChange={setMonthly} placeholder="e.g. 5000" />
        {months !== null ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResultBox label="Remaining" value={fmt(remaining)} />
            <ResultBox label="Months Needed" value={`${months} months`} />
            <ResultBox label="Reach Goal By" value={monthsToDate(months)} highlight />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Fill goal, current savings, and monthly saving amount.</p>
        )}
      </div>

      {/* Mode B: how much per month? */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How much to save per month?</p>
        <InputField label="Target Months" value={targetMonths} onChange={setTargetMonths} placeholder="e.g. 12" min="1" />
        {targetMonths && parseFloat(targetMonths) > 0 && remaining > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultBox label="Monthly Saving Needed" value={fmt(requiredMonthly(parseFloat(targetMonths))!)} highlight />
            <ResultBox label="Target Date" value={monthsToDate(parseInt(targetMonths))} />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Enter the number of months you want to reach your goal in.</p>
        )}
      </div>
    </div>
  )
}

// ── EMI Calculator ───────────────────────────────────────────────────────────
function EMICalc() {
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [tenure, setTenure] = useState('')

  const compute = () => {
    const P = parseFloat(principal)
    const annualRate = parseFloat(rate)
    const n = parseFloat(tenure)
    if (!P || !annualRate || !n) return null
    const r = annualRate / 12 / 100
    if (r === 0) {
      return { emi: P / n, total: P, interest: 0 }
    }
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const total = emi * n
    const interest = total - P
    return { emi, total, interest }
  }

  const result = compute()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">EMI / Loan Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Calculate your monthly installment for any loan.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label="Loan Amount (৳)" value={principal} onChange={setPrincipal} placeholder="e.g. 500000" />
        <InputField label="Annual Interest Rate (%)" value={rate} onChange={setRate} placeholder="e.g. 9.5" />
        <InputField label="Tenure (months)" value={tenure} onChange={setTenure} placeholder="e.g. 60" min="1" />
      </div>
      {result ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ResultBox label="Monthly EMI" value={fmt(result.emi)} highlight />
          <ResultBox label="Total Payment" value={fmt(result.total)} />
          <ResultBox label="Total Interest" value={fmt(result.interest)} />
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Fill all fields to calculate EMI.</p>
      )}
      {result && (
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Repayment Breakdown</p>
          <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${(parseFloat(principal) / result.total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
            <span>Principal: {((parseFloat(principal) / result.total) * 100).toFixed(1)}%</span>
            <span>Interest: {((result.interest / result.total) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bill Split ───────────────────────────────────────────────────────────────
function BillSplit() {
  const [total, setTotal] = useState('')
  const [people, setPeople] = useState('')
  const [tip, setTip] = useState('')
  const [names, setNames] = useState<string[]>([])
  const [customAmounts, setCustomAmounts] = useState<string[]>([])

  const n = parseInt(people) || 0
  const tipAmount = (parseFloat(total) || 0) * ((parseFloat(tip) || 0) / 100)
  const grandTotal = (parseFloat(total) || 0) + tipAmount
  const perPerson = n > 0 ? grandTotal / n : 0

  const handlePeopleChange = (v: string) => {
    setPeople(v)
    const count = parseInt(v) || 0
    setNames(Array(count).fill('').map((_, i) => names[i] ?? `Person ${i + 1}`))
    setCustomAmounts(Array(count).fill(''))
  }

  const totalCustom = customAmounts.reduce((s, a) => s + (parseFloat(a) || 0), 0)
  const customMode = customAmounts.some(a => a !== '')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Bill Split Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Split a bill equally or by custom amounts with optional tip.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label="Total Bill (৳)" value={total} onChange={setTotal} placeholder="e.g. 2500" />
        <InputField label="Number of People" value={people} onChange={handlePeopleChange} min="1" placeholder="e.g. 4" />
        <InputField label="Tip (%)" value={tip} onChange={setTip} placeholder="e.g. 10" />
      </div>
      {grandTotal > 0 && n > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ResultBox label="Tip Amount" value={fmt(tipAmount)} />
          <ResultBox label="Grand Total" value={fmt(grandTotal)} />
          <ResultBox label="Per Person (equal)" value={fmt(perPerson)} highlight />
        </div>
      )}
      {n > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom split (optional)</p>
          <div className="space-y-2">
            {names.map((name, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={name}
                  onChange={e => { const n2 = [...names]; n2[i] = e.target.value; setNames(n2) }}
                  placeholder={`Person ${i + 1}`}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  value={customAmounts[i]}
                  onChange={e => { const a = [...customAmounts]; a[i] = e.target.value; setCustomAmounts(a) }}
                  placeholder="Amount (৳)"
                  className="w-36 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
          {customMode && (
            <div className={`text-sm font-medium ${Math.abs(totalCustom - grandTotal) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Custom total: {fmt(totalCustom)} / Grand total: {fmt(grandTotal)}
              {Math.abs(totalCustom - grandTotal) < 0.01 ? ' — Balanced!' : ` — Difference: ${fmt(grandTotal - totalCustom)}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Percentage Tools ─────────────────────────────────────────────────────────
function PercentageTools() {
  const [pctOf, setPctOf] = useState({ pct: '', amount: '' })
  const [pctChange, setPctChange] = useState({ from: '', to: '' })
  const [vat, setVat] = useState({ amount: '', rate: '', mode: 'add' as 'add' | 'remove' })
  const [markup, setMarkup] = useState({ cost: '', pct: '' })

  const pctOfResult = pctOf.pct && pctOf.amount ? (parseFloat(pctOf.pct) / 100) * parseFloat(pctOf.amount) : null
  const pctChangeResult = pctChange.from && pctChange.to
    ? ((parseFloat(pctChange.to) - parseFloat(pctChange.from)) / parseFloat(pctChange.from)) * 100
    : null
  const vatResult = (() => {
    const a = parseFloat(vat.amount)
    const r = parseFloat(vat.rate)
    if (!a || !r) return null
    if (vat.mode === 'add') return { base: a, tax: a * r / 100, total: a * (1 + r / 100) }
    const base = a / (1 + r / 100)
    return { base, tax: a - base, total: a }
  })()
  const markupResult = markup.cost && markup.pct
    ? parseFloat(markup.cost) * (1 + parseFloat(markup.pct) / 100)
    : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Percentage Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Quick percentage, VAT, and markup calculations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* % of amount */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What is X% of an amount?</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <input type="number" value={pctOf.pct} onChange={e => setPctOf(p => ({ ...p, pct: e.target.value }))} placeholder="%" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <span className="text-gray-400 pb-2">% of</span>
            <div className="flex-1">
              <input type="number" value={pctOf.amount} onChange={e => setPctOf(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {pctOfResult !== null && <ResultBox label="Result" value={fmt(pctOfResult)} highlight />}
        </div>

        {/* % change */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Percentage change</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <input type="number" value={pctChange.from} onChange={e => setPctChange(p => ({ ...p, from: e.target.value }))} placeholder="From" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <span className="text-gray-400 pb-2">→</span>
            <div className="flex-1">
              <input type="number" value={pctChange.to} onChange={e => setPctChange(p => ({ ...p, to: e.target.value }))} placeholder="To" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {pctChangeResult !== null && (
            <ResultBox
              label="Change"
              value={`${pctChangeResult >= 0 ? '+' : ''}${pctChangeResult.toFixed(2)}%`}
              highlight
            />
          )}
        </div>

        {/* VAT */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">VAT / Tax</p>
          <div className="flex gap-2 mb-1">
            <button onClick={() => setVat(v => ({ ...v, mode: 'add' }))} className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${vat.mode === 'add' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>Add VAT</button>
            <button onClick={() => setVat(v => ({ ...v, mode: 'remove' }))} className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${vat.mode === 'remove' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>Remove VAT</button>
          </div>
          <div className="flex gap-2">
            <input type="number" value={vat.amount} onChange={e => setVat(v => ({ ...v, amount: e.target.value }))} placeholder="Amount (৳)" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="number" value={vat.rate} onChange={e => setVat(v => ({ ...v, rate: e.target.value }))} placeholder="Rate %" className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {vatResult && (
            <div className="grid grid-cols-3 gap-2">
              <ResultBox label="Base" value={fmt(vatResult.base)} />
              <ResultBox label="Tax" value={fmt(vatResult.tax)} />
              <ResultBox label="Total" value={fmt(vatResult.total)} highlight />
            </div>
          )}
        </div>

        {/* Markup */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selling Price with Markup</p>
          <div className="flex gap-2">
            <input type="number" value={markup.cost} onChange={e => setMarkup(m => ({ ...m, cost: e.target.value }))} placeholder="Cost (৳)" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="number" value={markup.pct} onChange={e => setMarkup(m => ({ ...m, pct: e.target.value }))} placeholder="Markup %" className="w-28 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {markupResult !== null && (
            <div className="grid grid-cols-2 gap-2">
              <ResultBox label="Profit" value={fmt(markupResult - parseFloat(markup.cost))} />
              <ResultBox label="Selling Price" value={fmt(markupResult)} highlight />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Net Worth ────────────────────────────────────────────────────────────────
interface NWItem { label: string; amount: string }

function NetWorth() {
  const [assets, setAssets] = useState<NWItem[]>([
    { label: 'Cash & Bank', amount: '' },
    { label: 'Investments', amount: '' },
    { label: 'Property', amount: '' },
  ])
  const [liabilities, setLiabilities] = useState<NWItem[]>([
    { label: 'Loans', amount: '' },
    { label: 'Credit Cards', amount: '' },
  ])

  const total = (items: NWItem[]) => items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const totalAssets = total(assets)
  const totalLiabilities = total(liabilities)
  const netWorth = totalAssets - totalLiabilities

  const addItem = (setter: React.Dispatch<React.SetStateAction<NWItem[]>>) =>
    setter(p => [...p, { label: '', amount: '' }])

  const updateItem = (setter: React.Dispatch<React.SetStateAction<NWItem[]>>, i: number, field: keyof NWItem, val: string) =>
    setter(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x))

  const removeItem = (setter: React.Dispatch<React.SetStateAction<NWItem[]>>, i: number) =>
    setter(p => p.filter((_, j) => j !== i))

  const ItemList = ({ items, setter, color }: { items: NWItem[]; setter: React.Dispatch<React.SetStateAction<NWItem[]>>; color: string }) => (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={item.label}
            onChange={e => updateItem(setter, i, 'label', e.target.value)}
            placeholder="Label"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            value={item.amount}
            onChange={e => updateItem(setter, i, 'amount', e.target.value)}
            placeholder="Amount (৳)"
            className="w-36 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={() => removeItem(setter, i)} className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">×</button>
        </div>
      ))}
      <button onClick={() => addItem(setter)} className={`text-xs font-medium ${color} hover:underline`}>+ Add row</button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Net Worth Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your assets and liabilities to see your net worth.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">Assets</p>
          <ItemList items={assets} setter={setAssets} color="text-green-600 dark:text-green-400" />
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Total: {fmt(totalAssets)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Liabilities</p>
          <ItemList items={liabilities} setter={setLiabilities} color="text-red-600 dark:text-red-400" />
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Total: {fmt(totalLiabilities)}</p>
          </div>
        </div>
      </div>
      <div className={`rounded-xl p-5 border-2 ${netWorth >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Net Worth</p>
        <p className={`text-3xl font-bold mt-1 ${netWorth >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
          {netWorth >= 0 ? '' : '-'}{fmt(Math.abs(netWorth))}
        </p>
        {totalAssets > 0 && totalLiabilities > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Debt-to-asset ratio: {((totalLiabilities / totalAssets) * 100).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Calculation() {
  const [active, setActive] = useState<CalcTab>('daily-budget')

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 pb-24 md:pb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calculations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Financial tools to help you make smarter money decisions.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                active === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        {active === 'daily-budget' && <DailyBudget />}
        {active === 'savings-goal' && <SavingsGoal />}
        {active === 'emi' && <EMICalc />}
        {active === 'split' && <BillSplit />}
        {active === 'percentage' && <PercentageTools />}
        {active === 'net-worth' && <NetWorth />}
      </div>
    </div>
  )
}
