const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const icons = {
  spark: '<path d="M12 2c.4 5.6 3.4 8.6 9 9-5.6.4-8.6 3.4-9 9-.4-5.6-3.4-8.6-9-9 5.6-.4 8.6-3.4 9-9Z"/><path d="M19 2v4M21 4h-4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M4 19V9M10 19V4M16 19v-7M22 19H2"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18h1.3a1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9H18a3 3 0 0 0 3-3C21 7.1 17 3 12 3Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="15" cy="7" r="1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  upload: '<path d="M12 16V3M7 8l5-5 5 5M4 15v5h16v-5"/>'
};

$$('[data-icon]').forEach((element) => {
  element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[element.dataset.icon]}</svg>`;
});

const scriptInput = $('#scriptInput');
const toast = $('#toast');
let captionText = '';
let toastTimer;
let saveTimer;

const example = `# 00:00 The hidden cost of every upload
Every video starts with a good idea. But between the first draft and publish day, creators lose hours rewriting titles, guessing chapters, and briefing thumbnails from scratch.

# 01:15 Build one source of truth
Your script should power the whole publishing workflow. We will turn each section into accurate metadata while keeping every claim grounded in what you actually said.

# 03:05 Make timing deterministic
AI should never invent timestamps. Use final captions to calculate where each chapter really begins, then let the model write only the chapter names.

# 05:20 Design the packaging
A strong title, thumbnail, and opening description all make the same promise. Generate three distinct creative directions, then test what your audience responds to.

# 07:10 Review before you publish
Automation should accelerate judgment—not replace it. Check the facts, approve the final package, and publish privately first.`;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function showToast(message) {
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function updateCount() {
  const value = scriptInput.value.trim();
  $('#wordCount').textContent = `${value ? value.split(/\s+/).length : 0} words`;
  $('#charCount').textContent = `${scriptInput.value.length.toLocaleString()} / 30,000`;
}

function saveDraft() {
  const draft = {
    script: scriptInput.value,
    audience: $('#audienceInput').value,
    keyword: $('#keywordInput').value,
    duration: $('#durationInput').value,
    tone: $('#toneSelect').value,
    language: $('#languageSelect').value
  };
  localStorage.setItem('frameforge-draft', JSON.stringify(draft));
  $('.saved').innerHTML = '<i></i> Saved';
}

function scheduleSave() {
  $('.saved').innerHTML = '<i></i> Saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 450);
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('frameforge-draft'));
    if (!draft?.script) return;
    scriptInput.value = draft.script || '';
    $('#audienceInput').value = draft.audience || '';
    $('#keywordInput').value = draft.keyword || '';
    $('#durationInput').value = draft.duration || '';
    $('#toneSelect').value = draft.tone || 'Clear & confident';
    $('#languageSelect').value = draft.language || 'English (US)';
    showToast('Draft restored');
  } catch (error) {
    localStorage.removeItem('frameforge-draft');
  }
}

function loadExample() {
  scriptInput.value = example;
  $('#audienceInput').value = 'Solo YouTube creators and small content teams';
  $('#keywordInput').value = 'creator content workflow';
  $('#durationInput').value = '8';
  updateCount();
  saveDraft();
  scriptInput.focus();
}

function capitalize(value) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function cleanHeading(value) {
  return value.replace(/[*_`#]/g, '').replace(/\s+/g, ' ').trim();
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function parseScriptSections(source) {
  const matches = [...source.matchAll(/^#{1,6}\s+(?:(\d{1,2}):(\d{2})(?::(\d{2}))?\s+)?(.+)$/gm)];
  if (!matches.length) {
    const paragraphs = source.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    return paragraphs.slice(0, 6).map((paragraph, index) => ({
      title: index === 0 ? 'Introduction' : cleanHeading(paragraph.split(/[.!?]/)[0]).slice(0, 52),
      seconds: null
    }));
  }
  return matches.slice(0, 8).map((match) => {
    let seconds = null;
    if (match[1] !== undefined) {
      seconds = match[3] !== undefined
        ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
        : Number(match[1]) * 60 + Number(match[2]);
    }
    return { title: cleanHeading(match[4]), seconds };
  });
}

function parseCaptionStarts(source) {
  const starts = [...source.matchAll(/(?:^|\n)(?:\d+\s*\n)?(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})\s+-->/g)];
  return starts.map((match) => Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]));
}

