#!/bin/bash

# Script de test pour l'API Airbnb Sync
# Usage: ./scripts/test-airbnb-api.sh [local|production]

# Configuration
ENV=${1:-local}

if [ "$ENV" = "local" ]; then
    API_URL="http://localhost:3000"
    echo "🧪 Testing LOCAL API: $API_URL"
elif [ "$ENV" = "production" ]; then
    API_URL="https://votreapp.vercel.app"
    echo "🧪 Testing PRODUCTION API: $API_URL"
else
    echo "❌ Invalid environment. Usage: ./test-airbnb-api.sh [local|production]"
    exit 1
fi

# Lire l'API Key depuis .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$AIRBNB_API_SECRET" ]; then
    echo "❌ AIRBNB_API_SECRET not found in .env.local"
    echo "Please add: AIRBNB_API_SECRET=your-api-key"
    exit 1
fi

echo "🔑 Using API Key: ${AIRBNB_API_SECRET:0:10}..."

# Test 1: Vérifier que l'endpoint existe
echo ""
echo "📋 Test 1: Check endpoint availability"
echo "----------------------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/airbnb/sync")
if [ "$response" = "405" ]; then
    echo "✅ Endpoint exists (405 Method Not Allowed for GET)"
else
    echo "❌ Unexpected response: $response"
fi

# Test 2: Tester sans authentification
echo ""
echo "📋 Test 2: Test without authentication"
echo "----------------------------------------"
response=$(curl -s -X POST "$API_URL/api/airbnb/sync" \
    -H "Content-Type: application/json" \
    -d '{"reservations":[]}')
echo "$response" | jq '.'
if echo "$response" | grep -q "Missing or invalid Authorization header"; then
    echo "✅ Authentication required (as expected)"
else
    echo "❌ Authentication should be required"
fi

# Test 3: Tester avec une API Key invalide
echo ""
echo "📋 Test 3: Test with invalid API key"
echo "----------------------------------------"
response=$(curl -s -X POST "$API_URL/api/airbnb/sync" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer invalid-key" \
    -d '{"reservations":[]}')
echo "$response" | jq '.'
if echo "$response" | grep -q "Invalid API key"; then
    echo "✅ Invalid API key rejected (as expected)"
else
    echo "❌ Invalid API key should be rejected"
fi

# Test 4: Tester avec un payload invalide
echo ""
echo "📋 Test 4: Test with invalid payload"
echo "----------------------------------------"
response=$(curl -s -X POST "$API_URL/api/airbnb/sync" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AIRBNB_API_SECRET" \
    -d '{"invalid":"payload"}')
echo "$response" | jq '.'
if echo "$response" | grep -q "Validation failed"; then
    echo "✅ Invalid payload rejected (as expected)"
else
    echo "❌ Invalid payload should be rejected"
fi

# Test 5: Tester avec une réservation valide (listing_id non mappé)
echo ""
echo "📋 Test 5: Test with valid reservation (unmapped listing_id)"
echo "----------------------------------------"
response=$(curl -s -X POST "$API_URL/api/airbnb/sync" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AIRBNB_API_SECRET" \
    -d '{
        "reservations": [
            {
                "id": "HMTEST123",
                "listing_id": "99999999",
                "statut": "Confirmée",
                "voyageur": "Test User",
                "nb_voyageurs": 2,
                "date_arrivee": "2026-06-01",
                "date_depart": "2026-06-05",
                "nb_nuits": 4,
                "montant_total": 40000.00,
                "devise": "DZD",
                "base_price": 35000.00,
                "cleaning_fee": 3000.00,
                "service_fee": 1500.00,
                "taxes": 500.00,
                "guest_email": "test@example.com",
                "guest_phone": "+213555123456"
            }
        ],
        "sync_metadata": {
            "sync_type": "manual",
            "timestamp": "2026-05-18T10:00:00Z",
            "script_version": "2.0.0"
        }
    }')
echo "$response" | jq '.'
if echo "$response" | grep -q "not mapped"; then
    echo "✅ Unmapped listing_id detected (as expected)"
    echo "ℹ️  To fix: Add airbnb_listing_id to lofts table"
else
    echo "⚠️  Check response above"
fi

# Test 6: Vérifier les logs dans Supabase
echo ""
echo "📋 Test 6: Check sync logs in Supabase"
echo "----------------------------------------"
echo "ℹ️  Run this SQL query in Supabase:"
echo ""
echo "SELECT sync_batch_id, sync_type, status, reservations_received, reservations_created, reservations_skipped"
echo "FROM airbnb_sync_logs"
echo "ORDER BY started_at DESC"
echo "LIMIT 5;"
echo ""

# Résumé
echo ""
echo "========================================="
echo "🎉 Tests completed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Check Supabase logs (airbnb_sync_logs table)"
echo "2. Add airbnb_listing_id to lofts table"
echo "3. Re-run test with mapped listing_id"
echo ""
