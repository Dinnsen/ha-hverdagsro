# Hverdagsro – kunstpakken

Alle ting i spillet, én SVG-fil pr. ting (508 filer). Tegn dem om i Illustrator eller et andet program,
og læg mappen i Home Assistant som `config/www/hverdagsro-art/`. Spillet bruger så filerne i stedet for sine egne
tegninger. Filer, der mangler, tegnes som før, så du kan tage én ting ad gangen.

- Behold viewBox'en: tingen står på y=0 og er centreret om x=0. Bredden og højden står i manifest.json.
- Alt, hvad der er inde i filen, vises. Farver, skygger, billeder (indlejrede PNG'er) – alt er tilladt.
- En ting med en egen farve i spillet (farveknappen i Byg) mister den, når den tegnes fra en fil.
- manifest.json siger, hvilke ting der er: id, navn, kategori, pakke, bredde, højde.
- Opdatér en fil: læg den i mappen igen og genindlæs siden (hold Shift nede, hvis browseren viser den gamle).
