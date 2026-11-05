// WorldHealthVision V2 — utilitaire PDF
//
// pdfSafe : normalise une chaîne pour les polices standard de jsPDF (helvetica),
// qui ne gèrent QUE le jeu WinAnsi / cp1252. Hors cp1252, jsPDF corrompt le
// rendu (chaque caractère devient « &X&Y&Z »). Coupables fréquents :
//   • U+202F (espace fine insécable) = séparateur de milliers de
//     toLocaleString("fr-FR") → casse TOUJOURS les valeurs type « 13 554,59 »
//     (ex. PIB par habitant) ;
//   • U+2082 (indice ₂) dans « CO₂ » → casse certains points clés ET le libellé
//     de l'indicateur « Émissions CO₂ ».
// On conserve toLocaleString pour l'affichage HTML (formatage fr correct) et on
// n'assainit qu'au moment d'écrire dans le PDF.

// Caractères cp1252 de la plage 0x80–0x9F (rendus correctement par jsPDF).
const CP1252_EXTRA = new Set(
  [
    0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
    0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
    0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
  ].map((cp) => String.fromCharCode(cp)),
);

export function pdfSafe(input: string): string {
  const normalized = input
    // Espaces Unicode (fines / insécables) → espace simple
    .replace(/[     ⁠﻿]/g, " ")
    // Indices ₀–₉ → chiffres ASCII (CO₂ → CO2)
    .replace(/[₀-₉]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x2080 + 0x30),
    );
  // Filet de sécurité : tout caractère hors cp1252 est retiré.
  return Array.from(normalized)
    .map((ch) => {
      const cp = ch.codePointAt(0) ?? 0;
      return cp <= 0xff || CP1252_EXTRA.has(ch) ? ch : "";
    })
    .join("");
}