# Test Scenarios per aggiornamento pagina convocazione (Process Update)

## URL dell'applicazione

/admin/participatory_processes/<process-slug>/edit

## Informazioni sulla convocation page

- La **convocation page** è un **Component** di tipo **Page** associato a un processo partecipativo.
- Ogni processo può avere una convocation page, che rappresenta una sezione modificabile dove vengono riportati esiti, decisioni e prossimi passi del processo (Presente una text area).
- I test presuppongono che la convocation page sia già creata come componente del processo, ma includono un setup iniziale che garantisce la presenza di una convocation page vuota prima di ogni scenario di test.

## Setup iniziale

- Creare un processo partecipativo pubblicato (se non esiste).
- Creare e associare una **convocation page** (Component di tipo Page) vuota al processo selezionato (Utilizza pagina NewPageComponentPage per questo setup).

## Scenari di test

### Scenario principale - Aggiornamento convocation page con successo

Il City Administrator naviga nella sezione "Processes", seleziona un processo, accede alla convocation page (componente Page), aggiorna il form aggiungendo esito, decisioni e prossimi passi, salva e riceve conferma dell’avvenuto aggiornamento.

### Scenario alternativo - Cancellazione aggiornamento

Il City Administrator inizia a modificare il form della convocation page, poi decide di annullare l’operazione. Il sistema mostra un prompt di conferma; confermando, le modifiche vengono scartate e si torna allo stato precedente.

### Scenario alternativo - Validazione campi con errore

Il City Administrator aggiorna il form della convocation page ma lascia campi obbligatori vuoti o li compila in modo errato. Al salvataggio, il sistema evidenzia i campi non validi e mostra messaggi di errore; l’utente corregge e può ritentare il salvataggio con successo.

### Scenario alternativo - Errore di salvataggio

Durante il salvataggio delle modifiche alla convocation page, il sistema incontra un errore e mostra un messaggio di errore. L’utente può scegliere se ritentare il salvataggio o abbandonare. L’errore viene loggato dal sistema.

## Credenziali di test

- **Email**: <admin@admin.com>
- **Password**: decidim123456789

## Prerequisiti per tutti i test

- Il City Administrator deve avere un account attivo sulla piattaforma
- Il City Administrator deve essere autenticato (login) prima dell’avvio dei test
- Esiste almeno un processo partecipativo pubblicato con componente convocation page vuota

## Note aggiuntive

- I test vanno fatti nella pagina ManagePageComponentPage.ts
- Tutti i test richiedono autenticazione (usa admin-state.json)
- Tutte le azioni vanno effettuate solo su processi su cui l’admin ha i permessi di modifica (altrimenti non compare tasto modifica)
- Validare messaggi di conferma, errore, prompt di cancellazione e la corretta evidenziazione dei campi non validi
- Assicurarsi che le modifiche vengano effettivamente salvate e siano visibili anche dopo refresh o nuovo login
