const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


// Configuration de l'application
const app = express();
const PORT = 3000;
const API_KEY = "c2d9932c8490ac665eada567d5272a13";


// Configuration de la base de données
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Erreur BD:', err);
  else console.log('BD SQLite connectée');
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS user_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT NOT NULL,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT,
    title TEXT,
    poster_path TEXT,
    overview TEXT,
    tmdb_rating REAL,
    user_rating REAL,
    status TEXT,
    in_list INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pseudo, tmdb_id)
  )
`);


// Intergiciels
app.use(express.json());
app.use(express.static('public'));


// Routes des films
app.get('/api/movies', async (req, res) => {
  try {
    const page = req.query.page || 1;
    
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&page=${page}&language=fr-FR`
    );
    
    res.json(response.data.results);
  } catch (error) {
    res.status(500).send("Erreur API");
  }
});


app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}&language=fr-FR`
    );
    res.json(response.data.results);
  } catch (error) {
    res.status(500).send("Erreur recherche");
  }
});


// Routes d'authentification
app.post('/api/signup', async (req, res) => {
  const { pseudo, email, password, confirmPassword } = req.body;

  if (!pseudo || !email || !password) {
    return res.status(400).json({ success: false, error: 'Tous les champs sont requis' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Les mots de passe ne correspondent pas' });
  }

  try {
    db.run(
      'INSERT INTO users (pseudo, email, password) VALUES (?, ?, ?)',
      [pseudo, email, password],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ success: false, error: 'Pseudo ou email déjà utilisé' });
          }
          return res.status(500).json({ success: false, error: 'Erreur inscription' });
        }
        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});


app.post('/api/login', (req, res) => {
  const { pseudo, password } = req.body;

  if (!pseudo || !password) {
    return res.status(400).json({ success: false, error: 'Pseudo et mot de passe requis' });
  }

  db.get('SELECT * FROM users WHERE pseudo = ?', [pseudo], async (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Pseudo ou mot de passe incorrect' });
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Pseudo ou mot de passe incorrect' });
    }

    res.json({ success: true, pseudo: user.pseudo });
  });
});


// Routes du profil
app.get('/api/profile/:pseudo', (req, res) => {
  const { pseudo } = req.params;

  db.get(
    'SELECT pseudo, email, created_at FROM users WHERE pseudo = ?',
    [pseudo],
    (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Profil introuvable' });
      }

      res.json({ success: true, user });
    }
  );
});

app.put('/api/profile', async (req, res) => {
  const { currentPseudo, newPseudo, currentPassword, newPassword } = req.body;

  if (!currentPseudo || !currentPassword) {
    return res.status(400).json({ success: false, error: 'Pseudo actuel et mot de passe actuel requis' });
  }

  try {
    db.get('SELECT * FROM users WHERE pseudo = ?', [currentPseudo], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
      }

      const isPasswordValid = currentPassword === user.password;
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect' });
      }

      const finalPseudo = (newPseudo || '').trim() || currentPseudo;
      const finalPassword = newPassword || user.password;

      db.run(
        'UPDATE users SET pseudo = ?, password = ? WHERE id = ?',
        [finalPseudo, finalPassword, user.id],
        function(updateErr) {
          if (updateErr) {
            if (updateErr.message.includes('UNIQUE')) {
              return res.status(400).json({ success: false, error: 'Ce pseudo est déjà pris' });
            }
            return res.status(500).json({ success: false, error: 'Erreur mise à jour profil' });
          }

          res.json({ success: true, pseudo: finalPseudo });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});


app.delete('/api/profile', async (req, res) => {
  const { pseudo, password } = req.body;

  if (!pseudo || !password) {
    return res.status(400).json({ success: false, error: 'Pseudo et mot de passe requis' });
  }

  try {
    db.get('SELECT * FROM users WHERE pseudo = ?', [pseudo], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
      }

      const isPasswordValid = password === user.password;
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
      }

      db.run('DELETE FROM users WHERE id = ?', [user.id], function(deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ success: false, error: 'Erreur suppression compte' });
        }

        res.json({ success: true });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});


// Éléments utilisateur : sauvegarde ou mise à jour de la note, du statut et de la présence dans la liste
app.post('/api/user/item', (req, res) => {
  const { pseudo, tmdb_id, media_type, title, poster_path, overview, tmdb_rating, user_rating, status, in_list } = req.body;

  if (!pseudo || !tmdb_id) return res.status(400).json({ success: false, error: 'Données manquantes' });

  db.get('SELECT id FROM user_items WHERE pseudo = ? AND tmdb_id = ?', [pseudo, tmdb_id], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: 'Erreur BD' });

    if (row) {
      db.run(
        `UPDATE user_items SET media_type = ?, title = ?, poster_path = ?, overview = ?, tmdb_rating = ?, user_rating = ?, status = ?, in_list = ? WHERE id = ?`,
        [media_type, title, poster_path, overview, tmdb_rating, user_rating, status, in_list ? 1 : 0, row.id],
        function(updateErr) {
          if (updateErr) return res.status(500).json({ success: false, error: 'Erreur mise à jour' });
          res.json({ success: true });
        }
      );
    } else {
      db.run(
        `INSERT INTO user_items (pseudo, tmdb_id, media_type, title, poster_path, overview, tmdb_rating, user_rating, status, in_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pseudo, tmdb_id, media_type, title, poster_path, overview, tmdb_rating, user_rating, status, in_list ? 1 : 0],
        function(insertErr) {
          if (insertErr) return res.status(500).json({ success: false, error: 'Erreur insertion' });
          res.json({ success: true });
        }
      );
    }
  });
});

// Récupérer la liste de l'utilisateur
app.get('/api/user/list/:pseudo', (req, res) => {
  const { pseudo } = req.params;
  db.all('SELECT * FROM user_items WHERE pseudo = ? ORDER BY created_at DESC', [pseudo], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'Erreur BD' });
    res.json({ success: true, items: rows });
  });
});

// Récupérer un élément utilisateur unique
app.get('/api/user/item/:pseudo/:tmdb_id', (req, res) => {
  const { pseudo, tmdb_id } = req.params;
  db.get('SELECT * FROM user_items WHERE pseudo = ? AND tmdb_id = ?', [pseudo, tmdb_id], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: 'Erreur BD' });
    if (!row) return res.status(404).json({ success: false, error: 'Introuvable' });
    res.json({ success: true, item: row });
  });
});

// Supprimer un élément utilisateur
app.delete('/api/user/item', (req, res) => {
  const { pseudo, tmdb_id } = req.body;
  if (!pseudo || !tmdb_id) return res.status(400).json({ success: false, error: 'Données manquantes' });
  db.run('DELETE FROM user_items WHERE pseudo = ? AND tmdb_id = ?', [pseudo, tmdb_id], function(err) {
    if (err) return res.status(500).json({ success: false, error: 'Erreur BD' });
    res.json({ success: true });
  });
});


// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});