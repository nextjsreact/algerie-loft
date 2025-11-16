-- Script pour tester ce que l'API /api/partner/status devrait retourner
-- pour l'utilisateur Habib Belkacemi

SELECT 
  pp.id,
  pp.business_name,
  pp.verification_status,
  pp.created_at,
  -- Ce que l'API devrait retourner:
  jsonb_build_object(
    'hasProfile', true,
    'verification_status', pp.verification_status,
    'business_name', pp.business_name,
    'created_at', pp.created_at
  ) as expected_api_response
FROM partner_profiles pp
WHERE pp.user_id = 'a2d8b1d9-0984-4e01-82c9-b6bd38fbd20e';
