// Génère compte-rendu-s3.html puis compte-rendu-s3.pdf (via Microsoft Edge)
// Lancer depuis le dossier Tp2 :  node compte-rendu/build-s3.js
// Les captures sont à placer dans captures/s3/ avec les noms listés ci-dessous.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CAPTURES = path.join(ROOT, 'captures', 's3');

// ---- À COMPLÉTER ----------------------------------------------------------
const ETUDIANT = { nom: 'Mohamed Jegham', classe: '5ème DS G3' };
// ---------------------------------------------------------------------------

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lire = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const code = (s, titre) => (titre ? `<p class="fichier">${titre}</p>` : '') + `<pre><code>${esc(s.trim())}</code></pre>`;

const manquantes = [];
function capture(fichier, legende) {
  const p = path.join(CAPTURES, fichier);
  if (!fs.existsSync(p)) {
    manquantes.push(fichier);
    return `<div class="missing">Capture manquante : captures/s3/${fichier}<br>${legende}</div>`;
  }
  const data = fs.readFileSync(p).toString('base64');
  return `<figure><img src="data:image/png;base64,${data}"><figcaption>${legende}</figcaption></figure>`;
}

const atlas = [
  ['atlas-users.png', 'MongoDB Atlas → Database → Collections : base <code>blogDB</code>, collection <code>users</code> avec les documents insérés (champs <code>createdAt</code>/<code>updatedAt</code> ajoutés par <code>timestamps</code>).'],
  ['atlas-articles.png', 'Collection <code>articles</code> : le champ <code>author</code> est stocké sous forme d\'<code>ObjectId</code> (référence vers <code>users</code>).'],
];

const postman = [
  ['post-user.png', 'POST /api/users avec un utilisateur valide → <b>201 Created</b>. MongoDB génère l\'<code>_id</code>, le rôle et les dates.'],
  ['post-article.png', 'POST /api/articles avec <code>authorId</code> = <code>_id</code> de l\'utilisateur → <b>201 Created</b>. Le champ <code>author</code> est déjà peuplé (<code>name</code>, <code>email</code>).'],
  ['get-articles.png', 'GET /api/articles → <b>200 OK</b>. <code>.populate(\'author\', \'name email\')</code> remplace l\'ObjectId par l\'objet auteur.'],
  ['doublon-409.png', 'POST /api/users avec un email déjà utilisé → <b>409 Conflict</b> (<code>User.findOne({ email })</code> trouve un doublon).'],
];

const ex2 = [
  ['ex2-casterror.png', 'GET /api/articles/abc → <b>400 Bad Request</b> « Identifiant de ressource invalide (format ObjectId attendu) » au lieu d\'une 500.'],
];

const fichiersCode = [
  'models/userModel.js',
  'models/articleModel.js',
  'controllers/userController.js',
  'controllers/articleController.js',
  'utils/gererErreur.js',
  'routes/userRoutes.js',
  'config/db.js',
  'server.js',
];

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Compte-rendu MERN – Séance 3</title>
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
  <h1>Compte-rendu – MERN Séance 3</h1>
  <p><b>Persistance des données avec MongoDB Atlas et Mongoose</b></p>
  <p>${esc(ETUDIANT.nom)} – ${esc(ETUDIANT.classe)}</p>
  <p>École Polytechnique de Sousse – Dr. Abdelweheb GUEDDES – 2026–2027</p>
</div>

