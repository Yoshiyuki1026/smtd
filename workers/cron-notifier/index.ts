// Cron Worker for SMTD Slack notifications
// Triggers: 9:00 JST, 12:00 JST, 21:00 JST

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const hour = new Date(event.scheduledTime).getUTCHours();
    
    // UTC to JST mapping
    // JST 9:00 = UTC 0:00
    // JST 12:00 = UTC 3:00  
    // JST 21:00 = UTC 12:00
    let context: string;
    if (hour === 0) {
      context = 'morning';
    } else if (hour === 3) {
      context = 'midday';
    } else if (hour === 12) {
      context = 'evening';
    } else {
      return; // Unknown schedule
    }

    const url = `https://smtd.neuro-ronin.com/api/slack/notify?context=${context}`;
    
    try {
      const response = await fetch(url);
      const result = await response.json();
      console.log(`Cron executed: ${context}`, result);
    } catch (error) {
      console.error(`Cron failed: ${context}`, error);
    }
  },
};

interface Env {}