function buildChapters() {
  let sections = parseScriptSections(scriptInput.value);
  if (!sections.length) sections = [{ title: 'Introduction', seconds: 0 }];
  const duration = Math.max(60, Number($('#durationInput').value || 8) * 60);
  const captionStarts = parseCaptionStarts(captionText);
  const hasMarkers = sections.every((section) => section.seconds !== null);

  if (captionStarts.length >= sections.length) {
    sections = sections.map((section, index) => ({ ...section, seconds: captionStarts[Math.floor(index * captionStarts.length / sections.length)] }));
    sections[0].seconds = 0;
    $('#timingConfidence').textContent = 'Caption-aligned · high confidence';
  } else if (hasMarkers) {
    $('#timingConfidence').textContent = 'Script markers · review timing';
  } else {
    sections = sections.map((section, index) => ({ ...section, seconds: Math.round(index * duration / sections.length) }));
    $('#timingConfidence').textContent = 'Word-count estimate · final review required';
  }

  if (sections.length < 3) {
    sections = [
      { title: sections[0]?.title || 'Introduction', seconds: 0 },
      { title: 'The key idea', seconds: Math.round(duration / 3) },
      { title: 'Putting it into practice', seconds: Math.round(duration * 2 / 3) }
    ];
  }
  sections[0].seconds = 0;
  return sections;
}

function buildTitles(keyword) {
  const topic = keyword || parseScriptSections(scriptInput.value)[0]?.title || 'content workflow';
  const readableTopic = capitalize(topic).slice(0, 38);
  return [
    `Build a ${readableTopic} That Actually Saves Time`,
    `From Raw Script to Ready-to-Publish: ${readableTopic}`,
    `The Smarter Way to Master ${readableTopic}`
  ].map((title) => title.length <= 70 ? title : `${title.slice(0, 67).trim()}…`);
}

function buildDescription(chapters, keyword) {
  const audience = $('#audienceInput').value.trim() || 'creators who want a clearer publishing process';
  const topic = keyword || 'a smarter content workflow';
  const chapterBlock = chapters.map((chapter) => `${formatTime(chapter.seconds)} ${chapter.title}`).join('\n');
  return `Turn the mess behind every upload into a clear, repeatable workflow—from first draft to final publish.\n\nIn this video, we break down ${topic} for ${audience}. You’ll see how to keep your packaging accurate, make chapter timing dependable, and build a review process you can trust.\n\nCHAPTERS\n${chapterBlock}\n\nIf this helped, subscribe for more practical creator systems.\n\n#CreatorWorkflow #YouTubeStrategy #ContentSystems`;
}

function createTags(keyword) {
  const base = [keyword, 'creator workflow', 'YouTube strategy', 'content system', 'video metadata', 'creator tools'];
  return [...new Set(base.map((tag) => tag?.trim()).filter(Boolean))].slice(0, 8);
}

function updateDescriptionCount() {
  const bytes = new TextEncoder().encode($('#fullDescription').value).length;
  $('#descriptionCount').textContent = `${bytes.toLocaleString()} / 5,000 bytes`;
  $('#descriptionCount').classList.toggle('limit-warning', bytes > 5000);
}

