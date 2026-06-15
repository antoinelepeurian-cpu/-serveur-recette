const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();
const compteurs = {};

// Liste des testeurs avec leurs codes
const testeurs = [
  { email: 'alise.ozolina@gmail.com', code: 'TEST01', used: false },
  { email: 'antoinelepeurian@gmail.com', code: 'TEST02', used: false },
  { email: 'aurelie.riotte@gmail.com', code: 'TEST03', used: false },
  { email: 'barbay.fabien76@gmail.com', code: 'TEST04', used: false },
  { email: 'beatricelepeurian@gmail.com', code: 'TEST05', used: false },
  { email: 'bengaillon@yahoo.fr', code: 'TEST06', used: false },
  { email: 'cavymarion@gmail.com', code: 'TEST07', used: false },
  { email: 'claireflorianleo@gmail.com', code: 'TEST08', used: false },
  { email: 'david.matias0330@orange.fr', code: 'TEST09', used: false },
  { email: 'derrienguillaumecl@gmail.com', code: 'TEST10', used: false },
  { email: 'ea.aie.aue@gmail.com', code: 'TEST11', used: false },
  { email: 'gregory.griffin@dalkiafroidsolutions.com', code: 'TEST12', used: false },
  { email: 'gregorygriffin@hotmail.fr', code: 'TEST13', used: false },
  { email: 'grisel.julien@gmail.com', code: 'TEST14', used: false },
  { email: 'jefone74@gmail.com', code: 'TEST15', used: false },
  { email: 'jgbequet@gmail.com', code: 'TEST16', used: false },
  { email: 'jrdnjan@gmail.com', code: 'TEST17', used: false },
  { email: 'maymaquennehan@gmail.com', code: 'TEST18', used: false },
  { email: 'sachaleterrible@gmail.com', code: 'TEST19', used: false },
  { email: 'scamedescasse@gmail.com', code: 'TEST20', used: false },
  { email: 'thomas.4.vigneron@gmail.com', code: 'TEST21', used: false },
];
  { email: 'antoinelepeurian@gmail.com', code: 'TEST02' },
  { email: 'aurelie.riotte@gmail.com', code: 'TEST03' },
  { email: 'barbay.fabien76@gmail.com', code: 'TEST04' },
  { email: 'beatricelepeurian@gmail.com', code: 'TEST05' },
  { email: 'bengaillon@yahoo.fr', code: 'TEST06' },
  { email: 'cavymarion@gmail.com', code: 'TEST07' },
  { email: 'claireflorianleo@gmail.com', code: 'TEST08' },
  { email: 'david.matias0330@orange.fr', code: 'TEST09' },
  { email: 'derrienguillaumecl@gmail.com', code: 'TEST10' },
  { email: 'ea.aie.aue@gmail.com', code: 'TEST11' },
  { email: 'gregory.griffin@dalkiafroidsolutions.com', code: 'TEST12' },
  { email: 'gregorygriffin@hotmail.fr', code: 'TEST13' },
  { email: 'grisel.julien@gmail.com', code: 'TEST14' },
  { email: 'jefone74@gmail.com', code: 'TEST15' },
  { email: 'jgbequet@gmail.com', code: 'TEST16' },
  { email: 'jrdnjan@gmail.com', code: 'TEST17' },
  { email: 'maymaquennehan@gmail.com', code: 'TEST18' },
  { email: 'sachaleterrible@gmail.com', code: 'TEST19' },
  { email: 'scamedescasse@gmail.com', code: 'TEST20' },
  { email: 'thomas.4.vigneron@gmail.com', code: 'TEST21' },
];

