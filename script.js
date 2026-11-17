(() => {
  'use strict';

  // Cole aqui o endereço oficial do checkout. Enquanto estiver vazio, o botão
  // direciona para a seção de compra e exibe um aviso em vez de inventar um link.
  const PURCHASE_URL = 'https://pay.hotmart.com/V106616215L';
  const STORAGE_KEY = 'mente-expansao-progresso-v1';
  const THEME_KEY = 'mente-expansao-tema-v1';

  const root = document.documentElement;
  const cards = [...document.querySelectorAll('.part-card')];
  const searchInput = document.getElementById('partSearch');
  const noResults = document.getElementById('noResults');
  const filterStatus = document.getElementById('filterStatus');
  const completedCount = document.getElementById('completedCount');
  const progressBar = document.getElementById('readingProgressBar');
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const themeToggle = document.getElementById('themeToggle');
  const resetButton = document.getElementById('resetProgress');
  const backToTop = document.getElementById('backToTop');
  const purchaseButton = document.getElementById('purchaseButton');
  const purchaseHint = document.getElementById('purchaseHint');
  const bookCover = document.getElementById('bookCover');
  const coverFallback = document.getElementById('coverFallback');

  function readCompleted() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return new Set(Array.isArray(parsed) ? parsed.filter(n => Number.isInteger(n) && n >= 1 && n <= 13) : []);
    } catch (error) {
      return new Set();
    }
  }

  let completed = readCompleted();

  function saveCompleted() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    } catch (error) {
      filterStatus.textContent = 'Não foi possível salvar o progresso neste navegador.';
    }
  }

  function renderProgress() {
    completedCount.textContent = String(completed.size);
    const percentage = (completed.size / cards.length) * 100;
    cards.forEach(card => {
      const number = Number(card.dataset.part);
      const isDone = completed.has(number);
      const button = card.querySelector('.complete-button');
      card.classList.toggle('completed', isDone);
      button.setAttribute('aria-pressed', String(isDone));
      button.textContent = isDone ? 'Concluída · desfazer' : 'Marcar como concluída';
    });
    // O indicador da página acompanha a leitura; o contador acompanha as partes marcadas.
    document.querySelector('.catalog-stat').setAttribute('aria-label', `${completed.size} de ${cards.length} partes concluídas`);
    root.style.setProperty('--completion-value', `${percentage}%`);
  }

  cards.forEach(card => {
    card.querySelector('.complete-button').addEventListener('click', () => {
      const number = Number(card.dataset.part);
      if (completed.has(number)) completed.delete(number);
      else completed.add(number);
      saveCompleted();
      renderProgress();
    });
  });

  resetButton.addEventListener('click', () => {
    if (completed.size === 0) {
      filterStatus.textContent = 'Nenhuma parte está marcada. Seu progresso já está zerado.';
      return;
    }
    completed.clear();
    saveCompleted();
    renderProgress();
    filterStatus.textContent = 'Progresso reiniciado neste navegador.';
  });

  function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  searchInput.addEventListener('input', () => {
    const query = normalize(searchInput.value);
    let visible = 0;
    cards.forEach(card => {
      const searchable = normalize(`${card.innerText} ${card.dataset.search || ''}`);
      const matches = !query || searchable.includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    });
    noResults.hidden = visible !== 0;
    filterStatus.textContent = query
      ? `${visible} ${visible === 1 ? 'parte encontrada' : 'partes encontradas'} para “${searchInput.value.trim()}”.`
      : 'Exibindo as 13 partes do guia.';
  });

  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mainNav.classList.toggle('open', open);
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }));

  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
    try { localStorage.setItem(THEME_KEY, theme); } catch (error) { /* tema continua funcional nesta sessão */ }
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (error) { /* usa o tema padrão */ }
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');
  themeToggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  function updateScrollUI() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI);
  updateScrollUI();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  bookCover.addEventListener('error', () => {
    bookCover.hidden = true;
    coverFallback.hidden = false;
  });

  if (PURCHASE_URL.trim()) {
    purchaseButton.href = PURCHASE_URL.trim();
    purchaseButton.target = '_blank';
    purchaseButton.rel = 'noopener noreferrer';
    purchaseHint.textContent = 'Checkout processado pela Hotmart. Confira preço, condições e detalhes antes de concluir.';
  } else {
    purchaseButton.href = '#adquirir';
    purchaseButton.addEventListener('click', event => {
      event.preventDefault();
      purchaseHint.textContent = 'O link de checkout ainda não foi configurado. Edite PURCHASE_URL no início de script.js.';
    });
  }

  document.getElementById('currentYear').textContent = String(new Date().getFullYear());
  renderProgress();
})();
