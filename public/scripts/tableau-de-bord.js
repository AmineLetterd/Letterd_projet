// ========== TABLEAU DE BORD - Navigation et films ==========
// Import du catalogue partagé (voir catalogue.js)

let currentPage = 1;

// Récupération des éléments du DOM spécifiques au tableau de bord
const profileBtn = document.getElementById('profileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const mylistBtn = document.getElementById('myListBtn');
const welcomeText = document.getElementById('welcome-text');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

// Redirection si non connecté
const userPseudo = localStorage.getItem('userPseudo');
if (!userPseudo) {
  window.location.href = 'index.html';
}

// Afficher le message de bienvenue
welcomeText.textContent = `Bienvenue ${userPseudo}!`;
if (profileBtn) {
  profileBtn.textContent = userPseudo;
}

// Navigation - Profil
if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    window.location.href = 'profil.html';
  });
}

// Navigation - Ma liste
if (mylistBtn) {
  mylistBtn.addEventListener('click', () => {
    window.location.href = 'ma-liste.html';
  });
}

// Navigation - Déconnexion
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userPseudo');
    window.location.href = 'index.html';
  });
}

// Charger les films (2 pages pour avoir 28 résultats)
function loadMovies(page) {
  Promise.all([
    fetch(`/api/movies?page=${page}`).then(res => res.json()),
    fetch(`/api/movies?page=${page + 1}`).then(res => res.json())
  ])
  .then(([data1, data2]) => {
    const combined = [...data1, ...data2].slice(0, 28);
    renderItems(combined);
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

// Charger les IDs de la liste de l'utilisateur
loadUserListIds();