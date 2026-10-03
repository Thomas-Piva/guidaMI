# Milano Evolution · piano di implementazione (Claude Impact Lab, 3/10/2026)

## Context
Hackathon Claude Impact Lab Milano, Track 01 «Welcome journey». Consegna alle 16:00: repo pubblico (github.com/Thomas-Piva/milano-evolution, MIT, registrato in Orca), README dal template con «Where Claude works», video di 2 minuti, issue «Submission» su Claude-Milano/impact-lab-oct-2026. Pitch di 2 minuti, un messaggio solo: «Nour non apre mai un portale».

Problema: per sapere cosa fare, chi arriva a Milano dovrebbe leggere decine di pagine su YesMilano, Comune, ATM e portali, metà in italiano. Si perde, si sente estraneo, dopo gli studi se ne va. Le aziende non trovano i profili.

Persona unica: Nour, studentessa appena arrivata a Milano (corso non specificato), zero italiano. Fonti e numeri: `outputs/claude-impact-lab-milano/fonti-e-dati.md`.

## Decisioni prese (interrogatorio)
| Tema | Decisione |
|---|---|
| Stack | Next.js 16 + TypeScript + Tailwind + shadcn + ElevenLabs UI (orb), `@elevenlabs/react`, `@anthropic-ai/sdk` nelle route API; deploy Vercel con CLI; PWA mobile-first |
| Voce | agente ElevenLabs con Claude nativo `claude-haiku-4-5` e client tools nel browser |
| Lingua della guida | parte in italiano e riconosce la lingua di Nour; lingue attive inglese, cinese, spagnolo, arabo (più italiano) |
| Interfaccia | inglese con l'italiano piccolo sotto («Your plan · Il tuo piano») |
| Test d'italiano | Nour dichiara il livello, la guida fa 3 prove di quel livello (una domanda, una frase da dire, una parola), Claude conferma, abbassa o alza; la barra mostra «dichiarato 4 → verificato 2» |
| Piano | parte solo dopo il sì di Nour; durante l'attesa si vedono le fonti lette in diretta |
| Fallo con me | la guida spiega il passo a voce e risponde ai dubbi; Nour spunta «fatto», il passo dopo si sblocca |
| Passaporto | si arriva dal passo «Codice fiscale» del piano |
| Cosa funziona davvero (demo dal vivo) | **A**: 1 «Parla con la guida» (onboarding vocale, scheda live, test d'italiano) e 2 «Il tuo piano» (fonti lette dal vivo, «Fallo con me», spunta «fatto»). 3 passaporto → moduli → PDF scaricabile compilato (richiesto da Thomas per app e demo). 4-7 come schermate cliccabili |
| Flussi non implementati | si mostrano nel video e nelle slide come flussi animati: passaporto → moduli → PDF, app collegate, Fascicolo con SPID, «Parlami in italiano», Talent card |
| Test d'italiano, contenuti | banca fissa di prove per fascia (0-2, 3-5, 6-8, 9-10) scritta da noi; Claude giudica le risposte e sposta la barra |
| Durata onboarding | circa 90 secondi, 6-7 scambi; nel video tagliato a 30-40 secondi |
| Ordine di lavoro | prima dell'implementazione: mockup di riferimento di Thomas → mockup e animazioni di tutte le schermate in stile Airbnb (orb vocale, wizard, scheda che si riempie, barra dell'italiano, fonti che si spuntano, transizioni) → approvazione → codice |
| PDF dei moduli | **presenti nell'app e nella demo**: Nour scarica il PDF e si vede che è compilato; quindi il passaporto (S5-S6) entra nella demo reale. Moduli in PDF: **AA4/8** (48 campi AcroForm compilati con `pdf-lib`), **dichiarazione di residenza** e **TARI nuova occupazione** (testo sovrapposto alle coordinate sul PDF ufficiale). Modulo 1 e ATM restano schede a schermo e flussi animati nel video |
| Voci | La guida usa il rilevamento automatico della lingua di ElevenLabs (parte in italiano, passa alla lingua di Nour). Nella registrazione le battute di Nour sono una voce ElevenLabs realistica in inglese. Narratore italiano diverso |
| Slide | 5 slide in PowerPoint (skill `pptx`) |
| Musica del video | base leggera generata con ElevenLabs Music, volume basso sotto la voce |
| Prossimo passo dopo l'approvazione | solo F6 (piano in HTML) e F1 (mockup e animazioni di tutte le schermate, sui mockup di Thomas); il codice parte dopo l'approvazione dei mockup |
| Anteprime cablate | Fascicolo con SPID, «Parlami in italiano», Talent card, con etichetta «anteprima» |
| Avatar | **nessuno** (scartato da Thomas). La guida è un orb vocale con onda sonora, nello stile del pulsante circolare di ricerca di Airbnb |
| Design | **sistema Airbnb**: `DESIGN.md` di awesome-design-md (`npx getdesign@latest add airbnb` nel repo; copia locale in `~/.claude/skills/awesome-design-md/design-md/airbnb/DESIGN.md`). Canvas bianco, inchiostro #222222, un solo accento (Rausch #ff385c) per CTA e orb, raggi morbidi (8 px pulsanti, 14 px card, pill per la ricerca), un solo livello d'ombra, font Cereal sostituito da un'alternativa open (Inter, come indica il file). Niente logo né nome Airbnb: prendiamo il linguaggio visivo, non il marchio |
| Modalità d'uso | **onboarding**: all'apertura parte di default il benvenuto a voce della guida, con il wizard già visibile sotto; una **X** chiude l'audio e lascia l'interfaccia a tocco e testo (si capisce subito che l'app si usa anche senza voce). Vincolo dei browser: l'audio parte solo dopo un primo tocco, quindi la schermata d'avvio ha un tocco «Inizia · Start» che avvia la voce; se l'audio è bloccato compare «tocca per ascoltare». Il test d'italiano a testo si fa rispondendo per iscritto, Claude giudica allo stesso modo. Nour può passare tra voce e testo in qualsiasi momento; stesso agente ElevenLabs, in modalità solo testo quando scrive (`overrides.conversation.textOnly`), stessi client tool; il wizard si compila anche col tocco (card da toccare, campi da scrivere). **Dopo l'onboarding**: app normale da telefono, a tocco e in silenzio; l'audio è facoltativo (pulsante «ascolta» su passi e frase italiana, «Fallo con me» a voce o a testo) |
| Provenienza di Nour | extra-UE, paese non specificato: la guida chiede solo «UE o extra-UE?»; il piano include il permesso di soggiorno entro 8 giorni |
| Fonti del piano | guide YesMilano lette dal vivo con timeout breve; se il sito non risponde, copia datata 3/10 dichiarata a schermo |
| Lingua del piano | lingua rilevata di Nour (inglese in demo) con le parole chiave italiane che sentirà allo sportello |
| Palette dell'app | struttura Airbnb (bianco, inchiostro #222222, raggi morbidi, una sola ombra) con i colori di Milano: pulsanti e orb vocale in rosso Comune `#A50D26`, evidenziati (barra dell'italiano, avanzamento, spunte, fonti lette) in giallo YesMilano `#FFC800` con testo scuro |
| Video e slide | usano solo materiale reale dell'app: registrazioni dello schermo, screenshot delle schermate vere o dei mockup approvati, stessi colori, font e icone. Niente interfacce inventate. I flussi non ancora implementati si animano partendo dai mockup approvati |
| Riferimento schermate | 70 schermate del flusso Airbnb «Creating new listing» (zip refero.design in `/mnt/c/Users/yolob/Downloads/Telegram Desktop/`). Il wizard di Airbnb (schermata introduttiva a 3 fasi, una domanda grande per schermata, griglia di card a scelta, contatori, barra di avanzamento in basso, «Indietro» e «Avanti») diventa l'onboarding di Nour: le card e i campi si accendono mentre lei parla e il wizard avanza da solo |
| Pitch | video come base (demo del flusso reale + flussi futuri animati), 5 slide brevi, demo dal vivo solo se resta tempo |
| Video | voce fuori campo italiana diversa dalla guida (ElevenLabs), HyperFrames; skill esterna `ai-video-generation` (verificata: MIT, wrapper di inference.sh, nessuno script) installata per riprese AI aggiuntive, serve `belt login` di Thomas e crediti inference.sh; nel video il cambio lingua è italiano → inglese |
| Nome e volto della guida | si decide con i mockup di Thomas |
| Team | l'app la fanno Thomas e Claude |
| Testi | inglese con `humanizer`, italiano con `italiano-scrittura-anti-ai` |

