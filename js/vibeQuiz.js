// Small vibe quiz module: simple psychometric questions that produce a score
// and write a Behavioral DNA entry using the compatibility layer (window.firebase)
function mountVibeQuiz(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="vibe-quiz">
      <h3>Vibe Quiz — a quick 6-question personality snapshot</h3>
      <form id="vibe-quiz-form">
        <label>Q1: How do you prefer to approach problems?
          <select name="q1">
            <option value="1">Analytical</option>
            <option value="2">Practical</option>
            <option value="3">Creative</option>
            <option value="4">Social</option>
          </select>
        </label>
        <label>Q2: When making decisions, you rely most on:
          <select name="q2">
            <option value="1">Data and facts</option>
            <option value="2">Past experience</option>
            <option value="3">Intuition and gut feeling</option>
            <option value="4">Others' opinions</option>
          </select>
        </label>
        <label>Q3: Your ideal work environment is:
          <select name="q3">
            <option value="1">Quiet and organized</option>
            <option value="2">Hands-on and practical</option>
            <option value="3">Dynamic and inspiring</option>
            <option value="4">Collaborative and social</option>
          </select>
        </label>
        <label>Q4: When facing a challenge, you:
          <select name="q4">
            <option value="1">Research and plan thoroughly</option>
            <option value="2">Jump in and figure it out</option>
            <option value="3">Think outside the box</option>
            <option value="4">Discuss it with others</option>
          </select>
        </label>
        <label>Q5: Your communication style is typically:
          <select name="q5">
            <option value="1">Direct and factual</option>
            <option value="2">Straightforward and clear</option>
            <option value="3">Expressive and imaginative</option>
            <option value="4">Warm and engaging</option>
          </select>
        </label>
        <label>Q6: In a team project, you prefer to:
          <select name="q6">
            <option value="1">Lead with strategy and analysis</option>
            <option value="2">Handle practical implementation</option>
            <option value="3">Generate new ideas and concepts</option>
            <option value="4">Facilitate collaboration and harmony</option>
          </select>
        </label>
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
