export const metadata = { title: 'Impressum' }

export default function ImpressumPage() {
  return (
    <div className="max-w-2xl space-y-6 text-zinc-300">
      <h1 className="text-3xl font-black text-white">Impressum</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <div>
          <h2 className="font-bold text-white mb-2">Angaben gemäß § 5 TMG</h2>
          <p>
            [DEIN NAME]<br />
            [DEINE STRASSE]<br />
            [PLZ ORT]
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">Kontakt</h2>
          <p>E-Mail: [DEINE EMAIL]</p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>[DEIN NAME], [ADRESSE]</p>
        </div>
        <div className="pt-4 border-t border-zinc-800 text-zinc-500 text-xs">
          <p>Angaben ohne Gewähr.</p>
        </div>
      </div>
    </div>
  )
}
