-- ============================================================
-- FENIX SUPPORT — Dati seed per migrazione (knowledge base + config AI)
-- Generato dallo stato live di hvrjnuszitrybesklnyt il 2026-07-03.
-- Contiene SOLO i dati con valore reale: knowledge base (2 documenti +
-- 88 chunk per il RAG full-text) e configurazione AI (4 chiavi).
-- NON include ticket/messaggi di test, ne utenti auth.
-- Eseguire DOPO full_schema.sql, sullo stesso nuovo progetto.
-- Nota: knowledge_documents.file_url punta ancora allo storage del vecchio
-- progetto (i file non vengono migrati); il RAG usa il testo dei chunk (FTS),
-- quindi funziona comunque. Il link "scarica originale" resterebbe rotto.
-- ============================================================

-- ==== knowledge_documents ====
INSERT INTO knowledge_documents (id, title, description, file_url, file_type, status, chunk_count, uploaded_by, created_at) VALUES ('8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec', NULL, 'https://hvrjnuszitrybesklnyt.supabase.co/storage/v1/object/public/knowledge-documents/1782206327967_Specifiche_Tecniche_Sensor_Plus_V2.5.0.txt', 'txt', 'ready', 84, NULL, '2026-06-23 09:18:48.307335+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_documents (id, title, description, file_url, file_type, status, chunk_count, uploaded_by, created_at) VALUES ('93b3819d-fbef-47ce-879c-17b6d256451e', 'problem solving', NULL, 'https://hvrjnuszitrybesklnyt.supabase.co/storage/v1/object/public/knowledge-documents/1782208432562_SCHEDA%20PROBLEM%20SOLVING.pdf', 'pdf', 'ready', 4, NULL, '2026-06-23 09:53:53.802983+00') ON CONFLICT (id) DO NOTHING;
-- ==== knowledge_chunks ====
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('83d23bd8-6068-4226-ae64-eeab9e2cff21', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 1)', '--- Pagina 1 ---
Sommario 
TABELLA DELLE REVISIONI ......................................................................................................................................... 3 
Generalità .................................................................................................................................................................. 4 
CTR ......................................................................................................................................................................... 4 
SENSOR .................................................................................................................................................................. 6 
FUNZIONAMENTO .............................................................', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('7568abe6-140e-4320-9778-b35a552df9e6', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 2)', '.................... 6 
FUNZIONAMENTO ..................................................................................................................................................... 8 
Sistema BOOST ...................................................................................................................................................... 9 
PIN OUT CTR ............................................................................................................................................................ 10 
Connettore 1 (Alimentazione) ............................................................................................................................. 10 
Connettore 2 (Manipolo BODY) ...........................................................................', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('021f22d1-0bd8-481b-bedc-24407ed9c726', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 3)', 'ettore 2 (Manipolo BODY) ........................................................................................................................... 11 
Connettore 3 (EXTERN) ........................................................................................................................................ 12 
Connettore 4 (DIGITAL VISO) ............................................................................................................................... 12 
Connettore 5 (DIGITAL CORPO) ........................................................................................................................... 12 
Connettore 6 (DIGITAL MICOL) ............................................................................................................................ 13 
Conn', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('bb43f922-b15a-4a85-95c9-be3fc2540070', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 4)', '.......................................................................................... 13 
Connettore 7 (MODBUS) ..................................................................................................................................... 13 
Connettore 8 (ENCODER)..................................................................................................................................... 13 
Connettore 9 (MOTORI) ....................................................................................................................................... 14 
PROTOCOLLO MODBUS ........................................................................................................................................... 15 
Input Register .........................................', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('31ce49c1-61ae-4a43-8475-42c9e732fe1d', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 5)', '...................................... 15 
Input Register ...................................................................................................................................................... 15 
Holding Register................................................................................................................................................... 16 
Coil Register ......................................................................................................................................................... 19 
Valori Calibrazione FACE ...................................................................................................................................... 21 
ACCOPPIAMENTO RADIO SENSOR-CTR ...............................................', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('c3587db0-e62d-4f82-9791-12c34a05dcc9', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 6)', '................ 21 
ACCOPPIAMENTO RADIO SENSOR-CTR ................................................................................................................... 22 
MODALITA DI AGGIORNAMENTO Firmware della CTR............................................................................................ 23 
Aggiornamento Moduli Radio (CTR e PLUS) ........................................................................................................ 26 
Aggiornamento Remoto Sensor .......................................................................................................................... 27 
Piattaforme Hardware e Software utilizzate ........................................................................................................... 29 
Eventuale valutazione', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('8c7899df-2bdb-4468-af41-59aac08b0606', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 7)', '........................................................................ 29 
Eventuale valutazione dei rischi riconducibili a possibili malfunzionamenti del FW/SW con individuazione delle 
misure di contenimento previste ............................................................................................................................ 29 
Requisiti funzionali utilizzati come input alla progettazione (compresi requisiti di sicurezza), anche in formato di 
“stories”, “use cases”, etc ........................................................................................................................................ 30 
Schema architetturale del FW/SW .......................................................................................................................... 30', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('c0641d9e-7e4b-46fb-8f7e-b17db3467592', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 8)', '................................................................................................ 30 
Moduli nei quali può essere suddiviso il FW STM32F4 ....................................................................................... 31 
Moduli nei quali può essere suddiviso il FW ESP32 (CTR) ................................................................................... 32 
Moduli nei quali può essere suddiviso il FW ESP32 (Manipolo) .......................................................................... 32 

--- Pagina 2 ---
Strumenti utilizzati per lo sviluppo del FW/SW e per la gestione della configurazione .......................................... 34 
Modalità di test eseguiti .......................................................................................', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('df225e93-d606-4ae9-b503-b47d90522306', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 9)', 'est eseguiti .......................................................................................................................................... 34 
Indicazione dell’ultima versione rilasciata (con eventuali indicazione della presenza di anomalie non risolte) .... 35 
 
  

--- Pagina 3 ---
TABELLA DELLE REVISIONI 
 
 
Versione DOC Versione FW Data Autore Modifiche 
1.0 1.1.0.0 16/03/2022 Piero D’Amico Versione Iniziale 
1.1 1.2.0.0 18/03/2022 Piero D’Amico Aggiornata variabile STATE con BIT di stato; 
introdotti comandi CALIB FACE e CALIB ZERO; 
aggiunta tabella MODBUS valori di calibrazione 
corrente FACE 
1.2 1.2.0.0 23/03/2022 Piero D’Amico Aggiunti parametri TIME FACE e RAMP in 
holding register; aggiunta procedura di 
accoppiamento radio CTR-SENSOR 
1.3 1.2.0', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d0e4f5b1-817c-47bc-ae1e-0f79100e02c2', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 10)', 'ACE e RAMP in 
holding register; aggiunta procedura di 
accoppiamento radio CTR-SENSOR 
1.3 1.2.0.0 24/03/2022 Piero D’Amico Corretti i collegamenti RS485 della scheda che 
erano invertiti; inserite istruzioni 
programmazione moduli RADIO; istruzioni di 
programmazione remota SENSOR 
1.4 1.3.0.0 01/04/2022 Piero D’Amico Aggiunto comando UPDATE SENSOR 
1.5 1.4.0.0 09/05/2022 Piero D’Amico Modificata la modalità di programmazione dei 
moduli RADIO 
1.6 1.7.2.0 07/06/2022 Piero D’Amico Introdotta la possibilità di impostare il livello di 
tensione massima per il manipolo viso; 
dettagliato BIT DIAGNOSTICA 
1.7 1.7.3.0 09/06/2022 Piero D’Amico Introdotta la possibilità di impostare il livello di 
tensione massima per il manipolo CORPO 
1.8 1.7.3.0 10/06/2022 Piero D’Amico Corret', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d6566f4f-9af7-4b9c-baf0-0ec48728b450', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 15)', 'La scheda SENSOR è collegata direttamente a: 
✓ +12Vdc proveniente dalla scheda CTR 
✓ Pulsante di STOP 
✓ Encoder motore 
✓ Sensore di forza 
✓ LED direzione 
La scheda SENSOR è dotata di 4 pulsanti per la selezione del verso di rotazione del motore e per la modifica dei 
parametri di funzionamento (destra, sinistra, avanti e indietro) e di un display OLED 128x64 pixel monocromatico 
per la visualizzazione del funzionamento. 
LED DIREZIONE 

--- Pagina 7 ---
Sulla SENSOR sono presenti due file di LED con lo scopo di rendere visibile, in modalità BARLED, il livello di 
pressione applicato. 
Inoltre, la scheda è in grado di fornire le seguenti informazioni diagnostiche: 
- Temperatura e Umidità della scheda 
- Corrente assorbita dalla scheda', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('815f5850-cd88-4367-af82-ae93861546ab', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 11)', 'il livello di 
tensione massima per il manipolo CORPO 
1.8 1.7.3.0 10/06/2022 Piero D’Amico Corretti valori indirizzi errati 
1.9 1.7.5.0 13/07/2022 Piero D’Amico Aggiunta diagnostica SENSOR; aggiunti 
comandi TEST ON e TEST OFF che abilitano la 
modalità test, e comandi ON SENOSR e OFF 
SENSOR che spengono o accendono il display e 
i LED del manipolo (su FW SENSOR 1.7.6.0 o 
successive) 
2.0 1.7.8.0 17/11/2022 Piero D’Amico Aggiunti comando per blocco scheda, 
watchdog sensor tramite relè esterno 
2.1 1.8.8.1 05/06/2023 Piero D’Amico Aggiunta segnalazione pulsante termocamera 
TERMO KEY in Holding Register 
2.2 1.8.8.4 02/05/2024 Piero D’Amico Inserimento info FDI 
2.3 1.8.8.6 27/02/2025 Piero D’Amico Gestione NFC, Limitazione di corrente 
2.4 4.2.0.0 05/03/2025 Piero D’Ami', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('8661a38b-de5d-4d51-9e61-c82d7dc33fdd', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 12)', '27/02/2025 Piero D’Amico Gestione NFC, Limitazione di corrente 
2.4 4.2.0.0 05/03/2025 Piero D’Amico Gestione LED UVC (solo ESSENZA) 
2.5 4.3.0.0 26/03/2025 Piero D’Amico Abilitazione/Disabilitazione NFC (Essenza) 
  

--- Pagina 4 ---
 
Generalità 
 
Il presente documento ha lo scopo di descrivere nel dettaglio le caratteristiche del sistema Sensor Plus. 
Il sistema è composto da 2 unità: 
➢ Scheda di controllo 
➢ Manipolo 
Le due unità comunicano fra loro tramite un canale radio da 2.4Mhz, con velocità di trasmissione d 1Mbit; le due 
unità sono associate in modo da poter comunicare solo fra loro. 
La scheda di controllo, che da ora in poi chiameremo CTR, ha il compito di controllare la velocità di rotazione di 
un motore regolandone la velocità ed il verso di rotazione', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('5c8e3afd-dc52-464c-8b3c-0dcff3001d7c', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 13)', 'ontrollare la velocità di rotazione di 
un motore regolandone la velocità ed il verso di rotazione mentre la scheda manipolo, che da ora in poi 
chiameremo SENSOR, ha il compito di analizzare e trasmettere i valori dei sensori in dotazione. 
In particolare, SENSOR è collegata all’encoder motore in modo da misurare costantemente la velocità, e ad un 
sensore di forza per la misura della pressione esercitata dal manipolo sul paziente; i valori rilevati, insieme ai dati 
di diagnostica, vengono periodicamente inviati alla CTR che li rende disponibili ad un’unità di elaborazione 
esterna (es. PC) tramite protocollo MODBUS RTU. 
 
CTR 
 


--- Pagina 5 ---
 
