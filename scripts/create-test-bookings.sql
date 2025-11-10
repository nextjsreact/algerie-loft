-- Script pour créer des réservations de test

-- D'abord, vérifions qu'on a des lofts
DO $$
DECLARE
    loft_count INTEGER;
    test_loft_id UUID;
    test_user_id UUID;
BEGIN
    -- Compter les lofts
    SELECT COUNT(*) INTO loft_count FROM lofts;
    
    IF loft_count = 0 THEN
        RAISE NOTICE 'Aucun loft trouvé. Création d''un loft de test...';
        
        -- Créer un loft de test
        INSERT INTO lofts (name, description, address, price_per_month, status)
        VALUES (
            'Loft Moderne Hydra',
            'Magnifique loft de 120m² avec vue panoramique sur la baie d''Alger',
            'Rue des Frères Bouadou, Hydra, Alger',
            25000,
            'available'
        )
        RETURNING id INTO test_loft_id;
        
        RAISE NOTICE 'Loft créé avec ID: %', test_loft_id;
    ELSE
        -- Utiliser le premier loft existant
        SELECT id INTO test_loft_id FROM lofts LIMIT 1;
        RAISE NOTICE 'Utilisation du loft existant: %', test_loft_id;
    END IF;
    
    -- Récupérer l'ID d'un utilisateur (le premier trouvé)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé. Veuillez d''abord créer un compte.';
    END IF;
    
    RAISE NOTICE 'Utilisation de l''utilisateur: %', test_user_id;
    
    -- Créer des réservations de test
    -- Réservation 1: À venir
    INSERT INTO bookings (
        loft_id,
        client_id,
        partner_id,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        payment_status,
        booking_reference
    ) VALUES (
        test_loft_id,
        test_user_id,
        test_user_id, -- Utiliser le même user comme partner pour le test
        CURRENT_DATE + INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '10 days',
        2,
        125000,
        'confirmed',
        'paid',
        'BK' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
    );
    
    -- Réservation 2: À venir (plus loin)
    INSERT INTO bookings (
        loft_id,
        client_id,
        partner_id,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        payment_status,
        booking_reference
    ) VALUES (
        test_loft_id,
        test_user_id,
        test_user_id,
        CURRENT_DATE + INTERVAL '20 days',
        CURRENT_DATE + INTERVAL '23 days',
        4,
        75000,
        'confirmed',
        'paid',
        'BK' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
    );
    
    -- Réservation 3: Passée
    INSERT INTO bookings (
        loft_id,
        client_id,
        partner_id,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        payment_status,
        booking_reference
    ) VALUES (
        test_loft_id,
        test_user_id,
        test_user_id,
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE - INTERVAL '25 days',
        2,
        125000,
        'completed',
        'paid',
        'BK' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
    );
    
    RAISE NOTICE 'Réservations de test créées avec succès!';
END $$;

-- Vérifier les réservations créées
SELECT 
    b.id,
    b.booking_reference,
    b.check_in,
    b.check_out,
    b.status,
    l.name as loft_name
FROM bookings b
JOIN lofts l ON b.loft_id = l.id
ORDER BY b.created_at DESC
LIMIT 10;
