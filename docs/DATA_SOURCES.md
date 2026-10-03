# Data sources

All data is public. Snapshot fetched on **2026-10-03** into `web/data/opendata-kb.json` (≈200 KB) and served to Claude through the tools in `web/lib/opendata.ts` (`find_places`, `city_procedure`, `list_sources`). No personal data is stored.

## Open datasets (Comune di Milano, dati.comune.milano.it, CKAN API, CC BY 4.0)

| Dataset | ID | URL | Records | Period | Fields used | Why it matters for Nour |
|---|---|---|---|---|---|---|
| Sedi dei servizi anagrafici | ds549 | https://dati.comune.milano.it/dataset/ds549-sedi-dei-servizi-anagrafici | 13 | current (updated 2026-05) | titolo (municipio), Indirizzo, telefono, orari, Note, NIL, LAT/LONG | The registry office where she books residence and the ID card; notes say counters work by online appointment only |
| Sedi municipi | ds1299 | https://dati.comune.milano.it/dataset/ds1299-sedi-municipi-nel-comune-di-milano | 9 | current | Municipio, Indirizzo, Civico, CAP, mail, telefono, Mezzi pubblici, LAT/LONG | Tells her which of the 9 municipi she lives in and how to get to its seat |
| Sedi universitarie degli atenei milanesi | ds94 | https://dati.comune.milano.it/dataset/ds94-infogeo-atenei-sedi-localizzazione | 90 sites (from 711 rows, grouped by university + address) | undated census | DENOMINAZ, INDIRIZZO, FACOLTA, T_SEDE, TEL_SEGR, WWW, MUNICIPIO, NIL, LAT/LONG | Anchors "near my university": offices are ranked by distance from her campus |
| Localizzazione delle biblioteche ed archivi | ds41 | https://dati.comune.milano.it/dataset/ds41_infogeo_biblioteche_localizzazione_2007 | 45 (City libraries only) | **2007** | DENOMINAZ, INDIRIZZO, TELEFONO, E_MAIL, SOTTOTIPO, INFO, ZONA, LAT/LONG | Free study space, Wi-Fi and Italian-learning material; old census, so opening must be checked on milano.biblioteche.it |
| Servizio Sociale Professionale Territoriale: le sedi | ds1303 | https://dati.comune.milano.it/dataset/ds1303-servizio-sociale-professionale-territoriale-le-sedi | 19 | current | name, Indirizzo, Civico, CAP, Telefono, Orari, Note, link utili, MUNICIPIO, LAT/LONG | Where to go if she is in difficulty (housing, money) |
| Sede dei Sindacati e Patronati | ds550 | https://dati.comune.milano.it/dataset/ds550_sede-dei-sindacati-e-patronati | 90 | current | Patronati, Indirizzo, tel, indirizzo web, CAP, MUNICIPIO, LAT/LONG | Free help with the residence-permit kit, tax code and benefits (YesMilano "Patronato" guide) |
| Scuole di italiano per stranieri e CPIA | ds551 | https://dati.comune.milano.it/dataset/ds551_scuole-di-italiano-per-stranieri-e-cpia | 115 | current | Nome-associazione, tipo, indirizzo, levels (principianti…C2), gratis, Mezzi, mail, permalink, LAT/LONG | Free Italian courses near her, filtered by level |
| ATM - Fermate linee metropolitane | ds535 | https://dati.comune.milano.it/dataset/ds535_atm-fermate-linee-metropolitane | 130 | updated 2026-07 | nome, linee, LAT/LONG | Nearest metro stop to an office ("near: Loreto") |

Reviewed but not used: `ds287` libraries 2013-2015 (no coordinates), `ds3019` "Spazi freschi: biblioteche" (summer cool-spaces list, 14 rows), the arrivals and foreign-residents series (`ds1959`, `ds1957`, `ds1954`, `ds74`, `ds27`, `ds31`): statistics for the pitch, not for Nour's plan.

## Official pages (procedure facts, read 2026-10-03)

| Topic | URL | Facts used | Why it matters for Nour |
|---|---|---|---|
| Residence for foreigners from abroad | https://www.comune.milano.it/servizi/anagrafe/richiesta-di-residenza-per-persone-straniere-provenienti-dall-estero | online request with uploaded forms; effects from the date of declaration; City checks afterwards | Her first registry step once she has a room |
| Change of residence | https://www.comune.milano.it/servizi/anagrafe/cambio-di-residenza | declare within 20 days; registration within 2 working days; via ANPR with SPID/CIE | When she moves to another flat |
| TARI occupation declaration | https://www.comune.milano.it/servizi/tributi/tari-dichiarazione-di-occupazione-di-appartamenti-e-immobili | online declaration; effect from the next two-month period; PEC/e-mail/post alternatives. The 90-day deadline comes from the team's research and is **not stated on this page**: the tool flags it as "confirm" | Renting a room triggers the waste tax |
| TARI payment | https://www.comune.milano.it/servizi/tributi/tari-pagamento | wait for the notice; pagoPA | |
| Identity card (CIE) | https://www.comune.milano.it/servizi/anagrafe/carta-d-identita | appointment; health card or tax code + photo; booking link servizicrm.comune.milano.it/Appuntamenti/AnagrafeCIE | Only after residence |
| Registry certificates | https://www.comune.milano.it/servizi/anagrafe/certificati-anagrafici | online or by appointment | |
| Fascicolo del Cittadino | https://www.comune.milano.it/servizi/fascicolo-del-cittadino | SPID/CIE access; certificates, TARI, appointments | Shows why she cannot use City online services on day one |
| Rent support for young workers | https://www.comune.milano.it/servizi/casa/contributo-sostegno-affitto-per-giovani-lavoratori | up to EUR 2,400, under 35, ISEE ≤ 26,000 | Housing goal |
| Milano Abitare | https://www.comune.milano.it/servizi/casa/milano-abitare | below-market rent agency | Housing goal |
| Which municipio is my street in | https://www.comune.milano.it/servizi/in-che-municipio-e-via...- | official address → municipio lookup | Picks her registry office |
| YesMilano how-to guides | https://www.yesmilano.it/en/study/how-to/ (residence-permit-students, get-italian-tax-code-codice-fiscale, get-your-student-transportation-pass, id-card, take-residence-milano-students, rents) | permit within 8 working days; tax code free at Agenzia delle Entrate with AA4/8; ATM card EUR 10 for 4 years; ID card needs residence | The order of her first steps (also read live by `lib/guides.ts`) |

## Known gaps

- The City's automatic welcome e-mails for new residents (mentioned in the Impact Lab brief) are not public, so they are not in the knowledge base.
- `comune.milano.it` URLs change: several guessed paths return 404. Every URL above returned 200 on 2026-10-03.
- No live refresh at request time: the snapshot is rebuilt by re-running the CKAN fetch (package_show → CSV resource).
