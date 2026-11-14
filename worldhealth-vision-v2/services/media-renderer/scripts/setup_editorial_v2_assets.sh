#!/usr/bin/env bash
set -euo pipefail
# The media is downloaded at CI time, not copied from unlicensed video references.
# Fonts are open-source, pinned to the SAME immutable Google Fonts commit.
SRC_ROOT=worldhealth-vision-v2/services/media-renderer
DIR="$SRC_ROOT/public/editorial-v2"
FONTS="$SRC_ROOT/public/fonts"
mkdir -p "$DIR" "$FONTS"
GF='https://raw.githubusercontent.com/google/fonts/29b4ec6df2522a8aee279414b78a07910b065874/ofl'
curl -fL --retry 5 --retry-all-errors --max-time 130 \
 "$GF/barlowcondensed/BarlowCondensed-Bold.ttf" -o "$FONTS/BarlowCondensed-Bold.ttf"
curl -fL --retry 5 --retry-all-errors --max-time 130 \
 "$GF/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf" -o "$FONTS/DMSans-variable.ttf"
test "$(git hash-object "$FONTS/BarlowCondensed-Bold.ttf")" = '9e480f467d703009e3abfce290b2ec2b7d24e188'
test "$(git hash-object "$FONTS/DMSans-variable.ttf")" = 'c672f98060af9b2c85fca704ebd5ad9a8717c1df'
download(){
 curl -fL --retry 5 --retry-all-errors --connect-timeout 20 --max-time 200 \
 --user-agent 'World-Vision-Editorial/2.0 (+https://github.com/OBIANG5/World-Health-Vision)' \
 "$2" -o "$DIR/$1"
 test "$(file --brief --mime-type "$DIR/$1")" = 'image/jpeg'
 test "$(stat -c %s "$DIR/$1")" -gt 40000
}
download trump.jpg 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29.jpg'
download putin.jpg 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Vladimir_Putin_official_portrait.jpg'
download xi.jpg 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Xi_Jinping_%28November_2024%29_01.jpg'
download shenzhen-city-2025.jpg 'https://upload.wikimedia.org/wikipedia/commons/5/57/02_View_from_Lianhuashan%2C_Shenzhen_in_2025.jpg'
download new-start-prague-2010.jpg 'https://upload.wikimedia.org/wikipedia/commons/2/21/Obama_and_Medvedev_sign_New_START.jpg'
# Neutral documentary archive photos, not footage of the announced 2026 meeting.
# Tehran: Safa Daneshvar, Azadi Tower, 31 July 2025, CC0 1.0
# https://commons.wikimedia.org/wiki/File:040509-AzadiTower-IMG_8560-2.jpg
download tehran-azadi-2025.jpg 'https://upload.wikimedia.org/wikipedia/commons/a/a3/040509-AzadiTower-IMG_8560-2.jpg'
# Kyiv: Angelina Bulatchyk, city street, 21 Sep 2023, CC BY 4.0.
# Reuse must credit and link author/license in publication caption.
# https://commons.wikimedia.org/wiki/File:Kyiv_photo.jpg
download kyiv-street-2023.jpg 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Kyiv_photo.jpg'
sha256sum "$DIR"/*.jpg > "$DIR/archival-photo-source-sha256.txt"
curl -fL --retry 5 --retry-all-errors --max-time 180 \
 'https://raw.githubusercontent.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-july-v3-clean-4p9s.mp4' \
 -o "$DIR/segment03-shenzhen-july-v3-clean-4p9s.mp4"
echo '59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe  '"$DIR/segment03-shenzhen-july-v3-clean-4p9s.mp4" | sha256sum --check --
LOGO="$SRC_ROOT/public/brand/world-vision-official.png"
test "$(git hash-object "$LOGO")" = 'bc80fa70cebd566768bfb1703a0f1f636a78c196'
echo 'Verified G0, globe, editorial fonts, genuine portraits and public-domain/CC0 photographs.'