## Flusso utente di Nour
### Schermate
| # | Schermata | Cosa vede e fa Nour | Dove lavora Claude |
|---|---|---|---|
| S0 | Benvenuto | logo, «Benvenuta a Milano · Welcome to Milan», tocco «Inizia · Start» che avvia il benvenuto a voce; il wizard compare sotto; una X chiude l'audio e resta l'interfaccia a tocco e testo; installa l'app | — |
| S1 | Onboarding vocale | orb della guida, trascrizione, scheda che si riempie dal vivo, indicatore dei passi | la guida riconosce la lingua, fa una domanda alla volta, compila la scheda (`update_profile`), fa il test d'italiano |
| S1b | Cosa ti serve? | «What do you need? · Di cosa hai bisogno?»: risposta a voce, a testo o con le scelte rapide (Casa, Codice fiscale, Medico, Trasporti, Studio, Italiano); in demo «I need to rent a room» | Claude riconosce l'obiettivo e i prerequisiti mancanti dal profilo |
| S2 | Piano in preparazione | lista delle guide che si spuntano mentre vengono lette; la guida dice «sto leggendo le guide ufficiali per te» | Claude legge YesMilano e sceglie i passi |
| S3 | Il tuo piano | 3-5 passi (cosa portare, dove, quanto ci vuole, entro quando, fonte), servizi per lei, frase italiana con ascolto, cosa ricontrollare, «prossime fermate» con le anteprime | piano personale con fonti |
| S4 | Fallo con me | foglio del passo: spiegazione scritta, pulsante «ascolta» o conversazione con la guida a voce o a testo, domande, «Compilalo per me» (sul codice fiscale), «Apri l'app ufficiale», «Fatto» | la guida spiega il passo nel contesto di Nour |
| S5 | Passaporto | foto o upload (pulsante «usa il passaporto di prova SPECIMEN»), lettura, campi estratti da confermare o correggere | Claude vision legge il documento |
| S6 | I tuoi moduli | 5 schede in ordine con scadenze (permesso entro 8 giorni, TARI entro 90), campi compilati, campi mancanti evidenziati da completare a voce o a mano, «Scarica PDF», «controlla e firma tu» | precompilazione dai dati di Nour |
| S7 | Anteprime | Fascicolo con SPID, Parlami in italiano (caffè con Giuseppe in biblioteca), Talent card per le aziende | (cablate, dati finti) |
| S8 | Il mio profilo | tutti i dati, italiano dichiarato e verificato, «cancella tutto» | — |

