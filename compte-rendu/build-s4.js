// Génère compte-rendu-s4.html puis compte-rendu-s4.pdf (via Microsoft Edge)
// Lancer depuis le dossier Tp2 :  node compte-rendu/build-s4.js
// Les captures sont à placer dans captures/s4/ avec les noms listés ci-dessous.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CAPTURES = path.join(ROOT, 'captures', 's4');

// ---- À COMPLÉTER ----------------------------------------------------------
const ETUDIANT = { nom: 'Mohamed Jegham', classe: '5ème DS G3' };
// ---------------------------------------------------------------------------

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lire = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const code = (s, titre) => (titre ? `<p class="fichier">${titre}</p>` : '') + `<pre><code>${esc(s.trim())}</code></pre>`;

// Extrait une fonction "const nom = ..." (avec ses commentaires au-dessus) jusqu'à la ligne "};"
function extrait(fichier, debut) {
  const lignes = lire(fichier).split(/\r?\n/);
  const i = lignes.findIndex(l => l.startsWith(debut));
  if (i === -1) throw new Error(`"${debut}" introuvable dans ${fichier}`);
  let s = i;
  while (s > 0 && lignes[s - 1].startsWith('//')) s--;
  let j = i;
  while (j < lignes.length && lignes[j] !== '};') j++;
  return code(lignes.slice(s, j + 1).join('\n'), `${fichier} – ${debut.replace('const ', '')}`);
}

const manquantes = [];
function capture(fichier, legende) {
  const p = path.join(CAPTURES, fichier);
  if (!fs.existsSync(p)) {
    manquantes.push(fichier);
    return `<div class="missing">Capture manquante : captures/s4/${fichier}<br>${legende}</div>`;
  }
  const data = fs.readFileSync(p).toString('base64');
  return `<figure><img src="data:image/png;base64,${data}"><figcaption>${legende}</figcaption></figure>`;
}

const ex1 = [
  ['ex1-ancien-incorrect-401.png', 'PUT /api/users/update-password avec un <code>oldPassword</code> erroné → <b>401 Unauthorized</b> « Ancien mot de passe incorrect ».'],
  ['ex1-update-password-200.png', 'PUT /api/users/update-password avec le bon <code>oldPassword</code> → <b>200 OK</b>, mot de passe mis à jour.'],
  ['ex1-login-ancien-401.png', 'POST /api/users/login avec l\'<b>ancien</b> mot de passe → <b>401</b> « Identifiants invalides » : il n\'est plus accepté.'],
  ['ex1-login-nouveau-200.png', 'POST /api/users/login avec le <b>nouveau</b> mot de passe → <b>200 OK</b> et nouveau token.'],
];

const ex2 = [
  ['ex2-my-articles-200.png', 'GET /api/articles/my-articles avec le token de Mohamed → <b>200 OK</b> : uniquement ses propres articles.'],
  ['ex2-my-articles-401.png', 'GET /api/articles/my-articles sans token → <b>401 Unauthorized</b> : la route est protégée.'],
  ['ex2-register-role-ignore.png', 'POST /api/users/register avec <code>"role": "admin"</code> dans le body → <b>201</b> mais <code>"role": "user"</code> : l\'escalade de privilèges est bloquée.'],
  ['ex2-put-role-403.png', 'PUT /api/users/:id/role avec le token d\'un simple utilisateur → <b>403 Forbidden</b> (bloqué par <code>adminOnly</code>).'],
  ['ex2-atlas-role-admin.png', 'MongoDB Atlas : le premier administrateur est promu manuellement (<code>role: "admin"</code>), puisque l\'inscription publique ne le permet plus.'],
  ['ex2-put-role-200.png', 'PUT /api/users/:id/role avec le token administrateur → <b>200 OK</b>, l\'utilisateur passe <code>admin</code>.'],
];

