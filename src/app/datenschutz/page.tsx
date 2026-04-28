export const metadata = { title: 'Datenschutz' }

export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl space-y-6 text-zinc-300">
      <h1 className="text-3xl font-black text-white">Datenschutzerklärung</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <div>
          <h2 className="font-bold text-white mb-2">1. Verantwortlicher</h2>
          <p>[DEIN NAME], [DEINE ADRESSE], [DEINE EMAIL]</p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">2. Erhobene Daten beim Seitenbesuch</h2>
          <p>
            Beim Besuch dieser Website werden technisch notwendige Daten durch unseren Hosting-Anbieter
            Vercel (Vercel Inc., 340 Pine Street Suite 701, San Francisco, CA 94104, USA) in Server-Logs
            gespeichert. Dazu gehören: IP-Adresse (anonymisiert), Zeitpunkt des Zugriffs, aufgerufene
            Seite, Referrer-URL, Browser-Typ.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">3. Affiliate-Link-Tracking</h2>
          <p>
            Wenn du auf einen Affiliate-Link klickst (/go/...), wird der Klick für Analysezwecke
            gespeichert. Dabei wird deine IP-Adresse in anonymisierter Form (Hash) gespeichert.
            Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">4. Externe Dienste</h2>
          <p>
            Diese Website nutzt Supabase (für Datenbank und Datenspeicherung) und Vercel (für Hosting).
            Beide Dienste verarbeiten Daten gemäß ihren eigenen Datenschutzrichtlinien.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">5. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung
            und Widerspruch. Wende dich dafür an: [DEINE EMAIL]
          </p>
        </div>
      </div>
    </div>
  )
}
