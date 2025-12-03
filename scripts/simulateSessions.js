#!/usr/bin/env node
// Lightweight local simulation harness that fakes session interactions
// Useful for basic performance/latency profiling without external APIs.
import { performance } from 'perf_hooks';

function randDelay(min=10,max=200){return Math.floor(Math.random()*(max-min))+min}

async function simulateOne(_id){
  const start = performance.now();
  // simulate short-term memory ops
  await new Promise(r=>setTimeout(r, randDelay(5,50)));
  // simulate model call (mock)
  await new Promise(r=>setTimeout(r, randDelay(50,200)));
  // simulate long-term write
  await new Promise(r=>setTimeout(r, randDelay(10,100)));
  const end = performance.now();
  return end-start;
}

async function run(count=1000, concurrency=50){
  console.log(`Simulating ${count} sessions (concurrency ${concurrency})`);
  const results=[];
  let running=0;
  let done=0;

  async function worker(){
    // run until the total started sessions reaches `count`
    while (done + running < count) {
      const i = done + running;
      running++;
      const t = await simulateOne(i);
      results.push(t);
      running--;
      done++;
      if (done % 100 === 0) console.log(`Progress: ${done}/${count}`);
    }
  }

  const workers = Array.from({length: Math.max(1, Math.min(concurrency, count))}).map(()=>worker());
  await Promise.all(workers);

  const avg = results.reduce((a,b)=>a+b,0)/results.length;
  const p95 = results.sort((a,b)=>a-b)[Math.floor(results.length*0.95)]||0;
  console.log(`Done. sessions: ${results.length}, avg=${avg.toFixed(1)}ms, p95=${p95.toFixed(1)}ms`);
}

const argv = process.argv.slice(2);
const count = Number(argv[0]||1000);
const conc = Number(argv[1]||50);
run(count, conc).catch(e=>{console.error(e); process.exit(2)})
