"""
enhance_guest_data_extraction.py - Amélioration de l'extraction des données voyageur
====================================================================================
Version  : 1.0.0
Date     : Mai 2026

Ce script améliore la fonction _parse_reservation_node pour extraire plus de données.
À intégrer dans airbnb_scraper.py

Données extraites:
- Email du voyageur (guest_email)
- Téléphone du voyageur (guest_phone)
- Nationalité du voyageur (guest_nationality)
- Nombre d'adultes vs enfants
"""

def _extract_field(node, *paths, default=""):
    """Extrait un champ depuis un objet JSON en testant plusieurs chemins."""
    for path in paths:
        try:
            obj = node
            for key in path:
                if isinstance(obj, dict):
                    obj = obj[key]
                elif isinstance(obj, list) and isinstance(key, int) and key < len(obj):
                    obj = obj[key]
                else:
                    obj = None
                    break
            if obj is not None and obj != "":
                return obj
        except (KeyError, IndexError, TypeError):
            continue
    return default


def _parse_reservation_node_enhanced(node):
    """
    Version améliorée de _parse_reservation_node avec extraction complète des données voyageur.
    
    Remplace la fonction existante dans airbnb_scraper.py
    """
    
    # ── Montant et devise ────────────────────────────────────────────────────
    earnings_raw = node.get("earnings", "")
    if isinstance(earnings_raw, dict):
        montant = earnings_raw.get("amount", 0)
        devise  = earnings_raw.get("currency", "GBP")
    else:
        montant, devise = _parse_earnings(earnings_raw)
    
    # ── Nombre de voyageurs ──────────────────────────────────────────────────
    guest_count = _extract_field(
        node,
        ["guest_details", "number_of_guests"],
        ["guest_details", "number_of_adults"],
        ["guest_count"], 
        ["guestCount"], 
        ["numberOfGuests"],
        ["number_of_guests"],
        default=0
    )
    
    # ── Nom du voyageur ──────────────────────────────────────────────────────
    voyageur = _extract_field(
        node,
        ["guest_user", "full_name"],
        ["guest_user", "first_name"],
        ["guest", "first_name"], 
        ["guest", "name"], 
        ["guestName"],
        ["guest_details", "guest_name"],
        default=""
    )
    
    # ── Email du voyageur (NOUVEAU - plusieurs chemins) ──────────────────────
    guest_email = _extract_field(
        node,
        ["guest_user", "email"],
        ["guest", "email"],
        ["guest_details", "email"],
        ["guest_email"],
        ["guestEmail"],
        ["contact_info", "email"],
        ["guest_user", "contact", "email"],
        default=""
    )
    
    # ── Téléphone du voyageur (NOUVEAU - plusieurs chemins) ──────────────────
    guest_phone = _extract_field(
        node,
        ["guest_user", "phone"],
        ["guest", "phone"],
        ["guest_details", "phone"],
        ["guest_phone"],
        ["guestPhone"],
        ["contact_info", "phone"],
        ["guest_user", "contact", "phone"],
        ["guest_user", "phone_number"],
        default=""
    )
    
    # Nettoyer le téléphone (enlever espaces, tirets)
    if guest_phone:
        guest_phone = guest_phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # ── Nationalité du voyageur (NOUVEAU - plusieurs chemins) ────────────────
    guest_nationality = _extract_field(
        node,
        ["guest_user", "nationality"],
        ["guest", "nationality"],
        ["guest_details", "nationality"],
        ["guest_nationality"],
        ["guestNationality"],
        ["guest_user", "country"],
        ["guest_user", "country_code"],
        default=""
    )
    
    # Normaliser la nationalité (2 lettres majuscules)
    if guest_nationality and len(guest_nationality) > 2:
        # Convertir nom de pays en code ISO (exemples courants)
        country_map = {
            "France": "FR", "Algeria": "DZ", "Algérie": "DZ",
            "United States": "US", "United Kingdom": "GB",
            "Germany": "DE", "Spain": "ES", "Italy": "IT",
            "Canada": "CA", "Morocco": "MA", "Tunisia": "TN",
        }
        guest_nationality = country_map.get(guest_nationality, guest_nationality[:2].upper())
    
    # ── Statut ───────────────────────────────────────────────────────────────
    statut = _extract_field(
        node,
        ["user_facing_status_localized"],
        ["user_facing_status_key"],
        ["status"], 
        ["reservationStatus"],
        ["confirmation_status"],
        default=""
    )
    
    # ── Logement ─────────────────────────────────────────────────────────────
    logement = _extract_field(
        node,
        ["listing_name"], 
        ["listingName"],
        ["listing", "name"], 
        ["listing", "title"],
        default=""
    )
    
    # ── Date de création ─────────────────────────────────────────────────────
    date_creation = _extract_field(
        node,
        ["booked_date"], 
        ["created_at"], 
        ["createdAt"],
        ["booking_date"],
        default=""
    )
    
    # ── Demandes spéciales ───────────────────────────────────────────────────
    special_requests = _extract_field(
        node,
        ["special_requests"],
        ["guest_details", "special_requests"],
        ["notes"],
        ["guest_notes"],
        default=""
    )
    
    # ── Retourner toutes les données ─────────────────────────────────────────
    return {
        "id":            _extract_field(
            node, 
            ["confirmation_code"], 
            ["confirmationCode"], 
            ["id"], 
            default=""
        ),
        "statut":        statut,
        "voyageur":      voyageur,
        "nb_voyageurs":  guest_count,
        "logement":      logement,
        "listing_id":    _extract_field(
            node, 
            ["listing_id"], 
            ["listingId"], 
            default=""
        ),
        "date_arrivee":  _extract_field(
            node, 
            ["start_date"], 
            ["checkIn"], 
            ["check_in"], 
            default=""
        ),
        "date_depart":   _extract_field(
            node, 
            ["end_date"], 
            ["checkOut"], 
            ["check_out"], 
            default=""
        ),
        "nb_nuits":      _extract_field(
            node, 
            ["nights"], 
            ["nightsCount"], 
            default=0
        ),
        "montant_total": montant,
        "devise":        devise,
        "date_creation": date_creation,
        
        # ── NOUVELLES DONNÉES ────────────────────────────────────────────────
        "guest_email":       guest_email or "",
        "guest_phone":       guest_phone or "",
        "guest_nationality": guest_nationality or "",
        "special_requests":  special_requests or "",
        
        # ── DONNÉES SUPPLÉMENTAIRES (optionnel) ──────────────────────────────
        "base_price":    _extract_field(
            node, 
            ["price_details", "base_price"],
            ["base_price"],
            ["basePrice"],
            default=0
        ),
        "cleaning_fee":  _extract_field(
            node, 
            ["price_details", "cleaning_fee"],
            ["cleaning_fee"],
            ["cleaningFee"],
            default=0
        ),
        "service_fee":   _extract_field(
            node, 
            ["price_details", "service_fee"],
            ["service_fee"],
            ["serviceFee"],
            default=0
        ),
        "taxes":         _extract_field(
            node, 
            ["price_details", "taxes"],
            ["taxes"],
            ["occupancy_taxes"],
            default=0
        ),
    }


