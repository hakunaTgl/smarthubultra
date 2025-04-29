import { IDB, showToast, logActivity } from './utils.js';
import { generateBehavioralDNA } from './behavioralDNA.js';

export function setupBotBuilder() {
  const workspace = document.getElementById('builder-workspace');
  workspace.innerHTML = '';
  document.querySelectorAll('.component').forEach(comp => {
    comp.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text', e.target.dataset.type);
    });
  });

  workspace.addEventListener('dragover', e => e.preventDefault());
  workspace.addEventListener('drop', async e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text');
    const node = document.createElement('div');
    node.className = 'node';
    node.textContent = type;
    workspace.appendChild(node);
  });

  document.getElementById('build-bot').addEventListener('click', async () => {
    const nodes = workspace.querySelectorAll('.node');
    if (nodes.length === 0) {
      showToast('Invalid Bot Configuration: No components added');
      return;
    }
    const bot = {
      id: Date.now().toString(),
      name: 'BuiltBot',
      purpose: 'Custom bot from builder',
      code: `return async () => "Built bot with ${nodes.length} components";`,
      creator: localStorage.getItem('currentUser'),
      createdAt: Date.now()
    };
