import {
  validateEditable,
  type EditableDay,
  type Item,
  type Step,
  type Rule,
} from "./model";
const items = (labels: string[]): Item[] =>
  labels.map((label, i) => ({ id: String(i + 1), label }));
const letter = [
  "Debby, bienvenue dans cet hiver imaginaire.",
  "Chaque petite attention peut devenir une étoile.",
  "Ce voyage de démonstration nous attend, pas à pas.",
];
const compliments = [
  "Ton sourire réchauffe les matins",
  "Ta curiosité ouvre des chemins",
  "Ta douceur rassure",
  "Ton rire est contagieux",
  "Tu sais écouter",
  "Tu transformes les détails",
  "Ton courage inspire",
  "Tu rends le silence doux",
  "Ton imagination voyage",
  "Tu vois la beauté partout",
  "Tu sais partager",
  "Tu oses rêver",
  "Tu fais confiance",
  "Ta présence apaise",
  "Tu sais surprendre",
  "Tu prends soin des autres",
  "Tu apportes de la lumière",
  "Tu sais recommencer",
  "Tu rends les promenades belles",
  "Ton regard raconte des histoires",
  "Tu accueilles les petits bonheurs",
  "Tu fais de la place aux rêves",
  "Tu es une belle rencontre",
  "Tu es irremplaçable",
];
const definitions: {
  title: string;
  room: EditableDay["content"]["room"];
  intro: string;
  steps: Step[];
  rules: Record<string, Rule>;
}[] = [
  {
    title: "Lettre interactive",
    room: "house",
    intro:
      "Une enveloppe fictive attend sur la table de Loyal. Ouvre ses trois fragments, puis choisis ta réponse.",
    steps: [
      {
        id: "lettre",
        kind: "read",
        prompt: "Ouvrir les trois fragments de la lettre",
        items: items(letter),
      },
      {
        id: "reponse",
        kind: "choice",
        prompt: "Que proposes-tu à Loyal ?",
        options: items([
          "Une promenade sous la neige",
          "Un thé au coin du feu",
        ]),
      },
    ],
    rules: { lettre: { minimum: 3 }, reponse: {} },
  },
  {
    title: "Mélodie mystérieuse",
    room: "inn",
    intro:
      "L’auberge cache quatre notes. Écoute-les, puis reproduis Do – Mi – Sol – Mi.",
    steps: [
      {
        id: "notes",
        kind: "melody",
        prompt: "Reproduire les quatre notes",
        items: [
          { id: "do", label: "Do" },
          { id: "mi", label: "Mi" },
          { id: "sol", label: "Sol" },
        ],
        text: "do,mi,sol,mi",
      },
    ],
    rules: { notes: { expected: ["do", "mi", "sol", "mi"] } },
  },
  {
    title: "Puzzle photographique",
    room: "library",
    intro: "Remets en ordre les neuf fragments d’un paysage de démonstration.",
    steps: [
      {
        id: "photo",
        kind: "photo",
        prompt: "Reconstituer les neuf fragments de la photographie",
      },
    ],
    rules: { photo: { expected: [0, 1, 2, 3, 4, 5, 6, 7, 8] } },
  },
  {
    title: "Souvenir à découvrir",
    room: "library",
    intro:
      "Dans notre souvenir fictif, la gare vient d’abord, puis le café, enfin la neige.",
    steps: [
      {
        id: "indices",
        kind: "collect",
        prompt: "Retourner les trois cartes-souvenirs",
        items: items([
          "La gare : le départ",
          "Le café : la pause",
          "La neige : la promenade",
        ]),
      },
      {
        id: "ordre",
        kind: "sequence",
        prompt: "Retrouver la chronologie",
        items: items(["La gare", "Le café", "La neige"]),
      },
    ],
    rules: { indices: { minimum: 3 }, ordre: { expected: ["1", "2", "3"] } },
  },
  {
    title: "Cache-cache avec Loyal",
    room: "village",
    intro:
      "Loyal se cache trois fois sur la place. Retrouve sa silhouette et utilise E ou le bouton tactile près de lui.",
    steps: [
      {
        id: "cachettes",
        kind: "hunt",
        style: "loyal",
        prompt: "Retrouver Loyal à ses trois cachettes",
        items: items([
          "Première cachette",
          "Deuxième cachette",
          "Dernière cachette",
        ]),
      },
    ],
    rules: { cachettes: { minimum: 3 } },
  },
  {
    title: "Six raisons de t’aimer",
    room: "house",
    intro: "Six petites cartes fictives attendent tes découvertes.",
    steps: [
      {
        id: "raisons",
        kind: "collect",
        prompt: "Ouvrir les six raisons",
        items: items(compliments.slice(0, 6)),
      },
      {
        id: "favorite",
        kind: "choice",
        prompt: "Quelle attention veux-tu partager ?",
        options: items([
          "Une écoute attentive",
          "Un fou rire",
          "Un moment calme",
        ]),
      },
    ],
    rules: { raisons: { minimum: 6 }, favorite: {} },
  },
  {
    title: "Fabrication de cadeau",
    room: "workshop",
    intro:
      "Oscar te prête son établi. Prépare les trois commandes, en réutilisant le jeu d’emballage du village.",
    steps: [
      {
        id: "cadeaux",
        kind: "wrap",
        prompt: "Fabriquer et emballer les trois cadeaux",
      },
    ],
    rules: { cadeaux: { expected: [0, 1, 2] } },
  },
  {
    title: "Coffre à code",
    room: "workshop",
    intro:
      "Le coffre porte deux indices : le nombre d’étoiles du calendrier, puis le mois de Noël. Assemble-les : 24 et 12.",
    steps: [
      { id: "code", kind: "input", prompt: "Saisir le code à quatre chiffres" },
    ],
    rules: { code: { expected: "2412" } },
  },
  {
    title: "Jardin des compliments",
    room: "village",
    intro:
      "Chaque graine plantée révèle un compliment fictif. Fais fleurir les six emplacements.",
    steps: [
      {
        id: "jardin",
        kind: "decorate",
        style: "garden",
        prompt: "Faire fleurir les six compliments",
        items: items(compliments.slice(6, 12)),
      },
    ],
    rules: { jardin: { minimum: 6 } },
  },
  {
    title: "Vidéo surprise",
    room: "house",
    intro:
      "Lance le court film de démonstration, puis retrouve le dernier mot affiché. Une transcription interactive est disponible.",
    steps: [
      {
        id: "film",
        kind: "media",
        prompt: "Regarder le film ou parcourir sa transcription",
        mediaPath: "/demo/surprise.webm",
        mediaType: "video",
        transcript: [
          "Un village sous la neige",
          "Deux silhouettes sur la place",
          "Ensemble",
        ],
      },
      { id: "mot", kind: "input", prompt: "Quel est le dernier mot du film ?" },
    ],
    rules: { film: {}, mot: { expected: "ensemble" } },
  },
  {
    title: "Tu préfères romantique",
    room: "inn",
    intro:
      "Trois petites préférences, sans mauvaise réponse. Compose ta soirée idéale.",
    steps: [
      {
        id: "lieu",
        kind: "choice",
        prompt: "Quel lieu choisis-tu ?",
        options: items(["La forêt enneigée", "Le coin du feu"]),
      },
      {
        id: "moment",
        kind: "choice",
        prompt: "Quel moment préfères-tu ?",
        options: items([
          "Une promenade au lever du jour",
          "Une veillée sous les étoiles",
        ]),
      },
      {
        id: "attention",
        kind: "choice",
        prompt: "Quelle attention te ressemble ?",
        options: items(["Une lettre", "Une mélodie"]),
      },
    ],
    rules: { lieu: {}, moment: {}, attention: {} },
  },
  {
    title: "Bon cadeau",
    room: "workshop",
    intro:
      "Fabrique un bon fictif personnalisable, puis télécharge-le pour le garder.",
    steps: [
      {
        id: "bon",
        kind: "voucher",
        prompt: "Composer un bon cadeau avec une date et un destinataire",
        options: items([
          "Une soirée jeux à deux",
          "Un goûter préparé ensemble",
          "Une promenade surprise",
        ]),
      },
    ],
    rules: { bon: {} },
  },
  {
    title: "Chasse aux petits bonheurs",
    room: "village",
    intro:
      "Trois petits bonheurs se cachent sur la place. Explore et interagis avec chaque lueur.",
    steps: [
      {
        id: "bonheurs",
        kind: "hunt",
        style: "collect",
        prompt: "Trouver les trois lueurs de bonheur",
        items: items([
          "Un rire partagé",
          "Une tasse fumante",
          "Une promenade à deux",
        ]),
      },
    ],
    rules: { bonheurs: { minimum: 3 } },
  },
  {
    title: "Décoration du sapin",
    room: "village",
    intro:
      "Choisis les emplacements du petit sapin et accroche les six ornements.",
    steps: [
      {
        id: "ornements",
        kind: "decorate",
        style: "tree",
        prompt: "Accrocher les six ornements",
        items: items([
          "Une boule dorée",
          "Un cœur",
          "Un ruban rouge",
          "Une étoile bleue",
          "Un flocon",
          "Une clochette",
        ]),
      },
    ],
    rules: { ornements: { minimum: 6 } },
  },
  {
    title: "Histoire à choix",
    room: "library",
    intro:
      "Choisis votre chemin dans une courte histoire fictive. Les deux routes mènent à un souvenir.",
    steps: [
      {
        id: "histoire",
        kind: "story",
        prompt: "Mener l’histoire jusqu’à sa fin",
        story: {
          start: {
            text: "Loyal tend la main à Debby. Où allons-nous ?",
            choices: [
              { id: "foret", label: "Vers la forêt", next: "foret" },
              { id: "place", label: "Vers les lanternes", next: "place" },
            ],
          },
          foret: {
            text: "Un flocon se pose sur vos lunettes. La forêt semble écouter.",
            choices: [
              {
                id: "retour",
                label: "Partager ce silence puis rentrer",
                next: "end",
              },
            ],
          },
          place: {
            text: "Les lanternes éclairent vos pas. Un rire résonne sur la place.",
            choices: [
              {
                id: "retour",
                label: "Garder ce rire en souvenir",
                next: "end",
              },
            ],
          },
          end: {
            text: "Vous rentrez avec une histoire à raconter ensemble.",
            choices: [],
          },
        },
      },
    ],
    rules: { histoire: {} },
  },
  {
    title: "Énigme",
    room: "library",
    intro:
      "Je tombe sans me faire mal, je couvre les toits sans couverture et je fonds dans une main. Qui suis-je ?",
    steps: [{ id: "enigme", kind: "input", prompt: "Répondre à l’énigme" }],
    rules: { enigme: { expected: "neige" } },
  },
  {
    title: "Lettre pour notre futur",
    room: "house",
    intro:
      "Écris quelques lignes pour votre futur. Le brouillon est conservé sur cet appareil ; en mode privé, la validation le garde dans votre journal personnel.",
    steps: [
      {
        id: "futur",
        kind: "write",
        prompt: "Écrire au moins 40 caractères pour votre futur",
      },
    ],
    rules: { futur: { minLength: 40 } },
  },
  {
    title: "Jeu de mémoire",
    room: "inn",
    intro: "Retrouve les quatre paires, avec le jeu de mémoire de l’auberge.",
    steps: [
      {
        id: "memoire",
        kind: "memory",
        prompt: "Réunir les quatre paires de souvenirs",
      },
    ],
    rules: { memoire: { expected: [0, 1, 2, 3, 4, 5, 6, 7] } },
  },
  {
    title: "Quiz de couple",
    room: "inn",
    intro:
      "Quiz fictif : Loyal a choisi le thé, Debby un plaid, et leur promenade traverse la neige. Ces réponses seront remplacées par les vôtres.",
    steps: [
      {
        id: "boisson",
        kind: "choice",
        prompt: "Quelle boisson a choisi Loyal ?",
        options: items(["Un thé", "Un café", "Un chocolat"]),
      },
      {
        id: "douceur",
        kind: "choice",
        prompt: "Quel objet a choisi Debby ?",
        options: items(["Un livre", "Un plaid", "Un bonnet"]),
      },
      {
        id: "promenade",
        kind: "choice",
        prompt: "Où se déroule la promenade ?",
        options: items(["Sur le sable", "Dans la neige", "Sous la pluie"]),
      },
    ],
    rules: {
      boisson: { expected: "1" },
      douceur: { expected: "2" },
      promenade: { expected: "2" },
    },
  },
  {
    title: "Constellation de rêves",
    room: "village",
    intro:
      "Relie les six étoiles dans leur ordre numéroté, puis nomme un petit rêve.",
    steps: [
      {
        id: "constellation",
        kind: "connect",
        prompt: "Relier les six étoiles dans l’ordre",
        items: items([
          "Voyager",
          "Créer",
          "Rire",
          "Apprendre",
          "Partager",
          "Rêver",
        ]),
      },
      {
        id: "reve",
        kind: "write",
        prompt: "Nommer un rêve en au moins 12 caractères",
      },
    ],
    rules: {
      constellation: { expected: ["1", "2", "3", "4", "5", "6"] },
      reve: { minLength: 12 },
    },
  },
  {
    title: "Recette interactive",
    room: "inn",
    intro:
      "Préparons un goûter imaginaire : réunir les ingrédients, chauffer le lait, mélanger, puis servir.",
    steps: [
      {
        id: "ingredients",
        kind: "collect",
        prompt: "Réunir les trois ingrédients",
        items: items(["Lait", "Cacao", "Cannelle"]),
      },
      {
        id: "recette",
        kind: "sequence",
        prompt: "Ordonner les étapes de la recette",
        items: items([
          "Réunir les ingrédients",
          "Chauffer le lait",
          "Mélanger doucement",
          "Servir à deux",
        ]),
      },
    ],
    rules: {
      ingredients: { minimum: 3 },
      recette: { expected: ["1", "2", "3", "4"] },
    },
  },
  {
    title: "Collection de 24 compliments",
    room: "library",
    intro:
      "Ouvre les 24 cartes et garde cette collection de compliments fictifs dans ton journal.",
    steps: [
      {
        id: "collection",
        kind: "collect",
        prompt: "Découvrir les 24 compliments",
        items: items(compliments),
      },
    ],
    rules: { collection: { minimum: 24 } },
  },
  {
    title: "Lettre du réveillon",
    room: "house",
    intro:
      "Une dernière lettre avant le grand soir. Ouvre chaque fragment, puis écris une petite promesse.",
    steps: [
      {
        id: "reveillon",
        kind: "read",
        prompt: "Ouvrir la lettre du réveillon",
        items: items([
          "La place s’illumine pour nous.",
          "Les petites attentions dessinent un chemin.",
          "Merci pour les souvenirs partagés.",
          "Demain, retrouvons-nous au grand sapin.",
        ]),
      },
      {
        id: "promesse",
        kind: "write",
        prompt: "Écrire une promesse en au moins 20 caractères",
      },
    ],
    rules: { reveillon: { minimum: 4 }, promesse: { minLength: 20 } },
  },
  {
    title: "Les 24 étoiles, ensemble",
    room: "village",
    intro:
      "Retourne au sapin de la Place des Lanternes. Lance la scène et avance dans le dialogue pour révéler le message final personnalisable.",
    steps: [
      {
        id: "final",
        kind: "scene",
        prompt: "Vivre la cinématique jusqu’à sa dernière réplique",
        text: "Debby, les petites lumières de cet hiver imaginaire n’attendaient que toi. Inventons la suite, ensemble. ♥",
      },
    ],
    rules: { final: {} },
  },
];
export const demoDays: EditableDay[] = definitions.map((d, i) =>
  validateEditable({
    content: {
      day: i + 1,
      title: d.title,
      intro: d.intro,
      room: d.room,
      reward: `Étoile ${i + 1} · ${d.title}`,
      steps: d.steps,
      version: 1,
    },
    rules: d.rules,
  }),
);
