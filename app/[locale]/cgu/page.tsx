import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — Loft Algérie',
  description: 'CGU de la plateforme LoftAlgerie — Version du 22 avril 2026',
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-gray-500 text-sm">LoftAlgerie — Version du 22 avril 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 1 — Présentation de la plateforme</h2>
            <p>LoftAlgerie est une plateforme en ligne de mise en relation entre des propriétaires de lofts et d'espaces atypiques (ci-après « Hôtes ») et des personnes souhaitant louer ces espaces pour des séjours de courte ou longue durée (ci-après « Voyageurs »). LoftAlgerie intervient exclusivement en qualité d'intermédiaire technique et ne prend jamais possession des biens proposés.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 2 — Acceptation des CGU</h2>
            <p>L'accès et l'utilisation de la plateforme LoftAlgerie sont subordonnés à l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation. En cochant la case prévue à cet effet lors de l'inscription, l'utilisateur reconnaît avoir lu, compris et accepté sans réserve les présentes CGU.</p>
            <p>LoftAlgerie se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email et/ou notification dans l'Application au moins 15 jours avant son entrée en vigueur.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 3 — Inscription et compte utilisateur</h2>
            <h3 className="font-semibold text-gray-700 mt-4">3.1 Conditions d'inscription</h3>
            <p>Pour utiliser LoftAlgerie, l'utilisateur doit :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Être âgé d'au moins 18 ans</li>
              <li>Disposer d'une adresse email valide et d'un numéro de téléphone algérien</li>
              <li>Fournir des informations exactes, complètes et à jour</li>
              <li>Accepter les présentes CGU et la Politique de confidentialité</li>
            </ul>
            <h3 className="font-semibold text-gray-700 mt-4">3.2 Responsabilité du compte</h3>
            <p>L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de toutes les activités effectuées depuis son compte. Il s'engage à notifier immédiatement LoftAlgerie de toute utilisation non autorisée de son compte à l'adresse <a href="mailto:contact@loftalgerie.com" className="text-blue-600 hover:underline">contact@loftalgerie.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 4 — Rôles des utilisateurs</h2>
            <h3 className="font-semibold text-gray-700 mt-4">4.1 L'Hôte</h3>
            <p>L'Hôte est toute personne physique ou morale qui publie une annonce de location d'un loft ou espace atypique sur la plateforme. En tant qu'Hôte, l'utilisateur s'engage à :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Être propriétaire du bien ou disposer d'une autorisation légale de sous-location</li>
              <li>Fournir des informations exactes sur le bien (superficie, équipements, localisation, photos)</li>
              <li>Respecter la législation algérienne applicable à la location de biens immobiliers</li>
              <li>Accueillir les Voyageurs dans les conditions décrites dans l'annonce</li>
              <li>Déclarer les revenus perçus conformément à la législation fiscale algérienne en vigueur</li>
            </ul>
            <h3 className="font-semibold text-gray-700 mt-4">4.2 Le Voyageur</h3>
            <p>Le Voyageur est toute personne qui réserve un loft ou espace via la plateforme. En tant que Voyageur, l'utilisateur s'engage à :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utiliser le bien exclusivement aux fins convenues lors de la réservation</li>
              <li>Respecter le règlement intérieur du loft communiqué par l'Hôte</li>
              <li>Prendre soin du bien mis à sa disposition et en signaler tout dommage immédiatement</li>
              <li>Quitter les lieux à la date et l'heure convenues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 5 — Annonces et réservations</h2>
            <h3 className="font-semibold text-gray-700 mt-4">5.1 Publication d'annonces</h3>
            <p>Les Hôtes peuvent publier des annonces gratuitement. LoftAlgerie se réserve le droit de modérer, modifier ou supprimer toute annonce ne respectant pas les présentes CGU, sans préavis ni justification.</p>
            <h3 className="font-semibold text-gray-700 mt-4">5.2 Processus de réservation</h3>
            <p>La réservation d'un loft s'effectue via la plateforme selon les étapes suivantes :</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Le Voyageur soumet une demande de réservation pour les dates souhaitées</li>
              <li>L'Hôte accepte ou refuse la demande dans le délai indiqué sur l'annonce</li>
              <li>En cas d'acceptation, la réservation est confirmée et un récapitulatif est envoyé aux deux parties</li>
              <li>Le paiement est traité conformément aux modalités prévues à l'article 6</li>
            </ol>
            <h3 className="font-semibold text-gray-700 mt-4">5.3 Annulation</h3>
            <p>Les conditions d'annulation sont définies par l'Hôte lors de la publication de l'annonce parmi les politiques proposées par LoftAlgerie (flexible, modérée, stricte). Ces conditions sont clairement affichées avant toute confirmation de réservation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 6 — Paiement et frais de service</h2>
            <p>LoftAlgerie perçoit des frais de service sur chaque transaction réalisée via la plateforme. Le montant de ces frais est clairement indiqué avant la confirmation de toute réservation.</p>
            <p>Les modalités de paiement disponibles sur la plateforme sont précisées dans l'Application. LoftAlgerie ne stocke aucune donnée bancaire sur ses serveurs.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 7 — Responsabilités</h2>
            <h3 className="font-semibold text-gray-700 mt-4">7.1 Responsabilité de LoftAlgerie</h3>
            <p>LoftAlgerie agit en tant qu'intermédiaire technique et ne saurait être tenu responsable :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Des informations inexactes publiées par les Hôtes</li>
              <li>Des dommages survenus dans un loft lors d'un séjour</li>
              <li>Des litiges entre Hôtes et Voyageurs</li>
              <li>Des interruptions ou dysfonctionnements techniques temporaires</li>
            </ul>
            <h3 className="font-semibold text-gray-700 mt-4">7.2 Responsabilité des utilisateurs</h3>
            <p>Chaque utilisateur est entièrement responsable des informations qu'il publie et des engagements qu'il prend via la plateforme. Tout manquement aux présentes CGU peut entraîner la suspension ou la suppression définitive du compte.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 8 — Contenu interdit</h2>
            <p>Il est strictement interdit d'utiliser LoftAlgerie pour :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Publier des annonces de biens inexistants ou frauduleuses</li>
              <li>Usurper l'identité d'une autre personne</li>
              <li>Contourner le système de paiement de la plateforme</li>
              <li>Diffuser des contenus illicites, offensants ou contraires aux bonnes mœurs</li>
              <li>Utiliser la plateforme à des fins commerciales non autorisées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 9 — Propriété intellectuelle</h2>
            <p>L'ensemble des éléments constituant la plateforme LoftAlgerie (logo, design, textes, fonctionnalités, code source) est la propriété exclusive de LoftAlgerie et est protégé par la législation algérienne relative à la propriété intellectuelle.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 10 — Données personnelles</h2>
            <p>Le traitement des données à caractère personnel des utilisateurs est régi par la Politique de confidentialité de LoftAlgerie, conforme à la <strong>Loi n° 18-07 du 10 juin 2018</strong>. La Politique de confidentialité fait partie intégrante des présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 11 — Droit applicable et litiges</h2>
            <p>Les présentes CGU sont régies par le droit algérien. En cas de litige entre LoftAlgerie et un utilisateur, les parties s'engagent à rechercher une solution amiable dans un délai de 30 jours. À défaut de résolution amiable, tout litige sera soumis à la compétence exclusive des tribunaux algériens compétents.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Article 12 — Contact</h2>
            <p>Pour toute question relative aux présentes CGU : <a href="mailto:contact@loftalgerie.com" className="text-blue-600 hover:underline">contact@loftalgerie.com</a></p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t text-center text-xs text-gray-400">
          LoftAlgerie — Conditions Générales d'Utilisation — 22 avril 2026
        </div>
      </div>
    </div>
  )
}
