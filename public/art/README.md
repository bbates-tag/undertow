# Art drop folder

Put generated **master** images here (any resolution), named by content id:

```
public/art/cards/<cardId>.png        e.g. tideStrike.png, gigavolt.png
public/art/enemies/<enemyId>.png     e.g. sunkenKing.png, jellyDrifter.png
public/art/characters/<charId>.png   tidecaller.png, voltaic.png
```

Then run the optimizer:

```
./scripts/optimize-art.sh
```

It moves each master into `art-originals/<kind>/` (git-ignored — your local
archive of the full-res files) and emits a downscaled **`.webp`** back into
`public/art/<kind>/`. Only the `.webp` files ship and get committed; the game
loads `<contentId>.webp`.

- Ids are in `docs/ART_PROMPTS.md` headings (and `src/content/*.ts`).
- Anything missing simply falls back to the built-in icon art — partial sets are fine.
- Masters render tiny in-game (cards ~120px, enemy medallions ~90px), so the
  webp display sizes (≤640–900px) are visually identical while ~100× smaller.
- Cards crop to a wide art band (`object-fit: cover`, center) — keep subjects centered.
- Local test: `npm run dev` and refresh. To ship: commit the `.webp` files and push.