Come riportato in figura la CTR, che rappresenta il cuore del sistema, è direttamente collegata al motore 
presente nel man', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('475ebe7c-9d3a-43b8-aa27-81a48b67496a', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 14)', 'la CTR, che rappresenta il cuore del sistema, è direttamente collegata al motore 
presente nel manipolo e, tramite un collegamento RS485 è in grado di comunicare con il PC. 
La stessa scheda svolge anche il compito di alimentare la SENSOR 
La CTR è dotata di 4 relè in grado di dirottare la tensione motore su più manipoli qualora fossero presenti. 
La CTR è dotata di 2 distinti processori: il processore principale che gestisce tutte le funzioni della scheda (es. 
modbus, gestione relè, elaborazione dati) ed un processore che funziona da transceiver RADIO ovvero che mette 
in collegamento radio la CTR con la SENSOR 
 

--- Pagina 6 ---
SENSOR 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
La scheda SENSOR è collegata direttamente a: 
✓ +12Vdc proveniente d', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('275ddacf-a641-4074-b8f6-ea102cdc3690', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 16)', 'rmazioni diagnostiche: 
- Temperatura e Umidità della scheda 
- Corrente assorbita dalla scheda 
- Tensione di alimentazione motore 
- Temperatura del motore (qualora venga montata una PT100 sul motore) 
 
  

--- Pagina 8 ---
FUNZIONAMENTO 
 
La CTR riceve le impostazioni sia dal PC che da manipolo; tramite queste impostazioni è in grado di controllare il 
motore sia in modalità OPEN LOOP, ovvero impostando una tensione fissa al motore che in modalità CLOSED 
LOOP, ovvero analizzando puntualmente la velocità di rotazione attestandola, tramite continua modulazione 
della potenza fornita al motore, ad un valore prefissato: 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Come si evince nella prima modalità, qualora lo sforzo del motore aumenti, la velocità potrebbe v', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('e9543342-138c-4e78-9bc0-1cac3c539791', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 17)', 'Come si evince nella prima modalità, qualora lo sforzo del motore aumenti, la velocità potrebbe variare mentre 
nella seconda modalità, a circuito chiuso, l’algoritmo PID, si occuperà di aumentare o diminuire la potenza 
trasmessa al motore in modo da mantenere costante la velocità di rotazione. 
La potenza trasmessa al motore può anche essere modulata sulla base del livello di pressione esercitato secondo 
il seguente algoritmo BOOST. 
La potenza al motore può variare da 0% (Tensione al motore di 0V) al 100% che corrisponde alla tensione massima 
di alimentazione. 
 
 
MOTORE DRIVER 
POTENZA 
MOTORE 
Livello di 
potenza da 0 a 
100% 
MOTORE DRIVER POTENZA 
MOTORE 
PID CONTROLLER +/- 
RPM MISURATI 
RPM 
IMPOSTATI 
Livello di potenza 
da 0 a 100% 
OPEN LOOP 
CLOSE', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('3cc472af-f21e-4025-a2e3-22fa78850470', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 18)', 'NTROLLER +/- 
RPM MISURATI 
RPM 
IMPOSTATI 
Livello di potenza 
da 0 a 100% 
OPEN LOOP 
CLOSED LOOP 

--- Pagina 9 ---
Sistema BOOST 
 
Il sistema BOOST è un meccanismo per il quale la velocità del motore viene aumentata in maniera proporzionale 
alla pressione esercitata sul paziente. 
Considerando un livello di pressione consentita che varia dallo 0% (barra led su SENSOR tutta spenta) al 100% 
(barra led su manipolo tutta accesa), al superamento di una data soglia percentuale la funzione BOOST si attiva 
imponendo un incremento di potenza al motore proporzionale. 
I due parametri da considerare sono: 
1. Soglia di pressione (%) 
2. Incremento di potenza (%) 
 
La formula che definisce l’incremento di potenza è la seguente: 
PM = PM0(1 + [INC*(Pr – Pr0)/1000]) 
Dove', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('4e0fcb00-de05-4089-be02-f6d636a87bd4', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 19)', 'la che definisce l’incremento di potenza è la seguente: 
PM = PM0(1 + [INC*(Pr – Pr0)/1000]) 
Dove: 
PM = Potenza al motore attuale 
PM0 = Potenza del motore prima del superamento della soglia di pressione 
INC = Incremento percentuale 
Pr = Pressione attuale 
Pr0: soglia di pressione dopo la quale attivare il BOOST 
 
Ad esempio, con una soglia di pressione di attivazione del 30%, un incremento dell’80% ed una pressione del 
60%, qualora la velocità di partenza sia del 40%, la velocità BOOST verrebbe calcolata a 40 + 40*0,24 = 49,6% 
Il sistema BOOST può funzionare sono se si esclude il PID controller in quanto, non può essere considerata più la 
regolazione RPM. 
 
  

--- Pagina 10 ---
PIN OUT CTR 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Connettore 1 (', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('da0bd4f1-9954-4b6d-adf4-645dee3b8e02', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 84)', 'attere hardware. 
 
 
 
 

--- Pagina 35 ---
Indicazione dell’ultima versione rilasciata (con eventuali 
indicazione della presenza di anomalie non risolte) 
 
Ultima versione FW scheda CTR (STM32F4): V 1.8.8.4 
Ultima versione FW scheda CTR (ESP32): V 3.1.0 
Ultima versione FW scheda Manipolo (ESP32): V 4.2.0.0 
Nessuna anomali ad oggi segnalata', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('7b785c8d-163a-413d-a930-dda73eb7394a', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 20)', 'Pagina 10 ---
PIN OUT CTR 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Connettore 1 (Alimentazione) 
 
PIN NOME DESCRIZIONE 
1 GND Massa alimentazione 
2 VCC Tensione di alimentazione 15-30Vdc 
 
 
 
 
 
 
1 
2 
3 
4 5 6 
7 
8 
9 
A B 
C 
1 
1 
1 
1 

--- Pagina 11 ---
Connettore 2 (Manipolo BODY) 
 
Il connettore può essere utilizzato per collegare alla scheda un manipolo esterno modello BODY o pulsanti 
esterni direttamente connessi con la scheda 
 
PIN NOME TIPO DESCRIZIONE 
1 VCC AUX IN Tensione di alimentazione complementare (15-30Vdc) 
2 +12Vdc IN Tensione di alimentazione complementare 12Vdc 
3 3.3Vdc OUT Tensione 3.3Vdc per alimentazione espansioni 
4 GND IN Massa alimentazione 
5 FREE1 IN/OUT I/O libero 
6 STOP IN Segnale digital', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('149cb597-db20-45ea-bae0-45b60ca2c3ef', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 21)', 'ne espansioni 
4 GND IN Massa alimentazione 
5 FREE1 IN/OUT I/O libero 
6 STOP IN Segnale digitale di STOP 
7 DX IN Segnale digitale rotazione destra motore 
8 SX IN Segnale digitale rotazione sinistra motore 
9 DW IN Segnale diminuisci velocità 
10 UP IN Segnale aumenta velocità 
 
NOTA: I segnali VCC AUX o +12Vdc servono qualora si desideri alimentare la scheda elettronica separatamente 
dal motore, ad esempio per eliminare i disturbi. 
Se si utilizza l’ingresso VCC AUX la +12Vdc, con la quale viene anche alimentato il manipolo, viene generata 
internamente alla scheda; se invece volessi utilizzare una 12Vdc esterna (ad esempio perché la 12V interna 
eroga poca corrente), allora posso collegare un alimentatore 12V all’ingresso +12Vdc. 
In entrambi i casi sarà necessario smo', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('2fa38511-04d3-49bc-a46b-bc476a51107b', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 22)', 'ra posso collegare un alimentatore 12V all’ingresso +12Vdc. 
In entrambi i casi sarà necessario smontare dalla scheda il componente EMI7 in bianco: 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


--- Pagina 12 ---
Connettore 3 (EXTERN) 
 
Questo connettore è stato previsto per il collegamento ad un driver motore per il pilotaggio di un carrello da 
utilizzare nella versione SENSOR MAGNETIKA. 
PIN NOME TIPO DESCRIZIONE 
1 GND OUT Massa per alimentazione driver carrello 
2 PWM BW OUT Segnale movimento carrello INDIETRO 
3 PWM FW OUT Segnale movimento carrello AVANTI 
4 NC NC NON COLLEGARE 
5 PROXIMITY IN SENSORE DI PROSSIMITA per STOP CARRELLO 
6 SDA OUT I2C per collegamento con sensori esterni 
7 SCL OUT I2C per collegamento con sensori esterni 
8 +12V PROT OUT Alimentazione p', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('1054f141-a882-4030-8f03-70a761c89c0f', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 23)', 'nsori esterni 
7 SCL OUT I2C per collegamento con sensori esterni 
8 +12V PROT OUT Alimentazione per dispositivi esterni (MAX 1A) 
 
I segnali SCL ed SDA possono essere utilizzati per la comunicazione con sensoristica esterna con protocollo I2C 
 
Connettore 4 (DIGITAL VISO) 
 
Il connettore serve per il collegamento ad un manipolo viso dotato di scheda elettronica con barled e 
collegamento RS485. 
PIN NOME TIPO DESCRIZIONE 
1 RS485-A SERIAL RS485 ausiliaria 
2 RS485-B SERIAL RS485 ausiliaria 
3 GND OUT Massa per alimentazione manipolo 
4 +12V PROT OUT Alimentazione manipolo 
5 S_VISO OUT Segnale analogico per BARLED 
6 Analog1 IN Segnale AD d’ingresso 0-10V (per usi futuri) 
 
Connettore 5 (DIGITAL CORPO) 
 
Il connettore serve per il collegamento ad un manipolo BODY', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d9138032-b5d1-4a65-a1ce-12873e6b0908', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 24)', 'Connettore 5 (DIGITAL CORPO) 
 
Il connettore serve per il collegamento ad un manipolo BODY sia della tipologia SENSOR PLUS che SENSOR 
NORMALE 
PIN NOME TIPO DESCRIZIONE 
1 RS485-A SERIAL RS485 ausiliaria 
2 RS485-B SERIAL RS485 ausiliaria 
3 GND OUT Massa per alimentazione manipolo 
4 +12V PROT OUT Alimentazione manipolo 
5 S_BODY OUT Segnale analogico per BARLED 
6 Analog0 IN Segnale AD d’ingresso 0-10V (per usi futuri) 
 
 
 

--- Pagina 13 ---
Connettore 6 (DIGITAL MICOL) 
 
Il connettore serve per il collegamento ad un manipolo tipologia MICOL 
PIN NOME TIPO DESCRIZIONE 
1 RS485-A SERIAL RS485 ausiliaria 
2 RS485-B SERIAL RS485 ausiliaria 
3 GND OUT Massa per alimentazione manipolo 
4 +12V PROT OUT Alimentazione manipolo 
5 S_MICOL OUT Segnale analogico', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('418d0846-f3b8-4fbe-b080-a683213fa601', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 25)', 'r alimentazione manipolo 
4 +12V PROT OUT Alimentazione manipolo 
5 S_MICOL OUT Segnale analogico per BARLED 
6 Analog0 IN Segnale AD d’ingresso 0-10V (per usi futuri) 
 
Connettore 7 (MODBUS) 
 
Il connettore serve per il collegamento ad un manipolo tipologia MICOL 
PIN NOME TIPO DESCRIZIONE 
1 +12V  OUT Alimentazione per dispositivo esterno 
2 VCC OUT Alimentazione principale riportata all’esterno 
3 GND OUT Massa 
4 RS485-A MODBUS SERIAL Collegamento MODBUS al PC 
5 RS485-B MODBUS SERIAL Collegamento MODBUS al PC 
6 GND OUT Massa 
 
