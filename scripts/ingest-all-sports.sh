#!/bin/bash

# Blaze Intelligence - Comprehensive Sports Data Ingestion Pipeline
# Ingests data from all major sports leagues and stores in Cloudflare

set -e

echo "🔥 Blaze Intelligence Data Ingestion Pipeline"
echo "============================================="
echo ""

# Configuration
DATA_DIR="./data/ingested"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/ingestion_${TIMESTAMP}.log"

# Create directories
mkdir -p "$DATA_DIR/mlb" "$DATA_DIR/nfl" "$DATA_DIR/nba" "$DATA_DIR/ncaa" "./logs"

# Initialize log
echo "Starting ingestion at $(date)" > "$LOG_FILE"

# Function to log messages
log_message() {
    echo "$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to ingest MLB data
ingest_mlb() {
    log_message "📊 Ingesting MLB data..."
    
    # Fetch all teams
    curl -s "https://statsapi.mlb.com/api/v1/teams?sportId=1" \
        -o "$DATA_DIR/mlb/teams_${TIMESTAMP}.json" || true
    
    # Fetch current standings
    curl -s "https://statsapi.mlb.com/api/v1/standings?leagueId=103,104" \
        -o "$DATA_DIR/mlb/standings_${TIMESTAMP}.json" || true
    
    # Fetch today's games
    TODAY=$(date +%Y-%m-%d)
    curl -s "https://statsapi.mlb.com/api/v1/schedule?date=${TODAY}&sportId=1" \
        -o "$DATA_DIR/mlb/schedule_${TIMESTAMP}.json" || true
    
    # Cardinals specific data (Team ID: 138)
    curl -s "https://statsapi.mlb.com/api/v1/teams/138/roster" \
        -o "$DATA_DIR/mlb/cardinals_roster_${TIMESTAMP}.json" || true
    
    curl -s "https://statsapi.mlb.com/api/v1/teams/138/stats?season=2024&group=hitting,pitching,fielding" \
        -o "$DATA_DIR/mlb/cardinals_stats_${TIMESTAMP}.json" || true
    
    log_message "✅ MLB data ingested"
}

# Function to ingest NFL data
ingest_nfl() {
    log_message "🏈 Ingesting NFL data..."
    
    # ESPN API (no key required)
    curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams" \
        -o "$DATA_DIR/nfl/teams_espn_${TIMESTAMP}.json" || true
    
    curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" \
        -o "$DATA_DIR/nfl/scoreboard_${TIMESTAMP}.json" || true
    
    # Titans specific (Team ID varies by API)
    curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/10" \
        -o "$DATA_DIR/nfl/titans_${TIMESTAMP}.json" || true
    
    # If SportsDataIO key is available
    if [ ! -z "$SPORTSDATAIO_KEY" ]; then
        curl -s "https://api.sportsdata.io/v3/nfl/scores/json/Teams" \
            -H "Ocp-Apim-Subscription-Key: $SPORTSDATAIO_KEY" \
            -o "$DATA_DIR/nfl/teams_sportsdata_${TIMESTAMP}.json" || true
            
        curl -s "https://api.sportsdata.io/v3/nfl/scores/json/Standings/2024" \
            -H "Ocp-Apim-Subscription-Key: $SPORTSDATAIO_KEY" \
            -o "$DATA_DIR/nfl/standings_${TIMESTAMP}.json" || true
    else
        log_message "⚠️  No SportsDataIO key found, skipping premium NFL data"
    fi
    
    log_message "✅ NFL data ingested"
}

# Function to ingest NBA data
ingest_nba() {
    log_message "🏀 Ingesting NBA data..."
    
    # ESPN API for NBA
    curl -s "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams" \
        -o "$DATA_DIR/nba/teams_${TIMESTAMP}.json" || true
    
    curl -s "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" \
        -o "$DATA_DIR/nba/scoreboard_${TIMESTAMP}.json" || true
    
    # Grizzlies specific (ESPN Team ID: 29)
    curl -s "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/29" \
        -o "$DATA_DIR/nba/grizzlies_${TIMESTAMP}.json" || true
    
    curl -s "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/29/roster" \
        -o "$DATA_DIR/nba/grizzlies_roster_${TIMESTAMP}.json" || true
    
    log_message "✅ NBA data ingested"
}

# Function to ingest NCAA data
ingest_ncaa() {
    log_message "🎓 Ingesting NCAA data..."
    
    # ESPN College Football
    curl -s "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams" \
        -o "$DATA_DIR/ncaa/cfb_teams_${TIMESTAMP}.json" || true
    
    # Texas Longhorns (ESPN Team ID: 251)
    curl -s "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/251" \
        -o "$DATA_DIR/ncaa/longhorns_${TIMESTAMP}.json" || true
    
    # CollegeFootballData API (if key available)
    if [ ! -z "$CFBD_KEY" ]; then
        curl -s "https://api.collegefootballdata.com/teams/fbs" \
            -H "Authorization: Bearer $CFBD_KEY" \
            -o "$DATA_DIR/ncaa/cfbd_teams_${TIMESTAMP}.json" || true
            
        curl -s "https://api.collegefootballdata.com/stats/season?year=2024&team=Texas" \
            -H "Authorization: Bearer $CFBD_KEY" \
            -o "$DATA_DIR/ncaa/longhorns_stats_${TIMESTAMP}.json" || true
            
        curl -s "https://api.collegefootballdata.com/rankings?year=2024&seasonType=regular" \
            -H "Authorization: Bearer $CFBD_KEY" \
            -o "$DATA_DIR/ncaa/rankings_${TIMESTAMP}.json" || true
    else
        log_message "⚠️  No CollegeFootballData key found, using ESPN data only"
    fi
    
    log_message "✅ NCAA data ingested"
}

# Function to process and store in Cloudflare KV
process_to_kv() {
    log_message "☁️  Processing data to Cloudflare KV..."
    
    # Process each sport's data
    for sport in mlb nfl nba ncaa; do
        if [ -d "$DATA_DIR/$sport" ]; then
            # Find the most recent file for each type
            latest_teams=$(ls -t "$DATA_DIR/$sport"/teams*.json 2>/dev/null | head -1)
            latest_standings=$(ls -t "$DATA_DIR/$sport"/standings*.json 2>/dev/null | head -1)
            latest_schedule=$(ls -t "$DATA_DIR/$sport"/*schedule*.json 2>/dev/null | head -1)
            
            # Upload to KV if files exist
            if [ -f "$latest_teams" ]; then
                npx wrangler kv:key put "${sport}_teams" --path "$latest_teams" \
                    --namespace-id="${KV_CACHE_ID:-a53c3726fc3044be82e79d2d1e371d26}" 2>/dev/null || true
                log_message "  Uploaded ${sport} teams to KV"
            fi
            
            if [ -f "$latest_standings" ]; then
                npx wrangler kv:key put "${sport}_standings" --path "$latest_standings" \
                    --namespace-id="${KV_CACHE_ID:-a53c3726fc3044be82e79d2d1e371d26}" 2>/dev/null || true
                log_message "  Uploaded ${sport} standings to KV"
            fi
        fi
    done
    
    log_message "✅ Data processed to KV"
}

# Function to generate summary report
generate_summary() {
    log_message "📝 Generating summary report..."
    
    SUMMARY_FILE="$DATA_DIR/summary_${TIMESTAMP}.json"
    
    cat > "$SUMMARY_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "ingestion_id": "${TIMESTAMP}",
    "sports_processed": {
        "mlb": {
            "files": $(ls "$DATA_DIR/mlb" 2>/dev/null | wc -l),
            "latest_update": "$(date)"
        },
        "nfl": {
            "files": $(ls "$DATA_DIR/nfl" 2>/dev/null | wc -l),
            "latest_update": "$(date)"
        },
        "nba": {
            "files": $(ls "$DATA_DIR/nba" 2>/dev/null | wc -l),
            "latest_update": "$(date)"
        },
        "ncaa": {
            "files": $(ls "$DATA_DIR/ncaa" 2>/dev/null | wc -l),
            "latest_update": "$(date)"
        }
    },
    "total_files": $(find "$DATA_DIR" -name "*.json" | wc -l),
    "total_size": "$(du -sh "$DATA_DIR" | cut -f1)",
    "status": "completed"
}
EOF
    
    log_message "✅ Summary report generated: $SUMMARY_FILE"
}

# Function to clean old data
cleanup_old_data() {
    log_message "🧹 Cleaning old data..."
    
    # Keep only last 7 days of data
    find "$DATA_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    
    # Keep only last 30 log files
    ls -t ./logs/ingestion_*.log 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true
    
    log_message "✅ Old data cleaned"
}

# Main execution
main() {
    log_message "Starting comprehensive sports data ingestion..."
    
    # Run ingestion for each sport
    ingest_mlb
    ingest_nfl
    ingest_nba
    ingest_ncaa
    
    # Process to KV if in production
    if [ "$NODE_ENV" = "production" ]; then
        process_to_kv
    fi
    
    # Generate summary
    generate_summary
    
    # Cleanup old files
    cleanup_old_data
    
    log_message "============================================="
    log_message "✅ Ingestion pipeline completed successfully!"
    log_message "Total files: $(find "$DATA_DIR" -name "*.json" | wc -l)"
    log_message "Log file: $LOG_FILE"
    
    # Return success
    exit 0
}

# Run main function
main