function populateResults() {
  const keyword = $('#keywordInput').value.trim();
  const titles = buildTitles(keyword);
  const chapters = buildChapters();
  const description = buildDescription(chapters, keyword);
  const tags = createTags(keyword);

  $('#selectedTitle').textContent = titles[0];
  $('#titleLength').textContent = `${titles[0].length} / 70 characters`;
  $('#descriptionHook').textContent = description.split('\n')[0];
  $('#fullDescription').value = description;
  updateDescriptionCount();

  $('#titleOptions').innerHTML = '';
  titles.forEach((title, index) => {
    const option = document.createElement('button');
    option.className = `title-option${index === 0 ? ' selected' : ''}`;
    option.innerHTML = `<small>${['Search-led', 'Transformation', 'Curiosity-led'][index]}</small><p>${escapeHTML(title)}</p><span>${title.length} / 70 characters · Grounded in script</span>`;
    option.addEventListener('click', () => {
      $$('.title-option').forEach((item) => item.classList.remove('selected'));
      option.classList.add('selected');
      $('#selectedTitle').textContent = title;
      $('#titleLength').textContent = `${title.length} / 70 characters`;
      showToast('Title selected');
    });
    $('#titleOptions').append(option);
  });

  $('#chapterList').innerHTML = chapters.map((chapter) => `
    <div class="chapter-item"><time>${formatTime(chapter.seconds)}</time><i></i><span>${escapeHTML(chapter.title)}</span></div>
  `).join('');

  $('#tagList').innerHTML = tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('');

  const topic = escapeHTML(keyword || 'your core idea');
  const concepts = [
    ['THE SHIFT', 'The transformation', `A visual before-and-after for ${topic}.`],
    ['STOP GUESSING', 'The problem', 'Bold type, expressive creator, and one clear point of tension.'],
    ['ONE SYSTEM', 'The outcome', 'A clean creator workflow with connected, ordered steps.']
  ];
  $('#conceptGrid').innerHTML = concepts.map((concept) => `
    <div class="concept-card"><div class="concept-art">${concept[0]}</div><div class="concept-info"><span>${concept[1]}</span><p>${concept[2]}</p><strong>16:9 · Text-safe · High contrast</strong></div></div>
  `).join('');
}

function finishGeneration(button) {
  populateResults();
  $('#loadingState').classList.add('hidden');
  $('#results').classList.remove('hidden');
  $('#statusPill').classList.add('ready');
  $('#statusPill').innerHTML = '<i></i>Validated';
  $('#resultSubtitle').textContent = 'A complete, review-ready package.';
  button.disabled = false;
  showToast('Publishing kit is ready');
}

async function readCaptionFile(file) {
  if (!file || !/\.(srt|vtt)$/i.test(file.name)) {
    showToast('Please choose an SRT or VTT file');
    return;
  }
  captionText = await file.text();
  $('#uploadLabel').textContent = file.name;
  $('#captionDrop').classList.add('has-file');
  showToast('Caption file attached');
}

$('#loadExample').addEventListener('click', loadExample);
scriptInput.addEventListener('input', updateCount);
$$('#scriptInput, #audienceInput, #keywordInput, #durationInput, #toneSelect, #languageSelect').forEach((field) => {
  field.addEventListener('input', scheduleSave);
  field.addEventListener('change', scheduleSave);
});

$('#srtUpload').addEventListener('change', (event) => readCaptionFile(event.target.files[0]));
const captionDrop = $('#captionDrop');
['dragenter', 'dragover'].forEach((eventName) => captionDrop.addEventListener(eventName, (event) => {
  event.preventDefault();
  captionDrop.classList.add('dragging');
}));
['dragleave', 'drop'].forEach((eventName) => captionDrop.addEventListener(eventName, (event) => {
  event.preventDefault();
  captionDrop.classList.remove('dragging');
}));
captionDrop.addEventListener('drop', (event) => readCaptionFile(event.dataTransfer.files[0]));

