import { logActivity, showToast } from './utils.js';

const TRAITS = {
  analytical: {
    label: 'Analytical Visionary',
    description: 'Thrives on data models, simulated outcomes, and systems thinking.',
    boosters: [
      'Run a predictive sprint in analytics.js to stress test assumptions.',
      'Spin up a precision bot in bots.js with guardrails tied to metrics.',
      'Use dashboard drills to review trend deltas before major decisions.'
    ]
  },
  practical: {
    label: 'Operational Dynamo',
    description: 'Executes quickly, iterates in the field, and optimizes through feedback loops.',
    boosters: [
      'Trigger a live workshop circuit in workshop.js for hands-on trials.',
      'Lean on manual.js playbooks to accelerate implementation blocks.',
      'Queue a maintenance task in predictiveTasks.js to automate follow-through.'
    ]
  },
  creative: {
    label: 'Concept Architect',
    description: 'Generates fresh angles, storylines, and differentiators across stacks.',
    boosters: [
      'Launch inspiration.js to surface lateral idea pivots.',
      'Pair with holoGuide.js for experiential walkthrough prototypes.',
      'Seed builders in builder.js with novel mode presets.'
    ]
  },
  social: {
    label: 'Collaborative Catalyst',
    description: 'Energizes teams, drives adoption, and activates the human layer.',
    boosters: [
      'Activate collab.js to orchestrate cross-team huddles.',
      'Draft a creator campaign inside creators.js aimed at viral resonance.',
      'Use notifications.js to pulse stakeholders with tailored nudges.'
    ]
  }
};

const questionBank = [
  {
    id: 'approach',
    prompt: 'How do you prefer to approach complex problems?',
    meta: 'Signals the core mode you default to when uncertainty spikes.',
    options: [
      { id: 'approach-analytical', label: 'Model the variables until the pattern appears.', trait: 'analytical', weight: 1.2 },
      { id: 'approach-practical', label: 'Prototype quickly and learn by doing.', trait: 'practical', weight: 1.15 },
      { id: 'approach-creative', label: 'Reframe the challenge entirely.', trait: 'creative', weight: 1.25 },
      { id: 'approach-social', label: 'Crowdsource insights with the right people.', trait: 'social', weight: 1.1 }
    ]
  },
  {
    id: 'decision',
    prompt: 'When you must decide fast, what do you trust most?',
    meta: 'Determines your rapid-execution compass and bias.',
    options: [
      { id: 'decision-data', label: 'Historical data and proven models.', trait: 'analytical', weight: 1.15 },
      { id: 'decision-experience', label: 'Hands-on experience and reps.', trait: 'practical', weight: 1.1 },
      { id: 'decision-intuition', label: 'Intuition, signals, and feels.', trait: 'creative', weight: 1.2 },
      { id: 'decision-network', label: 'Trusted peers and domain experts.', trait: 'social', weight: 1.1 }
    ]
  },
  {
    id: 'environment',
  prompt: 'Your ideal operating environment looks like...',
    meta: 'Cues how you sustain momentum once you are in motion.',
    options: [
      { id: 'environment-quiet', label: 'Structured, calm, data-synced.', trait: 'analytical', weight: 1.05 },
      { id: 'environment-hands', label: 'Tactile, resourceful, kinetic.', trait: 'practical', weight: 1.2 },
      { id: 'environment-dynamic', label: 'Immersive, story-driven, stimulating.', trait: 'creative', weight: 1.15 },
      { id: 'environment-collab', label: 'Team-centric, buzzing, collaborative.', trait: 'social', weight: 1.2 }
    ]
  },
  {
    id: 'challenge',
  prompt: 'When a new challenge appears, you...',
    meta: 'Reveals how you unlock velocity under pressure.',
    options: [
      { id: 'challenge-research', label: 'Research deeply and blueprint the plays.', trait: 'analytical', weight: 1.2 },
      { id: 'challenge-jump', label: 'Dive in, iterate, and learn in loops.', trait: 'practical', weight: 1.25 },
      { id: 'challenge-remix', label: 'Invent a fresh angle no one expects.', trait: 'creative', weight: 1.2 },
      { id: 'challenge-huddle', label: 'Rally co-creators to swarm the problem.', trait: 'social', weight: 1.15 }
    ]
  },
  {
    id: 'communication',
  prompt: 'Your go-to communication style leans...',
    meta: 'Indicates the way you transmit intent and energy.',
    options: [
      { id: 'communication-direct', label: 'Precise, structured, insight-rich.', trait: 'analytical', weight: 1.1 },
      { id: 'communication-plain', label: 'Clear, actionable, no fluff.', trait: 'practical', weight: 1.1 },
      { id: 'communication-expressive', label: 'Story-driven, evocative, emotive.', trait: 'creative', weight: 1.15 },
      { id: 'communication-warm', label: 'Relational, connective, inclusive.', trait: 'social', weight: 1.2 }
    ]
  },
  {
    id: 'team-role',
  prompt: 'Inside a team sprint you naturally...',
    meta: 'Uncovers how you scale beyond yourself.',
    options: [
      { id: 'team-role-strategy', label: 'Architect the high-level systems.', trait: 'analytical', weight: 1.2 },
      { id: 'team-role-execute', label: 'Own delivery, ops, and QA.', trait: 'practical', weight: 1.25 },
      { id: 'team-role-ideate', label: 'Prime brainstorms and spark leaps.', trait: 'creative', weight: 1.2 },
      { id: 'team-role-connect', label: 'Facilitate alignment and morale.', trait: 'social', weight: 1.25 }
    ]
  }
];