const ex3 = [
  ['ex3-token-10s.png', 'Modification temporaire de <code>generateToken</code> : <code>expiresIn: \'10s\'</code>.'],
  ['ex3-token-expire-401.png', 'GET /api/users/profile avec un token de plus de 10 secondes → <b>401</b> « Votre session a expiré, veuillez vous reconnecter ».'],
];

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Compte-rendu MERN – Séance 4</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  body { font: 11pt/1.45 "Segoe UI", Arial, sans-serif; color: #1a1a1a; max-width: 800px; margin: auto; }
  h1 { font-size: 20pt; margin: 0; } h2 { font-size: 14pt; border-bottom: 2px solid #1f3a8a; padding-bottom: 3px; margin-top: 26px; color: #1f3a8a; }
  h3 { font-size: 12pt; margin: 18px 0 6px; }
  h2, h3, .fichier { break-after: avoid; }
  .garde { text-align: center; padding: 60px 0 40px; border-bottom: 1px solid #ccc; }
  .garde p { margin: 4px 0; color: #444; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin: 8px 0; }
  th, td { border: 1px solid #bbb; padding: 4px 6px; vertical-align: top; text-align: left; } th { background: #eef1f8; }
  pre { background: #f5f6f8; border: 1px solid #ddd; padding: 8px 10px; font: 9pt/1.4 Consolas, monospace; white-space: pre-wrap; }
  code { font-family: Consolas, monospace; font-size: 9.5pt; }
  .fichier { font: bold 10pt Consolas, monospace; margin: 14px 0 2px; color: #1f3a8a; }
  figure { margin: 10px 0; break-inside: avoid; } img { max-width: 100%; max-height: 95mm; border: 1px solid #ccc; display: block; }
  figcaption { font-size: 9.5pt; color: #444; margin-top: 3px; }
  .missing { border: 2px dashed #d33; color: #d33; padding: 14px; margin: 8px 0; font-size: 10pt; break-inside: avoid; }
</style></head><body>

<div class="garde">
  <h1>Compte-rendu – MERN Séance 4</h1>
  <p><b>Authentification JWT, hachage Bcrypt et middlewares de sécurité</b></p>
  <p>${esc(ETUDIANT.nom)} – ${esc(ETUDIANT.classe)}</p>
  <p>École Polytechnique de Sousse – Dr. Abdelweheb GUEDDES – 2026–2027</p>
</div>

<h2>1. Exercice 1 – Mise à jour sécurisée du mot de passe</h2>
<p>La route <code>PUT /api/users/update-password</code> est protégée par <code>protect</code> : seul un utilisateur
connecté peut changer <b>son propre</b> mot de passe, identifié par <code>req.user._id</code> (extrait du token, jamais du body).</p>
<p>Le middleware charge <code>req.user</code> avec <code>.select('-password')</code> : le hash n'y figure donc pas. Le
contrôleur recharge l'utilisateur avec <code>User.findById(req.user._id)</code> pour récupérer le hash, puis
<code>bcrypt.compare(oldPassword, user.password)</code> vérifie l'ancien mot de passe. En cas d'échec, la réponse est
<b>401</b> « Ancien mot de passe incorrect ». Sinon, un <b>nouveau sel</b> est généré (<code>bcrypt.genSalt(10)</code>),
<code>newPassword</code> est haché puis enregistré avec <code>user.save()</code>.</p>
<p>La longueur minimale (6 caractères) est vérifiée <b>avant</b> le hachage : le <code>minlength</code> du schéma
s'appliquerait au hash (toujours 60 caractères) et ne bloquerait jamais un mot de passe trop court.</p>
${extrait('controllers/userController.js', 'const updatePassword')}
<table>
  <tr><th>Requête</th><th>Cas</th><th>Statut</th></tr>
  <tr><td>PUT /api/users/update-password</td><td>Sans token</td><td>401</td></tr>
  <tr><td>PUT /api/users/update-password</td><td>Champ manquant ou <code>newPassword</code> &lt; 6 caractères</td><td>400</td></tr>
  <tr><td>PUT /api/users/update-password</td><td><code>oldPassword</code> incorrect</td><td>401</td></tr>
  <tr><td>PUT /api/users/update-password</td><td><code>oldPassword</code> correct</td><td>200</td></tr>
  <tr><td>POST /api/users/login</td><td>Ancien mot de passe après changement</td><td>401</td></tr>
  <tr><td>POST /api/users/login</td><td>Nouveau mot de passe</td><td>200</td></tr>
</table>
${ex1.map(c => capture(c[0], c[1])).join('\n')}

<h2>2. Exercice 2 – Articles personnels et attribution des rôles</h2>
<h3>2.1 Route GET /api/articles/my-articles</h3>
<p>Express teste les routes <b>dans l'ordre de leur déclaration</b>. Si <code>/my-articles</code> était déclarée après
<code>/:id</code>, la chaîne « my-articles » serait capturée comme un identifiant : <code>findById('my-articles')</code>
lèverait une <code>CastError</code> (400). La route est donc placée avant <code>/:id</code> et protégée par
<code>protect</code>. Le filtre <code>Article.find({ author: req.user._id })</code> utilise l'identité vérifiée du token.</p>
${extrait('controllers/articleController.js', 'const getMyArticles')}
${code(lire('routes/articleRoutes.js'), 'routes/articleRoutes.js')}

<h3>2.2 Protection contre l'escalade de privilèges</h3>
<p>Avant la correction, n'importe qui pouvait envoyer <code>"role": "admin"</code> à <code>/register</code> et obtenir
tous les droits. Désormais, <code>role</code> n'est plus lu dans <code>req.body</code> et l'utilisateur est toujours créé avec
<code>role: 'user'</code>.</p>
${extrait('controllers/userController.js', 'const registerUser')}

<h3>2.3 Route d'administration PUT /api/users/:id/role</h3>
<p>La route est protégée par <code>protect</code> puis <code>adminOnly</code> : un simple utilisateur reçoit <b>403</b>.
Le rôle demandé est vérifié (<code>'user'</code> ou <code>'admin'</code>, sinon 400), puis appliqué avec
<code>findByIdAndUpdate</code> et <code>runValidators: true</code>. La réponse exclut le mot de passe. L'inscription ne
pouvant plus créer d'administrateur, le tout premier admin est promu directement dans MongoDB Atlas.</p>
${extrait('controllers/userController.js', 'const updateUserRole')}
<table>
  <tr><th>Requête</th><th>Cas</th><th>Statut</th></tr>
  <tr><td>GET /api/articles/my-articles</td><td>Avec token</td><td>200 (seulement ses articles)</td></tr>
  <tr><td>GET /api/articles/my-articles</td><td>Sans token</td><td>401</td></tr>
  <tr><td>POST /api/users/register</td><td><code>"role": "admin"</code> dans le body</td><td>201 avec <code>role: "user"</code></td></tr>
  <tr><td>PUT /api/users/:id/role</td><td>Token d'un utilisateur simple</td><td>403</td></tr>
  <tr><td>PUT /api/users/:id/role</td><td>Token admin, rôle invalide</td><td>400</td></tr>
  <tr><td>PUT /api/users/:id/role</td><td>Token admin, <code>{ "role": "admin" }</code></td><td>200</td></tr>
</table>
${ex2.map(c => capture(c[0], c[1])).join('\n')}

<h2>3. Exercice 3 – Gestion explicite de l'expiration du jeton</h2>
<p><code>jwt.verify()</code> lève une exception différente selon le problème : <code>TokenExpiredError</code> quand la date
<code>exp</code> du payload est dépassée, <code>JsonWebTokenError</code> quand la signature ou le format est invalide.
Le <code>catch</code> de <code>protect</code> teste <code>err.name === 'TokenExpiredError'</code> pour renvoyer un message
précis. Le client (le futur front-end React) sait ainsi qu'il doit simplement renvoyer l'utilisateur vers la page de
connexion, alors qu'un token falsifié garde le message générique.</p>
${extrait('middlewares/authMiddleware.js', 'const protect')}
<p>Test : <code>expiresIn</code> passé temporairement à <code>'10s'</code> dans <code>generateToken</code>, connexion,
attente de 15 secondes, puis appel de <code>GET /api/users/profile</code>. La durée a ensuite été remise à <code>'1d'</code>.</p>
<table>
  <tr><th>Token envoyé à GET /api/users/profile</th><th>Statut</th><th>Message</th></tr>
  <tr><td>Valide</td><td>200</td><td>Profil de l'utilisateur</td></tr>
  <tr><td>Expiré</td><td>401</td><td>Votre session a expiré, veuillez vous reconnecter</td></tr>
  <tr><td>Signature modifiée</td><td>401</td><td>Non autorisé, token invalide ou expiré</td></tr>
</table>
${ex3.map(c => capture(c[0], c[1])).join('\n')}
</body></html>`;

const htmlPath = path.join(__dirname, 'compte-rendu-s4.html');
const pdfPath = path.join(__dirname, 'compte-rendu-s4.pdf');
fs.writeFileSync(htmlPath, html);

const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
              'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (edge) {
  execFileSync(edge, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
  console.log('PDF généré :', pdfPath);
} else {
  console.log('Edge introuvable : ouvrez compte-rendu-s4.html et faites Ctrl+P > Enregistrer en PDF');
}
if (manquantes.length) console.log('\nCaptures manquantes (' + manquantes.length + ') dans captures/s4/ :\n  ' + manquantes.join('\n  '));
