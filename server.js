const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { Mistral } = require('@mistralai/mistralai');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();
const compteurs = {};

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

const testeurValides = {};
app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// À modifier à chaque nouvelle version publiée sur le Play Store.
const APP_VERSION_INFO = {
  latestVersion: '1.0.0',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ottokitchen.app',
};

app.get('/version', (req, res) => {
  res.json(APP_VERSION_INFO);
});

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

// Prompt de génération de recette, partagé par /recette et /recette-stream.
// Le texte doit rester identique entre les deux routes.
function construirePromptRecette({ ingredients, materiel, personnes, envie, placard, derniereFormeRef, airfryer }) {
  return `Tu es un chef cuisinier créatif spécialisé dans les recettes simples, modernes, réalistes et visuellement fortes.
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

🚫 INTERDICTIONS ABSOLUES — PRIORITÉ CRITIQUE
- JAMAIS proposer à l'utilisateur d'acheter un produit fini qu'il n'a PAS listé.
- TOUJOURS composer une recette maison.

🛒 INGRÉDIENTS MANQUANTS — RÈGLE OBLIGATOIRE
Si l'envie exprimée nécessite un ingrédient de base absent de la liste fournie
et du placard par défaut :
1. Tu réalises quand même la recette demandée.
2. Tu ajoutes OBLIGATOIREMENT, juste après le titre, une section :
## 🛒 À acheter
- ingrédient manquant, avec la quantité nécessaire
3. Tu n'utilises JAMAIS un produit transformé équivalent pour contourner le manque.
   Exemple interdit : proposer du riz au lait tout prêt parce qu'il manque
   du riz et du lait. Tu demandes le riz et le lait.
4. Cette section "À acheter" n'apparaît QUE si un ingrédient manque réellement.
   Si tout est disponible, tu ne l'écris pas du tout.
5. Quand des ingrédients manquent, fais la version la plus SIMPLE et la plus
   CLASSIQUE possible de la recette demandée. N'ajoute aucun ingrédient
   supplémentaire pour l'enrichir. La liste "À acheter" doit être la plus
   courte possible et ne contenir que le strict nécessaire.
Si plus de 3 ingrédients de base manquent, propose plutôt une recette réalisable
avec ce qui est disponible, et explique en une phrase pourquoi tu n'as pas fait
la recette demandée.

🧺 PLACARD PAR DÉFAUT
${placard || 'farine, huile, sel, poivre'}

${derniereFormeRef ? '⚠️ DERNIÈRE RECETTE PROPOSÉE — Propose obligatoirement autre chose : ' + derniereFormeRef : ''}

${airfryer ? `🔥 ÉQUIPEMENT DISPONIBLE : AIRFRYER
L'utilisateur possède un airfryer. Utilise-le en priorité pour les viandes, volailles et légumes rôtis.
Température entre 180°C et 200°C. Temps réduit d'environ 30% vs four classique.` : ''}

⚙️ RÈGLES STRICTES
Temps de préparation actif maximum : 30 minutes
Maximum 8 ingrédients au total, hors sel, poivre, huile, eau, beurre
Maximum 2 options facultatives

🧠 COHÉRENCE PRODUIT — PRIORITÉ ABSOLUE
- viande à mijoter → cuisson longue obligatoire
- viande tendre → cuisson rapide possible
- poisson fragile → cuisson courte et douce
- légumes durs → cuisson suffisante obligatoire
- légumineuses sèches → trempage et cuisson longue obligatoire
- Les ratios entre ingrédients doivent être techniquement corrects.
  Vérifie systématiquement les proportions liquide/solide.
  Exemple : un riz au lait demande environ 1 litre de lait pour 100 g de riz rond.
  Une quantité de liquide insuffisante donne une texture ratée.

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
Un vrai conseil en 2-3 phrases minimum.

## 🔄 Variante
Une seule variante simple.`;
}

app.post('/recette', async (req, res) => {
  const { ingredients, envie, placard, derniereFormeRef, airfryer, personnes, materiel, deviceId, premium } = req.body;
  if (!ingredients || typeof ingredients !== 'string' || ingredients.length > 2000) {
    return res.status(400).json({ erreur: 'Liste trop longue (2000 caractères max).' });
  }
  const today = new Date().toISOString().split('T')[0];
  if (!compteurs[deviceId]) compteurs[deviceId] = { date: today, count: 0 };
  if (compteurs[deviceId].date !== today) compteurs[deviceId] = { date: today, count: 0 };
  if (!premium && !testeurValides[deviceId] && compteurs[deviceId].count >= 1) {
    return res.json({ limite: true, message: 'Limite gratuite atteinte' });
  }
  compteurs[deviceId].count++;
  console.log('Personnes reçues:', personnes);
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: construirePromptRecette({ ingredients, materiel, personnes, envie, placard, derniereFormeRef, airfryer }) }]
    });
    res.json({ recette: message.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur Claude' });
  }
});

app.post('/recette-stream', async (req, res) => {
  const { ingredients, envie, placard, derniereFormeRef, airfryer, personnes, materiel, deviceId, premium } = req.body;
  if (!ingredients || typeof ingredients !== 'string' || ingredients.length > 2000) {
    return res.status(400).json({ erreur: 'Liste trop longue (2000 caractères max).' });
  }
  const today = new Date().toISOString().split('T')[0];
  if (!compteurs[deviceId]) compteurs[deviceId] = { date: today, count: 0 };
  if (compteurs[deviceId].date !== today) compteurs[deviceId] = { date: today, count: 0 };
  if (!premium && !testeurValides[deviceId] && compteurs[deviceId].count >= 1) {
    return res.json({ limite: true, message: 'Limite gratuite atteinte' });
  }
  compteurs[deviceId].count++;
  console.log('Personnes reçues (stream):', personnes);

  // Validation et quota geres au-dessus : a partir d'ici le flux SSE est ouvert,
  // on ne peut plus renvoyer de code HTTP ni de JSON classique.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let termine = false;
  const finirAvecErreur = (e) => {
    if (termine) return;
    termine = true;
    console.error(e);
    res.write(`event: error\ndata: ${JSON.stringify({ erreur: 'Erreur Claude' })}\n\n`);
    res.end();
  };

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: construirePromptRecette({ ingredients, materiel, personnes, envie, placard, derniereFormeRef, airfryer }) }]
    });

    stream.on('text', (fragment) => {
      if (!termine) res.write(`data: ${JSON.stringify({ text: fragment })}\n\n`);
    });

    stream.on('error', finirAvecErreur);

    await stream.finalMessage();
    if (!termine) {
      termine = true;
      res.write('event: done\ndata: {}\n\n');
      res.end();
    }
  } catch (e) {
    finirAvecErreur(e);
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
        { type: 'text', text: 'Liste uniquement les ingredients alimentaires et les ustensiles de cuisine reellement utilisables pour cuisiner, separes par des virgules uniquement. Pas de phrase. Ignore le mobilier et l\'electromenager (porte, etagere, clayette, bac a legumes, paroi, tiroir), les emballages et contenants vides (couvercle, boite, sachet, bocal vide), ainsi que tout element de decor ou d\'environnement qui ne se cuisine pas et ne sert pas a cuisiner (carrelage, mur, sol, plafond, plan de travail, cable, prise electrique, interrupteur, luminaire, decoration). Si un element visible ne correspond a aucune de ces deux categories, ne le liste pas.' }
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
    const reponse = await mistralClient.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: `Categorise ces ingredients alimentaires : ${ingredients}

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres, sans backticks.
Format exact :
{"ingredients":[{"nom":"poulet","categorie":"viande"},{"nom":"tomates","categorie":"legume"}]}

Categories possibles UNIQUEMENT : viande, poisson, fruitsmer, legume, fruit, laitage, feculent, epice, herbe, oeuf, sucre, conserve` }]
    });
    const text = reponse.choices[0].message.content.trim();
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
    const reponse = await mistralClient.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: `Categorise ce materiel de cuisine : ${materiel}

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres, sans backticks.
Format exact :
{"materiel":[{"nom":"poele","categorie":"cuisson"},{"nom":"thermomix","categorie":"electromenager"}]}

Categories possibles UNIQUEMENT : cuisson, electromenager, couteau, ustensile, conservation` }]
    });
    const text = reponse.choices[0].message.content.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur categorisation materiel' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { console.log(`Serveur lance sur le port ${PORT}`); });