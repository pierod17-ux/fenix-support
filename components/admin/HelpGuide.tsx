'use client'

import { useState } from 'react'

type Section = {
  id: string
  icon: string
  title: string
  summary: string
  body: { h?: string; p?: string; steps?: string[] }[]
}

const SECTIONS: Section[] = [
  {
    id: 'intro',
    icon: '🌐',
    title: 'Come funziona il portale',
    summary: 'Il percorso completo, dal cliente al tecnico',
    body: [
      { p: 'Fenix Support è il portale di assistenza tecnica per le macchine Endosphere (Evolution, Essenza, Sensor Smart, Sensor Therapy). Un\'assistente AI di nome Aura risponde ai clienti, e quando non basta passa la richiesta a un tecnico umano.' },
      { h: 'Il flusso in breve', steps: [
        'Il cliente apre la chat, compila un breve form (nome, centro, macchina) e descrive il problema.',
        'Aura (l\'AI) fa una diagnosi guidata, usando la Knowledge Base e le regole che imposti tu.',
        'Se il problema si risolve, finisce lì: la chat resta salvata in Conversazioni.',
        'Se non si risolve, Aura fa un\'escalation: crea un ticket e avvisa i tecnici reperibili.',
        'Un tecnico apre una chat diretta col cliente e gestisce il caso fino alla risoluzione.',
      ] },
    ],
  },
  {
    id: 'ticket',
    icon: '🎫',
    title: 'Ticket',
    summary: 'Le richieste passate a un tecnico',
    body: [
      { p: 'Nella sezione Ticket trovi solo le conversazioni andate in escalation, cioè quelle che sono diventate richieste vere per un tecnico.' },
      { h: 'Cosa puoi fare', steps: [
        '“Ticket aperti”: la scheda sempre in vista con i casi ancora da gestire.',
        '“Tutti i ticket”: scheda che si espande/chiude e include anche risolti e chiusi.',
        'Cerca un ticket per cliente, centro, macchina, oggetto o categoria.',
        'Seleziona uno o più ticket con le caselle e usa “Elimina selezionati”, oppure la × per eliminarne uno.',
        'Clicca un ticket per vedere il dettaglio: dati cliente, riepilogo AI, categoria e l\'intera conversazione.',
      ] },
    ],
  },
  {
    id: 'conversazioni',
    icon: '💬',
    title: 'Conversazioni',
    summary: 'Tutte le chat, anche quelle non escalate',
    body: [
      { p: 'Qui trovi la memoria di ogni chat con Aura, comprese quelle risolte senza bisogno di un tecnico. Un badge distingue le semplici “Chat” dai “Ticket”.' },
      { h: 'Cosa puoi fare', steps: [
        'Cercare una conversazione per cliente, centro, macchina o oggetto.',
        'Selezionarne una o più ed eliminarle (la cancellazione rimuove anche i messaggi collegati).',
        'Aprirne una per leggere l\'intero scambio tra cliente, AI e tecnico.',
      ] },
      { p: 'Nota: le risposte dell\'AI e del tecnico vengono registrate nelle conversazioni recenti. Le chat molto vecchie potrebbero mostrare solo i messaggi del cliente.' },
    ],
  },
  {
    id: 'knowledge',
    icon: '📚',
    title: 'Knowledge Base',
    summary: 'I documenti che rendono l\'AI competente',
    body: [
      { p: 'La Knowledge Base è il sapere tecnico a cui Aura attinge per rispondere: manuali, procedure, codici di errore. Più è ricca e aggiornata, più le risposte sono precise.' },
      { h: 'Cosa puoi fare', steps: [
        'Caricare documenti (es. PDF): vengono indicizzati e usati automaticamente dall\'AI.',
        'Trasformare i ticket risolti in nuova conoscenza, così l\'AI impara dai casi reali.',
        'Rimuovere documenti non più validi.',
      ] },
    ],
  },
  {
    id: 'training',
    icon: '🧠',
    title: 'Training AI',
    summary: 'Personalità, regole e costi di Aura',
    body: [
      { h: 'Cosa puoi configurare', steps: [
        'Contesti: informazioni di base sulle macchine e sull\'azienda che l\'AI deve sempre conoscere.',
        'Regole di comportamento: cosa fare sempre, cosa evitare, limiti e stile delle risposte.',
        'Limite di costo mensile: un tetto di spesa per l\'uso dell\'AI, con monitoraggio.',
      ] },
      { p: 'Le modifiche qui cambiano il modo in cui Aura parla e decide quando coinvolgere un tecnico.' },
    ],
  },
  {
    id: 'reperibilita',
    icon: '🗓️',
    title: 'Reperibilità',
    summary: 'Tecnici e turni settimanali',
    body: [
      { h: 'Tecnici', steps: [
        'Aggiungi un tecnico: riceve un\'email di invito per attivare l\'account.',
        'Modifica i dati, reimposta la password, disabilita o elimina un tecnico.',
        'Il pallino verde indica chi è collegato in questo momento.',
      ] },
      { h: 'Turni', steps: [
        'Per ogni giorno puoi creare turni con orario di inizio e fine.',
        'Un turno può includere più tecnici contemporaneamente: selezionali tutti prima di salvare.',
        'Quando scatta un\'escalation, vengono avvisati tutti i tecnici di turno in quel momento.',
      ] },
    ],
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'Analytics',
    summary: 'L\'andamento dell\'assistenza',
    body: [
      { p: 'Una panoramica degli ultimi 30 giorni: numero di ticket, tasso di risoluzione, quanti casi risolve l\'AI da sola e quanti finiscono in escalation.' },
      { h: 'Cosa trovi', steps: [
        'Distribuzione per priorità e per modello di macchina.',
        'Scheda “Per categoria problema”: i ticket suddivisi per tipologia, assegnata automaticamente dall\'AI.',
        'Costi AI del mese rispetto al limite impostato.',
      ] },
    ],
  },
  {
    id: 'categorie',
    icon: '🏷️',
    title: 'Le categorie dei problemi',
    summary: 'Come l\'AI classifica i ticket',
    body: [
      { p: 'Quando crea un ticket, Aura assegna automaticamente una tipologia. Servono a capire a colpo d\'occhio la natura del guasto e a leggere le statistiche.' },
      { h: 'Le 5 categorie', steps: [
        'Hardware: malfunzionamento delle schede elettroniche (escluso il PC).',
        'PC: problema del computer a bordo della macchina.',
        'Software: problema del sistema operativo o del software del PC.',
        'Firmware: malfunzionamento del firmware delle schede elettroniche.',
        'Meccanica: rotture o problemi meccanici (contenitore, parti meccaniche, ecc.).',
      ] },
    ],
  },
]

