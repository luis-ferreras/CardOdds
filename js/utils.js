// Odds parsing and formatting
export function parseOdds(oddsStr) {
    if (!oddsStr) return null;
    const parts = oddsStr.split(':');
    if (parts.length !== 2) return null;
    const [num, denom] = parts.map(Number);
    if (num > 1) return 1 / num;
    return denom;
}

export function formatOdds(oddsStr) {
    return oddsStr || '—';
}

// Rarity helpers
export function getRarityColor(oddsStr) {
    const odds = parseOdds(oddsStr);
    if (!odds || odds < 1) return 'text-emerald-400';
    if (odds <= 20) return 'text-emerald-400';
    if (odds <= 100) return 'text-blue-400';
    if (odds <= 500) return 'text-violet-400';
    if (odds <= 2000) return 'text-amber-400';
    if (odds <= 10000) return 'text-orange-400';
    return 'text-red-400';
}

export function getRarityBg(oddsStr) {
    const odds = parseOdds(oddsStr);
    if (!odds || odds < 1) return 'bg-emerald-500';
    if (odds <= 20) return 'bg-emerald-500';
    if (odds <= 100) return 'bg-blue-500';
    if (odds <= 500) return 'bg-violet-500';
    if (odds <= 2000) return 'bg-amber-500';
    if (odds <= 10000) return 'bg-orange-500';
    return 'bg-red-500';
}

export function getRarityTier(oddsStr) {
    const odds = parseOdds(oddsStr);
    if (!odds || odds <= 10) return { name: 'Common', emoji: '🟢', color: 'emerald' };
    if (odds <= 50) return { name: 'Uncommon', emoji: '🔵', color: 'blue' };
    if (odds <= 200) return { name: 'Rare', emoji: '🟣', color: 'violet' };
    return { name: 'Chase', emoji: '🟠', color: 'orange' };
}