const testeurValides = {}; // { deviceId: true }
app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
app.post('/valider-testeur', async (req, res) => {
  const { email, code, deviceId } = req.body;
  
  const testeur = testeurs.find(t => t.email === email && t.code === code);
  
  if (!testeur) {
    return res.json({ valide: false, message: 'Email ou code incorrect' });
  }
  
  if (testeur.used) {
    return res.json({ valide: false, message: 'Ce code a déjà été utilisé' });
  }
  
  testeur.used = true;
  testeurValides[deviceId] = true;
  res.json({ valide: true, message: 'Accès testeur débloqué !' });
});
app.post('/recette', async (req, res) => {
  const { ingredients, envie, placard, derniereFormeRef, airfryer, personnes, materiel, deviceId } = req.body;
  // 🔒 Sécurité : on bloque les entrées trop longues (protège la facture API)
  if (!ingredients || typeof ingredients !== 'string' || ingredients.length > 2000) {
    return res.status(400).json({ erreur: 'Liste trop longue (2000 caractères max).' });
  }
  const today = new Date().toISOString().split('T')[0];
  if (!compteurs[deviceId]) compteurs[deviceId] = { date: today, count: 0 };
  if (compteurs[deviceId].date !== today) compteurs[deviceId] = { date: today, count: 0 };
  if (!testeurValides[deviceId] && compteurs[deviceId].count >= 1) {
    return res.json({ limite: true, message: 'Limite gratuite atteinte' });
  }
  compteurs[deviceId].count++;
console.log('Personnes reçues:', personnes);
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: `Tu es un chef cuisinier créatif spécialisé dans les recettes simples, modernes, réalistes et visuellement fortes.
Ta mission : créer UNE recette maison cohérente à partir des ingrédients fournis par l'utilisateur, en respectant une cuisine simple mais précise, sans erreur technique.
La recette doit être simple mais jamais plate : peu d'ingrédients, bonne organisation, fraîcheur, contrastes nets, dressage lisible.

🥕 INGRÉDIENTS DISPONIBLES
${ingredients}

🔧 MATÉRIEL DISPONIBLE
${materiel || 'Non renseigné'}

👥 NOMBRE DE PERSONNES
${personnes || 2} personne(s) — adapte toutes les quantités en conséquence.
Tu DOIS obligatoirement écrire le nombre de personnes entre parenthèses juste après le titre.
Exemple obligatoire : # Poulet rôti (pour ${personnes || 2} personnes)

🍽️ ENVIE / STYLE DU MOMENT
${envie || 'une recette savoureuse'}

🚫 INGRÉDIENTS À ÉVITER
aucun

🚫 INTERDICTIONS ABSOLUES — PRIORITÉ CRITIQUE
- JAMAIS proposer à l'utilisateur d'acheter un produit fini qu'il n'a PAS listé (ex: "achète une brique de velouté").
- Si l'utilisateur a déjà un produit fini dans son inventaire ou placard (ex: "velouté en brique"), alors l'utiliser comme ingrédient de base et créer une vraie recette qui l'améliore ou l'enrichit.
- TOUJOURS composer une recette maison, jamais proposer simplement de chauffer un produit industriel seul.
- Interdit : "achète X" ou "utilise un produit tout fait" si l'utilisateur ne l'a pas listé.

🧺 PLACARD PAR DÉFAUT
${placard || 'farine, huile, sel, poivre'}
Important :
- Ne jamais tout utiliser.
- Choisir uniquement les éléments nécessaires.
- Si l'utilisateur renseigne des ingrédients disponibles, les utiliser en priorité.
- Si l'utilisateur ne renseigne aucun ingrédient disponible, utiliser le placard par défaut.
- Sel, poivre, huile, eau et beurre sont toujours disponibles.
- Sel, poivre, huile, eau ne comptent pas dans la limite des 8 ingrédients.

${derniereFormeRef ? '⚠️ DERNIÈRE RECETTE PROPOSÉE — Propose obligatoirement autre chose : ' + derniereFormeRef : ''}

${airfryer ? `🔥 ÉQUIPEMENT DISPONIBLE : AIRFRYER
L'utilisateur possède un airfryer. Utilise-le en priorité pour les viandes, volailles et légumes rôtis.
Règles airfryer :
- Température entre 180°C et 200°C
- Temps réduit d'environ 30% vs four classique
- Préciser toujours la température et la durée exacte
- Indice visuel obligatoire : doré, croustillant, etc.
- Retourner à mi-cuisson si nécessaire` : ''}

⚙️ RÈGLES STRICTES
Temps de préparation actif maximum : 30 minutes
Les cuissons longues sont autorisées uniquement si elles sont passives : four, mijotage, cuisson douce sans surveillance constante
Techniques simples uniquement : poêle, four, assemblage, cuisson douce, rôtissage, sauce rapide
Maximum 8 ingrédients au total, hors sel, poivre, huile, eau, beurre
Recette de base = uniquement ingrédients disponibles + placard renseigné ou placard par défaut
Les options ne doivent jamais être indispensables
Maximum 2 options facultatives
Respect strict des exclusions

🧱 STRUCTURE CULINAIRE OBLIGATOIRE
La recette doit être pensée en deux niveaux :

1. RECETTE DE BASE
Créer d'abord une recette simple, complète et cohérente uniquement avec :
- les ingrédients disponibles
- le placard renseigné ou le placard par défaut
- sel, poivre, huile, eau, beurre
Cette recette de base doit fonctionner seule.
Elle doit être bonne, claire, réaliste et ne pas dépendre des ingrédients complémentaires.

2. POUR ALLER PLUS LOIN
Après la recette de base, proposer maximum 2 améliorations facultatives.
Ces améliorations doivent être clairement séparées de la recette principale.
Elles peuvent apporter : acidité, fraîcheur, crémeux, croustillant, contraste chaud/froid, relief aromatique, dressage plus visuel.
Interdiction de forcer une amélioration si elle n'apporte pas une vraie plus-value culinaire.
Si aucun ajout n'est nécessaire, écrire : "Option facultative : aucune, la recette fonctionne telle quelle."

🔥 CUISSONS — OBLIGATION DE PRÉCISION
Chaque cuisson doit obligatoirement préciser :
- Température du four en °C ou intensité du feu
- Type de four si utilisé : statique ou chaleur tournante
- Durée réaliste
- Indice visuel de cuisson : doré, fondant, croustillant, caramélisé, nacré, réduit, etc.
- Test physique si utile : pointe de couteau, texture, résistance, évaporation, coloration
Interdit : "cuire au four" sans température / temps approximatif sans repère visuel / cuisson vague sans signe de réussite

🔥 STRATÉGIE DE CUISSON OPTIMISÉE
Choisir la méthode de cuisson la plus pertinente selon : gain de temps actif, intensité du goût, texture finale, simplicité réelle, impact visuel.
- Les légumes racines peuvent être cuits entiers avec peau si cela réduit la préparation.
- Privilégier la cuisson en papillote quand elle est plus logique.
- Toujours vérifier les légumes durs avec un test physique.
- Adapter la découpe après cuisson si cela améliore le rendu.
- Ne pas éplucher avant cuisson si la peau protège le produit.

🔴 FORME CULINAIRE PRIORITAIRE
Avant de choisir la recette, identifier la forme culinaire la plus pertinente pour l'ingrédient principal :
- viande hachée → boulettes, galettes, kefta, farce
- viande à mijoter → mijoté, effiloché, sauce longue
- viande tendre → saisie rapide, émincé, grillé
- poisson fragile → cuisson douce, pavé, effeuillé
- légumes racines → rôtis, purée, écrasé, cuisson entière, papillote
- légumes durs → rôtis, braisés, blanchis, poêlés après précuisson
- légumineuses → galettes, ragoût court, écrasé, purée
- légumineuses sèches → trempage et cuisson longue obligatoire
- fruits → rôti, compoté, cru assaisonné
- herbes fraîches → finition, condiment, sauce fraîche
Toujours privilégier : texture, concentration du goût, impact visuel.

🔬 GESTES TECHNIQUES FONDAMENTAUX
Cuissons salées :
- Toujours colorer avant d'ajouter un liquide si applicable.
- Adapter la taille de coupe à la cuisson.
- Ne jamais détremper inutilement.
- Réduire une sauce si elle est trop liquide.
- Infuser ou toaster légèrement les épices dans un corps gras.
- Ajouter les herbes fraîches en fin de cuisson ou crues.
Appareils, pâtes, crèmes :
- Œufs + sucre en premier si recette sucrée.
- Ajouter les poudres ensuite, liquides progressivement en dernier.
Organisation :
- Enchaînement logique et fluide.
- Aucune étape inutile.
- Privilégier les raccourcis intelligents de chef.

🧠 COHÉRENCE PRODUIT — PRIORITÉ ABSOLUE
- viande à mijoter → cuisson longue obligatoire
- viande tendre → cuisson rapide possible
- poisson fragile → cuisson courte et douce
- légumes durs → cuisson suffisante obligatoire
- légumineuses sèches → trempage et cuisson longue obligatoire
- herbes fraîches → crues ou ajoutées en fin de cuisson
- épices → toastées légèrement, jamais brûlées

🥬 GESTION DU CRU
Les éléments crus sont autorisés seulement s'ils apportent fraîcheur, texture, acidité, contraste.
Le plat doit chercher l'équilibre : cuit + cru + liant.
Interdit : légume dur cru sans justification / plat entièrement cru ou entièrement mou.

🧠 PHILOSOPHIE CULINAIRE
- peu d'ingrédients bien choisis
- un liant obligatoire : sauce, crème, jus, purée, réduction ou corps gras parfumé
- au moins un contraste réel : fondant/croustillant/frais/crémeux/acidulé/chaud-froid
- une finition fraîche ou aromatique
- un dressage visuel identifiable immédiatement

🎨 STYLE RECHERCHÉ
Éviter les recettes trop classiques. Chercher une originalité simple : sauce vive, herbe fraîche, épice bien choisie, contraste chaud/froid, texture intéressante, dressage graphique.
La recette doit rester familiale, faisable, mais avec une touche contemporaine.

🎥 ORIENTATION VISUELLE
La recette doit être pensée pour une vidéo courte.
Le dressage final doit avoir : contraste de couleurs, volume, sauce ou liant visible, topping identifiable, finition reconnaissable, rendu immédiatement appétissant.

📊 SCORING AUTOMATIQUE
Tester mentalement jusqu'à 3 recettes possibles.
Notation /20 : cohérence produit 5 / simplicité 4 / goût 4 / texture 3 / visuel 3 / originalité 1
Garder uniquement la meilleure. Ne jamais afficher le scoring.

✍️ FORMAT DE RÉPONSE OBLIGATOIRE — Réponds UNIQUEMENT en markdown :

# Nom de la recette

Pourquoi cette recette marche (2-3 lignes max)

## 🛒 Ingrédients
### Base
- liste avec quantités précises
### Options facultatives
- max 2 options

## 👨‍🍳 Étapes
1. étapes numérotées, claires, réalisables

## ⏱️ Temps
- Préparation active : X min
- Cuisson : X min

## 🎨 Dressage
Astuce visuelle pensée pour une vidéo courte.

## 💡 Astuce du Chef
Un vrai conseil en 2-3 phrases minimum. Jamais un emoji seul.

## 🔄 Variante
Une seule variante simple.

🔎 VALIDATION FINALE OBLIGATOIRE
Avant de répondre, vérifier silencieusement :
ordre logique / aucune erreur technique / températures précisées / type de four précisé / durée réaliste / indice visuel de cuisson / cuisson adaptée / recette réalisable / aucun geste inutile / forme culinaire optimale / liant présent / contraste réel / simplicité respectée / résultat visuellement fort / aucun ingrédient interdit utilisé.
Si une incohérence existe, corriger automatiquement avant de répondre.` }]
    });
    res.json({ recette: message.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur Claude' });
  }
});