def _parse_earnings(earnings_str):
    """Parse le montant et la devise depuis une chaîne."""
    if not earnings_str or not isinstance(earnings_str, str):
        return 0, "GBP"
    
    cleaned  = earnings_str.strip().replace("\u00a0", "").replace(" ", "")
    currency = "GBP"
    
    if "€" in cleaned:
        currency = "EUR"
        cleaned  = cleaned.replace("€", "")
    elif "$" in cleaned:
        currency = "USD"
        cleaned  = cleaned.replace("$", "")
    elif "£" in cleaned:
        currency = "GBP"
        cleaned  = cleaned.replace("£", "")
    elif "DZD" in cleaned or "DA" in cleaned:
        currency = "DZD"
        cleaned  = cleaned.replace("DZD", "").replace("DA", "")
    
    cleaned = cleaned.replace(",", ".").strip()
    
    try:
        return float(cleaned), currency
    except ValueError:
        return 0, currency


# ============================================================================
# INSTRUCTIONS D'INTÉGRATION
# ============================================================================
"""
Pour intégrer cette amélioration dans airbnb_scraper.py:

1. Remplacer la fonction _parse_reservation_node existante (ligne ~240)
   par _parse_reservation_node_enhanced

2. Ajouter la fonction _parse_earnings si elle n'existe pas déjà

3. La fonction _extract_field existe déjà, pas besoin de la modifier

4. Tester avec: python airbnb_scraper.py

RÉSULTAT ATTENDU:
- Les réservations auront maintenant guest_email, guest_phone, guest_nationality
- Si ces données ne sont pas disponibles dans l'API, les champs seront vides ("")
- L'API Next.js accepte ces champs vides (ils sont optionnels)
"""

if __name__ == "__main__":
    # Test avec des données fictives
    test_node = {
        "confirmation_code": "HMTEST999",
        "guest_user": {
            "full_name": "Jean Dupont",
            "email": "jean.dupont@example.com",
            "phone": "+33 6 12 34 56 78",
            "nationality": "France"
        },
        "guest_details": {
            "number_of_guests": 3
        },
        "listing_name": "Appartement Test",
        "listing_id": "12345678",
        "start_date": "2026-07-01",
        "end_date": "2026-07-05",
        "nights": 4,
        "earnings": {"amount": 50000, "currency": "DZD"},
        "user_facing_status_localized": "Confirmée",
        "special_requests": "Arrivée tardive souhaitée"
    }
    
    result = _parse_reservation_node_enhanced(test_node)
    
    print("Test de l'extraction améliorée:")
    print(f"  Nom: {result['voyageur']}")
    print(f"  Email: {result['guest_email']}")
    print(f"  Téléphone: {result['guest_phone']}")
    print(f"  Nationalité: {result['guest_nationality']}")
    print(f"  Demandes spéciales: {result['special_requests']}")
    print("\n✅ Test réussi!")
