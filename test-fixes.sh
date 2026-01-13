#!/bin/bash

# Comprehensive test script for all 5 critical fixes
# Run this after starting the server with: npm run dev -w packages/server

BASE_URL="http://localhost:3000/api"

echo "=========================================="
echo "Testing Promptetheus Critical Fixes"
echo "=========================================="

# Test 1: Authentication
echo -e "\n=== Test 1: Authentication ==="
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser_'$(date +%s)'","password":"testpass123"}')

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "✓ Registration successful"
  echo "✓ Token received: ${TOKEN:0:50}..."
else
  echo "✗ Registration failed"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

# Test 2: Create Project
echo -e "\n=== Test 2: Create Project ==="
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Project"}')

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id')
if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
  echo "✓ Project created: $PROJECT_ID"
else
  echo "✗ Project creation failed"
  echo "Response: $PROJECT_RESPONSE"
  exit 1
fi

# Test 3: Create Intent (tests version field)
echo -e "\n=== Test 3: Create Intent with Version Field ==="
INTENT_RESPONSE=$(curl -s -X POST $BASE_URL/intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"name\":\"Test Intent\",\"schema\":{\"type\":\"object\",\"properties\":{\"input\":{\"type\":\"string\"}}}}")

INTENT_ID=$(echo "$INTENT_RESPONSE" | jq -r '.id')
INTENT_VERSION=$(echo "$INTENT_RESPONSE" | jq -r '.version')

if [ -n "$INTENT_ID" ] && [ "$INTENT_ID" != "null" ]; then
  echo "✓ Intent created: $INTENT_ID"
  if [ "$INTENT_VERSION" == "1" ]; then
    echo "✓ Version field present and correct: $INTENT_VERSION"
  else
    echo "✗ Version field missing or incorrect: $INTENT_VERSION"
  fi
else
  echo "✗ Intent creation failed"
  echo "Response: $INTENT_RESPONSE"
  exit 1
fi

# Test 4: Authorization - Create second user and test 403
echo -e "\n=== Test 4: Authorization Security (Fix #2) ==="
TOKEN2=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"malicious_'$(date +%s)'","password":"hack123"}' | jq -r '.token')

# Try to create intent in user1's project with user2's token
FORBIDDEN_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" -X POST $BASE_URL/intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"name\":\"Malicious Intent\",\"schema\":{\"type\":\"object\"}}")

STATUS_CODE=$(echo "$FORBIDDEN_RESPONSE" | grep "STATUS:" | cut -d: -f2)
if [ "$STATUS_CODE" == "403" ]; then
  echo "✓ Authorization check working - returned 403 Forbidden"
else
  echo "✗ Authorization FAILED - returned $STATUS_CODE instead of 403"
  echo "Response: $FORBIDDEN_RESPONSE"
  exit 1
fi

# Try to read user1's intent with user2's token
FORBIDDEN_RESPONSE2=$(curl -s -w "\nSTATUS:%{http_code}" -X GET "$BASE_URL/intents/$INTENT_ID" \
  -H "Authorization: Bearer $TOKEN2")

STATUS_CODE2=$(echo "$FORBIDDEN_RESPONSE2" | grep "STATUS:" | cut -d: -f2)
if [ "$STATUS_CODE2" == "403" ]; then
  echo "✓ Read authorization working - returned 403 Forbidden"
else
  echo "✗ Read authorization FAILED - returned $STATUS_CODE2 instead of 403"
  exit 1
fi

# Test 5: Forge with version field (tests Fix #1)
echo -e "\n=== Test 5: Forge Prompts with Version Field ==="
FORGE_RESPONSE=$(curl -s -X POST "$BASE_URL/intents/$INTENT_ID/forge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"providers":["openai"]}')

FORGED_VERSION=$(echo "$FORGE_RESPONSE" | jq -r '.[0].version')
if [ "$FORGED_VERSION" == "1" ]; then
  echo "✓ Forged prompt has version field: $FORGED_VERSION"
else
  echo "✗ Forged prompt missing version field"
  echo "Response: $FORGE_RESPONSE"
  exit 1
fi

# Test 6: Execute and check executions endpoint doesn't crash
echo -e "\n=== Test 6: Execute and Verify Executions Endpoint ==="
EXECUTE_RESPONSE=$(curl -s -X POST "$BASE_URL/intents/$INTENT_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"providers":["openai"],"input":{"test":"data"}}')

EXECUTE_SUCCESS=$(echo "$EXECUTE_RESPONSE" | jq -r '.[0].provider')
if [ "$EXECUTE_SUCCESS" == "openai" ]; then
  echo "✓ Execute endpoint working"
else
  echo "✗ Execute endpoint failed"
  echo "Response: $EXECUTE_RESPONSE"
  exit 1
fi

# Now test the executions endpoint (the critical fix)
EXECUTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/executions?intentId=$INTENT_ID" \
  -H "Authorization: Bearer $TOKEN")

EXEC_COUNT=$(echo "$EXECUTIONS_RESPONSE" | jq 'length')
if [ "$EXEC_COUNT" -gt "0" ]; then
  EXEC_VERSION=$(echo "$EXECUTIONS_RESPONSE" | jq -r '.[0].forgedPrompt.version')
  if [ "$EXEC_VERSION" == "1" ]; then
    echo "✓ Executions endpoint working - no crash!"
    echo "✓ Execution records include forgedPrompt.version: $EXEC_VERSION"
  else
    echo "✗ Executions endpoint missing version in forgedPrompt"
    echo "Response: $EXECUTIONS_RESPONSE"
  fi
else
  echo "✗ No execution records found"
  echo "Response: $EXECUTIONS_RESPONSE"
fi

# Test 7: PWA Manifest and Icons (Fix #5)
echo -e "\n=== Test 7: PWA Manifest and Icons ==="
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/manifest.json)
if [ "$MANIFEST_STATUS" == "200" ]; then
  echo "✓ Manifest accessible"
else
  echo "✗ Manifest not found (Status: $MANIFEST_STATUS)"
fi

ICON_192_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/icon-192.png)
ICON_512_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/icon-512.png)

if [ "$ICON_192_STATUS" == "200" ]; then
  echo "✓ Icon 192x192 exists"
else
  echo "✗ Icon 192x192 missing (Status: $ICON_192_STATUS)"
fi

if [ "$ICON_512_STATUS" == "200" ]; then
  echo "✓ Icon 512x512 exists"
else
  echo "✗ Icon 512x512 missing (Status: $ICON_512_STATUS)"
fi

# Test 8: Service Worker (Fix #3 and #4)
echo -e "\n=== Test 8: Service Worker ==="
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/sw.js)
if [ "$SW_STATUS" == "200" ]; then
  echo "✓ Service worker accessible"

  # Check that background sync stub is removed
  SW_CONTENT=$(curl -s http://localhost:5173/sw.js)
  if echo "$SW_CONTENT" | grep -q "syncOperations"; then
    echo "✗ Background sync stub still present (should be removed)"
  else
    echo "✓ Background sync stub removed"
  fi
else
  echo "✗ Service worker not found (Status: $SW_STATUS)"
fi

echo -e "\n=========================================="
echo "All Critical Fixes Tested!"
echo "=========================================="
