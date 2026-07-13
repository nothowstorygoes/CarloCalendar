// AttachmentService.js
// Logica pura per la gestione degli allegati PDF, separata dai componenti
// esistenti (EventModal, DayView, LabelEventsView) per non toccarne la logica.
//
// Schema Firestore:
//   users/{ownerId}/attachments/{key}        -> documento con il PDF (base64) + metadati
//   users/{ownerId}/attachmentsMeta/index     -> { keys: [key1, key2, ...] } indice leggero
//                                                usato per mostrare il "graffettino" nelle
//                                                viste senza scaricare ogni singolo PDF.
//
// key = event.repeat se l'evento fa parte di una serie ricorrente, altrimenti event.id.
// Questo garantisce che:
//  - un evento rinviato (postponable) riceve un nuovo id -> nuova key -> PDF indipendente
//  - tutte le occorrenze di una serie condividono lo stesso "repeat" -> stessa key -> stesso PDF

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../firebase";

// Margine di sicurezza sotto il limite di 1MB per documento di Firestore
// (base64 aggiunge circa +33% rispetto alla dimensione del file originale).
export const MAX_PDF_BYTES = 800 * 1024;

export function getAttachmentKey(event) {
  if (!event) return null;
  return event.repeat || event.id;
}

function attachmentDocRef(ownerId, key) {
  return doc(db, `users/${ownerId}/attachments`, key);
}

function indexDocRef(ownerId) {
  return doc(db, `users/${ownerId}/attachmentsMeta`, "index");
}

// Trova il giorno dell'ultima occorrenza della serie (per calcolare la scadenza
// a 1 anno dall'ultima occorrenza, non dalla prima). Se l'evento non fa parte
// di una serie, ritorna semplicemente il giorno dell'evento stesso.
async function getSeriesLastDay(ownerId, repeatId, fallbackDay) {
  if (!repeatId) return fallbackDay;
  try {
    const q = query(
      collection(db, `users/${ownerId}/events`),
      where("repeat", "==", repeatId),
    );
    const snap = await getDocs(q);
    if (snap.empty) return fallbackDay;
    let maxDay = fallbackDay;
    snap.forEach((d) => {
      const day = d.data().day;
      if (day && day > maxDay) maxDay = day;
    });
    return maxDay;
  } catch (err) {
    console.error("Errore nel calcolo dell'ultima occorrenza della serie:", err);
    return fallbackDay;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addKeyToIndex(ownerId, key) {
  try {
    await updateDoc(indexDocRef(ownerId), { keys: arrayUnion(key) });
  } catch (err) {
    // Il documento indice non esiste ancora: lo creiamo.
    await setDoc(indexDocRef(ownerId), { keys: [key] });
  }
}

async function removeKeyFromIndex(ownerId, key) {
  try {
    await updateDoc(indexDocRef(ownerId), { keys: arrayRemove(key) });
  } catch (err) {
    // Indice inesistente: nulla da rimuovere.
  }
}

// Carica (o sostituisce) il PDF associato a un evento.
export async function uploadAttachment(ownerId, event, file) {
  if (!ownerId || !event) throw new Error("ownerId ed event sono obbligatori");
  if (!event.id) throw new Error("L'evento deve essere già salvato prima di allegare un PDF");
  if (file.type !== "application/pdf") {
    throw new Error("Il file deve essere in formato PDF");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(
      `Il PDF supera la dimensione massima consentita (${Math.round(MAX_PDF_BYTES / 1024)}KB)`,
    );
  }

  const key = getAttachmentKey(event);
  const base64 = await fileToBase64(file);
  const lastDay = await getSeriesLastDay(ownerId, event.repeat, event.day);
  const expiresAt = Timestamp.fromMillis(dayjs(lastDay).add(1, "year").valueOf());

  const attachmentData = {
    key,
    calendarId: event.calendarId,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    pdfBase64: base64,
    eventDay: event.day,
    expiresAt,
    createdAt: Timestamp.now(),
  };

  await setDoc(attachmentDocRef(ownerId, key), attachmentData);
  await addKeyToIndex(ownerId, key);

  return attachmentData;
}

// Recupera l'allegato (con il PDF incluso) per un evento specifico.
// Ritorna null se non esiste (o se è stato eliminato, es. dalla TTL policy).
export async function fetchAttachment(ownerId, event) {
  const key = getAttachmentKey(event);
  if (!ownerId || !key) return null;
  try {
    const snap = await getDoc(attachmentDocRef(ownerId, key));
    if (!snap.exists()) {
      // Auto-pulizia: se l'indice lo segnalava ma il documento non c'è più
      // (es. cancellato dalla TTL policy di Firestore), rimuoviamo la key stale.
      await removeKeyFromIndex(ownerId, key);
      return null;
    }
    return snap.data();
  } catch (err) {
    console.error("Errore nel recupero dell'allegato:", err);
    return null;
  }
}

export async function deleteAttachment(ownerId, event) {
  const key = getAttachmentKey(event);
  if (!ownerId || !key) return;
  await deleteDoc(attachmentDocRef(ownerId, key));
  await removeKeyFromIndex(ownerId, key);
}

// Ritorna l'elenco (array di stringhe) delle key che hanno un PDF associato,
// per un dato owner. Usato per popolare il badge nelle viste senza scaricare
// ogni singolo PDF.
export async function fetchAttachmentIndex(ownerId) {
  if (!ownerId) return [];
  try {
    const snap = await getDoc(indexDocRef(ownerId));
    return snap.exists() ? snap.data().keys || [] : [];
  } catch (err) {
    console.error("Errore nel recupero dell'indice allegati:", err);
    return [];
  }
}

export function downloadAttachment(attachment) {
  if (!attachment?.pdfBase64) return;

  const byteChars = atob(attachment.pdfBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  window.open(blobUrl, "_blank");

  // Rilascia la memoria dopo che la nuova scheda ha avuto il tempo di caricare il blob.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}