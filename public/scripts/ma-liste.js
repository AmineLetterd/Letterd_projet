// ========== INITIALISATION ==========
// Récupération des éléments du DOM et vérification de connexion
const usernameDisplay = document.getElementById('username');
const userPseudo = localStorage.getItem('userPseudo');

// Rediriger vers la connexion si l'utilisateur n'est pas connecté
if (!userPseudo) window.location.href = 'index.html';

usernameDisplay.textContent = userPseudo;
// Clic sur le profil
usernameDisplay.addEventListener('click', () => { window.location.href='profil.html'; });

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('userPseudo');
  window.location.href = 'index.html';
});

let currentEditItem = null;

// ========== CHARGEMENT DE LA LISTE ==========
// Fonction pour charger et afficher la liste des films/séries de l'utilisateur
function loadList() {
  fetch(`/api/user/list/${userPseudo}`)
    .then(r => r.json())
    .then(data => {
      if (!data.success) return;
      const items = data.items || [];
      const list = document.getElementById('list');
      list.innerHTML = '';

      // Variables pour calculer les statistiques
      let totalNoted = 0, moviesNoted = 0, tvNoted = 0, sumNotes = 0, countNotes = 0;

      // Créer une carte pour chaque film/série de la liste
      items.forEach(it => {
        const div = document.createElement('div');
        div.className = 'list-card';
        div.style.cursor = 'pointer';
        div.innerHTML = `
          <img src="${it.poster_path ? 'https://image.tmdb.org/t/p/w200'+it.poster_path : ''}" />
          <div class="list-meta">
            <h3>${it.title || ''}</h3>
            <div>TMDB: ${it.tmdb_rating || '-'}</div>
            <div>Ma note: ${it.user_rating || '-'}</div>
            <div>Statut: ${it.status || '-'}</div>
            <div><button class="edit-btn">Modifier</button></div>
          </div>
        `;

        list.appendChild(div);

        // Clic sur la carte pour ouvrir le modal
        div.addEventListener('click', (e) => {
          if (e.target.closest('.edit-btn')) return;
          openEditModal(it);
        });

        // Bouton Modifier
        const editBtn = div.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditModal(it);
        });

        // Compter les films notés pour les statistiques
        if (it.user_rating !== null && it.user_rating !== undefined) {
          totalNoted++;
          sumNotes += Number(it.user_rating) || 0;
          countNotes++;
          if (it.media_type === 'movie') moviesNoted++;
          if (it.media_type === 'tv') tvNoted++;
        }
      });

      // Mettre à jour les statistiques
      document.getElementById('total-noted').textContent = totalNoted;
      document.getElementById('movies-noted').textContent = moviesNoted;
      document.getElementById('tv-noted').textContent = tvNoted;
      document.getElementById('avg-note').textContent = countNotes ? (sumNotes / countNotes).toFixed(2) : '0';
    });
}

// ========== MODALE D'ÉDITION ==========
function openEditModal(item) {
  currentEditItem = item;
  const modal = document.getElementById('editModal');
  modal.classList.remove('hidden');
  modal.querySelector('.edit-poster').src = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '';
  modal.querySelector('.edit-title').textContent = item.title || '';
  modal.querySelector('.edit-tmdb').textContent = item.tmdb_rating || '-';
  modal.querySelector('.edit-rating').value = item.user_rating || '';
  modal.querySelector('.edit-status').value = item.status || '';
}

document.querySelector('.close-edit').addEventListener('click', () => {
  document.getElementById('editModal').classList.add('hidden');
  currentEditItem = null;
});

// ========== SAUVEGARDE DES MODIFICATIONS ==========
document.querySelector('.update-item').addEventListener('click', () => {
  const rating = document.querySelector('.edit-rating').value;
  const status = document.querySelector('.edit-status').value;

  fetch('/api/user/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pseudo: userPseudo,
      tmdb_id: currentEditItem.tmdb_id,
      media_type: currentEditItem.media_type,
      title: currentEditItem.title,
      poster_path: currentEditItem.poster_path,
      overview: currentEditItem.overview,
      tmdb_rating: currentEditItem.tmdb_rating,
      user_rating: rating ? Number(rating) : null,
      status: status || null,
      in_list: 1
    })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      document.getElementById('editModal').classList.add('hidden');
      loadList();
    } else {
      alert('Erreur lors de la sauvegarde');
    }
  });
});

// ========== SUPPRESSION D'UN FILM/SÉRIE ==========
document.querySelector('.delete-item-modal').addEventListener('click', () => {
  if (!confirm('Supprimer cet item ?')) return;

  fetch('/api/user/item', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pseudo: userPseudo, tmdb_id: currentEditItem.tmdb_id })
  }).then(r => r.json()).then(d => {
    if (d.success) {
      document.getElementById('editModal').classList.add('hidden');
      loadList();
    } else {
      alert('Erreur');
    }
  });
});

loadList();
