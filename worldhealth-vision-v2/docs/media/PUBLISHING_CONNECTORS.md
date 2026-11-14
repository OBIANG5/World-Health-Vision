# World-Vision Publishing Connectors

## Capability check — 2026-11-12

This document records the platform constraints that must be respected before
World-Vision turns the canonical Publication Package into an external post.

The publication package and proof-receipt model are implemented. Platform
connectors remain disabled until their official prerequisites are met.

## TikTok — official Content Posting API

Official product:
https://developers.tiktok.com/products/content-posting-api/

Direct Post guide:
https://developers.tiktok.com/docs/en/content-posting-api-get-started

Status API:
https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status

Content-sharing guidelines:
https://developers.tiktok.com/docs/en/content-sharing-guidelines

### Required before enabling

1. Register the World-Vision app in TikTok for Developers.
2. Add the Content Posting API product.
3. Obtain approval for the `video.publish` scope.
4. Complete OAuth authorization for the target World-Vision TikTok account.
5. Query creator info before every direct post and honor the creator's current
   privacy/comment/duet/stitch options.
6. Obtain explicit user consent for the post settings.
7. Complete TikTok's client audit before expecting public Direct Post.
   Unaudited clients are restricted to private visibility.
8. Export a TikTok-compliant media variant.

### Important media constraint

TikTok's sharing guidelines prohibit integrations from superimposing unwanted
app branding, logos, watermarks, links or promotional text onto shared media.

The canonical World-Vision newsroom render intentionally contains the
WORLD-VISION brand header. **It must not be wired directly into TikTok Direct
Post.** The Remotion renderer now provides a separate
`tiktok_api_clean_v1` profile and a channel-specific render job whose SHA-256
output hash is linked to the canonical Publication Package.

Before enabling the *official publishing connector*, the dedicated export still
needs human review against TikTok's current rules using real approved samples:

- confirm that app/integration watermarks and promotional overlays are absent;
- confirm factual source disclosure and the required AI-voice disclosure remain;
- inspect rendered pixels and audible track, not just structured scene metadata;
- verify that the clean file corresponds to the approved narration, claims,
  assets and immutable publication manifest;
- obtain scope approval, OAuth authorization, creator consent and client audit.

**A technically available clean export is not an approved TikTok integration.**

### Planned Direct Post state machine

`READY -> CREATOR_INFO_OK -> CONSENTED -> UPLOAD_INITIALIZED -> UPLOADED -> PROCESSING -> PUBLISH_COMPLETE | FAILED`

For local MP4 files, use TikTok's `FILE_UPLOAD` flow:

- POST `/v2/post/publish/creator_info/query/`
- POST `/v2/post/publish/video/init/`
- PUT the MP4 bytes to the returned `upload_url`
- POST `/v2/post/publish/status/fetch/` until a terminal state or consume the
  official webhook events

World-Vision must not create a `PublicationReceipt` merely because upload
initialization succeeded. A receipt is valid only after the status reaches
`PUBLISH_COMPLETE`. A public post ID may arrive later after moderation.

## WhatsApp Channels

Official Channels terms:
https://www.whatsapp.com/legal/channels-terms-of-service

As of 2026-11-12, no official Meta/WhatsApp Business Platform endpoint was found
for programmatically publishing updates to a WhatsApp Channel.

World-Vision policy:

- keep the generated WhatsApp copy in the canonical Publication Package;
- publish it manually in the WhatsApp app;
- record a proof receipt after the real post exists;
- do **not** integrate reverse-engineered WhatsApp Web/Channels automation into
  the core product because it can violate platform rules and jeopardize the
  publishing account.

If Meta later exposes an official Channels API, re-evaluate this decision and
implement it behind the same publication-package/receipt contract.

## Two independent SHA-256 integrity proofs

A publication has two distinct cryptographic checks:

1. **Canonical newsroom MP4 SHA-256**: `PublicationPackage.video_sha256` is
   copied from the *completed, encoded MP4 file*, and
   `video_render_profile=canonical_newsroom_v1` records its Remotion profile.
2. **Publication manifest SHA-256**: `PublicationPackage.manifest_sha256`
   hashes the selected video URL, the **canonical MP4 SHA-256**, the rendering
   profile, claims/copy, source URLs, channel list and approved CREATIVE/QA versions.

The channel-specific TikTok derivative has its own *distinct*
`ChannelExportRef.render_job.output_sha256` and profile
`tiktok_api_clean_v1`. Its `canonical_manifest_sha256` points back to the
approved newsroom manifest. **These two video hashes should normally differ**;
they describe different encoded bytes for the same verified editorial content.

A missing or stale canonical MP4 digest blocks new packages, new channel
derivatives and publication receipts. Older database packages without
`video_sha256` are readable for history but cannot be used as publication
proofs; generate a fresh canonical package after inspecting a real MP4.

The hashes document byte identity; they do not replace human visual review,
license validation, platform approval or checking that a publicly served
file actually matches the recorded digest after storage/copy/transfer.

## Why receipts remain mandatory

A platform API accepting an upload is not proof that users can see the post.
World-Vision only moves a story from `publish_ready` to `published` after
every target channel in the package has a real publication receipt.

This keeps the newsroom state auditable even when one channel is automatic and
another remains manual.
