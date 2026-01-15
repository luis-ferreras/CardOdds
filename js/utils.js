// Odds parsing and formatting
// Converts any odds format to a "1 in X" number for calculations
// Examples: "1:4" → 4, "2:1" → 0.5, "1:50" → 50, "3:1" → 0.33
export function parseOdds(oddsStr) {
    if (!oddsStr) return null;
    
    // Handle string input
    const str = String(oddsStr).trim();
    
    // If it contains a colon, parse as ratio
    if (str.includes(':')) {
        const parts = str.split(':');
        if (parts.length !== 2) return null;
        const [left, right] = parts.map(s => parseFloat(s.trim()));
        if (isNaN(left) || isNaN(right) || right === 0) return null;
        // "1:4" means 1 in 4, so return 4
        // "2:1" means 2 in 1, so return 0.5 (1 in 0.5)
        return right / left;
    }
    
    // If it's just a number, assume it's "1:X"
    const num = parseFloat(str);
    if (!isNaN(num)) return num;
    
    return null;
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
