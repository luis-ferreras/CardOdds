import { state } from './state.js';
import { PRODUCTS, getAvailableConfigs, getOddsForProduct, getAllParallelsForProduct, getAllInsertsForProduct, getAllAutographsForProduct } from './data.js';
import { parseOdds, formatOdds, getRarityColor, getRarityBg, getRarityTier } from './utils.js';
import { findSleeperHit, findBestValueConfig, findChaseCards, calculateExpectedHits, groupByRarityTier } from './insights.js';

export function renderViewTabs() {
    return `
        <div class="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-4">
            <button onclick="setView('compare')" class="px-3 py-1.5 rounded text-sm font-medium transition-all ${state.view === 'compare' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}">⚖️ Compare</button>
            <button onclick="setView('ladder')" class="px-3 py-1.5 rounded text-sm font-medium transition-all ${state.view === 'ladder' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}">🪜 Ladder</button>
            <button onclick="setView('calculator')" class="px-3 py-1.5 rounded text-sm font-medium transition-all ${state.view === 'calculator' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}">🧮 Calculator</button>
            <button onclick="setView('insights')" class="px-3 py-1.5 rounded text-sm font-medium transition-all ${state.view === 'insights' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}">💡 Insights</button>
        </div>
    `;
}

export function renderConfigSelector(productId) {
    return `
        <div class="flex flex-wrap gap-2 mt-4">
            ${getAvailableConfigs(productId).map(key => `
                <button onclick="setConfig('${key}')" class="px-3 py-1.5 rounded text-xs font-medium transition-all capitalize ${state.config === key ? 'bg-zinc-700 text-white' : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'}">${key}</button>
            `).join('')}
        </div>
    `;
}

