# Générateur d'Ishihara & Simulateur de Daltonisme (Deutéranomalie)

Un site web interactif de démonstration, de génération et de sensibilisation au daltonisme (deutéranopie et deutéranomalie). Ce projet permet aux personnes ayant une vision normale de comprendre et d'expérimenter directement comment une personne atteinte de deutéranomalie perçoit les célèbres plaques de test d'Ishihara.

---

## 🚀 Fonctionnalités Clés

1. **Générateur de Plaques d'Ishihara** :
   - Génération dynamique en temps réel basée sur un algorithme de **Circle Packing Glouton** (tassement de cercles sans chevauchement).
   - Prise en charge de symboles personnalisés : lettres/chiffres, formes géométriques prédéfinies (Cœur, Étoile, Cercle, Carré, Anneau) ou **Dessin Libre (Sketchpad)**.

2. **La Variante "Équivalence Vert" (Option innovante)** :
   - Pour un test standard (symbole orange sur fond vert), cette variante remplace chaque cercle orange par un cercle vert de **luminance relative sRGB mathématiquement identique**.
   - *Pour un normovoyant* : Le symbole disparaît entièrement (il ne reste qu'un disque vert uniforme).
   - *Pour un daltonien (deutéranomal)* : Le passage de la plaque normale à cette variante verte est presque imperceptible car les deux couleurs d'origine se confondaient déjà pour lui. Cela démontre de manière concrète l'absence de perception différentielle du spectre rouge-vert !

3. **Simulateur Temps Réel** :
   - Algorithme de simulation de deutéranopie complète ou partielle (deutéranomalie) basé sur le modèle mathématique de Brettel & Viénot.
   - Curseur d'intensité de la sévérité réglable de 0 % à 100 %.

4. **Suite de Validation de Luminance (Autotest)** :
   - Outil intégré de diagnostic qui vérifie que les luminances relatives entre l'original et la variante verte sont parfaitement égales ($|L_{orange} - L_{vert}| < 0.01$).

---

## 🛠️ Architecture du Projet

Le projet est conçu sous forme de **Single Page Application (SPA)** moderne, ultra-rapide et modulaire sans dépendances externes (Vanilla JS & CSS) :

```text
colorblind-test-creation/
├── index.html            # Structure HTML5 (Français, responsive, sémantique)
├── styles.css            # Styles modernes (Thème sombre, variables, Glassmorphic cards)
├── README.md             # Ce document d'explications et de mise en route
└── js/
    ├── main.js           # Coordinateur de l'application (Events, State & UI)
    ├── circle-packing.js # Algorithme de calcul spatial des cercles d'Ishihara
    ├── color-utils.js    # Simulation Brettel & conversions de luminance sRGB
    └── symbol-renderer.js# Rendu et pixellisation des masques (Texte, Formes, Sketchpad)
```

---

## 💻 Comment Lancer le Projet

Puisque l'application utilise les **modules JavaScript ES6** (`import` / `export`), les navigateurs bloquent les requêtes de fichiers locaux via le protocole `file://` pour des raisons de sécurité (CORS). Il est donc nécessaire de servir l'application via un serveur web local local.

Voici les méthodes les plus simples pour lancer le projet :

### Option A : Via PHP (Recommandé)
Si PHP est installé sur votre système, exécutez la commande suivante à la racine du projet :
```bash
php -S localhost:8000
```
Ouvrez ensuite votre navigateur sur `http://localhost:8000`.

### Option B : Via Node.js (npm)
Si vous préférez Node.js, installez et lancez un serveur statique rapide :
```bash
npx http-server -p 8000
```
Ouvrez ensuite votre navigateur sur `http://localhost:8000`.

### Option C : Extension d'Éditeur
Si vous utilisez **PhpStorm** ou **VS Code**, vous pouvez utiliser l'option de prévisualisation intégrée ou installer des extensions comme *Live Server* pour servir la page en un seul clic !

---

## 📐 Algorithmes Clés

### Formule de Luminance Relative sRGB (ITU-R BT.709)
Pour qu'un vert clair soit indiscernable d'un orange clair pour un deutan, sa luminosité perçue doit être identique. La luminance relative $L$ est calculée en convertissant les composantes sRGB en valeurs linéaires, puis en appliquant les coefficients de pondération :
$$L = 0.2126 \times R_{linear} + 0.7152 \times G_{linear} + 0.0722 \times B_{linear}$$

L'application résout cette formule à l'envers pour chaque cercle du symbole afin de générer un vert de luminance parfaitement équivalente, validé par l'autotest intégré !