function mountVibeQuiz(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="vibe-quiz">
      <h3>Vibe Intelligence Lab</h3>
      <p class="vibe-quiz__intro">Calibrate your operating signature so the system can evolve with you. Answer with your instinct.</p>
      <form id="vibe-quiz-form" class="vibe-quiz__form">
        ${renderQuestionMarkup()}
        <fieldset class="vibe-quiz__levers">
          <legend>Evolving focus</legend>
          <label>
            Preferred growth edge
            <select name="growth-edge" aria-label="Select the trait you want to level up next">
              <option value="balanced">Let the system decide dynamically</option>
              <option value="analytical">Sharpen analytical precision</option>
              <option value="practical">Accelerate operational execution</option>
              <option value="creative">Ignite creative divergence</option>
              <option value="social">Amplify collaborative influence</option>
            </select>
          </label>
        </fieldset>
        <div class="vibe-quiz__actions"><button type="submit">Generate living profile</button></div>
      </form>
      <section id="vibe-result" class="vibe-quiz__result" aria-live="polite"></section>
      <section id="vibe-history" class="vibe-quiz__history"></section>
    </div>
  `;

  const form = container.querySelector('#vibe-quiz-form');
  const resultEl = container.querySelector('#vibe-result');
  const historyEl = container.querySelector('#vibe-history');
  const userKey = getUserKey();
  const state = { history: loadHistory(userKey) };

  renderHistory(historyEl, state.history);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const selections = collectSelections(form);
    if (!selections.valid) {
      showToast('Answer every lane so we can generate a full graph.');
      return;
    }

    const profile = computeTraitProfile(selections.answers);
    const growthPreference = form.elements['growth-edge']?.value || 'balanced';
    const insights = buildEvolvingInsights(profile, state.history, growthPreference);
    const dnaRecord = buildDnaRecord(profile, insights);

    try {
      await persistDnaRecord(userKey, dnaRecord);
      showToast('Vibe profile synced. Regenerating guidance.');
      logActivity('vibe-quiz:profile-generated', {
        dominantTrait: profile.dominantTrait,
        vibeScore: profile.vibeScore,
        trajectory: insights.trajectory
      });
    } catch (err) {
      console.error('vibe save failed', err);
      showToast('Cloud sync unavailable — keeping the profile locally.');
    }

    state.history.push({
      timestamp: Date.now(),
      dominantTrait: profile.dominantTrait,
      normalized: profile.normalized,
      vibeScore: profile.vibeScore,
      trajectory: insights.trajectory
    });
    if (state.history.length > 10) state.history.shift();
    persistHistory(userKey, state.history);
    renderHistory(historyEl, state.history);
    renderResult(resultEl, profile, insights);
  });
}

function renderQuestionMarkup() {
  return questionBank.map((question, index) => `
    <label class="vibe-question" data-question="${question.id}">
      <span class="vibe-question__prompt">Q${index + 1}. ${question.prompt}</span>
      <select name="${question.id}" data-question-select>
        <option value="">Select your instinct lane</option>
        ${question.options.map(option => `<option value="${option.id}">${option.label}</option>`).join('')}
      </select>
      ${question.meta ? `<small class="vibe-question__meta">${question.meta}</small>` : ''}
    </label>
  `).join('');
}

function collectSelections(form) {
  const answers = {};
  let valid = true;
  questionBank.forEach((question) => {
    const value = form.elements[question.id]?.value || '';
    if (!value) {
      valid = false;
    } else {
      answers[question.id] = value;
    }
  });
  return { valid, answers };
}

function computeTraitProfile(answerMap) {
  const traitTotals = Object.keys(TRAITS).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  let totalWeight = 0;

  questionBank.forEach((question) => {
    const optionId = answerMap[question.id];
    const option = question.options.find((opt) => opt.id === optionId);
    if (!option) return;
    traitTotals[option.trait] += option.weight;
    totalWeight += option.weight;
  });

  const normalized = {};
  const denominator = totalWeight || 1;
  Object.entries(traitTotals).forEach(([trait, score]) => {
    normalized[trait] = Number(((score / denominator) * 100).toFixed(1));
  });

  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const dominantTrait = sorted[0]?.[0] || 'analytical';
  const vibeScore = sorted[0]?.[1] ?? 0;
  const secondaryTrait = sorted[1]?.[0] || dominantTrait;

  return {
    traitTotals,
    normalized,
    dominantTrait,
    secondaryTrait,
    vibeScore
  };
}

function buildEvolvingInsights(profile, history, growthPreference) {
  const previous = history[history.length - 1];
  const dominantScore = profile.normalized[profile.dominantTrait];
  const previousScore = previous?.normalized?.[profile.dominantTrait] ?? 0;
  const delta = Number((dominantScore - previousScore).toFixed(1));
  const trajectory = delta > 4 ? 'surging' : delta < -4 ? 'cooling' : previous ? 'steady' : 'fresh';

  const boosterPack = TRAITS[profile.dominantTrait].boosters;
  const secondaryBoosters = TRAITS[profile.secondaryTrait].boosters.slice(0, 2);
  const systemBoosters = [...new Set([...boosterPack, ...secondaryBoosters])].slice(0, 5);

  const growthEdge = resolveGrowthEdge(profile, growthPreference);
  const narrative = buildNarrative(profile, trajectory, delta, growthEdge);

  return { trajectory, systemBoosters, growthEdge, narrative };
}

function resolveGrowthEdge(profile, preference) {
  if (preference && preference !== 'balanced') {
    return {
      target: preference,
      rationale: 'You requested an intentional push into this lane. System rituals will pivot accordingly.'
    };
  }
  const lowest = Object.entries(profile.normalized).sort((a, b) => a[1] - b[1])[0];
  return {
    target: lowest?.[0] || 'analytical',
    rationale: 'Automatically steering focus to reinforce your thinnest edge.'
  };
}

function buildNarrative(profile, trajectory, delta, growthEdge) {
  const dominantMeta = TRAITS[profile.dominantTrait];
  const trendText = trajectory === 'fresh'
    ? 'Opening baseline captured — we will now track micro-shifts every run.'
    : trajectory === 'surging'
      ? `Momentum rising (+${delta}). Keep compounding in this lane.`
      : trajectory === 'cooling'
        ? `Energy cooled (${delta}). Let's reinforce before drift sets in.`
        : 'Trajectory steady. We can now layer cross-trait combos.';

  return {
    headline: `${dominantMeta.label} mode detected (${profile.vibeScore}%)`,
    trend: trendText,
    boost: `Next evolution pulse: ${growthEdge.target.toUpperCase()} — ${growthEdge.rationale}`,
    description: dominantMeta.description
  };
}

