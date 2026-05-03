// ========== CATALOGUE PARTAGÉ - Gestion des films et séries ==========

let selectedCategory = 'all';
let currentItems = [];
let userListIds = new Set();

// Récupération des éléments du DOM
const container = document.getElementById('movies');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('searchBtn');

// Fonction pour vérifier si un film/série correspond à la catégorie sélectionnée
function matchesCategory(item) {
  if (selectedCategory === 'all') {
    return item.media_type === 'movie' || item.media_type === 'tv' || (!item.media_type && (item.title || item.name));
  }
  return item.media_type === selectedCategory;
}

// Fonction pour afficher les films/séries dans le conteneur
function renderItems(items) {
  currentItems = items;
  container.innerHTML = '';

  const filteredItems = items.filter(matchesCategory);

  if (filteredItems.length === 0) {
    container.innerHTML = '<p>Aucun resultat pour cette categorie.</p>';
    return;
  }

  filteredItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.tmdbId = item.id;
    div.dataset.mediaType = item.media_type || (item.title ? 'movie' : 'tv');

    const title = item.title || item.name;
    const image = item.poster_path
      ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
      : '';
    const inList = userListIds.has(String(item.id));

    div.innerHTML = `
      <h3>${title}</h3>
      <img src="${image}" />
      <div class="rating-badge">${item.vote_average ? item.vote_average.toFixed(1) : '—'}</div>
      ${inList ? '<div class="list-badge">Dans ma liste</div>' : ''}
    `;

    div.addEventListener('click', () => openDetailModal(item));
    container.appendChild(div);
  });
}

// Charger les IDs de la liste de l'utilisateur
function loadUserListIds() {
  const userPseudo = localStorage.getItem('userPseudo');
  if (!userPseudo) {
    userListIds = new Set();
    return;
  }

  fetch(`/api/user/list/${userPseudo}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;
      userListIds = new Set((data.items || [])
        .filter(item => Number(item.in_list) === 1)
        .map(item => String(item.tmdb_id)));

      if (currentItems.length) {
        renderItems(currentItems);
      }
    })
    .catch(() => {
      userListIds = new Set();
    });
}

// Création de la fenêtre modale (une seule fois)
if (!document.getElementById('detailModal')) {
  const detailModal = document.createElement('div');
  detailModal.id = 'detailModal';
  detailModal.className = 'detail-modal hidden';
  detailModal.innerHTML = `
    <div class="detail-content">
      <span class="close-detail">&times;</span>
      <img class="detail-poster" src="" />
      <div class="detail-body">
        <h2 class="detail-title"></h2>
        <p class="detail-overview"></p>
        <div class="detail-row"><strong>Note TMDB:</strong> <span class="detail-tmdb">-</span></div>
        <div class="detail-actions">
          <label>Ma note (0-10): <input type="number" min="0" max="10" step="0.5" class="user-rating" /></label>
          <label>Statut: <select class="user-status"><option value="">--</option><option value="A voir">A voir</option><option value="Déja vu">Déja vu</option><option value="Pas vu">Pas vu</option></select></label>
          <button class="save-item">Ajouter à ma liste</button>
        </div>
        <p class="auth-warning" style="color:#ff4d4f; display:none; margin-top:10px;">Créez un compte pour ajouter cet item à votre liste.</p>
      </div>
    </div>
  `;
  document.body.appendChild(detailModal);
}

// Fonction pour ouvrir la modale avec les détails du film/série
function openDetailModal(item) {
  const modal = document.getElementById('detailModal');
  modal.classList.remove('hidden');
  
  modal.querySelector('.detail-poster').src = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '';
  modal.querySelector('.detail-title').textContent = item.title || item.name;
  modal.querySelector('.detail-overview').textContent = item.overview || '';
  modal.querySelector('.detail-tmdb').textContent = item.vote_average ? item.vote_average.toFixed(1) : '-';
  modal.querySelector('.user-rating').value = '';
  modal.querySelector('.user-status').value = '';

  modal.querySelector('.close-detail').onclick = () => modal.classList.add('hidden');

  const userRatingInput = modal.querySelector('.user-rating');
  const statusSelect = modal.querySelector('.user-status');
  const saveBtn = modal.querySelector('.save-item');
  saveBtn.disabled = true;

  const isLogged = !!localStorage.getItem('userPseudo');
  const actions = modal.querySelector('.detail-actions');
  const authWarning = modal.querySelector('.auth-warning');
  
  if (!isLogged) {
    actions.style.display = 'none';
    if (authWarning) authWarning.style.display = 'block';
    const existingDel = modal.querySelector('.delete-item'); 
    if (existingDel) existingDel.remove();
  } else {
    actions.style.display = 'flex';
    if (authWarning) authWarning.style.display = 'none';
  }

  function updateFieldsForStatus() {
    if (statusSelect.value === 'Déja vu') {
      userRatingInput.parentElement.style.display = 'inline-block';
      saveBtn.textContent = 'Ajouter à ma liste';
    } else {
      userRatingInput.parentElement.style.display = 'none';
      saveBtn.textContent = 'Ajouter à ma liste';
    }
    saveBtn.disabled = statusSelect.value === '';
  }

  statusSelect.addEventListener('change', updateFieldsForStatus);

  const userPseudo = localStorage.getItem('userPseudo');
  if (userPseudo) {
    fetch(`/api/user/item/${userPseudo}/${item.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.item) {
          const it = d.item;
          if (it.user_rating !== null && it.user_rating !== undefined) userRatingInput.value = it.user_rating;
          if (it.status) statusSelect.value = it.status;
          
          if (it.in_list == 1) {
            if (!modal.querySelector('.delete-item')) {
              const delBtn = document.createElement('button');
              delBtn.textContent = 'Supprimer';
              delBtn.className = 'btn-danger delete-item';
              delBtn.style.marginLeft = '6px';
              modal.querySelector('.detail-actions').appendChild(delBtn);
              delBtn.onclick = () => {
                if (!confirm('Supprimer cet item ?')) return;
                fetch('/api/user/item', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pseudo: userPseudo, tmdb_id: item.id })
                }).then(r => r.json()).then(d => {
                  if (d.success) { alert('Supprimé'); modal.classList.add('hidden'); }
                  else alert('Erreur');
                });
              };
            }
          }
        }
        updateFieldsForStatus();
      })
      .catch(() => { updateFieldsForStatus(); });
  } else {
    updateFieldsForStatus();
  }

  if (isLogged) {
    saveBtn.onclick = () => {
      const userPseudo = localStorage.getItem('userPseudo');
      if (!userPseudo) { alert('Connecte-toi pour enregistrer'); return; }

      const payload = {
        pseudo: userPseudo,
        tmdb_id: item.id,
        media_type: item.media_type || (item.title ? 'movie' : 'tv'),
        title: item.title || item.name,
        poster_path: item.poster_path || null,
        overview: item.overview || null,
        tmdb_rating: item.vote_average || null,
        user_rating: userRatingInput.value ? Number(userRatingInput.value) : null,
        status: statusSelect.value || null,
        in_list: 1
      };

      fetch('/api/user/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            alert('✅ Enregistré');
            modal.classList.add('hidden');
          } else {
            alert('Erreur: ' + (d.error || ''));
          }
        })
        .catch(err => alert('Erreur: ' + err));
    };
  }
}

// Note: La gestion des filtres de catégorie est faite dans chaque page spécifique (accueil.js, tableau-de-bord.js)