export default function HelpGuide() {
  const [open, setOpen] = useState<string | null>('intro')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {SECTIONS.map(s => {
        const isOpen = open === s.id
        return (
          <div key={s.id} style={{
            background: 'var(--surface)', borderRadius: 16, boxShadow: 'var(--shadow-md)', overflow: 'hidden',
          }}>
            <button onClick={() => setOpen(isOpen ? null : s.id)} style={{
              width: '100%', padding: '16px 18px', border: 'none', cursor: 'pointer', background: 'transparent',
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{s.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {s.title}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {s.summary}
                </span>
              </span>
              <span style={{
                flexShrink: 0, color: 'var(--text-tertiary)', fontSize: 13,
                transition: 'transform 0.18s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}>▶</span>
            </button>

            {isOpen && (
              <div style={{ padding: '0 18px 18px 52px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {s.body.map((block, i) => (
                  <div key={i}>
                    {block.h && (
                      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                        {block.h}
                      </p>
                    )}
                    {block.p && (
                      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
                        {block.p}
                      </p>
                    )}
                    {block.steps && (
                      <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {block.steps.map((step, j) => (
                          <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{
                              flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                              background: 'var(--accent-light)', color: 'var(--accent)',
                              fontSize: 11, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                            }}>{j + 1}</span>
                            <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
