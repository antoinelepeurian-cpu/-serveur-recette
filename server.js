const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({
 apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/recette', async (req, res) => {
 const { ingredients, envie, placard, derniereFormeRef } = req.body;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Tu es un chef cuisinier créatif spécialisé dans les recettes simples, modernes, réalistes et visuellement fortes.

Ta mission : créer UNE recette maison cohérente à partir des ingrédients fournis par l'utilisateur, en respectant une cuisine simple mais précise, sans erreur technique., Important : ne jamais proposer deux fois la même recette. Chaque génération doit être différente des précédentes.

La recette doit être simple mais jamais plate : peu d'ingrédients, bonne organisation, fraîcheur, contrastes nets, dressage lisible.

🥕 INGRÉDIENTS DISPONIBLES
${ingredients}🧺 PLACARD DE BASE DISPONIBLE
${placard}
Ces ingrédients sont toujours disponibles. Les utiliser intelligemment si pertinent.🔄 FORME CULINAIRE À ÉVITER (déjà utilisée)
${derniereFormeRef || 'aucune'}

🍽️ ENVIE / STYLE DU MOMENT
${envie}

Ingrédients disponibles: ${ingredients}
Génération aléatoire : ${Math.random()}
${placard}
aucun pour l'instant

🧺 PLACARD PAR DÉFAUT
Si aucun ingrédient n'est renseigné, utiliser uniquement : farine, œufs, ail, oignons, riz, pâtes, concentré de tomate, sucre, sel, poivre.

⚙️ RÈGLES STRICTES
- Temps de préparation actif maximum : 30 minutes
- Cuissons longues autorisées uniquement si passives : four, mijotage, cuisson douce
- Techniques simples uniquement : poêle, four, assemblage, sauce rapide
- Maximum 8 ingrédients au total, hors sel, poivre, huile, eau, beurre
- Maximum 2 options facultatives
- Les options ne doivent jamais être indispensables

🧱 STRUCTURE CULINAIRE OBLIGATOIRE
1. RECETTE DE BASE : uniquement avec les ingrédients disponibles + placard. Doit fonctionner seule.
2. POUR ALLER PLUS LOIN : maximum 2 améliorations facultatives clairement séparées.

🔥 CUISSONS — OBLIGATION DE PRÉCISION
Chaque cuisson doit préciser : température en °C, type de four, durée réaliste, indice visuel de cuisson, test physique si utile.

🔴 FORME CULINAIRE PRIORITAIRE
Identifier la forme culinaire la plus pertinente pour l'ingrédient principal avant de choisir la recette.

🧠 COHÉRENCE PRODUIT — PRIORITÉ ABSOLUE
- viande à mijoter → cuisson longue obligatoire
- viande tendre → cuisson rapide possible
- poisson fragile → cuisson courte et douce
- légumes durs → cuisson suffisante obligatoire
- légumineuses sèches → trempage et cuisson longue obligatoire

🧠 PHILOSOPHIE CULINAIRE
- liant obligatoire
- au moins un contraste réel : fondant / croustillant / frais / crémeux
- finition fraîche ou aromatique
- dressage visuel identifiable immédiatement

🎥 ORIENTATION VISUELLE
Recette pensée pour une vidéo courte. Dressage avec contraste de couleurs, volume, sauce visible, topping identifiable.

📊 SCORING AUTOMATIQUE
Tester mentalement jusqu'à 3 recettes. Garder uniquement la meilleure. Ne jamais afficher le scoring.

✍️ FORMAT DE RÉPONSE OBLIGATOIRE
1. Nom de la recette
2. Pourquoi cette recette marche (2-3 lignes)
3. Ingrédients avec quantités (base + options séparées)
4. Étapes numérotées
5. Temps (préparation active + cuisson)
6. Astuce visuelle / dressage
7. Variante possible
8. Forme culinaire utilisée (une ligne, ex: "Forme : rôti au four")

🔎 VALIDATION FINALE OBLIGATOIRE
Vérifier silencieusement avant de répondre : ordre logique, températures précisées, cuisson adaptée, liant présent, contraste réel, aucun ingrédient interdit utilisé. Corriger automatiquement si nécessaire.

🎯 PRIORITÉ ABSOLUE
1. Cohérence produit
2. Technique correcte
3. Simplicité
4. Impact visuel`
    }]
  });

  res.json({ recette: message.content[0].text });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Serveur lancé sur le port ' + (process.env.PORT || 3000));
});