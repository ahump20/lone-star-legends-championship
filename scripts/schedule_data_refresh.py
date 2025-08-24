#!/usr/bin/env python3
"""
Blaze Intelligence Scheduled Data Refresh
Runs the complete pipeline every 30 minutes as specified in the agent manifest
"""

import time
import schedule
import logging
from datetime import datetime
from run_complete_pipeline import BlazePipeline
from deploy import BlazeDeployment

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_scheduler')

def run_scheduled_refresh():
    """Run scheduled data refresh and deployment"""
    logger.info("🔄 Starting scheduled data refresh...")
    
    try:
        # Run complete pipeline
        pipeline = BlazePipeline()
        summary = pipeline.run_complete_pipeline()
        
        # Deploy updates
        deployer = BlazeDeployment()
        deployment_success = deployer.deploy_updates()
        
        if deployment_success:
            logger.info("✅ Scheduled refresh and deployment completed successfully")
            logger.info(f"📊 Summary: {summary['total_records_processed']} records processed")
        else:
            logger.warning("⚠️  Pipeline completed but deployment failed")
            
    except Exception as e:
        logger.error(f"❌ Scheduled refresh failed: {e}")

def main():
    """Main scheduler function"""
    logger.info("🕒 Blaze Intelligence Scheduler Starting")
    logger.info("📅 Schedule: Every 30 minutes")
    logger.info("🎯 Next run: Immediate, then every 30 minutes")
    
    # Schedule the refresh every 30 minutes
    schedule.every(30).minutes.do(run_scheduled_refresh)
    
    # Run immediately on startup
    run_scheduled_refresh()
    
    # Keep scheduler running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == '__main__':
    main()