// Strisce editoriali "Sereno mediterraneo": per ogni pagina una foto tematica
// + una breve etichetta serif e una descrizione localizzata.
// Lingue: it, en, es, fr, de, pt. Fallback sull'italiano se la chiave/lang manca.

const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt'];

const EDITORIAL = {
  home: {
    theme: 'serena',
    it: { label: "Il tuo spazio sereno", desc: "IBD Care ti accompagna ogni giorno con strumenti calmi per ascoltare il tuo corpo: diario dei sintomi, alimentazione, terapie ed esami, raccolti in un posto privato e ordinato." },
    en: { label: "Your calm space", desc: "IBD Care walks with you every day with gentle tools to listen to your body: symptom diary, food, therapies and exams, gathered in one private, orderly place." },
    es: { label: "Tu espacio sereno", desc: "IBD Care te acompaña cada día con herramientas tranquilas para escuchar a tu cuerpo: diario de síntomas, alimentación, terapias y exámenes, en un lugar privado y ordenado." },
    fr: { label: "Votre espace apaisé", desc: "IBD Care vous accompagne chaque jour avec des outils doux pour écouter votre corps : journal des symptômes, alimentation, thérapies et examens, réunis en un lieu privé et ordonné." },
    de: { label: "Dein ruhiger Ort", desc: "IBD Care begleitet dich täglich mit sanften Werkzeugen, um deinen Körper zu verstehen: Symptomtagebuch, Ernährung, Therapien und Befunde an einem privaten, ordentlichen Ort." },
    pt: { label: "Seu espaço sereno", desc: "IBD Care acompaña você todos os dias com ferramentas calmas para ouvir seu corpo: diário de sintomas, alimentação, terapias e exames, em um lugar privado e organizado." },
  },
  symptoms: {
    theme: 'sintomi',
    it: { label: "Ascolta il tuo corpo", desc: "Registrare dolore, stanchezza, scariche e consistenza ti aiuta a riconoscere i pattern e a raccontare la tua storia al medico con parole chiare." },
    en: { label: "Listen to your body", desc: "Logging pain, fatigue, bowel movements and consistency helps you spot patterns and tell your story to the doctor in clear words." },
    es: { label: "Escucha tu cuerpo", desc: "Registrar dolor, cansancio, deposiciones y consistencia te ayuda a identificar pautas y contarle tu historia al médico con palabras claras." },
    fr: { label: "Écoutez votre corps", desc: "Noter douleur, fatigue, selles et consistance vous aide à repérer des schémas et à raconter votre histoire au médecin avec des mots clairs." },
    de: { label: "Höre auf deinen Körper", desc: "Schmerzen, Erschöpfung, Stuhlgang und Konsistenz zu notieren, hilft dir, Muster zu erkennen und deine Ärztin klar zu informieren." },
    pt: { label: "Ouça seu corpo", desc: "Anotar dor, cansaço, evacuações e consistência ajuda a identificar padrões e contar sua história ao médico com clareza." },
  },
  food: {
    theme: 'alimentazione',
    it: { label: "Mangia con consapevolezza", desc: "Annotare i pasti e le reazioni ti rivela quali cibi ti fanno stare bene e quali, nel tempo, possono invece scatenare fastidi." },
    en: { label: "Eat with awareness", desc: "Noting meals and reactions reveals which foods keep you well and which may, over time, trigger discomfort." },
    es: { label: "Come con consciencia", desc: "Anotar comidas y reacciones revela qué alimentos te sientan bien y cuáles pueden desencadenar molestias con el tiempo." },
    fr: { label: "Manger en conscience", desc: "Noter repas et réactions révèle quels aliments vous conviennent et lesquels peuvent, à la longue, déclencher des gênes." },
    de: { label: "Bewusst essen", desc: "Mahlzeiten und Reaktionen festzuhalten zeigt, welche Speisen dir gut tun und welche mit der Zeit Beschwerden auslösen können." },
    pt: { label: "Coma com consciência", desc: "Anotar refeições e reações revela quais alimentos fazem bem e quais podem, com o tempo, causar desconfortos." },
  },
  meds: {
    theme: 'terapie',
    it: { label: "Le tue terapie, con calma", desc: "Tieni a portata di mano orari, dosaggi e tipo di assunzione: una routine serena rende più semplice seguire la cura ogni giorno." },
    en: { label: "Your therapies, calmly", desc: "Keep times, dosages and type of intake close at hand: a calm routine makes following your treatment easier each day." },
    es: { label: "Tus terapias, con calma", desc: "Ten a mano horarios, dosis y tipo de toma: una rutina serena facilita seguir el tratamiento cada día." },
    fr: { label: "Vos thérapies, sereinement", desc: "Gardez à portée de main horaires, dosages et type de prise : une routine apaisée rend le traitement plus simple au quotidien." },
    de: { label: "Deine Therapien, ruhig", desc: "Behalte Zeiten, Dosierungen und Art der Einnahme griffbereit: eine ruhige Routine macht die tägliche Behandlung einfacher." },
    pt: { label: "Suas terapias, com calma", desc: "Tenha à mão horários, doses e tipo de toma: uma rotina serena facilita o tratamento dia após dia." },
  },
  records: {
    theme: 'esami',
    it: { label: "La tua storia clinica", desc: "Archivia referti, analisi e controlli in un posto solo: ritrovi subito date, esiti e prossimi appuntamenti quando servono." },
    en: { label: "Your clinical story", desc: "Archive reports, tests and check-ups in one place: dates, results and next appointments are there when you need them." },
    es: { label: "Tu historia clínica", desc: "Archiva informes, análisis y controles en un solo lugar: fechas, resultados y próximas citas al alcance cuando hace falta." },
    fr: { label: "Votre histoire clinique", desc: "Archivez comptes rendus, analyses et contrôles au même endroit : dates, résultats et prochains rendez-vous à portée de main." },
    de: { label: "Deine Krankengeschichte", desc: "Archiviere Befunde, Analysen und Kontrolltermine an einem Ort: Daten, Ergebnisse und nächste Termine sind schnell griffbereit." },
    pt: { label: "Sua história clínica", desc: "Arquive laudos, exames e consultas num só lugar: datas, resultados e próximos compromissos à mão quando precisar." },
  },
  esami: {
    theme: 'esami',
    it: { label: "Esami sotto controllo", desc: "Scannerizza esami del sangue, calprotectina e imaging: l'AI estrae i valori e tu li confronti nel tempo con un PDF pronto per la visita." },
    en: { label: "Exams under control", desc: "Scan blood tests, calprotectin and imaging: AI extracts the values and you compare them over time with a visit-ready PDF." },
    es: { label: "Exámenes bajo control", desc: "Escanea análisis de sangre, calprotectina e imagen: la IA extrae los valores y tú los comparas en el tiempo con un PDF listo para la visita." },
    fr: { label: "Examens maîtrisés", desc: "Scannez prises de sang, calprotectine et imagerie : l'IA extrait les valeurs et vous les comparez dans le temps via un PDF prêt pour la consultation." },
    de: { label: "Befunde im Blick", desc: "Scanne Blutwerte, Calprotectin und Bildgebung: die KI zieht die Werte, du vergleichst sie über die Zeit mit einer PDF für den Termin." },
    pt: { label: "Exames sob controle", desc: "Escanee exames de sangue, calprotectina e imagem: a IA extrai os valores e você compara ao tempo com um PDF pronto para a consulta." },
  },
  trends: {
    theme: 'sintomi',
    it: { label: "Leggi i tuoi trend", desc: "I grafici uniscono sintomi e pasti: vedrai emergere collegamenti tra ciò che mangi e come ti senti nelle settimane." },
    en: { label: "Read your trends", desc: "Charts join symptoms and meals: connections between what you eat and how you feel emerge over the weeks." },
    es: { label: "Lee tus tendencias", desc: "Los gráficos unen síntomas y comidas: aparecen conexiones entre lo que comes y cómo te sientes a lo largo de las semanas." },
    fr: { label: "Lisez vos tendances", desc: "Les graphiques relient symptômes et repas : des liens entre ce que vous mangez et comment vous vous sentez émergent sur les semaines." },
    de: { label: "Lies deine Trends", desc: "Diagramme verbinden Symptome und Mahlzeiten: Zusammenhänge zwischen Essen und Befinden zeigen sich über die Wochen." },
    pt: { label: "Leia suas tendências", desc: "Gráficos unem sintomas e refeições: surgem conexões entre o que você come e como se sente ao longo das semanas." },
  },
  symptomcharts: {
    theme: 'sintomi',
    it: { label: "Grafici dedicati", desc: "Visualizza nel dettaglio dolore, stanchezza e scariche giorno per giorno per riconoscere i tuoi cambiamenti improvvisi." },
    en: { label: "Dedicated charts", desc: "See pain, fatigue and bowel movements day by day in detail to spot your sudden changes." },
    es: { label: "Gráficos dedicados", desc: "Visualiza dolor, cansancio y deposiciones día a día para identificar tus cambios súbitos." },
    fr: { label: "Graphiques dédiés", desc: "Visualisez douleur, fatigue et selles jour après jour pour repérer vos changements soudains." },
    de: { label: "Eigene Diagramme", desc: "Sieh Schmerzen, Erschöpfung und Stuhlgang tagtäglich im Detail, um plötzliche Veränderungen zu erkennen." },
    pt: { label: "Gráficos dedicados", desc: "Veja dor, cansaço e evacuações dia a dia em detalhe para perceber suas mudanças súbitas." },
  },
  assistant: {
    theme: 'serena',
    it: { label: "Parla con l'assistente", desc: "Una voce amica per domande su IBD, alimentazione e segnali d'allarme: risposte chiare, senza sostituire il tuo medico." },
    en: { label: "Talk to the assistant", desc: "A friendly voice for questions on IBD, food and alarm signs: clear answers, never replacing your doctor." },
    es: { label: "Habla con el asistente", desc: "Una voz amiga para preguntas sobre EII, alimentación y señales de alarma: respuestas claras, sin sustituir a tu médico." },
    fr: { label: "Parlez à l'assistant", desc: "Une voix amie pour vos questions sur les MICI, l'alimentation et les signaux d'alerte : des réponses claires, sans remplacer votre médecin." },
    de: { label: "Sprich mit dem Assistenten", desc: "Eine freundliche Stimme für Fragen zu IBD, Ernährung und Warnsignalen: klare Antworten, ohne deine Ärztin zu ersetzen." },
    pt: { label: "Fale com o assistente", desc: "Uma voz amiga para perguntas sobre DII, alimentação e sinais de alerta: respostas claras, sem substituir seu médico." },
  },
  community: {
    theme: 'community',
    it: { label: "Non sei solo", desc: "Una board serena dove confrontarti con chi vive la tua stessa strada: consigli, emozioni e piccole vittorie, insieme." },
    en: { label: "You are not alone", desc: "A calm board where you can share with those on the same road: tips, emotions and small wins, together." },
    es: { label: "No estás solo", desc: "Un foro sereno donde compararte con quien vive tu mismo camino: consejos, emociones y pequeñas victorias, juntos." },
    fr: { label: "Vous n'êtes pas seul", desc: "Un espace calme pour échanger avec ceux qui vivent la même route : conseils, émotions et petites victoires, ensemble." },
    de: { label: "Du bist nicht allein", desc: "Ein ruhiges Board zum Austausch mit anderen auf demselben Weg: Tipps, Emotionen und kleine Erfolge, gemeinsam." },
    pt: { label: "Você não está sozinho", desc: "Um quadro sereno para compartilhar com quem vive a mesma jornada: conselhos, emoções e pequenas vitórias, juntos." },
  },
  summary: {
    theme: 'serena',
    it: { label: "Il riepilogo per il medico", desc: "Scegli il periodo e le voci, aggiungi una nota e scarica un PDF chiaro per la prossima visita: parli meglio, in meno tempo." },
    en: { label: "The summary for your doctor", desc: "Pick the period and entries, add a note and download a clear PDF for the next visit: better talk, less time." },
    es: { label: "El resumen para el médico", desc: "Elige el periodo y las entradas, añade una nota y descarga un PDF claro para la próxima visita: hablas mejor, en menos tiempo." },
    fr: { label: "Le résumé pour le médecin", desc: "Choisissez la période et les rubriques, ajoutez une note et téléchargez un PDF clair pour la prochaine visite : mieux parler, en moins de temps." },
    de: { label: "Die Zusammenfassung für die Ärztin", desc: "Wähle Zeitraum und Einträge, füge eine Notiz hinzu und lade ein klares PDF für den nächsten Termin: besser reden, in weniger Zeit." },
    pt: { label: "O resumo para o médico", desc: "Escolha o período e os itens, adicione uma nota e baixe um PDF claro para a próxima consulta: conversa melhor, em menos tempo." },
  },
  map: {
    theme: 'mappa',
    it: { label: "Servizi a portata", desc: "Trova centri IBD, farmacie, bagni e pronto soccorso più vicini: sai subito dove andare quando serve, anche fuori casa." },
    en: { label: "Services at hand", desc: "Find nearby IBD centres, pharmacies, toilets and emergency rooms: know where to go when needed, even away from home." },
    es: { label: "Servicios a mano", desc: "Encuentra centros de EII, farmacias, baños y urgencias cercanos: sabes a dónde ir cuando hace falta, incluso fuera de casa." },
    fr: { label: "Services à portée", desc: "Trouvez centres MICI, pharmacies, toilettes et urgences proches : vous savez où aller en cas de besoin, même loin de chez vous." },
    de: { label: "Dienste in der Nähe", desc: "Finde nahe IBD-Zentren, Apotheken, Toiletten und Notaufnahmen: du weißt sofort, wohin, auch unterwegs." },
    pt: { label: "Serviços à mão", desc: "Encontre centros de DII, farmácias, banheiros e emergência por perto: saiba aonde ir quando precisar, até fora de casa." },
  },
  abbonamento: {
    theme: 'serena',
    it: { label: "Tanti strumenti, un solo abbonamento", desc: "Sblocca diario illimitato, assistente AI, riepiloghi PDF, scanner esami e board community: 14 giorni gratuiti, disdici quando vuoi." },
    en: { label: "Many tools, one subscription", desc: "Unlock unlimited diary, AI assistant, PDF summaries, exam scanner and community board: 14 days free, cancel anytime." },
    es: { label: "Muchas herramientas, una suscripción", desc: "Desbloquea diario ilimitado, asistente IA, resúmenes PDF, escáner de exámenes y foro comunitario: 14 días gratis, cancela cuando quieras." },
    fr: { label: "De nombreux outils, un abonnement", desc: "Débloquez journal illimité, assistant IA, résumés PDF, scanner d'examens et communauté : 14 jours gratuits, annulez à tout moment." },
    de: { label: "Viele Werkzeuge, ein Abo", desc: "Freischalten: unlimitiertes Tagebuch, KI-Assistent, PDF-Zusammenfassungen, Befund-Scanner und Community: 14 Tage gratis, jederzeit kündbar." },
    pt: { label: "Muitas ferramentas, uma assinatura", desc: "Desbloqueie diário ilimitado, assistente IA, resumos PDF, scanner de exames e comunidade: 14 dias grátis, cancele quando quiser." },
  },
  about: {
    theme: 'serena',
    it: { label: "Conosci IBD Care", desc: "Nato per chi convive con la malattia infiammatoria intestinale, l'app unisce discrezione, calma e strumenti utili attorno alla tua quotidianità." },
    en: { label: "Meet IBD Care", desc: "Built for those living with inflammatory bowel disease, the app joins discretion, calm and useful tools around your daily life." },
    es: { label: "Conoce IBD Care", desc: "Creada para quien convive con la enfermedad inflamatoria intestinal, la app une discreción, calma y herramientas útiles en tu día a día." },
    fr: { label: "Découvrez IBD Care", desc: "Conçue pour qui vit avec une MICI, l'app réunit discrétion, calme et outils utiles autour de votre quotidien." },
    de: { label: "Lerne IBD Care kennen", desc: "Für Menschen mit chronisch-entzündlichen Darmerkrankungen: die App verbindet Diskretion, Ruhe und nützliche Werkzeuge im Alltag." },
    pt: { label: "Conheça o IBD Care", desc: "Feito para quem convive com a doença inflamatória intestinal, o app une discrição, calma e ferramentas úteis no seu dia a dia." },
  },
  contact: {
    theme: 'serena',
    it: { label: "Scrivici", desc: "Domande, dubbi o richieste di supporto: ti rispondiamo con cura, perché la tua voce sia ascoltata." },
    en: { label: "Write to us", desc: "Questions, doubts or support requests: we reply with care, so your voice is heard." },
    es: { label: "Escríbenos", desc: "Preguntas, dudas o peticiones de soporte: respondemos con cuidado, para que tu voz sea escuchada." },
    fr: { label: "Écrivez-nous", desc: "Questions, doutes ou demandes d'assistance : nous répondons avec soin, pour que votre voix soit entendue." },
    de: { label: "Schreib uns", desc: "Fragen, Unsicherheiten oder Supportwünsche: wir antworten sorgfältig, damit deine Stimme gehört wird." },
    pt: { label: "Escreva para nós", desc: "Dúvidas, perguntas ou suporte: respondemos com cuidado, para que sua voz seja ouvida." },
  },
  article: {
    theme: 'serena',
    it: { label: "Notizie IBD", desc: "Aggiornamenti affidabili e curati sulla malattia infiammatoria intestinale, tradotti per te, da leggere con calma." },
    en: { label: "IBD news", desc: "Reliable, curated updates on inflammatory bowel disease, translated for you, to read at your own pace." },
    es: { label: "Noticias EII", desc: "Actualizaciones fiables y cuidadas sobre la enfermedad inflamatoria intestinal, traducidas para ti, para leer con calma." },
    fr: { label: "Actus MICI", desc: "Des actualités fiables et sélectionnées sur les MICI, traduites pour vous, à lire tranquillement." },
    de: { label: "IBD-News", desc: "Zuverlässige, kuratierte Updates zu chronisch-entzündlichen Darmerkrankungen, für dich übersetzt, in Ruhe lesen." },
    pt: { label: "Notícias DII", desc: "Atualizações confiáveis e selecionadas sobre a doença inflamatória intestinal, traduzidas para você, para ler com calma." },
  },
};

const SUPPORTED = new Set(LANGS);

// Ritorna { theme, label, desc } per la pagina richiesta, fallback sull'italiano.
export function getEditorial(lang, pageKey) {
  const entry = EDITORIAL[pageKey] || EDITORIAL.home;
  const l = SUPPORTED.has(lang) ? lang : 'it';
  const text = entry[l] || entry.it;
  return { theme: entry.theme, label: text.label, desc: text.desc };
}