NOTA: Qualora sulla scheda venga montato il componente U10 al posto del componente U12 la scheda può 
essere utilizzata per comandare il display della SENSOR vecchio modello (con opportune modifiche al firmware). 
 
Connettore 8 (ENCODER)', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('1fde714a-69a8-45fe-a4b1-2995ef9983fa', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 26)', 'lay della SENSOR vecchio modello (con opportune modifiche al firmware). 
 
Connettore 8 (ENCODER) 
 
Il connettore serve per collegamenti esterni di varia natura 
PIN NOME TIPO DESCRIZIONE 
1 +5Vdc ALIM Alimentazione +5V 
2 AUX_IN IN Input digitale ausiliario 
3 GND ALIM Massa 
4 3.3V ALIM Alimentazione 3.3Vdc 
5 NC  NON COLLEGARE 
6 ENC IN Ingresso encoder 
 
 
 
 
 
 

--- Pagina 14 ---
Connettore 9 (MOTORI) 
 
Il connettore serve per il collegamento con i motori 
PIN NOME TIPO DESCRIZIONE 
1 CB OUT TENSIONE MOTORE CORPO + 
2 CA OUT TENSIONE MOTORE CORPO - 
3 MB OUT TENSIONE MOTORE MICOL + 
4 MA OUT TENSIONE MOTORE MICOL - 
5 FB OUT TENSIONE MOTORE VISO + 
6 FA OUT TENSIONE MOTORE VISO  - 
 
  

--- Pagina 15 ---
PROTOCOLLO MODBUS 
Di seguito viene ripo', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('27bb14d9-8e29-4189-afc3-2956f8a5023a', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 27)', 'OUT TENSIONE MOTORE VISO  - 
 
  

--- Pagina 15 ---
PROTOCOLLO MODBUS 
Di seguito viene riportato il protocollo di comunicazione MODBUS RTU, 115200 bps, modalità RS485, indirizzo 
85. Intervallo minimo di lettura e scrittura: 250ms. 
Input Register 
Variabile Indirizzo Funzione Tipo SOLA 
LETTURA 
RANGE DESCRIZIONE 
CURRENT 999 Input Register Uint16 SI 0-12000 Corrente assorbita dal 
motore espressa in mA 
SENS 
DIAGNOSTICA 
1002 Input Register Uint16 SI 0-65536 BIT diagnostica SENSOR 
BIT0: BAR FAULT Il chip che gestisce la bar led non risponde ai comandi 
BIT1: SHUNT FAULT Il chip che misura tensione-corrente scheda non risponde ai comandi 
BIT2: PT100 FAULT Il chip che legge la PT100 (opzionale) non risponde 
BIT3: FAULT TEMP SENSOR Il sensore temperatura e umidità', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('3687903f-f23b-4ae8-bc39-81cf4f0be782', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 28)', 'e legge la PT100 (opzionale) non risponde 
BIT3: FAULT TEMP SENSOR Il sensore temperatura e umidità non risponde 
BIT4: FORCE FAULT Problema al sensore di forza 
 BIT10: NFC ERROR Non rilevato lettore NFC. Lettura NFC disabilitata 
DIAGNOSTICA 1003 Input Register Uint16 SI 0-65536 BIT diagnostica 
BIT0: SHUNT1 Modulo INA misura tensione corrente non funzionante 
BIT1: SENSOR COUPLER La scheda di controllo non è accoppiata ad una scheda SENSOR 
BIT2: Sensore corrente di Hall Il sensore di corrente deve essere tarato 
BIT3:EEPROM La memoria eeprom, dove vengono memorizzati tutti I parametri, non sta funzionando 
BIT4: Supply L’alimentazione è inferior a 14500 mV 
BIT5: Libero To be defined 
BIT6: Sensore di pressione Se 1 vuol dire che la testa del manipolo non è collegata bene (v', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('9567ff9c-05e8-4532-8c28-99f4a771b976', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 29)', 'efined 
BIT6: Sensore di pressione Se 1 vuol dire che la testa del manipolo non è collegata bene (verificare I pin) 
BIT7: Motore Body scollegato Il motore è stato attivato ma non viene rilevato assorbimento di corrente e gli RPM = 0 
BIT8:Radio Fault Il modulo Radio risponde ai comandi ma non riesce a comunicare via wireless 
BIT9: NO RX SENSOR Il Sensor non sta inviando dati (da almeno 10 secondi) 
BIT10: RADIO COM Comunciazione seriale con modulo radio KO 
BIT11: NO ENCODER Il motore è alimentato ma RPM = 0; possible problema encoder 
BIT12: LIMITER ON Indica che si è attivato il limitatore di Corrente che ha spento il motore 
VALORI DIAGNOSTICA SENSOR 
TEMPERATURA 
SENSOR 
1004 Input Register Uint16 SI 0-65536 Temperatura scheda 
SENSOR x 100 (°C) 
UMIDITA 
SENSOR 
1005', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('2a2722f7-a17c-4f15-8d19-639a21334496', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 30)', '4 Input Register Uint16 SI 0-65536 Temperatura scheda 
SENSOR x 100 (°C) 
UMIDITA 
SENSOR 
1005 Input Register Uint16 SI 0-65536 Umidità scheda SENSOR x 
100 (%) 
CORRENTE 
SENSOR 
1006 Input Register Uint16 SI 0-65536 Corrente assorbita 
SENSOR x 100 (mA) 
ALIMENTAZIONE 
SENSOR 
1007 Input Register Uint16 SI 10000 - 
13000 
Alimentazione SENSOR 
(mV) 
VALORI SENSORI OPERATIVI 
RPM 1009 Input Register Uint16 SI 0 - 1000 Velocità di rotazione del 
motore espressa in 
giri/min 
STATE 1010 Input Register Uint16 SI 0-65536 Vettore di stato che indica 
lo stato di funzionamento 
della macchina 
BIT0: MOTORE ON, BIT1:PAUSA, BIT2:VERSO SX, BIT3:VERSO DX,BIT4:Modalità 
PID,BIT5:BOOST,BIT6:BOOST ACT, BIT7:FACE ON;BIT8: BODY ON; BIT9:CTR DISABLE; 
BIT10:WTD EN; BIT11: RS485', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('61fdeb4e-2e5b-4218-941c-5affe63be10d', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 31)', 'T5:BOOST,BIT6:BOOST ACT, BIT7:FACE ON;BIT8: BODY ON; BIT9:CTR DISABLE; 
BIT10:WTD EN; BIT11: RS485 EN; NFC:EN 
Quando il BIT è 1 allora è True; La modalità PID indica la modalità di controllo della velocità 
motore secondo il setpoint impostato in Holding register 1015. La modalità PID è ALTERNATIVA 
alla modalità BOOST descritta precedentemente. BOOST ACT diventa 1 quando il BOOST sta 
operando 
PRESSION 1011 Input Register Uint16 SI 0 - 500 Pressione espressa in Kg x 
10 
Si tratta del valore di pressione rilevato dal manipolo durante il trattamento. Per 
ottenere il valore di pressione espresso in KG dividere per 10 il numero letto. 

--- Pagina 16 ---
FW VERSION 1012 Input Register Uint16 SI 0-65536 Versione Firmware CTR 
HW VERSION 1013 Input Register Uint16 SI 0-65536 Ve', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d3cd7cbb-cdd6-435e-9017-8001c5b0cb09', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 32)', 'gister Uint16 SI 0-65536 Versione Firmware CTR 
HW VERSION 1013 Input Register Uint16 SI 0-65536 Versione Hardware CTR 
SESSION TIME 1014 Input Register Uint16 SI 0-65536 Tempo di lavoro espresso 
in secondi. Il primo 
indirizzo è MSB; la 
variabile è a 32 bit 
1015 Input Register Uint16 SI 0-65536 
Il SESSION TIME viene incrementata ogni secondo quando dopo l’invio del comando RUN 
(inizio trattamento); il conteggio si ferma quando invio il comando PAUSE e riparte quando, 
dopo, invio il comando RUN. Il conteggio si azzera quando invio il comando STOP (Holding 
Reg 1000) 
FW SENSOR 1016 Input Register Uint16 SI 0-65536 Versione Firmware 
SENSOR 
FW RADIO 1017 Input Register Uint16 SI 0-65536 Versione Firmware 
MODULO RADIO 
RADIO 
DIAGNOSTIC 
1018 Input Register Uint16 SI', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('1f54ec2d-155e-44a6-9ead-3f6200045d62', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 33)', 't16 SI 0-65536 Versione Firmware 
MODULO RADIO 
RADIO 
DIAGNOSTIC 
1018 Input Register Uint16 SI 0-65536 Diagnostica MODULO 
RADIO 
NFC_01 1019 Input Register Uint16 SI 0-65536 BYTE 0-1 codice NFC 
NFC_23 1020 Input Register Uint16 SI 0-65536 BYTE 2-3 codice NFC 
NFC_45 1021 Input Register Uint16 SI 0-65536 BYTE 4-5 codice NFC 
NFC_6 1022 Input Register Uint16 SI 0-65536 BYTE 6 codice NFC 
LIMIT_CURR 1023 Input Register Uint16 SI 0-65536 Corrente limite motore 
(mA) 
TIME_LIMIT 1024 Input Register Uint16 SI 0-65536 Tempo intervento 
limitatore corrente (msec) 
 
 
Holding Register 
 
Variabile Indirizzo Funzione Tipo SCRITURA/ 
LETTURA 
RANGE DESCRIZIONE 
MOTOR VEL 999 Holding Register Uint16 SI 0-100 Potenza attiva sul 
motore espressa in % 
Se imposto questo parame', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('37df10c5-24bf-4b4c-a187-1867a2e841b0', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 34)', 'olding Register Uint16 SI 0-100 Potenza attiva sul 
motore espressa in % 
Se imposto questo parametro, ad esempio, al 50% il motore verrà alimentato 
con una tensione pari al 50% di quella massima. Quando è attiva la modalità 
PID il controllo di questo parametro passa al processore che lo varierà in 
continuazione in modo da mantenere la velocità di rotazione il piu vicino 
possibile a quella impostata. 
COMANDO1 1000 Holding Register Uint16 SI 0-100 Il codice scritto in questo 
registro viene 
interpretato come un 
comando da eseguire.  
NOME CODICE DESCRIZIONE 
SX 1 Rotazione motore a sinistra 
DX 2 Rotazione motore a destra 
STOP 3 Ferma il motore (e termina il trattamento) 
PAUSE 4 Ferma il motore (e mette in pausa il trattamento) 
RUN 5 Avvia il motore avviando un nuo', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('5dc576f0-0578-4ac9-9838-75fb899013dc', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 35)', 'PAUSE 4 Ferma il motore (e mette in pausa il trattamento) 
RUN 5 Avvia il motore avviando un nuovo trattamento o 
riavviando un trattamento in pausa 
RESET SENSOR 6 Esegue il reset della scheda SENSOR 
SYSTEM RESET 7 Esegue il reset della scheda CTR 
OK READ 100 Solo lettura -La CTR ha letto il comando 
 
1 Dopo aver inviato un comando, prima d’inviare il successivo, attendere la risposta OK READ.  

