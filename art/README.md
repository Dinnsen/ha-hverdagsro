# Hverdagsro – kunstpakken

Alle ting i spillet, én SVG-fil pr. ting (508 filer). Tegn dem om i Illustrator eller et andet program,
og læg mappen i Home Assistant som `config/www/hverdagsro-art/`. Spillet bruger så filerne i stedet for sine egne
tegninger. Filer, der mangler, tegnes som før, så du kan tage én ting ad gangen.

- Behold viewBox'en: tingen står på y=0 og er centreret om x=0. Bredden og højden står i pack.json.
- "figur/": figurens dele (hår, tøj, sko, ansigt, ting at bære) i figurens egen ramme. Hver fil tegner kun sin del,
  men i hele figurens ramme, så den lander det rigtige sted. En del fra fil har sin egen farve (hårfarve og tøjfarve
  fra spillet gælder ikke for den).
  Figurens dele og baggrundene er slået fra i pack.json ("parts_off" og "backdrops_off"), indtil du har tegnet
  dem om: sæt dem til false, når filerne skal bruges. Ellers ville alle i familien få filernes farver, og
  baggrundene fra fil har ikke regn, nat og lampeskær.
- "figurer/": byens karakterer, hele figuren. "dyr/": kæledyrene. "baggrunde/": rummene i huset (efter slags),
  verdens steder og barnets egne rum. Gulvlinjen er y=440; et bredt rum strækkes.
- Alt, hvad der er inde i filen, vises. Farver, skygger, billeder (indlejrede PNG'er) – alt er tilladt.
- En ting med en egen farve i spillet (farveknappen i Byg) mister den, når den tegnes fra en fil.
- pack.json siger, hvilke ting der er: id, navn, kategori, pakke, bredde, højde.
- Opdatér en fil: læg den i mappen igen og genindlæs siden (hold Shift nede, hvis browseren viser den gamle).