function buildDnaRecord(profile, insights) {
  return {
    vibeScore: profile.vibeScore,
    timestamp: new Date().toISOString(),
    source: 'vibe-quiz',
    traitTotals: profile.traitTotals,
    normalized: profile.normalized,
    dominantTrait: profile.dominantTrait,
    secondaryTrait: profile.secondaryTrait,
    trajectory: insights.trajectory,
    boosters: insights.systemBoosters,
    growthEdge: insights.growthEdge,
    narrative: insights.narrative
  };
}

async function persistDnaRecord(userKey, dnaRecord) {
  const safeKey = sanitizeKey(userKey || 'anon');
  const recordId = `${safeKey}-${Date.now()}`;
  const payload = { ...dnaRecord, id: recordId, user: safeKey };

  if (window.firebase && window.firebase.database) {
    await window.firebase.database().ref(`behavioral_dna/${recordId}`).set(payload);
  } else {
    const cacheKey = `behavioral_dna:${safeKey}`;
    const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    existing.push(payload);
    localStorage.setItem(cacheKey, JSON.stringify(existing));
  }
}

function renderResult(container, profile, insights) {
  const traitList = Object.entries(profile.normalized)
    .map(([trait, score]) => `<li><strong>${TRAITS[trait].label}:</strong> ${score}%</li>`)
    .join('');

  const boosters = insights.systemBoosters
    .map((tip) => `<li>${tip}</li>`)
    .join('');

  container.innerHTML = `
    <div class="vibe-report">
      <h4>${insights.narrative.headline}</h4>
      <p>${insights.narrative.description}</p>
      <p class="vibe-report__trend">${insights.narrative.trend}</p>
      <p class="vibe-report__boost">${insights.narrative.boost}</p>
      <ul class="vibe-report__traits">${traitList}</ul>
      <div class="vibe-report__boosters">
        <h5>System boosters to trigger now:</h5>
        <ul>${boosters}</ul>
      </div>
    </div>
  `;
}

function renderHistory(container, history) {
  if (!history.length) {
    container.innerHTML = '<p>No previous runs yet. Each session teaches the system how to personalize the stacks.</p>';
    return;
  }
  const entries = history.slice().reverse().map((entry) => {
    const date = new Date(entry.timestamp).toLocaleString();
    return `<li><span>${date}</span> — <strong>${TRAITS[entry.dominantTrait].label}</strong> (${entry.vibeScore}%) · ${entry.trajectory}</li>`;
  }).join('');
  container.innerHTML = `
    <h4>Evolution log</h4>
    <ul>${entries}</ul>
  `;
}

function loadHistory(userKey) {
  const cacheKey = `vibe-history-${sanitizeKey(userKey || 'anon')}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse vibe history', err);
    return [];
  }
}

function persistHistory(userKey, history) {
  const cacheKey = `vibe-history-${sanitizeKey(userKey || 'anon')}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to persist vibe history', err);
  }
}

function getUserKey() {
  return localStorage.getItem('currentUser') || 'anon';
}

function sanitizeKey(value) {
  return (value || '').toString().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export { mountVibeQuiz };