--- Pagina 17 ---
PRESS CALIB 8 Calibra il sensore di pressione 
BOOST EN 9 Attiva la modalità BOOST 
BOOT 10 Solo lettura – La scheda si è appena avviata 
BOOST DISABLE 11 Disabilità la modalità BOOST 
LCD VERT 12 Attiva la visualizzazione verticale del display SENSOR 
LCD ORIZ 13 Attiva la visualizzazione orizzontale del display 
SENSOR 
LCD DIAGNOSTIC 14 Attiva la visual', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d255e34d-f63a-431b-bc5c-d33f6311b8c0', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 36)', 'Z 13 Attiva la visualizzazione orizzontale del display 
SENSOR 
LCD DIAGNOSTIC 14 Attiva la visualizzazione diagnostica del display 
SENSOR 
RESET 
ACCOPPIAMENTO 
15 Annulla l’accoppiamento radio tra SENSOR e CTR 
RESET RADIO 16 Esegue il reset del modem RADIO della CTR 
CALIB FACE2 17 Calibra la modalità “Pressione” del Face 
CALIB ZERO 18 Taratura del sensore di corrente - Calcola lo “zero” 
del sensore di corrente 
UPDATE SENSOR 20 Attiva la modalità UPDATE REMOTO della scheda 
sensor 
ON SENSOR 23 ATTIVA il manipolo sensor 
OFF SENSOR 24 SPEGNE il manipolo sensor 
TEST ON 25 Attiva la modalità TEST del manipolo sensor 
TEST OFF 26 Disattiva la modalità TEST del manipolo sensor 
DISABLE CTR3 27 Disattiva il pulsante di avvio/pausa del manipolo 
ENABLE CTR 28 Attiva il', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('9b127ce2-08ed-469d-af30-e76cb389efd8', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 37)', 'ensor 
DISABLE CTR3 27 Disattiva il pulsante di avvio/pausa del manipolo 
ENABLE CTR 28 Attiva il pulsante di avvio/pausa del manipolo 
DISABLE WTD 29 Disabilita la funzione watchdog del relè 
ENABLE WTD4 30 Riattiva la funzione watchdog del relè 
NFC OFF 31 Disabilita il controllo NFC 
NFC ON5 32 Attiva controllo NFC 
 
PWM FREQ 1001 Holding Register Uint16 SI 0-35000 E’ la frequenza impostata 
per il segnale PWM che 
regola la tensione 
erogata al motore. 
Questo parametro 
dipende dal tipo di 
motore ed è 
preimpostato a 25000  
VEL BAR 1002 Holding Register Uint16 SI 0-100 Per utilizzi futuri 
BUZZER 1003 Holding Register Uint16 SI 0-65536 Tempo di durata del 
buzzer espresso in ms 
Il valore di questo registro normalmente è a zero. Posso scriverci dentro il 
tempo', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('c5f695a8-59a5-47dd-8bf0-4b29edd93180', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 38)', 'presso in ms 
Il valore di questo registro normalmente è a zero. Posso scriverci dentro il 
tempo durante il quale il buzzer dovrà essere attivo. Quindi se ci scrivo 1000 il 
buzzer suonerà per 1 secondo. 
PRES_BAR 1007 Holding Register Uint16 SI 0-100 Livello della barra di 
pressione presente su 
SENSOR 
Il valore di pressione riportato in Input Reg 0x1010 rappresenta il valore reale. 
Tuttavia la modalità BOOST lavora sulla percentuale di pressione rispetto al 
100% del valore di pressione consentito (impostato di fabbrica). Quindi 
leggendo questo parametro posso sapere il livello della barra di pressione su 
SENSOR e riportarlo sul PC 
 
2 CALIB FACE attiva la rotazione del manipolo, prima in un senso e poi nell’altro, con un valore di potenza crescente da 
0 a 100. Per', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('2ecf7d02-b930-4ae2-bc32-793b6e2f4af5', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 39)', 'manipolo, prima in un senso e poi nell’altro, con un valore di potenza crescente da 
0 a 100. Per ogni valore di potenza viene misurata la relativa corrente; questa corrente viene confrontata con la 
corrente assorbita durante l’attività del manipolo e la differenza fra le due, convertite in un valore di pressione 
percentuale (più pressione esercito, più il motore fatica, più corrente assorbo)  
3 Se attivato impedisce di avviare il motore dal pulsante del manipolo 
4 Nel caso in cui per 10 secondi la scheda non riceva segnali dal manipolo, lo spegne e lo riaccende tramite il relè 
opzionale. 
5 Il motore gira a 120RPM per 4 secondi per poter leggere l’NFC dopodiché va alla velocità impostata 

--- Pagina 18 ---
SERIAL 1008 Holding Register Uint16 SI 0-65536 Numero seriale dell', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('c86999f6-be08-40e0-a835-4569fe26f5d9', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 40)', 'impostata 

--- Pagina 18 ---
SERIAL 1008 Holding Register Uint16 SI 0-65536 Numero seriale della 
macchina 
PULSANTI 1009 Holding Register Uint16 SI 0-65536 Codice ULTIMO pulsante 
premuto 
La CTR memorizza l’ultimo pulsante premuto sul manipolo. 
1 = UP, 2 = DOWN, 4 = LEFT, 8 = RIGHT, 16 = STOP  
STEP 1010 Holding Register Uint16 SI 1-13 Memorizza lo step 
corrente, ovvero il 
programma che la 
macchina sta eseguendo.  
Lo STEP può essere cambiato sia dal manipolo che dal PC 
SENSORMAC[0] 1011 Holding Register Uint16 SI 0-65536 LSB MAC ADDRESS 
SENSOR 
SENSORMAC[1] 1012 Holding Register Uint16 SI 0-65536 MSB MAC ADDRESS 
SENSOR 
SENSORMAC[2] 1013 Holding Register Uint16 SI 0-65536 MMSB MAC ADDRESS 
SENSOR 
I SENSORMAC da 2 a 0 rappresentano un numero a 48 bit che def', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('128541ff-8f4a-416a-9d81-2deebd3cfd6d', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 41)', 'SI 0-65536 MMSB MAC ADDRESS 
SENSOR 
I SENSORMAC da 2 a 0 rappresentano un numero a 48 bit che definisce il MAC ADDRESS della 
SENSOR nel formato esadecimale 11:22:33:44:55:66 
SET RPM 1015 Holding Register Uint16 SI 0-800 Numero di giri al minuto 
che il motore deve 
realizzare grazie al 
controllo PID 
Quando scrivo questo registro la CTR si pone automaticamente in modalità 
PID (Closed Loop); per cui quando avvierò il motore l’algoritmo farà in modo 
di mantenere la velocità di rotazione il piu vicina possibile a quella impostata. 
La velocità di rotazione reale può essere letta da Input Reg 0x1009 
SENSIBILITY 1016 Holding Register Uint16 SI 0-100 Rappresenta la 
sensibilità del sensore di 
pressione 
Come detto in precedenza la funzione BOOST non lavora sul valore di', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('2e2dd8e2-22df-4a97-85df-34f359704977', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 42)', 'del sensore di 
pressione 
Come detto in precedenza la funzione BOOST non lavora sul valore di 
pressione ma sulla percentuale rispetto alla pressione massima. Con 
sensibilità al 100% il valore della pressione massima è di 10Kg per cui per 
attivare il BOOST devo imporre una pressione di almeno 3Kg se la soglia di 
attivazione è al 30%. Se imposto la sensibilità al 50% la soglia di attivazione 
rimarra sempre al 30% ma la pressione da esercitare sarà doppia. 
Kp 1017 Holding Register Uint16 SI 0-10 Costante PRODOTTO 
Ki 1018 Holding Register Uint16 SI 0-10 Costante INTEGRATIVA 
Kd 1019 Holding Register Uint16 SI 0-10 Costante DERIVATIVA 
Questi 3 parametri definiscono il comportamento del motore in modalità PID; 
vengono memorizza moltiplicati x 1000. Quindi se voglio un Kp d', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('040cf514-7d2d-4255-922a-df3da6e18bb9', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 43)', 'amento del motore in modalità PID; 
vengono memorizza moltiplicati x 1000. Quindi se voglio un Kp di 0.1 
memorizzerò 100. Questi parametri devono essere maneggiati solo da 
personale specializzato perché anche una piccola modifica può 
compromettere il corretto funzionamento del motore. 
BOOST PRESS 1020 Holding Register Uint16 SI 0-100 Soglia di pressione (in %) 
oltre la quale la CTR entra in 
modalità BOOST 
BOOST INC 1021 Holding Register Uint16 SI 0-100 Percentuale d’incremento 
della velocità secondo 
quanto descritto in Sistema 
BOOST 
TIME BODY 1022 Holding Register Uint32 SI 0-65536 MSB Tempo di lavoro totale 
del motore BODY (in secondi) 
1023    LSB Tempo di lavoro totale 
del motore BODY (in secondi) 
TIME FACE 1024 Holding Register Uint32 SI 0-65536 MSB Tempo', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('cee3b103-9073-4297-83b8-749d11c2daf8', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 44)', 'totale 
del motore BODY (in secondi) 
TIME FACE 1024 Holding Register Uint32 SI 0-65536 MSB Tempo di lavoro totale 
del motore FACE (in secondi) 

--- Pagina 19 ---
1025    LSB Tempo di lavoro totale 
del motore FACE (in secondi) 
RAMP 1026 Holding Register Uint16 SI 200-
65536 
Gestisce la rampa di 
accelerazione e 
decelerazione del motore. E’ 
il valore espresso in usec che 
il motore impiega per 
incrementare o 
decrementare la propria 
velocità dell’1% 
FACE LIMIT 1027 Holding Register Uint16 SI 0 - 19000 Tensione di alimentazione 
massima (espressa in mV) 
per il manipolo VISO.  
BODY LIMIT 1028 Holding Register Uint16 SI 0 - 19000 Tensione di alimentazione 
massima (espressa in mV) 
per il manipolo CORPO. 
TERMO KEY 1029 Holding Register Uint16 SI 0-1 1 → Il', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('cc61c336-aa8b-46ae-b66d-be34db3f527a', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 45)', 'ma (espressa in mV) 
per il manipolo CORPO. 
TERMO KEY 1029 Holding Register Uint16 SI 0-1 1 → Il pulsante è stato 
premuto per almeno 100ms. 
Dopo la lettura il registro 
deve essere azzerato dal PC 
 
Coil Register 
 
Variabile Indirizzo Funzione Tipo SCRITURA/ 
LETTURA 
DESCRIZIONE 
HANDLE 1001 Coil Register BOOL SI Selezione Manipolo 
Corpo o Viso  
0 = Manipolo BOSY (SENSOR), 1 = Manipolo FACE (VISO) 
REGISTRAZIONE 1002 Coil Register BOOL SI Attiva la modalità di 
accoppiamento radio fra 
CTR e SENSOR  
0 = Registrazione OFF, 1 = Registrazione ON 
Quando attivo la modalità di registrazione la CTR invia 
periodicamente un messaggio radio di tipo broadcast. Premendo 
contemporaneamente i 4 pulsanti della SENSOR anche questa si 
mette in modalità di registrazione. A', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('8e5dd2ce-c2a2-497f-90cf-5cc38dcace5e', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 46)', 'contemporaneamente i 4 pulsanti della SENSOR anche questa si 
mette in modalità di registrazione. Appena riceve il messaggio 
broadcast dalla CTR allora imposta il MAC della CTR nella sua 
memoria e comunica a questa il proprio in MAC. Terminata la 
fase di registrazione il registro 0x1002 viene messo a 0 dalla CTR 
WATCHDOG 1003 Coil Register BOOL SI Ativa o disattiva 
alimentazione manipolo 
(solo se montata la 
scheda relè opzionale) 
0 = Manipolo non alimentato 1 = Manipolo alimentato 
ON_LED_C 1004 Coil Register BOOL SI Spegni Accendi LED UVC 
CORPO  
0 = LED BODY ESSENZA OFF 1 = LED BODY ESSENZA ON 
ON_LED_F 1005 Coil Register BOOL SI Spegni Accendi LED UVC 
FACE  
0 = LED FACE ESSENZA OFF 1 = LED FACE ESSENZA ON 
 
