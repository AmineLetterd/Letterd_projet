// ========== PAGE D'ACCUEIL - AUTHENTIFICATION ET FILMS ==========
// Import du catalogue partagé (voir catalogue.js)

let currentPage = 1;
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

// Fonction pour charger et afficher les films depuis l'API
function loadMovies(page) {
  fetch(`/api/movies?page=${page}`)
    .then(res => res.json())
    .then(data => {
      renderItems(data);
    });
}

window.loadMoviesHandler = loadMovies;

loadMovies(currentPage);

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadMovies(currentPage);
  }
});

nextBtn.addEventListener('click', () => {
  currentPage++;
  loadMovies(currentPage);
});

searchBtn.addEventListener('click', () => {
  const query = searchInput.value;
  fetch(`/api/search?q=${query}`)
    .then(res => res.json())
    .then(data => {
      renderItems(data);
    });
});

// Gestion des filtres de catégorie
categoryButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    categoryButtons.forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');
    selectedCategory = btn.dataset.category;
    const query = searchInput.value.trim();
    if (query) {
      searchBtn.click();
    } else {
      loadMovies(currentPage);
    }
  });
});

// ========== AUTHENTIFICATION ==========
// Récupération des éléments d'authentification du DOM
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authPopup = document.getElementById('authPopup');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Bouton d'ouverture de la fenêtre de connexion
loginBtn.addEventListener('click', () => {
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  authPopup.classList.remove('hidden');
});

// Bouton d'ouverture de la fenêtre d'inscription
signupBtn.addEventListener('click', () => {
  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  authPopup.classList.remove('hidden');
});

// Bouton pour fermer la fenêtre modale
closeBtn.addEventListener('click', () => {
  authPopup.classList.add('hidden');
});

// Fermer la fenêtre en cliquant en dehors
authPopup.addEventListener('click', (e) => {
  if (e.target === authPopup) {
    authPopup.classList.add('hidden');
  }
});

// ========== GESTION DU FORMULAIRE DE CONNEXION ==========
// Soumettre le formulaire de connexion
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const inputs = loginForm.querySelectorAll('input');
  const pseudo = inputs[0].value;
  const password = inputs[1].value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pseudo, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('userPseudo', data.pseudo);
      window.location.href = 'tableau-de-bord.html';
    } else {
      alert('❌ ' + data.error);
    }
  })
  .catch(err => alert('Erreur: ' + err));
});

// ========== GESTION DU FORMULAIRE D'INSCRIPTION ==========
// Soumettre le formulaire d'inscription
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const inputs = signupForm.querySelectorAll('input');
  const pseudo = inputs[0].value;
  const email = inputs[1].value;
  const password = inputs[2].value;
  const confirmPassword = inputs[3].value;

  fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pseudo, email, password, confirmPassword })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('✅ Inscription réussie! Vous êtes connecté');
      localStorage.setItem('userPseudo', pseudo);
      window.location.href = 'tableau-de-bord.html';
    } else {
      alert('❌ ' + data.error);
    }
  })
  .catch(err => alert('Erreur: ' + err));
});

loadUserListIds();