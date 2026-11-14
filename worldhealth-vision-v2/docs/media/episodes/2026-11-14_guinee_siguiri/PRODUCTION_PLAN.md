# WORLD-VISION / Guinée — Balato/Siguiri, novembre 2026
## Épisode 02 après Soudan du Sud — contrat d'exécution et continuité

**Historique utilisateur** : première vidéo Soudan du Sud publiée, note propriétaire 4–5/10. Problèmes spécifiquement signalés : voix Vivienne encore robotique et **trop rapide**, sans chaleur ni émotion ; choix de photographies souvent sans impact, répétitives et parfois loin du propos ; titres parfois amateurs, images fixes, absence de vrais rushes. **Ne jamais confondre succès GitHub Actions avec approbation artistique.** L'utilisateur a explicitement choisi le dernier script retravaillé de Siguiri, et demande maintenant de lancer toute la production, pas de lui proposer une autre version.

**Source unique de narration** : `SCRIPT_LOCK_V1.json`, hash SHA-256 `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`. Toute altération nécessite un nouveau consentement explicite. Narration visée < 60 s, débit **sensiblement plus lent** que Soudan du Sud, voix de référence **Vivienne** (`fr-FR-VivienneMultilingualNeural`) mais pas de licence commerciale présumée. Les contrôles doivent bloquer une voix trop rapide, pas accélérer pour gagner du temps.

### Vérification factuelle (14 novembre 2026)
- Arrêté du 2 novembre 2026 interdisant l'orpaillage anarchique et illégal ; patrouille d'application le **11 novembre** dans le secteur de Sètiquiyah, Balato, nord-est de la Guinée.
- **Bilan provisoire gouvernemental** : dix morts, treize blessés, cinq personnes étrangères dont l'identité reste à établir. Barricades, échanges de tirs, enquête judiciaire ; **qui a tiré le premier demeure inconnu**.
- L'État invoque pollution des rivières et dommages aux terres agricoles. L'orpaillage artisanal fait vivre de nombreuses familles ; cela n'excuse ni n'attribue les violences.
- Ne pas affirmer un lien de cause à effet non établi, ne pas attribuer les décès à un seul camp. Reportage TV5MONDE/7info et Reuters/AP utilisables comme **référence journalistique**, mais pas comme source d'images pour republication sans droits.

Sources : 
https://gouvernement.gov.gn/wp-content/uploads/2026/11/COMMUNIQUE-NA%C2%B0-008-MATD-CAB-2026-DU-GOUVERNEMENT-RELATIF-AUX-EVENEMENTS-SURVENUS-LE-11-NOVEMBRE-2026-A-BALATO-PREFECTURE-DE-KINTINIAN-DU-12112026.pdf
https://www.reuters.com/world/africa/10-killed-clashes-guinea-after-artisanal-mining-ban-2026-11-13/
https://apnews.com/article/3bf55251d4da7159b04e031c8783d7a4
https://information.tv5monde.com/afrique/video/guinee-10-morts-lors-daffrontements-lies-loperation-anti-orpaillage-2845778

### Intention de la vidéo / re-hook
| Séquence parlée | Ce que l'image doit faire | Vérité des images |
|---|---|---|
| 1. Dix morts / treize blessés | Hook chiffré fort, globe pivotant vers la Guinée, pas d'effet choc fabriqué | Cartographie factuelle NASA/Natural Earth ; chiffres officiels |
| 2. Balato, près de Siguiri | Situations géographiques concrètes, localisation fluide | Cartographie, pas fausse vidéo de Balato |
| 3. Neuf jours après l'interdiction | Orpaillage et date administrative | Photo réelle des lieux / représentation documentaire datée |
| 4. Barricades / tirs | Tension par rythme des coupes + documents, **jamais** fausses victimes ni faux affrontements | Texte officiel ou photo authentifiée des affrontements seulement avec droits |
| 5. Cinq victimes étrangères | Deuxième révélation : 5 / 10, sans inventer leur pays ni photographier d'autres morts | Graphic de chiffres, pas faux portraits |
| 6. Pourquoi une telle tension | Transition sémantique vers « explication » | Vue réelle de l'exploitation aurifère guinéenne |
| 7. Terres / rivières | Conséquences écologiques | Images réelles d'orpaillage ou eaux, date/licence précises |
| 8. Familles et revenus | Portée humaine dans région aurifère ; pas d'enfants/victimes fabriqués | Photo licite de travailleuses/communauté guinéenne |
| 9. Qui a tiré le premier | Re-hook enquête (pas d'insinuation sur les personnes) | Extrait typographique du communiqué, pas fausse preuve |
| 10. La justice enquête | Fin sobre, pas de morale inventée | Documents officiels et signature G0 discrète |

### Droits / transparence
Les photos géolocalisées de Siguiri sous droit (UNICEF, Reuters, DW, presse locale) sont recherchées comme **références**, mais jamais copiées dans le master sans licence. Les médias USAID sont dans le domaine public américain mais anciens et parfois de faible résolution. Certaines photos de mine industrielle ne peuvent pas illustrer une « descente policière » contre l'orpaillage artisanal sans créer de confusion. Les rushes Pexels sont autorisés commercialement suivant https://www.pexels.com/license/ mais ne deviennent pas, par magie, des images tournées en Guinée : ne montrer que si illustration clairement présentée et pertinence éditoriale réelle.
L'affichage de la voix `edge-tts` est pour **relecture sonore**, droits commerciaux à vérifier avec le fournisseur de TTS payant ou une narratrice autorisée.

### Règles techniques
- 1080 × 1920 ; 30 fps, H.264/AAC ; durée maximale 60 s.
- Tableau de visuels, crédits et licence dans manifest pour chaque scène, date de prise de vue si connue.
- Traitement typographique discret mais net et signifiant : maximum 1 chiffre fort par plan, pas de bandeau blanc logo, pas de lignes gratuites, pas de « S01 », « QA », « archives » technique en pied de vidéo.
- Voix : deux propositions de rythme et de respirations au même texte si possible ; **préférer une diction naturelle**, pas d'accélération musicale et pas de time-stretch artificiel > 1. La voix doit rester audible même avec musique.
- Contrôle d'images 9 photogrammes, dont 3 dans le globe ; vérification sincère de tous les plans. QA son > codec (intelligibilité et rythme) reste humaine.
- Déploiement iPhone GitHack permanent sur branche `whv-media-studio-browser-preview` ; ne pas annoncer d'export réussi avant vérification GitHub.
- Conserver les versions et les refus dans GitHub. Nouveau dossier par épisode sans toucher aux projets parallèles Shenzhen et Soudan du Sud.
