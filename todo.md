# ToDo

1. in electron quando cambio pagina se premo alt + freccia sx, non torna indietro
2. si può in qualche modo mostrare la barra degli strumenti? non farlo, solo info
3. l'app mi sembra lenta in caricamento. migliora con la build?
4. spiegami e motiva tutte le dipendenze del progetto

aggiungi una toolbar in alto in position fixed, centrata con queste icone:
- back e next che triggerano la navigazione di electron
- home che riporta alla home page
- search che triggera focus sul search
- settings che non fa nulla per ora
toolbar minimale: niente background. icone fontawesome senza background o bordi. 

# in corso
- titolo, icona
- aggiungi un api che permetta di modificare la configurazione. si devono poter fare le CRUD dei comandi disponibili e l'upload dei file immagine
- commands in basso a destra

## impostazioni (icona cog)
deve portare una pagina dove si possono cambiare:
- per ogni comando app presente in api: la visibilità in home, il nome, l'immagine e il comando
- per ogni comando app un ulteriore proprietà da aggiungere che dice se "fai focus automaticamente dopo avvio comando". booleano con default a true. (sarà false solo su shutdown, sleep e hibernate). ovviamente bisogna ternene conto quando si clicca su esegui. questo richiederà una web api per gestire i dati di configurazione. salviamo tutto direttamente in un json, niente db.
- il flag viene chiesto per lanciare alcuni comandi che avranno un flag apposito. 
- se di default avere il tema "dark" che sostituisce il gradiente con un background nero
- se attivare il "Randomize Tile Position" che nella descrizione spiega che serve a evitare OLED Burn-in
- se avere il refresh automatico ogni 5s sarà sotto un booleano flaggato qui, di default false. inoltre bisogna poter scegliere il tempo, di default 5*60s
- start /MAX globale e per app
- dark mode (bg scuro, ui chiara)
- bg con URL o gradienti

## mi restano da gestire poi manualmente:
- come rilevare cambio app quando browser non in focus
- fare il randomize 

## altre funzionalità:
- wrapper electron
- auto update (anche solo git trigger)
- disattiva polling se la finestra non ha il focus e dopo 5 minuti che non vengono premuti tasti o mosso il mouse
- gestione di un secret in qualche modo (general e/o per command) + rate limiting su login (non su comandi)
- test: app normale / UWP / bash / bash.pause / singleton / steam che spawna figli
- dobbiamo dare la possibilità di gestire argomenti con il command, li salviamo in una proprietà separata così da comporre poi noi la stringa completa
- verifichiamo path con spazi
- trovare il modo di dare un F11 dopo spotify e VLC
