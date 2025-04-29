import { showToast, speak } from './utils.js';

export function loadInspirationLab() {
  document.getElementById('generate-idea').addEventListener('click', () => {
    const ideas = ['Weather Bot', 'Meme Generator', 'Task Automator'];
    const idea = ideas[Math.floor(Math.random() * ideas.length)];
    const div = document.createElement('div');
    div.textContent = idea;
    document.getElementById('inspiration-ideas').prepend(div);
    showToast(`New idea: ${idea}`);
    speak(`Generated idea: ${idea}`);
  });

  document.getElementById('meme-search').addEventListener('input', async e => {
    const query = e.target.value;
    if (query.length > 2) {
      try {
        const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=your_giphy_api_key&q=${query}&limit=5`);
        const data = await res.json();
        const ideasDiv = document.getElementById('inspiration-ideas');
        ideasDiv.innerHTML = '';
        data.data.forEach(gif => {
          const img = document.createElement('img');
          img.src = gif.images.fixed_height.url;
          img.className = 'meme-preview';
          ideasDiv.appendChild(img);
        });
      } catch {
        showToast('Failed to fetch memes');
      }
    }
  });
}
