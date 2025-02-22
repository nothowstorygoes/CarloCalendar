import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

const resources = {
  en: {
    translation: {
      "save": "Save",
      "labels": "Labels",
      "add_title": "Add title",
      "add_description": "Add Description",
      "create": "Create",
      "delete": "Delete",
      "manage_labels": "Manage Labels",
      "label_name": "Label name",
      "login_with_google": "Login with Google",
      "login_with_email": "Login with Email",
      "events_for": "Events for",
      "no_events_label": "There are no events for this label.",
      "no_events": "There are no upcoming events for today.",
      "today": "Today",
      "view_day": "View Day",
      "view_week": "View Week",
      "view_month": "View Month",
      "settings": "Settings",
      "chevron_left": "Previous",
      "chevron_right": "Next",
      "close": "Close",
      "edit": "Edit",
      "bookmark_border": "Bookmark Border",
      "access_time": "at",
      "event": "Event",
      "calendar": "Calendar",
      "day": "Day",
      "week": "Week",
      "month": "Month",  
      "label_manager": "Label Manager",
      "spinner": "Loading...",
      "add_code": "Add Code",
      "select_priority": "Select Priority",
      "workweek": "Work Week",
      "year": "Year",
      "loading_user_info": "Loading user info...",
      "Profile": "Profile",
      "Sign Out": "Sign Out",
    }
  },
  it: {
    translation: {
      "save": "Salva",
      "labels": "Categorie",
      "add_title": "Aggiungi titolo",
      "add_description": "Aggiungi Descrizione",
      "login_with_google": "Accedi con Google",
      "login_with_email": "Accedi con Email",
      "add_label": "Aggiungi Categoria",
      "create": "Crea",
      "delete": "Elimina",
      "manage_labels_for": "Gestione Categorie",
      "label_name": "Nome categoria",
      "events_for": "Eventi per",
      "no_events_label": "Non ci sono eventi per questa categoria.",
      "no_events": "Non ci sono eventi in programma per oggi.",
      "today": "Oggi",
      "view_day": "Visualizza Giorno",
      "view_week": "Visualizza Settimana",
      "view_month": "Visualizza Mese",
      "settings": "Impostazioni",
      "chevron_left": "Precedente",
      "select_priority": "Seleziona Priorità",
      "chevron_right": "Successivo",
      "close": "Chiudi",
      "edit": "Modifica",
      "bookmark_border": "Segnalibro",
      "access_time": "Alle",
      "event": "Evento",
      "calendar": "Calendario",
      "day": "Giorno",
      "week": "Week",
      "month": "Mese",
      "label_manager": "Gestore Etichette",
      "spinner": "Caricamento...",
        "add_code": "Priorità",
        "workweek": "Work Week",
        "loading_user_info": "Caricamento informazioni utente...",
        "year": "Anno",
      "active_events": "Eventi Attivi",
      "passed_events": "Eventi Passati",
      "sign_out": "Esci",
      "profile": "Profilo",
      "repeat_event": "Ripeti Evento",
      "end_date": "Data di fine",
      "custom": "Personalizzato",
      "monthly": "Mensile",
      "weekly": "Settimanale",
      "daily": "Giornaliero",
      "custom_repeat": "Ripetizione personalizzata",
      "days_of_week": "Giorni della settimana",
      "repeat": "Ripeti",
      "yearly": "Annuale",
      "no_repeat": "Non si ripete",
      "end_year" :  "Anno di fine",
      "days": {
        "Mon": "Lun",
        "Tue": "Mar",
        "Wed": "Mer",
        "Thu": "Gio",
        "Fri": "Ven",
        "Sat": "Sab",
        "Sun": "Dom"
      },
      "no_active_events": "Non ci sono eventi attivi.",
      "no_passed_events": "Non ci sono eventi passati.",
      "postponable": "Rinviabile",
      "specific_date": "Data specifica",
      "never": "Mai",
      "after": "Dopo",
      "occurrences": "occorrenze",
      "day_of_month": "Giorno del mese",
      "select_a_label": "Seleziona una categoria",
      "add_calendar": "Aggiungi Calendario",
    }
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;