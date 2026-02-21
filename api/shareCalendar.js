import admin from "firebase-admin";
import nodemailer from "nodemailer";

// Inizializza Firebase Admin solo se non è già inizializzato
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel gestisce le chiavi private con i \n in modo particolare, questo replace aiuta
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Configura il trasportatore per le email (es. Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Usa la "App Password" generata da Google
  },
});

export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { targetEmail, ownerId, calendarId, permissionLevel, calendarName } = req.body;

try {
    // 1. CREA UN DOCUMENTO "INVITO" NEL DATABASE
    // Creiamo una nuova collezione globale per tracciare gli inviti in sospeso
    const inviteRef = db.collection("invitations").doc(); // Genera un ID casuale automatico
    const inviteId = inviteRef.id;

    await inviteRef.set({
      calendarId: calendarId,
      calendarName: calendarName,
      ownerId: ownerId,
      targetEmail: targetEmail,
      permissionLevel: permissionLevel,
      status: "pending", // STATO FONDAMENTALE: in attesa!
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("--- DEBUG API ---");
    console.log("Creato Invito ID:", inviteId);
    console.log("In attesa di accettazione da:", targetEmail);
    console.log("-----------------");

    // 2. CREA IL LINK PER IL PULSANTE
    // Per ora usiamo localhost per i test. Poi metteremo il dominio vero (es. su Vercel)
    const baseUrl = process.env.REACT_APP_URL || "http://localhost:3000";
    const acceptLink = `${baseUrl}/accept-invite?inviteId=${inviteId}`;

    // 3. INVIA L'EMAIL CON IL PULSANTE DI ACCETTAZIONE
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: targetEmail,
      subject: `Invito a collaborare al calendario "${calendarName}"`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4285F4; text-align: center;">Nuovo Invito!</h2>
          <p style="font-size: 16px;">Ciao!</p>
          <p style="font-size: 16px;">Un utente ti ha invitato a collaborare al suo calendario <strong>"${calendarName}"</strong>.</p>
          <p style="font-size: 16px;">Livello di accesso proposto: <em>${permissionLevel === 'read' ? 'Sola lettura' : 'Lettura e Scrittura'}</em></p>
          
          <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="${acceptLink}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
              Accetta l'invito
            </a>
          </div>
          
          <p style="font-size: 14px; color: #777; text-align: center;">Se non sei tu l'interessato, puoi ignorare questa email.</p>
        </div>
      `
    };

    console.log(`Sto inviando l'email di invito a: ${targetEmail}...`);
    await transporter.sendMail(mailOptions);
    
    // Risposta al frontend: Non diciamo "condiviso", diciamo "invito inviato"!
    return res.status(200).json({ success: true, message: "Invito inviato con successo!" });

  } catch (error) {
    console.error("Errore server inaspettato:", error);
    return res.status(500).json({ error: "Errore interno del server." });
  }
}