### Passaggi tra schermate
| Da | Evento | A |
|---|---|---|
| S0 | tocca «Parla con la guida» e concede il microfono | S1 |
| S0 | nega il microfono | S1 in modalità testo |
| S1 | onboarding completo | S1b |
| S1b | Nour dice l'obiettivo e conferma «Faccio il tuo piano?» | S2 |
| home | tocca «+ nuovo obiettivo» | S1b |
| S2 | piano pronto | S3 |
| S3 | tocca un passo | S4 |
| S4 | «Compilalo per me» | S5 |
| S5 | campi confermati | S6 |
| S6 | indietro | S3, con il passo «Codice fiscale» in corso |
| S4 | «Fatto» | S3, passo spuntato e il successivo sbloccato |
| S3 | tocca una prossima fermata | S7 |
| ovunque | tocca il profilo | S8 |

### Aggiornamenti dal vivo
- `update_profile` (client tool) aggiorna la scheda in S1 mentre Nour parla.
- Il piano arriva in streaming: ogni guida letta compare spuntata in S2, poi il piano completo.
- La lingua della voce cambia quando la guida riconosce la lingua di Nour; l'interfaccia resta inglese con l'italiano sotto.
- Spunta «fatto» e campi completati si salvano nel profilo sul telefono.

### Stati onesti
| Situazione | Cosa succede |
|---|---|
| connessione alla guida | orb in attesa, «Sto chiamando la guida…» |
| microfono negato | campo di testo, la guida risponde comunque a voce |
| guida disconnessa | messaggio e pulsante «Riprova»; il profilo resta |
| piano in errore | «Non riesco a leggere le guide adesso», pulsante «Riprova» |
| passaporto illeggibile | «Rifai la foto con più luce» |
| PDF in errore | la scheda resta visibile con i dati da copiare |
| offline | la shell PWA si apre, piano e profilo salvati restano leggibili |

