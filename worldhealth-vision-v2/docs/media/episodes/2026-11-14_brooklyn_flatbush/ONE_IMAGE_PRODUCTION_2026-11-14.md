# World-Vision — Brooklyn / production mono-image choisie par l'utilisateur

## Instruction expresse du propriétaire
**« Avec cette image et uniquement cette image, continue la production de la vidéo. Je ne voulais pas d'autres images. »** L'utilisateur a renvoyé exactement sa photo verticale 864×1536 et rejette toutes les autres images générées dans le chat. Ne jamais substituer les images « pompiers », « femme enceinte sauvée », « enquête » ou d'autres générations qui avaient été rejetées. L'image photojournalistique n'est **pas un reportage réel** de Flatbush ; c'est une **reconstitution visuelle**, ce qui doit être explicitement déclaré.

## Fichiers sources
- Image UNIQUE du reportage : l'upload utilisateur du 14 novembre 2026 ; empreinte SHA256 `d43fa51b5920608de8ab7974df9f14926cfeecc3859e151c8e166d195b055c72`. Dimensions **864×1536** ; visualise un bâtiment effondré, équipes d'urgence et fosse avec pont de Brooklyn en arrière-plan. Important : **ce lieu illustré n'est pas 1321 Flatbush Avenue**. Tout usage doit distinguer clairement ce visuel de la scène réelle.
- Signature World-Vision : la **véritable vidéo du propriétaire animée de 3 secondes**, bleu/œil-globe, au format 1080×1920 ; aucune version statique à carré blanc.
- Narration : **Vivienne** `fr-FR-VivienneMultilingualNeural`, prise continue de tout le script Brooklyn, débit synthèse `-4%` (environ **172,3 mots/minute** au total) et durée **36,912 s** ; cible plus naturelle que la Guinée trop lente. Traitement léger -14 LUFS, -1,5 dBTP ; **licence commerciale Edge TTS non vérifiée**.

## Résultat produit et vérifié dans l'environnement ChatGPT actuel
- MP4 véritable : `worldvision_brooklyn_image_unique_v1.mp4` dans les fichiers joints de conversation.
- SHA-256 master : `86618d576839c7f06ae2bb60b3bfea79da511b33452594a4503b3a8e163fe300`.
- **39,900 secondes**, **1080×1920** 30 images/s, H.264/AAC, **15,3 Mio**.
- Audio du MP4 contrôlé : **−14,52 LUFS**, vrai pic **−1,48 dBTP** ; aucun TTS par phrases puis recollement.
- Sept mouvements de caméra distincts **à l'intérieur du seul cliché approuvé**, plans recadrés vers le bâtiment, les étages, les sauveteurs, la fosse et l'équipe d'enquête ; titres Inter et Inter Display ; `RECONSTITUTION VISUELLE` discret à l'écran pour éviter une fausse représentation du lieu.
- Visuel de fermeture : vrai fichier vidéo identitaire bleu du propriétaire, 3 s, pas un logo PNG blanc.
- QA : 12 captures réelles dans `worldvision_brooklyn_image_unique_contact.jpg`, issues du MP4 exporté, revues dans ChatGPT.

**Aucun fichier autre que l'image fournie et le carton identitaire déjà approuvé n'a servi d'image de reportage.** La génération de plusieurs photos avant cette instruction était une erreur de compréhension.

## Situation de livraison
Le MP4 et sa planche contact ont été créés sous `/mnt/data/` et doivent être joints dans la conversation avec des liens sandbox vérifiés. **Ils ne sont pas déclarés hébergés sur GitHub** tant qu'un upload binaire confirmé n'a pas été effectué. Ne pas inventer une URL GitHack.

## Épisode et texte de narration
« À New York, un immeuble s'effondre en quelques secondes. Huit morts. Parmi eux, deux enfants. Nous sommes à Brooklyn, le 11 novembre. Un bâtiment de trois étages vient de s'écrouler dans une excavation voisine. Mais au milieu des décombres, un espoir : une femme enceinte est retrouvée vivante. Après plus de deux heures, les secours parviennent à l'évacuer. Son mari apprend qu'elle a survécu. Leur bébé aussi. Au total, dix-huit personnes sont blessées. Et une question demeure : les travaux voisins ont-ils joué un rôle dans cette catastrophe ? Les autorités enquêtent. Pour l'instant, la cause exacte de l'effondrement reste inconnue. »

**Publication** : cette version n'est pas implicitement approuvée artistiquement. Les droits commerciaux de la voix synthétique restent à valider. Les images sont explicitement marquées reconstitution.
