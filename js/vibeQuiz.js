// Small vibe quiz module: simple psychometric questions that produce a score
// and write a Behavioral DNA entry using the compatibility layer (window.firebase)
function mountVibeQuiz(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="vibe-quiz">
      <h3>Vibe Quiz — a quick 6-question personality snapshot</h3>
      <form id="vibe-quiz-form">
        ${[1,2,3,4,5,6].map(i => `
          <label>Q${i}: How do you prefer to approach problems?
            <select name="q${i}">
              <option value="1">Analytical</option>
              <option value="2">Practical</option>
              <option value="3">Creative</option>
              <option value="4">Social</option>
            </select>
          </label>
        `).join('')}
        <div style="margin-top:8px;"><button type="submit">Save Vibe</button></div>
      </form>
      <div id="vibe-result" style="margin-top:8px;color:var(--text)"></div>
    </div>
  `;

  const form = container.querySelector('#vibe-quiz-form');
  const result = container.querySelector('#vibe-result');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    let sum = 0;
  for (let [_k, v] of fd.entries()) sum += Number(v || 0);
    // Normalize into simple traits
    const dna = {
      vibeScore: sum / 6,
      timestamp: new Date().toISOString(),
      source: 'vibe-quiz'
    };

    try {
      if (window.firebase && window.firebase.database) {
        const id = 'user-' + Date.now();
        await window.firebase.database().ref('behavioral_dna/' + id).set(dna);
        result.textContent = 'Saved vibe (id: ' + id + ').';
      } else {
        result.textContent = 'Firebase not available — quiz saved locally.';
        localStorage.setItem('vibe-dna', JSON.stringify(dna));
      }
    } catch (err) {
      console.error('vibe save failed', err);
      result.textContent = 'Save failed: ' + err.message;
    }
  });
}

export { mountVibeQuiz };
