# WORLD-VISION — Gate 0: official current logo confirmed

**Decision date:** 2026-11-13  
**Status:** **APPROVED FOR CURRENT USE** (explicit user message). No numerical rating was supplied.  
**Next gate:** assess three opening style frames separately; no full MP4 until further approvals.

## The approved exact original file

- Source: `frontend/web/src/assets/logo.png`
- Git blob SHA (not a SHA-256): `bc80fa70cebd566768bfb1703a0f1f636a78c196`
- Official site copy (byte-identical blob): `worldhealth-vision-v2/frontend/web-v2/public/brand/world-vision-official.png`
- Official Remotion copy (byte-identical blob): `worldhealth-vision-v2/services/media-renderer/public/brand/world-vision-official.png`
- Visual description: dark blue original eye silhouette framing a two-tone blue Earth/globe.
- Approval record: `worldhealth-vision-v2/docs/media/approvals/2026-11-13-current-official-logo.json`

The older audit incorrectly treated the *future multicolor idea* as a prerequisite. The user clarified unequivocally that **this original blue logo is the current official identity**, suitable for immediate media production.

## Important separation of decisions

| Area | Status |
| --- | --- |
| Official unchanged eye/globe asset | **Approved for current use** |
| Future green / multicolor globe | Deferred, not required |
| Brand usage, spacing and typography | Proposed, requires separate review |
| Storyboard/story telling/visual styles | Awaiting user selection |
| Voices / licensed footage / transitions | Not approved |
| COP31 pilot MP4 SHA-256 `5e62e2f0f65e1335c67a3ac3cac70b827b2d676111309f3b151528bdc8440cfd` | **Rejected 1/10, Issue #9** |
| TikTok / WhatsApp publication | Not authorized |

## Constraints for video rendering

1. Always load the byte-identical PNG; never redraw its eye/globe geometry.
2. This original asset contains its own off-white opaque background. In still layouts display it on an off-white or matching light panel; do not make fake transparency that would destroy its pixels. A transparent cutout, if created later, must be reviewed separately and must not silently replace this approved asset.
3. Future recolor variants are **proposals**, not automatic replacements.
4. No stage labels `HOOK`, `01/07`, QA progress bars, faux broadcast watermarks or permanent AI-voice overlays in audience-facing cuts.
5. If the channel requires synthetic-content disclosure, use correct platform labeling and metadata rather than constant on-screen technical boilerplate.
6. CI and SHA-256 can establish technical integrity but never artistic acceptance.

The previous exploratory source comparison from this audit was preserved in Git history. This revision updates the factual decision in response to the owner.