## Cuore dell'app: «Cosa ti serve?» (decisione di Thomas)
L'agente capisce l'**obiettivo** di Nour e risponde «per farlo devi fare questo, e i moduli te li compilo io». Il piano è per obiettivo, non generico.
1. Dopo l'onboarding (chi sei, una volta sola) la domanda è «What do you need? · Di cosa hai bisogno?»; risposta a voce, a testo o toccando una scelta rapida (Casa, Codice fiscale, Medico, Trasporti, Studio, Italiano).
2. Claude riconosce l'obiettivo, guarda il profilo (cosa le manca: per esempio il codice fiscale) e legge le guide YesMilano pertinenti.
3. Restituisce i passi in ordine, prerequisiti compresi, ognuno con fonte, «Fallo con me» e, dove serve, «Compilalo per me».
4. Obiettivo della demo: **«I need to rent a room»** → codice fiscale (compila AA4/8) → cercare casa senza truffe → contratto registrato → residenza entro 20 giorni (compila dichiarazione) → TARI entro 90 giorni (compila modulo). Copre i 3 PDF scelti.
5. Ogni obiettivo diventa una card nella home con il suo avanzamento; Nour può aggiungerne altri.
Il dettaglio tecnico sotto resta valido, con `build_plan(goal)` al posto di `build_plan()` e il piano costruito sull'obiettivo.

## Dettaglio «Faccio il tuo piano» (S2-S3)
1. **Innesco**: la guida chiede «Shall I make your plan? · Faccio il tuo piano?»; Nour dice sì; l'agente chiama il client tool `build_plan` (con risposta).
2. **Browser**: passa a S2 e chiama `POST /api/plan` con il profilo salvato sul telefono; legge la risposta in streaming NDJSON.
3. **Server**: valida il profilo (zod, dimensione massima), poi tool loop con `claude-sonnet-5-5`:
   - prompt di sistema: piano della prima settimana per chi è appena arrivato; ogni passo deve venire da una guida letta con `read_guide` e citarla; ordine per dipendenze (codice fiscale → permesso entro 8 giorni se extra-UE → residenza → tessera sanitaria e medico → abbonamento ATM → TARI entro 90 giorni se affitta); adattato a provenienza UE o extra-UE, situazione e preoccupazioni; parole semplici in inglese con le parole chiave italiane;
   - `read_guide(slug)`: le 12 guide YesMilano; Claude può chiederne più di una nello stesso turno e il server le legge in parallelo; lettura dal vivo con timeout breve, ripiego su una copia datata in `data/guides-snapshot.json` dichiarata a schermo;
   - tool finale `show_plan` (schema zod): headline; 3-5 passi {id, title_en, title_it, why_for_you, bring[], where, how_long, deadline, source_url, service_id}; 2-3 servizi {name, why_you, source_url, service_id}; frase italiana {phrase, meaning, when}; cosa ricontrollare con il Comune. Se Claude risponde in testo, nuova chiamata con `tool_choice` forzato su `show_plan`.
