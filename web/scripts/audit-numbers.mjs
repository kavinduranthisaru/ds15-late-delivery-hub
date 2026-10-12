// Number audit: every metric the app renders must equal the group's results table.
// Reads the rendered Models table, the Overview champion card, the Compare table (all 8 models, in 3 views)
// and the chart value labels. Usage: node scripts/audit-numbers.mjs [baseUrl]
import puppeteer from 'puppeteer-core'

const base = process.argv[2] ?? 'http://127.0.0.1:4173'
const RESULTS = {   // rank, model, owner id, score, CV ROC, test ROC, test PR, test Brier
  'Logistic Regression': ['1', 'IT24102928', '88.8', '0.7743', '0.7793', '0.8593', '0.1735'],
  AdaBoost: ['2=', 'IT24102901', '86.7', '0.7748', '0.7771', '0.8048', '0.1733'],
  XGBoost: ['2=', 'IT24102901', '86.7', '0.7748', '0.7771', '0.8048', '0.1733'],
  'Linear SVM': ['4', 'IT24102255', '86.6', '0.7742', '0.7793', '0.8599', '0.1736'],
  KNN: ['5', 'IT24102255', '85.0', '0.7756', '0.7797', '0.8534', '0.1733'],
  'Naive Bayes': ['6', 'IT24102928', '58.9', '0.7693', '0.7791', '0.8593', '0.1763'],
  'Decision Tree': ['7', 'IT24102397', '58.2', '0.7754', '0.7787', '0.8588', 'not reported'],
  'Random Forest': ['8', 'IT24102397', '40.8', '0.7736', '0.7787', '0.8601', 'not reported'],
}
const b = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
await p.setViewport({ width: 1280, height: 800 })
let bad = 0, checked = 0
const expect = (where, got, want) => { checked++; if (got !== want) { bad++; console.log(`DIFF ${where}: app "${got}" vs table "${want}"`) } }

await p.goto(`${base}/models?tab=table`, { waitUntil: 'networkidle0' })
const rows = await p.$$eval('tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('td,th')].map((c) => c.innerText.trim())))
for (const r of rows) {
  const name = Object.keys(RESULTS).find((n) => r[1].startsWith(n))
  const [rank, owner, score, cvroc, troc, tpr, brier] = RESULTS[name]
  expect(`${name} rank`, r[0], rank); expect(`${name} owner`, r[1].includes(owner), true)
  expect(`${name} score`, r[2], score); expect(`${name} CV ROC`, r[3], cvroc); expect(`${name} test ROC`, r[5], troc)
  expect(`${name} test PR`, r[6], tpr); expect(`${name} Brier`, r[7], brier)
}

await p.goto(`${base}/?tab=summary`, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 900))
const champ = await p.$eval('article', (a) => [...a.querySelectorAll('dd')].map((d) => (d.querySelector('[aria-hidden="true"]') ?? d).textContent.trim()))
expect('champion CV ROC', champ[0], '0.7743'); expect('champion test ROC', champ[1], '0.7793')
expect('champion test PR', champ[2], '0.8593'); expect('champion Brier', champ[3], '0.1735')

for (const sel of ['logistic_regression,adaboost,xgboost', 'linear_svm,knn,naive_bayes', 'decision_tree,random_forest']) {
  await p.goto(`${base}/compare?tab=metrics&m=${sel}`, { waitUntil: 'networkidle0' })
  const heads = await p.$$eval('thead th', (t) => t.slice(1).map((h) => h.querySelector('span')?.innerText.trim()))
  const body = await p.$$eval('tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((c) => c.innerText.replace('best', '').trim())))
  heads.forEach((name, i) => {
    const [, , score, cvroc, troc, tpr, brier] = RESULTS[name]
    expect(`compare ${name} score`, body[0][i], score); expect(`compare ${name} CV ROC`, body[1][i], cvroc)
    expect(`compare ${name} test ROC`, body[3][i], troc); expect(`compare ${name} test PR`, body[4][i], tpr); expect(`compare ${name} Brier`, body[5][i], brier)
  })
}

await p.goto(`${base}/charts?tab=roc`, { waitUntil: 'networkidle0' })
const labels = await p.$$eval('.recharts-label-list text', (t) => t.map((x) => x.textContent))
const want = Object.values(RESULTS).map((r) => r[3])
expect('chart CV ROC labels', labels.slice().sort().join(','), want.slice().sort().join(','))

await b.close()
console.log(bad ? `${bad} of ${checked} checks differ` : `All ${checked} rendered numbers match the results table.`)
process.exit(bad ? 1 : 0)
