// Always loads dashboard data by HTTP fetch (for both client and server, Vercel-compatible).
const PROD_URL = 'https://crmbz-bet-dashboard.vercel.app/dashboard-data.json';

export async function getData() {
  let url = PROD_URL;
  if (typeof window !== 'undefined') url = '/dashboard-data.json';
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
