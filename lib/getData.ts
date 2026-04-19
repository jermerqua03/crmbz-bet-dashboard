// Loads dashboard data both client and server (always works on Vercel and locally)
const PROD_URL = 'https://crmbz-bet-dashboard.vercel.app/dashboard-data.json';

export async function getData() {
  let url = PROD_URL;
  // Use environment variable if available (Vercel server), else fallback
  if (typeof window !== 'undefined') {
    url = '/dashboard-data.json'
  } else if (process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}/dashboard-data.json`
  }
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return await res.json();
  } catch {
    return {
      currentBankroll: 1000, startingBankroll: 1000, netProfit: 0, roi: 0, wins: 0, losses: 0, winRate: 0, daysRemaining: 14,
      bankrollHistory: [], strategies: [], bets: [], todaysBets: []
    };
  }
}