4. **Streaming**: eventi `reading` (guida in lettura), `read` (letta), `plan` (piano completo), `error`. In S2 ogni guida compare e si spunta in giallo.
5. **Ritorno all'agente**: `build_plan` restituisce un riassunto di 2-3 righe con i passi; la guida lo dice a voce e invita a toccare il primo passo.
6. **Dopo**: piano salvato sul telefono; «Fallo con me» manda all'agente il passo toccato (`sendContextualUpdate` e messaggio utente) e la guida lo spiega; la spunta «fatto» sblocca il passo successivo.
7. **Obiettivi**: piano pronto in meno di 25 secondi; errore onesto con «Riprova»; nessun piano finto di riserva.
8. **Test**: lo schema di `show_plan` accetta un output valido e rifiuta passi senza fonte; ordine rispettato (codice fiscale prima della residenza) su un profilo di prova.

## Architettura
- `app/page.tsx`: macchina a stati delle schermate S0-S8; componenti `VoiceGuide` (useConversation + Orb di ElevenLabs UI), `ProfileCard`, `PlanView`, `StepSheet`, `PassportFlow`, `FormsView`, `Previews`, `ProfileView`.
- `app/api/signed-url/route.ts`: URL firmato ElevenLabs, chiave solo sul server.
- `app/api/plan/route.ts`: tool loop `claude-sonnet-5-5`; tool `read_guide(slug)` sulle 12 guide YesMilano, `find_places` sul CKAN del Comune; tool finale `show_plan`; risposta in streaming NDJSON (eventi «sto leggendo X», poi il piano).
- `app/api/passport/route.ts`: Claude vision, tool `passport_fields`; max 5 MB, solo JPEG e PNG, mai salvato.
- `app/api/forms/pdf/route.ts`: PDF di un modulo con `pdf-lib` (campi AcroForm, oppure testo sovrapposto, oppure PDF nostro).
- `lib/guides.ts` (allowlist, pulizia testo, cache), `lib/forms.ts` (mappatura deterministica campi → 5 moduli), `lib/services.ts` (app ufficiali con URL verificati), `lib/ckan.ts`.
- `scripts/create-agent.mjs`: crea o aggiorna l'agente via API (LLM `claude-haiku-4-5`, prima lingua italiano, rilevamento lingua, preset en/zh/es/ar, voce multilingue, client tools `update_profile`, `set_italian_level`, `build_plan`, `show_screen`, `request_passport`, `open_service`); salva `ELEVENLABS_AGENT_ID`.
- PWA: `app/manifest.ts`, `public/sw.js` (cache della sola shell), icone.
- Sicurezza: fetch solo su allowlist, tetto di chiamate su plan e passport, nessun dato personale sul server, profilo nel `localStorage` con «cancella tutto».
- Test (vitest): mappatura moduli, allowlist delle guide, validazione dell'immagine.
- Da verificare con context7 al momento: rilevamento lingua e preset ElevenLabs, schema dei parametri dei client tool, `sendContextualUpdate` per «Fallo con me», componenti ElevenLabs UI installabili con shadcn.