L’impostazione della variabile HANDLE determina se', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('f50b0084-7180-41b1-bb8d-7c83e64c76c5', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 47)', 'ED FACE ESSENZA OFF 1 = LED FACE ESSENZA ON 
 
L’impostazione della variabile HANDLE determina se voglio utilizzare il manipolo SENSOR, oppure quello FACE; 
dato che la scheda è dotata di un solo driver motore, tale parametro attiverà o disattiverà un RELE che ha il 
compito di portare la tensione di controllo al motore FACE o a quello SENSOR. 

--- Pagina 20 ---
Nel caso venga selezionato il manipolo FACE, non essendo questo dotato di sensoristica, sia i valori RPM che 
quelli di PRESSIONE non saranno disponibili. 
Tuttavia, dopo aver eseguito la procedura di calibrazione (solo in produzione), sarà possibile conoscere la 
pressione esercitata dal manipolo leggendo il valore memorizzato in PRESS BAR (Holding Reg 0x1007) con un 
valore percentuale, da 0 a 100. 100% significa che', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('bd9eb472-f4c4-433e-9efb-9c4395149511', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 48)', 'zzato in PRESS BAR (Holding Reg 0x1007) con un 
valore percentuale, da 0 a 100. 100% significa che il motore sta assorbendo, a quella determinata velocità, 
esattamente il doppio di quello che assorbe a vuoto, ovvero girando liberamente. 
Tale valore può poi essere associato ad un valore di pressione corrispondente indicativo. 
In modalità FACE verrà escluso dal funzionamento il manipolo SENSOR che entrerà in fase di STAND BY e non 
sarà più possibile controllare il motore ne altri valori tramite di esso. 
Nel caso di MANIPOLO FACE ESSENZA (dotato di display) la selezione del manipolo face fara in modo che il 
manipolo corpo venga escluso e disattivato. La comunicazione avverrà quindi fra scheda e manipolo FACE e 
tutti i dati ricevuti (es. versione FW, diagnostica) saranno relativ', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('77e02e72-2aad-48e8-8ddc-6544dc6710ba', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 49)', 'fra scheda e manipolo FACE e 
tutti i dati ricevuti (es. versione FW, diagnostica) saranno relativi a tale scheda. Anche i comandi inviati dalla 
scheda saranno indirizzati alla scheda FACE e non quel corpo. E viceversa. 
Invece, il manipolo FACE risponderà ai comandi di aumento velocità, destra e sinistra e funzionerà anche con la 
modalità BOOST. 
ON_LED_C e ON_LED_F sono implementati, per ora, solo sulla versione ESSENZA.  

--- Pagina 21 ---
Valori Calibrazione FACE 
 
Dopo aver eseguito il comando CALIB FACE ed aver terminato la procedura di calibrazione del sensore di 
corrente-pressione, i valori di calibrazione vengono salvati nella flash interna del processore, e sono accessibili, 
sia in lettura che scrittura, tramite MODBUS. 
Questo vuol dire che è possibile, trami', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('16dcf68d-b23b-4d3f-8bf1-60ab5f6049a8', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 50)', 'cessibili, 
sia in lettura che scrittura, tramite MODBUS. 
Questo vuol dire che è possibile, tramite applicazione PC, visualizzare le curve di calibrazione e sovrascriverle; 
questo torna utile in fase di produzione della macchina, in quanto è possibile precaricare le curve di calibrazione 
predefinite, sempre ipotizzando che le caratteristiche dei motori utilizzati siano tutte simili. 
Variabile Indirizzo Funzione Tipo Lettura/scrittura RANGE DESCRIZIONE 
CAL_DX0 2999 Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza 1% , Rotazione 
DESTRA 
CAL_DX1 3000 Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza 1% , Rotazione 
DESTRA 
CAL_DXn (2999 + n) Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza n% , Rotazione 
DESTRA', '2026-06-23 09:18:48.670952+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('8acc82cc-c7c0-4e65-9102-b1bc4a48bd96', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 51)', 'n) Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza n% , Rotazione 
DESTRA 
CAL_DX100 3099 Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza 100% , 
Rotazione DESTRA 
CAL_SX0 3100 Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza 1% , Rotazione 
SINISTRA 
CAL_SXn (3100 + n) Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza n% , Rotazione 
SINISTRA 
CAL_SX100 3198 Holding 
Register 
Uint16 SI 0-12000 Corrente assorbita a 
Potenza 100% , 
Rotazione DESTRA 
ZERO SENS 3199 Holding 
Register 
Uint16 SI 1500-
1700 
Tensione del sensore a 
ZER AMPERE 
 
Il valore ZERO SENS viene calcolato automaticamente inviando il comando CALIB ZERO e rappresenta la tensione 
di uscita del sensore di HALL quan', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('db69bb76-8cdb-4207-8606-6bcc7e6f30bf', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 52)', 'amente inviando il comando CALIB ZERO e rappresenta la tensione 
di uscita del sensore di HALL quando l’assorbimento di corrente è pari a zero Ampere. 
Se il parametro ha un valore al difuori dal range allora è necessario provvedere alla ricalibrazione in quanto la 
misura di corrente risulterà errata e di conseguenza anche il funzionamento del rilevamento di pressione per la 
FACE. In generale, dopo aver calibrato lo zero, sarà necessario ricalibrare anche il sensore di corrente-pressione 
del FACE con il comando CALIB ZERO. 
  

--- Pagina 22 ---
ACCOPPIAMENTO RADIO SENSOR-CTR 
 
Come descritto in precedenza la scheda SENSOR è accoppiata tramite collegamento radio criptato. 
Per questa ragione, quando un nuovo manipolo deve essere collegato alla macchina, è necessario procede', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('b4826d38-c422-47fb-bd5e-e611b87e9714', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 53)', 'r questa ragione, quando un nuovo manipolo deve essere collegato alla macchina, è necessario procedere a 
quello che si chiama provisionig radio, ovvero ala registrazione da una parte e dall’altra del mac address del 
proprio interlocutore. 
La semplice procedura prevede i seguenti passaggi: 
1. Alimentare scheda CTR e scheda SENSOR 
2. Attendere l’avvio 
3. Attivare la modalità registrazione (scrivere 1 in Coil Register 0x1002) 
4. Premere tutti e 4 i pulsanti del manipolo viso fino a che non appare la schermata di registrazione 
 
 
 
 
 
 
 
 
AL termine della procedura, se tutto è andato a buon fine, il display del manipolo segnalerà il simbolo della 
faccina sorridente, e la scheda CTR avrà memorizzato il MAC della SENSOR e viceversa. 
Qualora sia necessario sostitui', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d47670be-ba06-4bad-b0e2-59b9e410a441', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 54)', 'e la scheda CTR avrà memorizzato il MAC della SENSOR e viceversa. 
Qualora sia necessario sostituire la scheda o l‘intero manipolo, la procedura potrà essere rieseguita tutte le volte 
che si renda necessario.  


--- Pagina 23 ---
MODALITA DI AGGIORNAMENTO Firmware della CTR 
 
Il firmware della scheda CTR può essere aggiornato tramite il meccanismo DFU (Device Firmware Update); per 
attivare tale meccanismo impostare il selettore verso DESTRA quando la scheda è spenta e subito dopo collegare 
la scheda all’USB: 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Quando la scheda viene avviata in modalità programmazione il LED in alto a sinistra è attivo. 
Terminata la programmazione rimettere il selettore a destra e scollegare l’USB. 
 
 
 
 
Selettore 
USB', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('68cdd940-0a8f-466b-b56c-f14f5b46eb60', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 55)', 'la programmazione rimettere il selettore a destra e scollegare l’USB. 
 
 
 
 
Selettore 
USB 
LED 
programmazione 
ON 

--- Pagina 24 ---
 
 
Lanciare il programma ST32CubeProgrammer (scaricabile da questo link):  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Premere su “FILE” e selezionare il file da programmare con estensione .exe 
A destra selezionare USB e premere il pulsante di rilevamento USB di programmazione. 
 


--- Pagina 25 ---
 
 
Premere CONNECT e attendere che la scheda entri in DFU MODE: 
 
 
A questo punto premere il pulsante “DOWNLOAD” e attendere che il firmware sia correttamente scaricato. 
 
 
PREMERE PER RILEVARE 
l’USB DI 
PROGRAMMAZIONE 

--- Pagina 26 ---
Aggiornamento Moduli Radio (CTR e PLUS) 
 
La scheda CTR è dotata d', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('704d5a3b-24ea-4cb1-ae27-30271b5f6240', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 56)', 'MAZIONE 

--- Pagina 26 ---
Aggiornamento Moduli Radio (CTR e PLUS) 
 
La scheda CTR è dotata di 2 microprocessori; il primo, un STM32F446RET, e del quale abbiamo visto la modalità 
di riprogrammazione, gestisce tutta la parte applicativa (motore, modbus, etc). 
Il secondo è un ESP32 dotato di connettività WiFi tramite la quale viene realizzata la comunicazione Radio con la 
SENSOR; il processore svolge quindi il compito di radio gateway mettendo in comunicazione radio il processore 
STM32 con la scheda SENSOR. 
1. Scaricare il SW “Flash download tool” dal link https://www.espressif.com/en/support/download/other-
tools 
2. Avviare il programma in modalità “factory” 
3. Selezionare i file di programmazione e programmare 
 
 
 
Inserire il file “bootloader.bin” con indirizzo', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('b5dd8c0e-daf7-49f9-a6c0-3cf6ebbf0e93', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 57)', 're i file di programmazione e programmare 
 
 
 
Inserire il file “bootloader.bin” con indirizzo 0x1000, partition.bin, con indirizzo 0x8000 ed il firmware 
all’indirizzo 0x10000; selezionare la COM in uno dei pannelli di programmazione e premere START; attendere il 
termine dell’installazione e riavviare la scheda. 
Avendo a disposizione piu programmatori è possibile programmare in contemporanea fino a 8 schede. 
A questo punto è necessario provvedere alla realizzazione di un programmatore; a tale scopo acquistare un 
convertitore UART-USB dotato di segnali DTR ed RTS. Ecco due esempi: 
https://www.amazon.it/gp/product/B07CQTC8P2/ref=ppx_yo_dt_b_search_asin_title?ie=UTF8&psc=1 
https://www.amazon.it/gp/product/B0753H4SQS/ref=ppx_yo_dt_b_search_asin_title?ie=UTF8&psc=1 
Eseguir', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('64e0ed8e-22d6-40ea-aa09-ac8ac8a920f7', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 58)', 'ttps://www.amazon.it/gp/product/B0753H4SQS/ref=ppx_yo_dt_b_search_asin_title?ie=UTF8&psc=1 
Eseguire il seguente collegamento: 


--- Pagina 27 ---
 
 
 
Per il cablaggio è possibile utilizzare il cavetto MOLEX PicoBlade OTS 15134 acquistabile su Farnell: 
https://it.farnell.com/molex/15134-0602/gruppo-cavi-presa-crimp-6-pos/dp/2671468 
 
 
Lo stesso programmatore, così realizzato, può essere utilizzato per programmare la scheda SENSOR: 
 
 
 
 
 
 
 
CONVERTITORE UART-
USB 
+5V 
DTR 
RX 
RTS 
GND 
TX 
TX 
RX 
GND 
RTS 
DTR 
+5V 
PROGRAMMAZIONE 

--- Pagina 28 ---
Aggiornamento Remoto Sensor 
 
La scheda SENSOR è dotata di una modalità di aggiornamento remoto; per attivare tale modalità premere 
velocemente il pulsante STOP e scorrere il menu di conf', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('c2845146-d8b6-4106-882e-0a008c2a72aa', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 59)', 'remoto; per attivare tale modalità premere 
velocemente il pulsante STOP e scorrere il menu di configurazione fino alla voce UPDATE: 
 
 
 
