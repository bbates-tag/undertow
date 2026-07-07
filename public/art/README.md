# Art drop folder

Put generated images here, named by content id, as **PNG**:

```
public/art/cards/<cardId>.png        e.g. tideStrike.png, gigavolt.png
public/art/enemies/<enemyId>.png     e.g. sunkenKing.png, jellyDrifter.png
public/art/characters/<charId>.png   tidecaller.png, voltaic.png
```

- Ids are in `docs/ART_PROMPTS.md` headings (and `src/content/*.ts`).
- Anything missing simply falls back to the built-in icon art — partial sets are fine.
- Cards crop to a wide art band (`object-fit: cover`, center) — keep subjects centered.
- Enemies render in a circular medallion; characters crop from the top (faces survive).
- Local test: just refresh `npm run dev`. To ship to the live site: commit the files and push.
