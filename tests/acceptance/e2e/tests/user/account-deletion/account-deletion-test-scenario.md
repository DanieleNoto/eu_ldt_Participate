# Test Scenarios per Account Deletion Feature

## POM da utilizzare

Partenza daHomePage come utente normale loggato

## Scenari di test

### Scenario principale - Eliminazione account con successo

L'utente cittadino naviga nelle impostazioni dell'account, seleziona l'opzione di eliminazione account, rivede le informazioni sui rischi, conferma la richiesta e riceve conferma dell'avvio del processo di eliminazione dati

### Scenario alternativo - Cancellazione richiesta eliminazione

L'utente cittadino inizia il processo di eliminazione account ma decide di non procedere e clicca il pulsante "Cancel", tornando alle impostazioni dell'account senza modifiche

### Scenario alternativo - Timeout della sessione durante eliminazione

L'utente cittadino inizia il processo di eliminazione account ma impiega troppo tempo, la sessione scade per motivi di sicurezza e viene reindirizzato alla pagina di login con messaggio di timeout

### Scenario alternativo - Errore durante la sottomissione

L'utente cittadino completa il processo di eliminazione account ma il sistema incontra un errore durante la registrazione della richiesta, visualizza un messaggio di errore e permette di ritentare

## Credenziali di test

- **Email**: <user@user.com>
- **Password**: decidim123456789

## Prerequisiti per tutti i test

- L'utente deve avere un account attivo sulla piattaforma
- L'utente deve essere autenticato (logged in) prima di iniziare i test

## Note aggiuntive

- Tutti i test richiedono autenticazione preventiva
- I test devono verificare che le contribuzioni dell'utente rimangano visibili ma senza informazioni di authorship dopo l'eliminazione
- I test devono validare i messaggi di conferma e di errore appropriati
- È necessario testare la gestione della sessione e i timeout di sicurezza
