// EventAttachment.js
// Widget autonomo per allegare/visualizzare/rimuovere il PDF di un evento.
// Non contiene nessuna logica di EventModal: riceve l'evento (o null, se
// l'evento è ancora in fase di creazione) e l'ownerId già risolti, e
// comunica verso l'esterno solo tramite onAttachmentChange.
//
// Caso "evento non ancora salvato" (event === null):
// il file scelto dall'utente viene tenuto in memoria locale (pendingFile)
// e NON viene caricato su Firestore finché l'evento non esiste davvero.
// Il genitore (EventModal), subito dopo aver scritto l'evento su Firestore
// e PRIMA di chiudere il modale, deve chiamare:
//   ref.current.commitPending(localEvent, targetUserId)
// per effettuare l'upload effettivo del file pendente.

import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  getAttachmentKey,
  uploadAttachment,
  deleteAttachment,
  fetchAttachment,
  downloadAttachment,
  MAX_PDF_BYTES,
} from "./AttachmentService";

function validatePdf(file) {
  if (file.type !== "application/pdf") {
    return "Il file deve essere in formato PDF";
  }
  if (file.size > MAX_PDF_BYTES) {
    return `Il PDF supera la dimensione massima consentita (${Math.round(
      MAX_PDF_BYTES / 1024,
    )}KB)`;
  }
  return null;
}

const EventAttachment = forwardRef(function EventAttachment(
  { event, ownerId, onAttachmentChange },
  ref,
) {
  const [attachment, setAttachment] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const key = getAttachmentKey(event);

  // Carica l'allegato reale solo se l'evento esiste già.
  useEffect(() => {
    setAttachment(null);
    setError("");
    if (!event || !ownerId || !key) return;

    let cancelled = false;
    setLoading(true);
    fetchAttachment(ownerId, event).then((data) => {
      if (!cancelled) {
        setAttachment(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key, ownerId, event]);

  // Espone al genitore (EventModal) il modo per caricare il PDF scelto
  // prima che l'evento esistesse, ora che l'evento è stato salvato.
  useImperativeHandle(ref, () => ({
    commitPending: async (finalEvent, finalOwnerId) => {
      if (!pendingFile || !finalEvent || !finalOwnerId) return;
      try {
        await uploadAttachment(finalOwnerId, finalEvent, pendingFile);
        setPendingFile(null);
        onAttachmentChange?.(getAttachmentKey(finalEvent), true);
      } catch (err) {
        // L'evento è già stato salvato a questo punto: non blocchiamo
        // la chiusura del modale, ma segnaliamo l'errore in console.
        console.error("Errore durante il caricamento del PDF pendente:", err);
      }
    },
    hasPending: () => !!pendingFile,
  }));

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permette di ricaricare lo stesso file due volte
    if (!file) return;

    const validationError = validatePdf(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    // Evento non ancora salvato: teniamo il file in memoria, upload rimandato.
    if (!event) {
      setPendingFile(file);
      return;
    }

    setLoading(true);
    try {
      const data = await uploadAttachment(ownerId, event, file);
      setAttachment(data);
      onAttachmentChange?.(key, true);
    } catch (err) {
      setError(err.message || "Errore durante il caricamento del PDF");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setError("");
    setLoading(true);
    try {
      await deleteAttachment(ownerId, event);
      setAttachment(null);
      onAttachmentChange?.(key, false);
    } catch (err) {
      setError("Errore durante la rimozione del PDF");
    }
    setLoading(false);
  };

  const handleRemovePending = () => {
    setPendingFile(null);
    setError("");
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center flex-wrap gap-2">
        <span className="material-icons text-gray-400 dark:text-zinc-200">
          attach_file
        </span>

        {loading && (
          <span className="text-sm text-gray-400 dark:text-zinc-400 ml-0 md:ml-[2vw]">
            Caricamento...
          </span>
        )}

        {/* Evento reale già salvato con un PDF associato */}
        {!loading && event && attachment && (
          <>
            <button
              type="button"
              onClick={() => downloadAttachment(attachment)}
              className="text-sm text-blue-500 hover:text-blue-600 underline truncate max-w-[10rem] ml-0 md:ml-[2vw]"
              title={attachment.fileName}
            >
              {attachment.fileName}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="material-icons text-sm cursor-pointer text-gray-400 hover:text-red-500"
              title="Rimuovi PDF"
            >
              delete
            </button>
          </>
        )}

        {/* Evento non ancora salvato ma file già scelto: in attesa di salvataggio */}
        {!loading && !event && pendingFile && (
          <>
            <span
              className="text-sm text-blue-500 truncate max-w-[10rem]  ml-0 md:ml-[7.5vw]"
              title={pendingFile.name}
            >
              {pendingFile.name}
            </span>
            <span
              className="material-icons text-sm text-gray-400"
              title="Verrà caricato al salvataggio dell'evento"
            >
              schedule
            </span>
            <button
              type="button"
              onClick={handleRemovePending}
              className="material-icons text-sm cursor-pointer text-gray-400 hover:text-red-500"
              title="Rimuovi"
            >
              delete
            </button>
          </>
        )}

        {/* Nessun allegato/file: bottone per sceglierne uno, sempre visibile */}
        {!loading && !attachment && !pendingFile && (
          <label className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer underline ml-0 md:ml-[14.5vw]">
            Allega PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {!event && pendingFile && (
        <span className="text-xs text-gray-400 dark:text-zinc-500 mt-1 ml-0 md:ml-[3.7vw]">
          Il PDF verrà caricato al salvataggio dell'evento
        </span>
      )}
      {event?.repeat && (
        <span className="text-xs text-gray-400 dark:text-zinc-500 mt-1 ml-0 md:ml-[3.7vw]">
          Il PDF è condiviso da tutte le occorrenze di questa serie
        </span>
      )}
      {error && <span className="text-xs text-red-500 ml-0 md:ml-[3.7vw] mt-1">{error}</span>}
    </div>
  );
});

export default EventAttachment;