A questo punto premere il pulsante SU e successivamente il pulsante GIU in modo da attivare la modalità WiFi 
del manipolo: 
 
 
Come indicato del messaggio, collegarsi con il proprio smartphone (prima collegato alla rete WiFi da impostare 
nel manipolo), inserendo la password “password”; una volta che lo smartphone sarà stato collegato alla rete di 
cortesia del manipolo indicata sul display, si attiverà sullo smartphone la pagina web di configurazione della rete 
Wi-Fi della SENSOR. Impostare le credenziali di accesso, dopodiché’ la SENSOR si riavvierà in automatico. 
Con questa procedura, abbiamo attivato una rete WiFi e registrato la S', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('27a5a854-1a89-467f-9b51-641a8b44686c', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 60)', 'si riavvierà in automatico. 
Con questa procedura, abbiamo attivato una rete WiFi e registrato la SENSOR sul portale degli aggiornamenti; 
Ripetere la procedura una seconda volta per scaricare la nuova versione del FW (la configurazione del WiFi verrà 
richiesta solo la prima volta dopodiché le credenziali saranno registrate nella SENSOR). 
Al termine della procedura SPEGNERE e POI RIACCENDERE il sistema. 
 
NOTA: Non spegnere il manipolo durante la fase di aggiornamento; qualora dopo l’aggiornamento la scheda 
SENSOR non dovesse riavviarsi, sarà necessario riprogrammarla con il programmatore ed un PC.  


--- Pagina 29 ---
Piattaforme Hardware e Software utilizzate 
 
Il sistema è composto da due schede tra loro interconnesse tramite un protocollo di comunicazione Wireless', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('9c881a23-a630-488a-81d5-a6c0dc8c18e8', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 61)', 'a è composto da due schede tra loro interconnesse tramite un protocollo di comunicazione Wireless 
denominato ESP-NOW che sfrutta una portante radio a 2.4GHz su canale 2. 
La scheda di controllo denominata CTR, è dotata di 2 processori che comunicano fra loro tramite un protocollo 
proprietario su UART: 
1. STM32F4, processore ARM a 280MHz che ha il compito di gestire tutti gli IO, la comunicazione MODBUS 
e la gestione del motore, oltre alla diagnostica 
2. ESP32-WROVER-B (o analogo), processore ARM a 80MHz, che ha il compito di gestire la comunicazione 
Wireless con la scheda di gestione del manipolo. 
STM32F4 è programmato in linguaggio di programmazione C Ansi, utilizzando come sistema di sviluppo STM32 
Cube e IAR nella versione ARM che garantisce anche funzioni evolute di de', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('655c46c6-6c2b-4ae2-94fa-8b2264d80c1d', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 62)', 'istema di sviluppo STM32 
Cube e IAR nella versione ARM che garantisce anche funzioni evolute di debug. 
ESP32 viene programmato in linguaggio Ansi C, sfruttando come sistema di sviluppo Visual studio e l’estensione 
a pagamento Visual Micro per la programmazione embedded.  
È poi presente una scheda manipolo, dotata di solo processore ESP32, che pilota una barra LED per segnalare il 
livello di pressione esercitato sul paziente, 4 pulsanti per pilotare il motore ed un display per notificare lo stato 
dei parametri di funzionamento ed eventuali anomalie diagnostiche. 
 
Eventuale valutazione dei rischi riconducibili a possibili 
malfunzionamenti del FW/SW con individuazione delle 
misure di contenimento previste 
 
Le schede sono dotate di diagnostica interna come ampiamente ri', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('85574fce-5e62-440b-b760-1112fac67f18', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 63)', 'misure di contenimento previste 
 
Le schede sono dotate di diagnostica interna come ampiamente riportato nel protocollo di comunicazione 
MODBUS. Ogni singolo componente viene costantemente monitorato e le relative informazioni di 
funzionamento rese disponibili tramite modus. 
E’ compito del Software PC (Alto livello) verificare tali informazioni e segnalarle all’utente tramite interfaccia 
Display e/o inviarle all’assistenza tecnica tramite internet. 
Per quanto riguarda invece il funzionamento autonomo la scheda di controllo prevede un blocco motore in caso 
di: 
1. Assenza o non corretto inserimento del tappo manipolo 
2. Errore sensore di pressione integrato nel tappo manipolo 
In entrambi i casi l’anomalia viene segnalata in maniera autonoma sul display del manipolo ed il', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('2538b0d9-a615-40d9-8024-49f651c908c0', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 64)', 'o 
In entrambi i casi l’anomalia viene segnalata in maniera autonoma sul display del manipolo ed il motore viene 
immediatamente fermato e non è possibile più farlo ripartire fino all’eliminazione dell’anomalia che ha scaturito 
il blocco. 
In caso di blocco o malfunzionamento del manipolo SENSOR Evolution, la scheda di controllo prova ad eseguire 
un reset hardware della scheda manipolo, togliendo per circa 2 secondi, l’alimentazione 12V che lo alimenta. 

--- Pagina 30 ---
Qualora il problema non dovesse risolversi, riproverà il reset ogni 180s; a differenza del caso precedente (dove 
evidentemente viene evitata la possibilità che il motore venga attivato se non è presente il coperchio di 
protezione), in questo caso è sempre possibile, tramite PC, avviare il motore a meno che,', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('ceb11133-a20e-4430-affc-5c0ee7a6c668', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 65)', 'rchio di 
protezione), in questo caso è sempre possibile, tramite PC, avviare il motore a meno che, il SW identificando 
dalla diagnostica l’anomalia, non blocchi eventuali avvi da parte dell’utente. 
 
Requisiti funzionali utilizzati come input alla progettazione 
(compresi requisiti di sicurezza), anche in formato di 
“stories”, “use cases”, etc 
 
Il committente non ha fornito particolari requisiti funzionali che sono stati decisi in autonomia dal sottoscritto, in 
base al funzionamento della macchina SENSOR versione Therapy. 
Infatti, dal punto di vista funzionale, le macchine sono praticamente identiche mentre differiscono solo per la 
disponibilità di un PC che garantisce servizi evoluti, e per la tecnologia elettronica che in questo caso sfrutta le 
capacità di microproc', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('9cca57b8-4f54-4a6c-a24f-822800e126c8', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 66)', 'rvizi evoluti, e per la tecnologia elettronica che in questo caso sfrutta le 
capacità di microprocessori ARM a 32bit anziché microprocessori a 8 bit. 
I requisiti di sicurezza adottati dal sottoscritto sono i seguenti: 
- Blocco motore in caso di mancata presenza o anomalia del tappo manipolo 
- Comunicazione con il PC tramite protocollo MODBUS in modo da evitare anomali relative a disturbi e 
errori di comunicazione 
- Sistema evoluto di diagnostica integrata in grado di monitorare, e rendere disponibile, qualunque tipo di 
malfunzionamento delle schede, anche non critico. 
- Blocco motore in caso di corrente assorbita eccessiva (> 10 A) 
 
Schema architetturale del FW/SW 
 
