export const metadata = { title: 'Affiliate-Hinweis' }

export default function AffiliateHinweisPage() {
  return (
    <div className="max-w-2xl space-y-6 text-zinc-300">
      <h1 className="text-3xl font-black text-white">Affiliate-Hinweis</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          Diese Website enthält sogenannte Affiliate-Links. Wenn du auf einen solchen Link klickst und
          darüber ein Produkt kaufst, erhalten wir möglicherweise eine Provision vom jeweiligen Shop.
          Für dich entstehen dabei keine zusätzlichen Kosten — du zahlst denselben Preis wie ohne
          Affiliate-Link.
        </p>
        <p>
          Alle Deals und Empfehlungen auf dieser Website sind unabhängig von eventuellen Provisionen.
          Wir veröffentlichen nur Deals, die wir für attraktiv halten.
        </p>
        <p>
          Alle Preisangaben sind ohne Gewähr. Preise können sich jederzeit ändern. Maßgeblich ist
          stets der aktuelle Preis auf der Seite des jeweiligen Anbieters zum Zeitpunkt des Kaufs.
        </p>
        <p>
          Posts und Inhalte auf unseren Social-Media-Kanälen, die Affiliate-Links enthalten, sind
          mit "Anzeige" oder "Werbung" gekennzeichnet.
        </p>
      </div>
    </div>
  )
}