## Fasi e orari (alle 13:19 mancano 2 ore e 40)
| Quando | Fase | Cosa | Dipende da |
|---|---|---|---|
| subito | F6 | piano completo in HTML pubblicato come artifact | approvazione del piano |
| con F1, 15 min | F1b | logo dell'app con la CLI `higgsfield` (skill `higgsfield-brandkit` / `higgsfield-generate`; ripiego kie.ai nano-banana-pro se i crediti sono finiti): icone astratte piatte stile app sui 4 concept scelti (M-percorso, due fumetti a incastro, freccia che diventa casa, interscambio); colori: giallo YesMilano `#FFC800` principale, rosso Comune di Milano `#A50D26` secondario, fondo bianco; nessuno stemma o logo ufficiale; poi icona PWA 512/192 e favicon | concept scelti |
| 13:30–14:15 | F0 | scaffold Next.js, agente ElevenLabs con client tools, route signed-url e plan (streaming), lib guide, test | `.env` con le chiavi |
| subito dopo l'approvazione, 30 min | F1 | estrarre lo zip in scratchpad e studiare le 70 schermate Airbnb; `DESIGN.md` Airbnb nel repo; mockup HTML mobile di **tutte** le schermate S0-S8 in stile Airbnb, con animazioni (wizard che avanza mentre Nour parla, card che si accendono, barra dell'italiano che scende da 4 a 2, fonti che si spuntano, PDF che si compila); skill `motion-design`, `emil-design-eng`, `mobile-design`, `app-fedelta-ui`; screenshot e console pulita; pubblicati come artifact per l'approvazione | DESIGN.md + zip |
| 14:15–15:00 | F2 | UI con `/feature-dev:feature-dev`: S0-S4 vere, S6-S8 cablate; voce collegata | F1 |
| 14:30 | F3 | se in orario: passaporto → schede dei moduli (S5-S6 vere) | F2 |
| 14:30–15:20, in parallelo | F4 | video: copione e voce fuori campo, flussi futuri animati in HyperFrames (anche riprese AI con `ai-video-generation`), poi registrazione della demo reale e render | F2 per la registrazione |
| 15:00–15:20 | F5a | deploy Vercel, prova sul telefono, screenshot `verify-ui` | F2 |
| 15:20–15:40 | F5b | 5 slide brevi (problema, demo, flussi futuri, dove lavora Claude, primo giorno), README | F4 |
| 15:40–15:55 | F5c | upload del video, submission | tutto |

## Video: demo del prodotto (circa 2 minuti)
Il video mostra il prodotto; la storia del pitch sta nelle slide. Tutto quello che si vede viene dall'app vera o dai mockup approvati.

| Tempo | Blocco | Immagini | Audio |
|---|---|---|---|
| 0:00–0:12 | Uso reale | scena Higgsfield: drone sopra Milano, discesa e zoom su Nour (persona inventata) per strada con il telefono in mano; inquadratura alle spalle; lo schermo si allarga e diventa la registrazione vera | base musicale, suoni della città |
| 0:12–1:15 | La demo reale | registrazione dell'app: benvenuto, la guida passa dall'italiano all'inglese, wizard con le card che si accendono, test d'italiano (4 → 2), «Faccio il tuo piano?», guide che si spuntano, piano, «Fallo con me», passaporto, moduli, PDF scaricato | voci della guida e di Nour (ElevenLabs), sottotitoli |
| 1:15–1:45 | I flussi che arrivano | mockup approvati animati: app ufficiali, Fascicolo con SPID, «Parlami in italiano», Talent card | voce fuori campo italiana breve |
| 1:45–2:00 | Chiusura | logo animato, «Nour non apre mai un portale», QR dell'app e link al repo | voce fuori campo, musica |

