#!/bin/bash

echo "🔄 Monitoring domain status (press Ctrl+C to stop)..."
echo ""

while true; do
    echo -n "$(date '+%H:%M:%S') - "
    
    # Test apex domain
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 https://blaze-intelligence.com 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        echo "✅ blaze-intelligence.com is LIVE! (HTTP $STATUS)"
        break
    elif [ "$STATUS" = "000" ]; then
        echo "⏳ blaze-intelligence.com - No response (timeout)"
    else
        echo "⚠️ blaze-intelligence.com - HTTP $STATUS"
    fi
    
    sleep 10
done

echo ""
echo "🎉 Domain is now accessible!"
echo "Running full test..."
echo ""
./test-domains.sh