$('#generateBtn').addEventListener('click', () => {
  if (scriptInput.value.trim().split(/\s+/).length < 20) {
    scriptInput.closest('.field').classList.add('shake');
    setTimeout(() => scriptInput.closest('.field').classList.remove('shake'), 400);
    showToast('Add at least 20 words to continue');
    scriptInput.focus();
    return;
  }

  const button = $('#generateBtn');
  button.disabled = true;
  $('#emptyState').classList.add('hidden');
  $('#results').classList.add('hidden');
  $('#loadingState').classList.remove('hidden');
  $('#statusPill').classList.remove('ready');
  $('#statusPill').innerHTML = '<i></i>Forging';
  $('#progressBar').style.width = '8%';

  let progress = 8;
  let messageIndex = 0;
  const messages = [
    [22, 'Finding the core promise…'], [42, 'Writing title directions…'],
    [61, 'Structuring chapters…'], [78, 'Designing thumbnail concepts…'],
    [91, 'Running platform checks…']
  ];
  const timer = setInterval(() => {
    progress += Math.random() * 8;
    $('#progressBar').style.width = `${Math.min(progress, 96)}%`;
    if (messageIndex < messages.length && progress > messages[messageIndex][0]) {
      $('#loadingText').textContent = messages[messageIndex][1];
      messageIndex += 1;
    }
    if (progress >= 98) {
      clearInterval(timer);
      setTimeout(() => finishGeneration(button), 300);
    }
  }, 150);
});

$$('.result-tabs button').forEach((button) => button.addEventListener('click', () => {
  $$('.result-tabs button').forEach((tab) => tab.classList.remove('active'));
  $$('.tab-content').forEach((content) => content.classList.remove('active'));
  button.classList.add('active');
  $(`#${button.dataset.tab}`).classList.add('active');
}));

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const helper = document.createElement('textarea');
    helper.value = text;
    document.body.append(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }
  showToast('Copied to clipboard');
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.copy-btn');
  if (!button) return;
  const target = $(`#${button.dataset.copyTarget}`);
  copyText(target.value ?? target.textContent);
});

$('#fullDescription').addEventListener('input', updateDescriptionCount);

const modal = $('#modalBackdrop');
function closeModal() { modal.classList.add('hidden'); }
$('#detailsBtn').addEventListener('click', () => modal.classList.remove('hidden'));
$('#modalClose').addEventListener('click', closeModal);
$('#modalDone').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

$('#exportBtn').addEventListener('click', () => {
  const title = $('#selectedTitle').textContent;
  const chapterText = $$('.chapter-item').map((item) => `${item.querySelector('time').textContent} ${item.querySelector('span').textContent}`).join('\n');
  const tags = $$('#tagList span').map((tag) => tag.textContent).join(', ');
  const data = `FRAMEFORGE PUBLISHING KIT\n\nTITLE\n${title}\n\nDESCRIPTION\n${$('#fullDescription').value}\n\nCHAPTERS\n${chapterText}\n\nTAGS\n${tags}\n\nSTATUS\nValidated — human review required`;
  const blob = new Blob([data], { type: 'text/plain' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'frameforge-publishing-kit.txt';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  showToast('Publishing kit exported');
});

$('#shareBtn').addEventListener('click', () => copyText(location.href));
$('#notificationBtn').addEventListener('click', () => showToast('You’re all caught up'));
$('#upgradeBtn').addEventListener('click', () => showToast('Creator Pro is coming soon'));
$('#newProjectBtn').addEventListener('click', () => {
  [scriptInput, $('#audienceInput'), $('#keywordInput'), $('#durationInput')].forEach((field) => { field.value = ''; });
  captionText = '';
  localStorage.removeItem('frameforge-draft');
  updateCount();
  $('#results').classList.add('hidden');
  $('#loadingState').classList.add('hidden');
  $('#emptyState').classList.remove('hidden');
  $('#statusPill').className = 'status-pill';
  $('#statusPill').innerHTML = '<i></i>Draft';
  $('#resultSubtitle').textContent = 'Your generated assets will appear here.';
  $('#uploadLabel').textContent = 'Add SRT / VTT';
  $('#captionDrop').classList.remove('has-file');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  scriptInput.focus();
  showToast('New project created');
});

$('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.addEventListener('click', (event) => {
  if (innerWidth <= 760 && !event.target.closest('#sidebar') && !event.target.closest('#mobileMenu')) {
    $('#sidebar').classList.remove('open');
  }
});
$$('.nav-item').forEach((item) => item.addEventListener('click', () => {
  if (item.dataset.page !== 'studio') showToast(`${item.querySelector('span').textContent} is ready for your next workflow`);
}));

restoreDraft();
updateCount();