**Animazioni** (HyperFrames con `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `motion-design`): telefono 3D inclinato che ruota piano attorno alla registrazione; zoom con maschera sui momenti chiave (card che si accendono, barra 4 → 2, guide spuntate, PDF che si compila); sottotitoli parola per parola; transizioni a maschera tra i blocchi; niente che copra il prodotto. Scena drone generata con la CLI `higgsfield` (skill `higgsfield-generate`), sostituzione dello schermo in HyperFrames; nessuna persona reale, nessun logo sul telefono generato.

## Slide del pitch (5, PowerPoint, stile e colori dell'app)
Seguono i quattro tempi di SUBMISSION.md (20/60/20/20 secondi):
1. **Il problema** (20 secondi): pagine reali dei 5 siti, i numeri (84%, 16%, 39%, 45,6%), «passano all'inglese».
2. **La demo** (60 secondi): il video o la demo dal vivo, con il QR per provare l'app.
3. **Dove lavora Claude** (20 secondi): diagramma negli stessi colori; la persona decide.
4. **Il primo giorno per il Comune** (20 secondi): link nell'email di benvenuto e su YesMilano; dati che servirebbero (SPID e ANPR via PDND, feed eventi).
5. **Dove va** (di riserva, per le domande): flussi futuri e fuga di cervelli, con Talent card e Parlami in italiano.

## Cosa serve da Thomas
- `~/milano-evolution/.env` con `ANTHROPIC_API_KEY` e `ELEVENLABS_API_KEY`.
- I mockup di riferimento (in arrivo).
- Login Vercel CLI (da verificare).

## Verifica
1. `node scripts/create-agent.mjs` stampa l'ID agente; `GET /api/signed-url` risponde 200.
2. `POST /api/plan` con il profilo di Nour: eventi di lettura in streaming, poi 3-5 passi con `source_url` su yesmilano.it.
3. `POST /api/passport` con lo SPECIMEN: campi estratti; `POST /api/forms/pdf` restituisce 5 PDF apribili con i dati.
4. Browser su localhost: la guida parte in italiano, passa all'inglese, la scheda si riempie, il test d'italiano sposta la barra, il piano arriva dopo il sì, «Fallo con me» spiega un passo, la spunta sblocca il successivo, i pulsanti aprono le app ufficiali.
5. Screenshot su 3 dispositivi con `verify-ui`, console pulita; sul telefono via HTTPS (Vercel) PWA installabile e microfono attivo.
6. `vitest` verde; repo senza chiavi; README completo; video caricato; submission entro le 15:55.

## Adattamento al repo dell'hackathon (Claude-Milano/impact-lab-oct-2026, ricontrollato alle 14:40)
Il repo non è cambiato da ieri sera. Dal brief della Track 01 e da SUBMISSION.md aggiungiamo:
1. **Avvisi proattivi** (il «Watch out» e il quarto passo del brief: «quali, quando, con quali dati»): nella home una card «Upcoming deadlines» calcolata dalle scadenze del piano (permesso entro 8 giorni, residenza entro 20, TARI entro 90) con notifica opzionale; nel README e nella slide 4 la tabella degli avvisi della versione 2 con i dati necessari (data d'arrivo dal Comune, stato della pratica di residenza, ANPR via PDND, consenso).
2. **Open data del Comune come knowledge base** (DATA.md): ds549 sedi anagrafe, ds1299 municipi, ds550 patronati, ds94 atenei, ds535 fermate metro, più le pagine procedure del Comune e di YesMilano; strumenti `find_places`, `city_procedure`, `list_sources` nel tool loop del piano, sempre con fonte; periodo coperto dichiarato nel README.
3. **Consegna**: README da `templates/PROJECT_README.md` con traccia, «Where Claude works» (modelli, prompt, tool, cosa decide Claude e cosa conferma la persona), dati e periodo; video di 2 minuti con link pubblico; issue «Submission» (azione esterna: da confermare con Thomas prima dell'invio); nessun dato personale nemmeno in screenshot e video; nessuna chiave nel repo.
4. **Rifinitura UI richiesta da Thomas**: padding generoso e spaziatura in stile Airbnb (24px ai lati, ritmo verticale 24-32px tra blocchi, card con 16-20px di padding interno).