<h2>1. Réponse à l'encadré « Prédisez »</h2>
<p><i>10 requêtes POST, puis redémarrage du serveur (Ctrl+C puis <code>npm run dev</code>) : que renvoie <code>GET /api/articles</code> ?</i></p>
<p>En Séance 2, les articles sont stockés dans la variable <code>let articles = [...]</code> du contrôleur, donc dans la
<b>mémoire vive du processus Node</b>. Les 10 POST ajoutent bien 10 objets au tableau (ids 4 à 13), mais Ctrl+C termine
le processus et le système libère toute sa mémoire.</p>
<p>Au redémarrage, Node relit et ré-exécute <code>articleController.js</code> : le tableau est recréé à partir de sa valeur
initiale écrite dans le code. Le client reçoit donc <b>200 OK avec uniquement les 3 articles codés en dur</b>
(<code>total: 3</code>). Les 10 articles créés sont définitivement perdus, et <code>prochainId</code> repart à 4 : le
prochain article créé réutilisera un id déjà distribué avant le redémarrage.</p>
<p>Avec MongoDB Atlas, les documents sont écrits sur le disque du cluster, en dehors du processus Node. Redémarrer le
serveur ne fait que rouvrir la connexion : <code>Article.find()</code> renvoie toujours les 10 articles (vérifié à
l'étape 7.4).</p>

<h2>2. MongoDB Atlas – collections <code>users</code> et <code>articles</code></h2>
${atlas.map(c => capture(c[0], c[1])).join('\n')}

<h2>3. Tests Postman – TP guidé</h2>
${postman.map(c => capture(c[0], c[1])).join('\n')}

<h2>4. Exercice 1 – Intégrité référentielle et contraintes avancées</h2>
<p>Ajout de <code>bio</code> (<code>maxlength: 200</code>) et <code>phone</code> (<code>match: /^\\d{8}$/</code>) dans
<code>userModel.js</code>. Le contrôleur <code>deleteUser</code> vérifie d'abord que l'utilisateur existe (404 sinon), puis
cherche une dépendance avec <code>Article.findOne({ author: req.params.id })</code> : si un article existe, la suppression
est refusée (400). Sans cette vérification, les articles de l'utilisateur supprimé pointeraient vers un <code>_id</code>
inexistant et <code>.populate()</code> renverrait <code>author: null</code>.</p>

<h2>5. Exercice 2 – Gestion des identifiants invalides (CastError)</h2>
<p>Un <code>_id</code> MongoDB est une chaîne hexadécimale de 24 caractères. Quand on passe <code>"abc"</code> à
<code>findById</code>, Mongoose ne peut pas le convertir en <code>ObjectId</code> et lève une <code>CastError</code>.
Ce n'est pas une panne du serveur mais une erreur du client : la bonne réponse est <b>400</b>, pas 500.</p>
<p>Le test <code>err.name === 'CastError'</code> est placé dans <code>utils/gererErreur.js</code>, appelé dans le
<code>catch</code> de tous les contrôleurs (dont <code>getArticleById</code> et <code>getUserById</code>). Le même helper
transforme aussi une <code>ValidationError</code> en 400 et une erreur d'index unique (code <code>11000</code>) en 409.</p>
<table>
  <tr><th>Requête</th><th>Cas</th><th>Statut</th></tr>
  <tr><td>GET /api/articles/abc</td><td>ID mal formé → CastError</td><td>400</td></tr>
  <tr><td>GET /api/users/123</td><td>ID mal formé → CastError</td><td>400</td></tr>
  <tr><td>GET /api/users/665a1b2c3d4e5f6a7b8c9d0e</td><td>ID valide mais inexistant</td><td>404</td></tr>
</table>
${ex2.map(c => capture(c[0], c[1])).join('\n')}

<h2>6. Code source</h2>
${fichiersCode.map(f => code(lire(f), f)).join('\n')}
</body></html>`;

const htmlPath = path.join(__dirname, 'compte-rendu-s3.html');
const pdfPath = path.join(__dirname, 'compte-rendu-s3.pdf');
fs.writeFileSync(htmlPath, html);

const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
              'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (edge) {
  execFileSync(edge, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
  console.log('PDF généré :', pdfPath);
} else {
  console.log('Edge introuvable : ouvrez compte-rendu-s3.html et faites Ctrl+P > Enregistrer en PDF');
}
if (manquantes.length) console.log('\nCaptures manquantes (' + manquantes.length + ') dans captures/s3/ :\n  ' + manquantes.join('\n  '));
