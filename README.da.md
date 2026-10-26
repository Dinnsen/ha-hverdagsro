<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="custom_components/hverdagsro/brand/dark_logo.png">
    <img src="custom_components/hverdagsro/brand/logo.png" alt="Hverdagsro" width="420">
  </picture>
</p>

# Hverdagsro til Home Assistant

🇬🇧 [Read in English](README.md)

Hverdagsro giver hele familien ét smukt panel i Home Assistants sidemenu: hvad der sker i dag, børnenes missioner og point, kalenderen, madplanen og indkøbslisten, musikken, apparaterne og selve huset – tegnet af jer og levende med hjemmets tilstand. Forældrene ser familien; hvert barn ser sin egen dag.

Alt sættes op i panelet af en guide, der selv finder jeres kalendere, lister, højttalere, kameraer og resten. I skal mest bare bekræfte.

**Indhold:** [Det kan Hverdagsro](#det-kan-hverdagsro) · [Krav](#krav) · [Installation](#installation) · [Opsætning](#opsætning) · [Hvem ser hvad](#hvem-ser-hvad) · [Huset](#huset) · [Enheder](#enheder) · [Handlinger](#handlinger) · [Privatliv](#privatliv) · [Begrænsninger](#kendte-begrænsninger) · [Fjern integrationen](#fjern-integrationen)

## Det kan Hverdagsro

- **En levende himmel.** Toppen af panelet er dagens himmel: solopgang og solnedgang fra `sun.sun`, regn, sne og skyer fra jeres vejr, pynt til fødselsdage, bryllupsdage og højtider, skraldespandene når der er tømning, og huset der lyser i alarmens farve, når den er slået til.
- **Dagen på ét blik.** En tidslinje fra 06 til 24 med dagens aftaler, vejret time for time og elprisen. Træk i den, og se dagen gå.
- **Missioner, point og en shop.** Morgen-, eftermiddags- og aftenmissioner til hvert barn med point; belønninger børnene kan købe, godkendt af en forælder; et mål at spare op til. Virker med børnenes egne brugere eller med en fælles familietablet.
- **Kalender, madplan og lister** fra enhver kalender- og to do-integration (Google, CalDAV, lokal, Bring!, Todoist …).
- **Musik.** Vælg højttaler, styr hver for sig, grupper dem, gennemse og afspil favoritter. Virker med alle medieafspillere; bedst med Sonos, Music Assistant, Google Cast, Spotify og Apple TV/AirPlay.
- **Apparater** – vaskemaskine, tørretumbler, opvasker, ovn, kogeplade, kaffemaskine, køleskab, fryser, robotstøvsuger, plæneklipper, ventilation – med levende, animeret status i den rækkefølge, I vil have.
- **Huset.** Tegn jeres hjem i *Husbyggeren*, og se det live: åbne døre og vinduer, låse, garageporte, bevægelse, røg, lys i deres rigtige farve, TV og højttalere der spiller, robotter der kører rundt, biler hjemme med ladekablet der viser tilsluttet, lader, planlagt, pause eller opladet. Tryk på et rum for at åbne det.
- **Rum.** En tegning af hvert rum ud fra rumtypen – børneværelser efter alder og stil – eller jeres eget billede, med rummets lys og enheder.
- **Alarm, kameraer og dagens hændelser** samlet under *Huset*.
- **Temaer** til hvert familiemedlem, lyst og mørkt.
- **Dansk og engelsk.**

## Krav

- Home Assistant 2026.3 eller nyere.
- Familiens medlemmer som [personer](https://www.home-assistant.io/integrations/person/) (Indstillinger → Personer). Knyt en person til en bruger, så vedkommende kan åbne sin egen side.
- Valgfrit: kalendere, to do-lister, vejr, medieafspillere, alarm, kameraer, en elpris-sensor (Energi Data Service, Nord Pool …) og sensorer eller kalendere for affald.

## Installation

### HACS

1. Åbn HACS → ⋮ → **Brugerdefinerede repositories**, og tilføj `https://github.com/Dinnsen/ha-hverdagsro` som **Integration**.
2. Find **Hverdagsro** i HACS, og hent den.
3. Genstart Home Assistant.

[![Åbn din Home Assistant og repositoryet i HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Dinnsen&repository=ha-hverdagsro&category=integration)

### Manuelt

Kopiér `custom_components/hverdagsro` til mappen `config/custom_components`, og genstart Home Assistant.

## Opsætning

1. Indstillinger → Enheder og tjenester → **Tilføj integration** → **Hverdagsro**.
2. Åbn **Hverdagsro** i sidemenuen. Guiden tager jer igennem:
   - **Familien** – udfyldt fra jeres personer. Vælg hvem der er forældre og børn, farver, fødselsdage og børnenes skole eller børnehave.
   - **Moduler** – slå det til, familien bruger.
   - **Hjemmet** – vejr, kalendere, madplan, lister, alarm, højttalere, kameraer, elpris og affald, fundet automatisk.
   - **Huset** – tegn det nu, start fra jeres områder i Home Assistant, eller vent.
3. Færdig. Alt kan ændres senere under *Familieindstillinger* i profilmenuen.

Integrationens indstillinger (Indstillinger → Enheder og tjenester → Hverdagsro → Konfigurer) bestemmer panelets navn og ikon i sidemenuen, og om kun administratorer må åbne det.

## Hvem ser hvad

| | Forældre | Børn |
|---|---|---|
| Hjem med familien, dagen og godkendelser | ✓ | |
| Min dag: missioner, point, mål | | ✓ |
| Shop | alle børn | sin egen |
| Kalender, madplan, lister | ✓ | lister |
| Musik, apparater, huset, alarm og kameraer | ✓ | sit eget værelse |
| Indstillinger og Husbyggeren | ✓ | |

En **forælder** er et familiemedlem markeret som forælder, eller en administrator i Home Assistant, som ikke er med i familien. Et **barn** ser sin egen side, når barnets person er knyttet til barnets bruger. En **fælles tablet** – en bruger, der ikke er nogen i familien – spørger *Hvem er du?* og kan handle for børnene, aldrig for forældrene. Forældre kan se Hverdagsro som ethvert familiemedlem fra profilmenuen.

## Huset

*Husbyggeren* (profilmenuen → Husbygger) er et tegneværktøj til jeres hjem:

- **Tegn** vægge, rum og udearealer (græs, fliser, terrasse, indkørsel, bede) med så mange knæk, I har brug for.
- **Placér** døre, vinduer og garageporte på væggene – med deres sensor og eventuelt en lås – kameraer, bevægelses-, røg- og vandsensorer, lamper (loft, pendel, spot, gulv, bord, væg, LED-strip, RGBWW, have), møbler (eller møblér et helt rum på én gang), TV, højttalere, apparater, robotstøvsugere og plæneklippere, biler, ladere, solceller, husbatterier, træer og buske.
- **Ændr størrelse, flyt og drej** alt; fortryd og gentag; fastgør til væggene.
- **Start fra jeres områder** for at få et rum til hvert område i Home Assistant, og **importér eller eksportér** tegningen som en fil.

Biler vises kun, når deres tilstedeværelse siger, de er hjemme. Tegn et ladekabel fra bilens ladeport til en lader; det vises, når bilen er tilsluttet, og fortæller om den lader, er planlagt, holder pause, er opladet eller har en fejl. En lader kan betjene flere biler.

Tegningen gemmes i Home Assistant (se [Privatliv](#privatliv)) og deles af hele familien.

## Enheder

Til hvert barn:

| Enhed | |
|---|---|
| `sensor.<barn>_points` | Barnets point. Attributter: næste mål i shoppen og prisen, dagens missioner og hvor mange der er klaret, køb der venter på godkendelse. |
| `todo.<barn>_missions` | Dagens missioner. Et flueben her giver point, ligesom i panelet. |

## Handlinger

| Handling | |
|---|---|
| `hverdagsro.add_points` | Giv et barn point – eller træk dem fra med et negativt tal – med en begrundelse. |
| `hverdagsro.complete_mission` | Markér et barns mission som klaret (i dag eller en dato), og giv dens point. |

Eksempel: point for at tømme opvaskeren, fra en knap.

```yaml
action: hverdagsro.add_points
data:
  member: Ida
  points: 10
  reason: Tømte opvaskeren
```

## Privatliv

Hverdagsro kører helt i jeres Home Assistant og forbinder ikke til internettet. Familien, missionerne, pointene og tegningen af huset gemmes i Home Assistants `.storage`-mappe (`hverdagsro.<entry id>`), som er med i jeres backups. Billeder af rum gemmes af Home Assistants egen billedupload. Diagnostik udelader navne, fødselsdage og personer.

## Kendte begrænsninger

- Panelet er bygget til Home Assistants egen brugerflade og Home Assistant-apperne; det er ikke et dashboard-kort.
- Rumtegningerne er generiske. Læg et billede ind til et rum for at gøre det til jeres.
- Hverdagsro viser og styrer det, jeres integrationer tilbyder: kan en højttaler ikke grupperes, kan Hverdagsro heller ikke.

## Fjern integrationen

Indstillinger → Enheder og tjenester → Hverdagsro → ⋮ → **Slet**. Familiens gemte data slettes med. Fjern derefter Hverdagsro i HACS, og genstart.

## Support

Fundet en fejl eller har en idé? [Opret et issue](https://github.com/Dinnsen/ha-hverdagsro/issues). Giver Hverdagsro ro i jeres hverdag, kan du [give en kop kaffe](https://buymeacoffee.com/dinnsen) ☕.

Licens: [MIT](LICENSE).