app.post('/analyser-photo', async (req, res) => {
  const { image } = req.body;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image }},
        { type: 'text', text: 'Liste les elements visibles (ingredients alimentaires OU ustensiles de cuisine), separes par des virgules uniquement. Pas de phrase.' }
      ]}]
    });
    res.json({ ingredients: message.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur analyse photo' });
  }
});

app.post('/categoriser', async (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients || typeof ingredients !== 'string' || ingredients.length > 2000) {
    return res.status(400).json({ erreur: 'Texte trop long (500 caractères max).' });
  }
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `Categorise ces ingredients alimentaires : ${ingredients}

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres, sans backticks.
Format exact :
{"ingredients":[{"nom":"poulet","categorie":"viande"},{"nom":"tomates","categorie":"legume"}]}

Categories possibles UNIQUEMENT : viande, poisson, fruitsmer, legume, fruit, laitage, feculent, epice, herbe, oeuf, sucre, conserve` }]
    });
    const text = message.content[0].text.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur categorisation' });
  }
});

app.post('/categoriser-materiel', async (req, res) => {
  const { materiel } = req.body;
  if (!materiel || typeof materiel !== 'string' || materiel.length > 2000) {
    return res.status(400).json({ erreur: 'Texte trop long (500 caractères max).' });
  }
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `Categorise ce materiel de cuisine : ${materiel}

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres, sans backticks.
Format exact :
{"materiel":[{"nom":"poele","categorie":"cuisson"},{"nom":"thermomix","categorie":"electromenager"}]}

Categories possibles UNIQUEMENT : cuisson, electromenager, couteau, ustensile, conservation` }]
    });
    const text = message.content[0].text.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur categorisation materiel' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { console.log(`Serveur lance sur le port ${PORT}`); });