Come già ampiamente descritto il sistema è composto da 2 schede che comunicano fra di loro tramite un', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('eb9651e7-99ad-4044-866f-347398f69123', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 67)', 'me già ampiamente descritto il sistema è composto da 2 schede che comunicano fra di loro tramite un 
protocollo wireless. La scheda CTR è composta da 2 processori tra loro interoperanti (STM32F4 e ESP32) mentre 
la scheda manipolo da un unico processore ESP32 che comunica con la scheda CTR tramite collegamento 
wireless. 
Al loro avvio le schede eseguono una diagnostica delle proprie componenti segnalando eventuali anomalie al PC 
e/o, in alcuni casi, tramite il display del manipolo. 
Al termine della fase di boot/diagnostica, stabiliscono una connessione wireless, con protocollo proprietario e la 
scheda CTR, a questo punto, trasmette le informazioni relative alla propria impostazione alla scheda manipolo 
(direzione di rotazione, velocità impostata, stato attivazione modalità BOO', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('b5c4d4f7-6357-46b9-a300-34df60d8f58f', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 68)', 'e alla scheda manipolo 
(direzione di rotazione, velocità impostata, stato attivazione modalità BOOST, valore sensore, sensibilità del 
sensore di pressione, Versione FW scheda manipolo) e le rende disponibili sul proprio display. 
Tali impostazioni sono memorizzate nella scheda CTR e vengono modificate dal Sw del pC tramite un protocollo 
modbus ad ogni accensione della macchina; infatti le modifiche non vengono memorizzate nella memoria non 

--- Pagina 31 ---
volatile per questioni di sicurezza ma devono essere ogni volta modificate dal SW del PC; in caso contrario le 
impostazioni saranno quelle di default memorizzate nel codice sorgente. 
 
Il SW del PC infatti, rappresenta il MASTER ed il cuore del funzionamento della macchina; definisce 
le impostazioni della scheda di co', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('eb1d8067-603d-40c2-ad96-3e572050679d', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 69)', 'MASTER ed il cuore del funzionamento della macchina; definisce 
le impostazioni della scheda di controllo CTR, attiva e disattiva il motore e ha il compito di 
segnalare eventuali anomalie riportate dalle schede tramite protocollo MODBUS, oltre a gestire le 
informazioni utente. 
L’interfaccia SW del PC ha accesso diretto a tutte le impostazioni e funzionalità delle schede, 
essendo queste rese tutte disponibili su protocollo standard MODBUS. 
È altresì vero che, l’utente è in grado di attivare il motore e variarne la velocità anche senza il 
consenso del SW del PC ma non è in grado di modificare altro. 
 
Moduli nei quali può essere suddiviso il FW STM32F4 
 
Modulo1 – Fase di Boot – 
Il microprocessore viene attivato ed esegue la configurazione di tutte le periferiche attive', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('2e91eb65-8e02-4ad7-92a7-243aa626a776', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 70)', 'oot – 
Il microprocessore viene attivato ed esegue la configurazione di tutte le periferiche attive (Uart, USB, IO) e 
successivamente analizza il corretto funzionamento della scheda attivando eventuali flag diagnostici in caso di 
problematiche riscontrate. 
In particolare, viene eseguito un controllo su: 
- Stato alimentazione 
- Stato memoria EEPROM 
- Stato memoria RAM 
- Stato comunicazione con processore Wireless 
 
Modulo2- Attivazione Task Software 
Il processore in questione, è dotato di un sistema operativo Real Time (RTOS) per cui è in grado di gestire più 
processi contemporaneamente; avendo però un solo core i processi vengono gestiti  a ”divisione di tempo”; in 
particolare viene attivato un Task principale che ha la funzione di gestire tutte le comunicazioni (as', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('17aac348-e7c4-4ec5-8202-90f8f98ba1f8', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 71)', 'rticolare viene attivato un Task principale che ha la funzione di gestire tutte le comunicazioni (asincrone) fra il 
processore ed il microprocessore wireless; un secondo Task (ModbusTask), ha il compito di gestire le 
comunicazione modbus su RS485, fra il processore ed il PC connesso; il terzo Task (SensorTask) ha il compito di 
gestire la rilevazione dei vari sensori di bordo come il sensore di corrente, il sensore di tensione. 
Tutte le comunicazioni tra processore principale e processore wireless e/o PC vengono verificate utilizzando un 
protocollo proprietario dotato di CRC a 16 bit. 
 
Modulo 3 – Funzionamento 
Terminata la fase di avvio il processore è in costante comunicazione, come MASTER, con la scheda Manipolo 
tramite collegamento wireless; riceve da quest’ultima tutte', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('a2ea822f-ef83-4821-bc6d-d8df25b17661', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 72)', 'e, come MASTER, con la scheda Manipolo 
tramite collegamento wireless; riceve da quest’ultima tutte le informazioni relative ai sensori di bordo 
(temperatura, umidità, forza esercitata sul rullo, corrente assorbita, tensione di alimentazione, eventuali fault). 

--- Pagina 32 ---
Allo stesso modo aggiorna i registri modbus relativi alle informazioni diagnostiche e di stato della macchina e 
riceve comandi leggendo altrettanti registri scritti dal PC (avvio o stop motore, impostazione velocità, verso di 
rotazione, livello sensibilità sensore di forza, attivazione/disattivazione modalità BOOST). 
Modulo 4 – Update Firmware 
La scheda CTR è dotata di un connettore USB tramite il quale è possibile aggiornare il firmware della scheda; a 
tale scopo è necessario provvedere a posizion', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('6c0b77c7-76bc-4e63-99d9-9616707f4bda', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 73)', 'e è possibile aggiornare il firmware della scheda; a 
tale scopo è necessario provvedere a posizionare su ON uno switch presente sulla scheda e successivamente 
avviare la scheda che andrà in modalità di riprogrammazione. Collegare la scheda al PC e riprogrammarla tramite 
il sw STM32 Programmer della ST Microelectronics. 
 
Moduli nei quali può essere suddiviso il FW ESP32 (CTR) 
 
A differenza del processore principale, il firmware del modulo di comunicazione radio è regolamentato da un 
unico processo che può essere suddiviso nei seguenti moduli: 
Modulo1 – Fase di Boot – 
Il processore configura tutte le periferiche: UART e sistema wireless e verifica la corretta comunicazione UART 
con il processore principale nonché quella wireless con la scheda manipolo designata. 
NOTA:', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('5a743c25-58fc-4b0c-a649-a8761dab4305', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 74)', 'UART 
con il processore principale nonché quella wireless con la scheda manipolo designata. 
NOTA: i messaggi scambiati via wireless tra la scheda CTR e la scheda manipolo non sono di tipo wireless ma 
sono indirizzati con il mac address del ricevente per cui, una volta effettuato l’accoppiamento, il manipolo potrà 
comunicare solo con la sua CTR e viceversa. 
Modulo1 – Comunicazione – 
Il processore rimane in costante ascolto della UART e del canale wireless; in caso di ricezione da uno dei due 
canali, dopo aver verificato la correttezza del messaggio, inoltra quest’ultimo sull’altro canale svolgendo a tutti 
gli effetti la funzione di bridge. 
 
Moduli nei quali può essere suddiviso il FW ESP32 (Manipolo) 
 
Anche in questo caso il FW viene gestito da un unico processo che p', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('7c687fa5-4372-4843-8e1f-e480fb418f34', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 75)', 'viso il FW ESP32 (Manipolo) 
 
Anche in questo caso il FW viene gestito da un unico processo che può essere suddiviso nei seguenti moduli: 
Modulo1 – Fase di Boot – 
Il processore configura tutte le periferiche: UART, sistema wireless, sensore di temperature e umidità, sensore di 
alimentazione (tensione e corrente di alimentazione), barra LED, sensore di forza, display grafico, sensore di Hall 
del motore; verifica la corretta comunicazione Wireless con il processore ESP32 della scheda CTR e segnala a 
quest’ultimo e a display eventuali fault diagnostici. 
Modulo2 – Verifica stato pulsanti – 
Periodicamente il processore verifica lo stato dei 5 pulsanti collegati alla scheda elettronica: aumento velocità, 
diminuzione velocità, rotazione destra, rotazione sinistra, stop e avvio', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('f1d6c017-5b10-4f66-b5f6-516368f438b5', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 76)', 'onica: aumento velocità, 
diminuzione velocità, rotazione destra, rotazione sinistra, stop e avvio motore. 
Quando uno dei pulsanti viene premuto il processore invia istantaneamente il relativo comando alla scheda CTR; 
i pulsanti possono funzionare anche in combinazione per attivare funzionalità particolari come la visualizzazione 

--- Pagina 33 ---
dello stato diagnostico e della versione FW, oppure per attivare la modalità di registrazione del mac address 
(accoppiamento manipolo – CTR) oppure collegare il manipolo a internet tramite connessione WiFi per 
permetterne l’aggiornamento remoto del FW. 
Modulo3 – Menu tecnico – 
Tenendo premuti i pulsanti UP e DOWN contemporaneamente per almeno 10 secondi, è possibile accedere ad 
un menu interno. Tale menu permette di modificare', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('f9dc3b52-808c-4389-89c6-93e5103b1ed6', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 77)', 'e per almeno 10 secondi, è possibile accedere ad 
un menu interno. Tale menu permette di modificare il canale di comunicazione Wireless (da 0 a 12) ed il tipo di 
comunicazione fra la scheda manipolo e la scheda CTR (Wireless o RS485 con protocollo proprietario) 
Modulo3 – Attivazione UPGRADE remoto – 
Tenendo premuti i pulsanti DX ed SX contemporaneamente per almeno 10 secondi, il manipolo si collega 
automaticamente ad internet sfruttando una rete wi-fi resa disponibile dal PC della macchina; una volta 
collegato va a verificare se sono disponibili aggiornamenti FW sul server remoto e, in caso affermativo, esegue in 
automatico la propria riprogrammazione qualora abilito sul relativo server. 
La funzione di upgrade può essere anche attivata dal PC, inviando un apposito comando al', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('baedc806-813b-4666-9af9-beab32713563', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 78)', 'o server. 
La funzione di upgrade può essere anche attivata dal PC, inviando un apposito comando alla scheda di controllo 
che a sua volta provvederà ad inoltrarlo alla scheda manipolo 
Modulo4 – Gestione barra LED – 
Nel caso in cui il sensore di Hall comunichi al processore che il motore è in rotazione, viene attivata la barra LED 
composta da 8 LED disposti su due file; tale barra ha lo scopo di segnalare costantemente, tramite i valori rilevati 
su sensore di forza presente nel tappo del manipolo, il livello di pressione esercitata sul paziente in modalità 
percentuale (0-100%) 
Modulo4 – Diagnostica – 
Il processore invia alla CTR, ogni 150ms, lo stato dei sensori ed i valori diagnostici come: tensione di 
alimentazione, corrente assorbita, temperatura e umidità scheda, corr', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('dc2fa567-550b-455e-a9d6-99647c2ed0b7', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 79)', 'iagnostici come: tensione di 
alimentazione, corrente assorbita, temperatura e umidità scheda, corretto funzionamento del sensore di forza, 
corretto funzionamento barra LED, codice errore rilevato in seguito ad un eventuale riavvio per 
malfunzionamento.  
Modulo5 – Watchdog – 
E’ presente un watchdog integrato in grado di riavviare velocemente il processore in caso di eventuali 
malfunzionamenti; il watchdog entra in funzione, dopo 3 secondi, in caso di blocco del processore; nel caso in cui 
il watchdog di bordo dovesse fallire, dopo 60 secondi durante i quali nessun messaggio di “keep alive” viene 
inviato alla scheda CTR, quest’ultima provvederà ad eseguire un hard reset sconnettendo fisicamente 
l’alimentazione della scheda e ricollegandola 2 secondi dopo. 
Modulo5 – Modali', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('3782515a-447a-457b-b1bd-41c1cddd7360', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 80)', 'tendo fisicamente 
l’alimentazione della scheda e ricollegandola 2 secondi dopo. 
Modulo5 – Modalità TEST – 
Il FW manipolo prevede una modalità TEST: il sensore di forza ed i pulsanti vengono momentaneamente 
disattivati in modo da poterne simulare lo stato via firmware; in questa configurazione la scheda manipolo invia 
in maniera random lo stato dei pulsanti ed il valore (fittizio) del sensore di forza in modo da simulare un 
operatore che preme “a caso” i pulsanti del manipolo aumentando, diminuendo e cambiando direzione al 
motore per un tempo indefinito. Lo scopo è di verificare se, sotto stress e per un tempo sufficientemente lungo, 
possano comparire anomalie. 
 
 

--- Pagina 34 ---
Strumenti utilizzati per lo sviluppo del FW/SW e per la 
gestione della configurazion', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('31fcf4e7-7704-42c2-b47e-23919cb29b8c', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 81)', 'agina 34 ---
Strumenti utilizzati per lo sviluppo del FW/SW e per la 
gestione della configurazione 
 
La scheda viene fornita preconfigurata in quanto i parametri vengono impostati a livello di codice sorgente; 
tuttavia, tali parametri vengono personalizzati secondo le impostazioni memorizzate nel SW PC che ad ogni avvio 
deve quindi riconfigurarli. Onde evitare pericolosi malfunzionamenti dovuti ad errate parametrizzazioni da parte 
del SW PC, la scheda CTR accetta solo parametri “sicuri” ovvero in range di valori che non possano 
compromettere, in linea di massima, il corretto funzionamento del dispositivo. Ad ogni modo, in caso di errore di 
comunicazione, non essendo i parametri memorizzati permanentemente, verranno comunque ripristinati al 
primo riavvio della macchina.', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('6964636f-e476-4f2e-9a68-61280d81e3d2', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 82)', 'ri memorizzati permanentemente, verranno comunque ripristinati al 
primo riavvio della macchina. 
In ogni caso la scheda CTR, essendo dotata di protocollo MODBUS standard, può essere analizzata utilizzando un 
SW di analisi MODBUS in commercio, impostandovi i corretti indirizzamenti. 
Per lo sviluppo del FW sono stati utilizzati i seguenti tool: 
Linguaggio di programmazione: ANSI C 
CONFIGURAZIONE STM32F4: STM32 CUBE MX della St Microelectronics 
IDE1: IAR WORKBEACH per ARM 
IDE2: Visual Studio 
 
Modalità di test eseguiti 
 
Prima di essere collegate alla macchina le schede vengono verificate in produzione 
- Accensione e verifica stato led diagnostici 
- Collegamento MODBUS ed analisi dei valori diagnostici 
- Accoppiamento wireless tra scheda CTR e Manipolo e verifica fu', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('534c1273-5e04-47dc-971f-d27324b7626e', '8d3e0e8d-2bd1-44c4-a109-db956c30fccc', 'tec (parte 83)', 'ed analisi dei valori diagnostici 
- Accoppiamento wireless tra scheda CTR e Manipolo e verifica funzionale 
Successivamente all’assemblaggio della macchina completa, quest’ultima viene verificata utilizzandola 
manualmente e attivando la modalità TEST durante la quale, la scheda, simula in autonomia un funzionamento 
random del manipolo e quindi della macchina intera. Se dopo diverse ore di funzionamento in modalità TEST e 
dopo un tempo adeguatamente lungo di funzionamento tramite operatore non vengono rilevate anomalie, la 
macchina risulta aver superato il Quality test. 
Ad oggi, con oltre 400 macchine prodotte, non risultano segnalate anomalie ne di carattere firmware ne di 
carattere hardware. 
 
 
 
 

--- Pagina 35 ---
Indicazione dell’ultima versione rilasciata (con', '2026-06-23 09:18:48.874659+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('d08ed5e3-c33c-4541-9b7a-d07426b49ff2', '93b3819d-fbef-47ce-879c-17b6d256451e', 'problem solving (parte 1)', 'Problema Verifica Causa Soluzione Note 
Dal manipolo non è 
possibile invertire la 
rotazione del motore 
né variare la velocità 
L’antenna è montata 
correttamente; la 
scheda di controllo è 
attiva e funzionante; se 
stacco il manipolo e lo 
riattacco la scheda 
riparte  
Possibili cortocircuiti 
nella testa del 
manipolo 
Sostituire la testa del 
manipolo oppure la 
scheda tampone 
Meccanica 
Se stacco e riattacco il 
manipolo il problema 
sussiste 
Possibile blocco del 
modulo radio o 
malfunzionamento 
della scheda di 
controllo o errato 
accoppiamento 
Verificare che il cavo 
USB o il modulo ST-LINK 
siano collegati alla 
scheda 
Elettronica 
Provare a rieseguire 
l’accoppiamento radio 
Impostazioni 
Dal manipolo è 
possibile comandare il 
motore ma sullo 
schermo del PC non 
cambi', '2026-06-23 09:53:53.973768+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('c80b93e7-c4b7-4ecc-b189-02071c0c99d2', '93b3819d-fbef-47ce-879c-17b6d256451e', 'problem solving (parte 2)', 'io 
Impostazioni 
Dal manipolo è 
possibile comandare il 
motore ma sullo 
schermo del PC non 
cambia nulla 
Collegando un PC 
esterno al convertitore 
RS485 e utilizzando il 
SW di test modbus 
tutto funziona 
Porta COM impostata 
sul PC non corretta 
Impostare la porta COM 
corretta 
Impostazioni 
Porta USB non 
funzionante 
Cambiare porta USB 
oppure 
Impostazioni 
Problema software PC Verifica 
Software PC 
Collegando un PC 
esterno al convertitore 
RS485 e utilizzando il 
SW di test modbus non 
funziona 
Convertitore USB-
RS485 guasto; 
cablaggio non corretto 
Sostituire convertitore; 
verifica e ripristino 
cablaggio 
Elettronica, 
Cablaggio 
Collegando un PC 
esterno ad un NUOVO 
convertitore RS485 e 
utilizzando il SW di test 
modbus non funziona 
Possibile guasto 
scheda di contro', '2026-06-23 09:53:53.973768+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('b7e5ff0b-d8e4-45bc-bd61-91f10364a751', '93b3819d-fbef-47ce-879c-17b6d256451e', 'problem solving (parte 3)', 'ertitore RS485 e 
utilizzando il SW di test 
modbus non funziona 
Possibile guasto 
scheda di controllo 
Sostituire 
Elettronica, 
Cablaggio 
Il motore è attivo ed il 
manipolo funziona 
correttamente 
(risponde ai comandi) 
ma le barre LED del 
manipolo non si 
muovono 
Il manipolo legge gli 
RPM 
Possibile guasto al 
driver LED 
Sostituire scheda 
SENSOR 
Elettronica 
Sul manipolo RPM = 0 Problema con 
l’encoder del motore 
che non viene letto dal 
manipolo 
Verificare cablaggio 
encoder ed 
eventualmente 
sostituire motore 
Motore, 
Cablaggio 
Il motore è attivo ed il 
manipolo funziona 
correttamente 
(risponde ai comandi) 
ma le barre LED del 
manipolo sono sempre 
al massimo 
 
Sul manipolo RPM > 10 
sempre 
 
Il sensore di pressione 
potrebbe essere 
“inceppato” 
 
Sostituire la tes', '2026-06-23 09:53:53.973768+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge_chunks (id, document_id, title, content, created_at) VALUES ('fc7d2a0d-54b1-4c88-8fe7-30117ed46cec', '93b3819d-fbef-47ce-879c-17b6d256451e', 'problem solving (parte 4)', 'ipolo RPM > 10 
sempre 
 
Il sensore di pressione 
potrebbe essere 
“inceppato” 
 
Sostituire la testa del 
manipolo oppure la 
scheda tampone 
Meccanica 
     
 
  

 
 FLUSSO DI TEST 
AVVIO LA 
MACCHINA 
IL MANIPOLO 
RISPONDE AI 
COMANDI? 
IL PC 
VISUALIZZA I 
COMANDI DEL 
MANIPOLO? 
SI 
Possibile blocco 
modulo Radio o 
manipolo 
NO 
TUTO OK 
Problema di 
comunicazione con 
la scheda di 
controllo 
SI 
Con il SW di 
test 
FUNZIONA? 
VERIFICA SU PC 
NO 
Verifica scheda di 
controllo 
SI 
NO', '2026-06-23 09:53:53.973768+00') ON CONFLICT (id) DO NOTHING;
-- ==== ai_config ====
INSERT INTO ai_config (key, value) VALUES ('system_context', 'Macchine Endosphere per pressoterapia estetica. Modelli principali: Endosphere Body (trattamenti corpo, pressione max 120 bar), Endosphere Face (trattamenti viso, delicato). Componenti principali: motore brushless, pompa a pistone, sensori pressione/temperatura, display touch LVGL, microcontrollore ESP32-S3. Codici errore comuni: E01=pressione fuori range, E02=motore in stallo, E03=sovratemperatura, E04=sensore disconnesso. Reset di emergenza: tasto POWER 5 secondi.') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ai_config (key, value) VALUES ('cost_limit_usd', '10') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ai_config (key, value) VALUES ('system_contexts', '[{"id":"adnt5kmj","title":"Regola generale","content":"Fornisci assistenza sulle macchine endoshere della FenixGroup srl.La macchina è composta da una scheda elettronica, CTR, che comunica tramite modbus con un PC e tramite seriale RS485 con il manipolo evolution. Il PC contiene il software di gestione con Windows. La CTR riceve le impostazione sia dal PC che dalla scheda del manipolo per attivare, disattivare il motore, cambiarne la velocità e direzione. La scheda CTR pilota direttamente il motore"},{"id":"zqheklye","title":"Problema comunicazione","content":"Se tramite il touch screen del PC provo a modificare la velocità del motore, o attivare e disattivare il motore o a modificarne il senso di rotazione e questo non avviene, significa che c''è un problema di comunicazione fra il PC e la scheda CTR. In questo caso potrebbe essere guasto il transceiver RS485 del PC oppure quello della scheda CTR, oppure un problema del cablaggio. Se dal manipolo riesco a modificare le impostazioni del motore allora il problema è tra PC e scheda CTR ma la scheda CTR sta funzionando"},{"id":"zfwrh3zp","title":"Informazioni sistema","content":"Il sistema è composto da queste parti: PC con windows e software di controllo. Scheda di controllo a microcontrollore che chiameremo CTR. Scheda manipolo BODY a microcontrollore, con display utente e 5 pulsanti: 4 che servono per rotazione motore destro, rotazione sinistra, aumenta velocità, diminuisci velocità. Pulsante di start/PAUSa che serve per avviare o mettere in pausa il motore. La CTR comunica con il pc tramite protocollo modbus e con la scheda manipolo body tramite protocollo proprietario RS485. Esistono anche dei modelli che comunicano in wireless con protocollo ESP-NOW."},{"id":"1qrbxjfs","title":"Manipolo Sensor Evolution","content":"Il manipolo sensor evolution è composto da una scheda elettronica con microprocessore ESP32 dotato di display e che comunica con la scheda CTR tramite una RS485 dedicata. La scheda riceve lo stato del sistema periodicamente sulla seriale. Tenendo premuti i pulsanti destro e sinistro contemporaneamente per 10 secondi si accede al menu tecnico dove è possibile impostare la comunicazione (RS485 o Wireless), attivare la funzione di debug che permette di accedere al web server per la diagnostica, tarare il sensore di pressione. infatti il manipolo è dotato di un sensore di forza  resistenza, in grado di rilevare quanta pressione sto esercitando durante il trattamento. poi c''è un rullo con dei pallini in silicone che ruota grazie al motore e con il quale si esegue il massaggio. Se il sensore di pressione non è collegato per esempio perchè il coperchio superiore, nel quale è allogiato, e stato rimosso, oppure perchè non è stato inserito bene o perchè il sensore è guasto, la scheda rileva il problema e, sul display, al posto della pressione, riporta due punti esclamativi. se invece il valore di pressione è zero e la barra non si muove allora è probabile che il sensore debba essere tarato; in questo caso chiamare un tecnico. Se invece leggo sul display un valore di pressione ma non si muove la barra di pressione, allora probabilmente, una scarica elettrostatica ha mandato in tilt il controller della barra ed in questo caso è necessario riavviare la macchina, oppure scollegare e ricollegare il manipolo per riavviarlo: se questo problema si presenta spesso allora contattare il tecnico"},{"id":"mvmtxg16","title":"Problema Timer disallineato","content":"Se la macchina è un modello Evolution ed il timer del trattamento e disallineato rispetto allo stesso timer del PC, il problema è legato al fatto che il timer del PC gestisce diversamente i tempi (bug software conosciuto). Il timer che fa fede è sempre quello del manipolo. Il problema non esiste nella versione Essenza della macchina"},{"id":"gs51fepu","title":"Ore macchina o motore terminate","content":"Se il cliente chiama perché il motore non parte quando viene dato il comando, chiedere di verificare quante ore motore sono rimaste o se non è partito il blocco per termine utilizzo della macchina. Ogni motore ha una durata di utilizzo massima di 500 ore al termine delle quali il motore non puo essere avviato per questioni di sicurezza. Inoltre, alcune macchine, quasi tutte, hanno una scadenza di solito mensile al termine della quale deve essere rinnovata la licenza dopo che è stato eseguito il pagamento. Quindi chiedere al cliente di verificare se il pagamento della rata corrente della macchina è stato eseguito e, in caso negativo, eseguirlo e comunicarlo alla Fenix, In caso positivo aprire un ticket."},{"id":"z0d20eem","title":"Tipologie di macchine","content":"Abbiamo la sensor therapy che è un vecchio modello senza PC controllato da una scheda custom con microprocessore e sensore di pressione realizzato misurando la corrente assorbita dal motore. poi abbiamo la sensor evolution che è dotata di un PC con WINDOWS a bordo e puo utilizzare sia una termocamera per la verifica dei trattamenti che un modulo per l''elettrostimolazione chiamato EAMS controllato dal PC tramite modbus come la scheda di controllo CTR che controlla il motore. Poi abbiamo il modello ESSENZA, dotato di un PC con windows a bordo; in questo modello il manipolo ha un display grafico a colori mentre nella versione Evolution il display è monocromatico e piu piccolo. Sia Evolution che Essenza sono dotati di u sensore di forza posto nel tappo del manipolo e collegato alla scheda di controllo del manipolo tramite dei contatti elettrici a molla. Puo accadere che i contatti si usurano e questo causerebbe un mancato collegamento del sensore di forza/pressione con visualizzazione del doppio punto esclamativo al posto del valore di pressione. Sia il modello ESSENZA che EVOLUTION sono in grado di leggere la velocità di rotazione del motore espressa in RPM. Se la velocità non viene letta allora è possibile che ci sia un guasto all''encoder del motore o al cavo di collegamento. In questo caso il manipolo deve essere inviato in assistenza per cui è necessario aprire un ticket"}]') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ai_config (key, value) VALUES ('behavior_rules', '[{"id":"923f87df-dc55-41e3-87ab-1ef48750839d","category":"stile","text":"Professionale ma informale e sempre gentile. L''assistente è una ragazza di 25 anni e si chiama Giulia"},{"id":"6d61e203-b881-4ca6-ad9b-a15ea556418b","category":"fare","text":"Nel caso non riesco a risolvere il problema passa la chiamata al tecnico di turno"},{"id":"1a12e15d-4d20-41b0-ba6d-2ef4811d5ea2","category":"limiti","text":"Non sono permessi insulti, minacce, razzismo. Nel caso chiudere il collegamento e segnalare"},{"id":"59f253c8-2c1b-46a4-bea8-11d65afa4a47","category":"evitare","text":"Non permettere al cliente di smontare la macchina che puo'' essere manomessa solo da un tecnico Fenix specializzato.Al massimo il cliente puo verificare se il manipolo è connesso correttamente, e se il cavo di alimentazione alla rete 220V è collegato e se ''interruttore è su ON"}]') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
