import { showToast, speak, logActivity } from './utils.js';

export async function loadInspirationLab() {
  try {
    const ideasDiv = document.getElementById('inspiration-ideas');
    ideasDiv.innerHTML = '';
    const ideas = await fetchInspirationIdeas();
    ideas.forEach(idea => {
      const div = document.createElement('div');
      div.className = 'glassmorphic';
      div.innerHTML = `<p>${idea.text}</p><img src="${idea.image}" class="meme-preview" alt="Meme">`;
      ideasDiv.appendChild(div);
    });

    document.getElementById('meme-search').addEventListener('input', async e => {
      const query = e.target.value;
      const filteredIdeas = ideas.filter(idea => idea.text.toLowerCase().includes(query.toLowerCase()));
      ideasDiv.innerHTML = '';
      filteredIdeas.forEach(idea => {
        const div = document.createElement('div');
        div.className = 'glassmorphic';
        div.innerHTML = `<p>${idea.text}</p><img src="${idea.image}" class="meme-preview" alt="Meme">`;
        ideasDiv.appendChild(div);
      });
    });

    document.getElementById('generate-idea').addEventListener('click', async () => {
      const newIdea = await generateNewIdea();
      ideasDiv.insertAdjacentHTML('afterbegin', `<div class="glassmorphic"><p>${newIdea.text}</p><img src="${newIdea.image}" class="meme-preview" alt="Meme"></div>`);
      showToast('New inspiration idea generated!');
      logActivity('Generated new inspiration idea');
    });

    speak('Welcome to the Inspiration Lab! Search or generate bot ideas.');
  } catch (error) {
    showToast(`Failed to load Inspiration Lab: ${error.message}`);
    console.error('Inspiration Lab Error:', error);
  }
}

async function fetchInspirationIdeas() {
  // Simulate fetching from an API
  return [
    { text: 'Create a bot that generates daily memes', image: 'https://via.placeholder.com/150?text=Meme1' },
    { text: 'Build a weather bot with witty forecasts', image: 'https://via.placeholder.com/150?text=Meme2' },
    { text: 'Design a bot for task automation', image: 'https://via.placeholder.com/150?text=Meme3' }
  ];
}

async function generateNewIdea() {
  // Simulate AI-generated idea
  const texts = [
    'Create a bot for real-time stock updates',
    'Build a fitness challenge bot',
    'Design a bot for language translation'
  ];
  const randomText = texts[Math.floor(Math.random() * texts.length)];
  return { text: randomText, image: `https://via.placeholder.com/150?text=${randomText.split(' ')[0]}` };
}