export function renderComparisonTable(title, dataMap, configs, showSSP = false) {
    if (dataMap.size === 0) return '';
    return `
        <div class="mb-8">
            <h3 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">${title}</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-zinc-800">
                            <th class="text-left py-3 px-2 text-zinc-400 font-medium">Name</th>
                            ${configs.map(c => `<th class="text-center py-3 px-2 text-zinc-400 font-medium capitalize">${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from(dataMap.entries()).map(([name, configOdds]) => {
                            let bestConfig = null;
                            let bestOddsNum = Infinity;
                            configs.forEach(c => {
                                if (configOdds[c]) {
                                    const num = parseOdds(configOdds[c]);
                                    if (num < bestOddsNum) { bestOddsNum = num; bestConfig = c; }
                                }
                            });
                            const isSSP = showSSP && configOdds.isSSP;
                            return `
                                <tr class="border-b border-zinc-800/50">
                                    <td class="py-3 px-2 text-zinc-200">${name}${isSSP ? '<span class="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">SSP</span>' : ''}</td>
                                    ${configs.map(c => {
                                        const odds = configOdds[c];
                                        const isBest = c === bestConfig && configs.length > 1;
                                        return `<td class="text-center py-3 px-2"><span class="font-mono ${isBest ? 'text-emerald-400 font-bold' : getRarityColor(odds)}">${odds || '—'}</span>${isBest ? '<span class="ml-1 text-xs">✓</span>' : ''}</td>`;
                                    }).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export function renderCompareView() {
    const parallels = getAllParallelsForProduct(state.product);
    const inserts = getAllInsertsForProduct(state.product);
    const autographs = getAllAutographsForProduct(state.product);
    const configs = getAvailableConfigs(state.product);
    return `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">⚖️ Config Comparison</h3>
            <p class="text-zinc-500 text-sm">Compare odds across all box types</p>
        </div>
        ${renderComparisonTable('Base Parallels', parallels, configs)}
        ${renderComparisonTable('Inserts', inserts, configs, true)}
        ${renderComparisonTable('Autographs', autographs, configs)}
        <div class="mt-4 text-xs text-zinc-600">✓ = Best odds for this card</div>
    `;
}

export function renderLadderView() {
    const currentOdds = getOddsForProduct(state.product, state.config);
    if (!currentOdds.base_parallels) return '<p class="text-zinc-500">No parallel data available</p>';
    const sorted = [...currentOdds.base_parallels].filter(p => p.odds).sort((a, b) => parseOdds(a.odds) - parseOdds(b.odds));
    const maxOdds = Math.max(...sorted.map(p => parseOdds(p.odds)));
    return `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">🪜 Rarity Ladder</h3>
            <p class="text-zinc-500 text-sm">Visual progression from common to chase</p>
            ${renderConfigSelector(state.product)}
        </div>
        <div class="space-y-3">
            ${sorted.map(p => {
                const odds = parseOdds(p.odds);
                const width = Math.min(100, (Math.log(odds + 1) / Math.log(maxOdds + 1)) * 100);
                const tier = getRarityTier(p.odds);
                return `
                    <div class="bg-zinc-900 rounded-lg p-3">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-sm">${tier.emoji}</span>
                                <span class="text-zinc-200 font-medium">${p.name}</span>
                            </div>
                            <span class="font-mono text-sm ${getRarityColor(p.odds)}">${p.odds}</span>
                        </div>
                        <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div class="h-full ${getRarityBg(p.odds)} ladder-bar rounded-full" style="width: ${Math.max(5, width)}%"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="mt-6 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span>🟢 Common (1:1-1:10)</span>
            <span>🔵 Uncommon (1:11-1:50)</span>
            <span>🟣 Rare (1:51-1:200)</span>
            <span>🟠 Chase (1:200+)</span>
        </div>
    `;
}

export function renderCalculatorView() {
    const product = PRODUCTS[state.product];
    const expected = calculateExpectedHits(state.product, state.config);
    const configInfo = product.configs[state.config] || {};
    const totalCards = (configInfo.packs || 0) * (configInfo.cardsPerPack || 0);
    return `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">🧮 Expected Hits Calculator</h3>
            <p class="text-zinc-500 text-sm">What you can expect to pull per box</p>
            ${renderConfigSelector(state.product)}
        </div>
        <div class="bg-zinc-900 rounded-lg p-4 mb-6">
            <div class="text-zinc-500 text-xs uppercase tracking-wide mb-1">Box Configuration</div>
            <div class="text-white">
                <span class="text-2xl font-bold">${totalCards}</span>
                <span class="text-zinc-400 ml-2">total cards (${configInfo.packs} packs × ${configInfo.cardsPerPack} cards)</span>
            </div>
        </div>
        <div class="grid gap-2">
            ${expected.map(e => {
                const isGuaranteed = e.expected >= 1;
                return `
                    <div class="bg-zinc-900 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-zinc-200">${e.name}</span>
                            <span class="text-xs text-zinc-500">${e.odds}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-mono font-bold ${isGuaranteed ? 'text-emerald-400' : 'text-amber-400'}">${isGuaranteed ? '~' + e.display : e.display + ' chance'}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="mt-4 text-xs text-zinc-600">Note: These are statistical averages. Actual results will vary.</div>
    `;
}

export function renderInsightsView() {
    const chaseCards = findChaseCards(state.product, state.config);
    const tiers = groupByRarityTier(state.product, state.config);
    const sleeperHit = findSleeperHit(state.product, state.config);
    const parallels = getAllParallelsForProduct(state.product);
    const bestValues = [];
    parallels.forEach((configOdds, name) => {
        const best = findBestValueConfig(state.product, name);
        if (best) bestValues.push({ name, ...best });
    });
    return `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">💡 Insights Dashboard</h3>
            <p class="text-zinc-500 text-sm">Key insights and analysis for this product</p>
            ${renderConfigSelector(state.product)}
        </div>
        <div class="grid gap-6 md:grid-cols-2">
            ${sleeperHit ? `
            <div class="sleeper-gradient rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <div class="text-2xl">💤</div>
                    <div>
                        <div class="text-xs uppercase tracking-wide text-amber-900 font-semibold mb-1">Sleeper Hit</div>
                        <div class="text-lg font-bold text-zinc-900">${sleeperHit.card}</div>
                        <div class="text-amber-900 font-semibold">${sleeperHit.odds}</div>
                        <p class="text-amber-900/80 text-sm mt-1">${sleeperHit.reason}</p>
                    </div>
                </div>
            </div>
            ` : ''}
            <div class="bg-zinc-900 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">🎯</span>
                    <h4 class="font-semibold text-white">Chase Cards</h4>
                </div>
                ${chaseCards.length > 0 ? `
                    <div class="space-y-2">
                        ${chaseCards.map(c => `
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-300 text-sm">${c.name}</span>
                                <span class="font-mono text-xs ${getRarityColor(c.odds)}">${c.odds}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-zinc-500 text-sm">No chase cards (1:200+) in this config</p>'}
            </div>
            <div class="bg-zinc-900 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">💰</span>
                    <h4 class="font-semibold text-white">Best Value Config</h4>
                </div>
                <div class="space-y-2">
                    ${bestValues.slice(0, 5).map(v => `
                        <div class="flex justify-between items-center">
                            <span class="text-zinc-300 text-sm">${v.name}</span>
                            <span class="text-xs">
                                <span class="text-emerald-400 font-medium capitalize">${v.config}</span>
                                <span class="text-zinc-500 ml-1">${v.odds}</span>
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="bg-zinc-900 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">📊</span>
                    <h4 class="font-semibold text-white">Rarity Breakdown</h4>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="text-center p-2 bg-emerald-500/10 rounded">
                        <div class="text-2xl font-bold text-emerald-400">${tiers.common.length}</div>
                        <div class="text-xs text-zinc-500">Common</div>
                    </div>
                    <div class="text-center p-2 bg-blue-500/10 rounded">
                        <div class="text-2xl font-bold text-blue-400">${tiers.uncommon.length}</div>
                        <div class="text-xs text-zinc-500">Uncommon</div>
                    </div>
                    <div class="text-center p-2 bg-violet-500/10 rounded">
                        <div class="text-2xl font-bold text-violet-400">${tiers.rare.length}</div>
                        <div class="text-xs text-zinc-500">Rare</div>
                    </div>
                    <div class="text-center p-2 bg-orange-500/10 rounded">
                        <div class="text-2xl font-bold text-orange-400">${tiers.chase.length}</div>
                        <div class="text-xs text-zinc-500">Chase</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderProductContent() {
    const product = PRODUCTS[state.product];
    if (!product) {
        document.getElementById('productContent').innerHTML = '<p class="text-zinc-500">No data available</p>';
        return;
    }
    let viewContent = '';
    switch (state.view) {
        case 'ladder': viewContent = renderLadderView(); break;
        case 'calculator': viewContent = renderCalculatorView(); break;
        case 'insights': viewContent = renderInsightsView(); break;
        default: viewContent = renderCompareView();
    }
    document.getElementById('productContent').innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-semibold text-white">${product.name}</h2>
            <p class="text-zinc-500 text-sm mt-1">${product.sport} • ${product.brand} • ${product.year}</p>
        </div>
        ${renderViewTabs()}
        ${viewContent}
        <div class="text-center text-zinc-600 text-xs mt-12 pb-8">Data from Google Sheets • Last loaded: ${new Date().toLocaleTimeString()}</div>
    `;
}
