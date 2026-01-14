import { state } from './state.js';
import { PRODUCTS, getAvailableConfigs, getOddsForProduct, getAllParallelsForProduct, getAllInsertsForProduct, getAllAutographsForProduct } from './data.js';
import { parseOdds, formatOdds, getRarityColor, getRarityBg, getRarityTier } from './utils.js';
import { findSleeperHit, findBestValueConfig, findChaseCards, calculateExpectedHits, groupByRarityTier } from './insights.js';

export function renderViewTabs() {
    return `
        <div class="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-4">
            <button onclick="setView('compare')" class="px-3 py-1.5 rounded text-sm font-medium transition-all ${state.view === 'compare' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}">⚖️ Compare</button>
            <button onclick="setView('bubbles')" class="px-3 py-1.5 rounded text-sm font-medium transition-all ${state.view === 'bubbles' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}">🫧 Bubbles</button>
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
    
    // Default to 'base' if not set or invalid
    const subTab = state.compareTab || 'base';
    
    // Determine which tables to show
    let tableContent = '';
    if (subTab === 'base') {
        tableContent = parallels.size > 0 
            ? renderComparisonTable('Base Parallels', parallels, configs)
            : '<p class="text-zinc-500 text-center py-8">No base parallel data available</p>';
    } else if (subTab === 'inserts') {
        tableContent = inserts.size > 0 
            ? renderComparisonTable('Inserts', inserts, configs, true)
            : '<p class="text-zinc-500 text-center py-8">No insert data available</p>';
    } else if (subTab === 'autos') {
        tableContent = autographs.size > 0 
            ? renderComparisonTable('Autographs', autographs, configs)
            : '<p class="text-zinc-500 text-center py-8">No autograph data available</p>';
    }
    
    // Count items for badges
    const baseCount = parallels.size;
    const insertCount = inserts.size;
    const autoCount = autographs.size;
    
    return `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">⚖️ Config Comparison</h3>
            <p class="text-zinc-500 text-sm">Compare odds across all box types</p>
        </div>
        
        <!-- Sub-tabs -->
        <div class="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg w-fit">
            <button onclick="setCompareTab('base')" 
                class="px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === 'base' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}">
                Base Parallels ${baseCount > 0 ? '<span class="ml-1 text-xs text-zinc-500">(' + baseCount + ')</span>' : ''}
            </button>
            <button onclick="setCompareTab('inserts')" 
                class="px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === 'inserts' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}">
                Inserts ${insertCount > 0 ? '<span class="ml-1 text-xs text-zinc-500">(' + insertCount + ')</span>' : ''}
            </button>
            <button onclick="setCompareTab('autos')" 
                class="px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === 'autos' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}">
                Autographs ${autoCount > 0 ? '<span class="ml-1 text-xs text-zinc-500">(' + autoCount + ')</span>' : ''}
            </button>
        </div>

        ${tableContent}

        <div class="mt-4 text-xs text-zinc-600">✓ = Best odds for this card</div>
    `;
}

export function renderBubblesView() {
    const currentOdds = getOddsForProduct(state.product, state.config);
    if (!currentOdds.base_parallels) return '<p class="text-zinc-500">No parallel data available</p>';
    
    // Prepare data for bubbles
    const bubbleData = currentOdds.base_parallels
        .filter(p => p.odds)
        .map(p => {
            const odds = parseOdds(p.odds);
            const tier = getRarityTier(p.odds);
            return {
                name: p.name,
                odds: p.odds,
                oddsNum: odds,
                tier: tier.name,
                color: tier.color
            };
        });
    
    // Store data globally for the chart function
    window.bubbleChartData = bubbleData;
    
    // Schedule chart rendering after DOM update
    setTimeout(() => renderBubbleChart(), 0);
    
    return `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">🫧 Rarity Bubbles</h3>
            <p class="text-zinc-500 text-sm">Bubble size = pull rate. Bigger = easier to pull.</p>
            ${renderConfigSelector(state.product)}
        </div>
        
        <div id="bubbleChart" class="w-full bg-zinc-900 rounded-lg relative overflow-hidden" style="height: 500px;"></div>
        
        <div class="mt-6 flex flex-wrap justify-center gap-6 text-xs text-zinc-500">
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Common (1:1-1:10)</span>
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Uncommon (1:11-1:50)</span>
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-violet-500"></span> Rare (1:51-1:200)</span>
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-orange-500"></span> Chase (1:200+)</span>
        </div>
    `;
}

function renderBubbleChart() {
    const data = window.bubbleChartData;
    if (!data) return;
    
    const container = document.getElementById('bubbleChart');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Clear previous
    container.innerHTML = '';
    
    // Color mapping
    const colors = {
        emerald: '#10b981',
        blue: '#3b82f6',
        violet: '#8b5cf6',
        orange: '#f97316'
    };
    
    // Calculate bubble sizes (inverse of odds - rarer = smaller)
    const maxOdds = Math.max(...data.map(d => d.oddsNum));
    const minRadius = 20;
    const maxRadius = 70;
    
    data.forEach(d => {
        const logMax = Math.log(maxOdds + 1);
        const logOdds = Math.log(d.oddsNum + 1);
        d.radius = maxRadius - ((logOdds / logMax) * (maxRadius - minRadius));
        d.x = width / 2 + (Math.random() - 0.5) * 100;
        d.y = height / 2 + (Math.random() - 0.5) * 100;
    });
    
    // Create SVG
    const svg = d3.select('#bubbleChart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Add glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
    filter.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Create force simulation
    const simulation = d3.forceSimulation(data)
        .force('charge', d3.forceManyBody().strength(10))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 5))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));
    
    // Create bubble groups
    const bubbles = svg.selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .style('cursor', 'grab')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles
    bubbles.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => colors[d.color])
        .attr('fill-opacity', 0.75)
        .attr('stroke', d => colors[d.color])
        .attr('stroke-width', 2)
        .style('filter', 'url(#glow)');
    
    // Add labels
    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .attr('fill', 'white')
        .attr('font-size', d => Math.max(10, d.radius / 4))
        .attr('font-weight', '600')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 10 ? d.name.slice(0, 8) + '...' : d.name);
    
    // Add odds labels
    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.1em')
        .attr('fill', 'rgba(255,255,255,0.8)')
        .attr('font-size', d => Math.max(9, d.radius / 5))
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .text(d => d.odds);
    
    // Hover effects
    bubbles
        .on('mouseover', function(event, d) {
            d3.select(this).select('circle')
                .transition()
                .duration(150)
                .attr('fill-opacity', 1)
                .attr('r', d.radius * 1.15);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).select('circle')
                .transition()
                .duration(150)
                .attr('fill-opacity', 0.75)
                .attr('r', d.radius);
        });
    
    // Update positions on tick
    simulation.on('tick', () => {
        bubbles.attr('transform', d => {
            d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
            d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
            return `translate(${d.x},${d.y})`;
        });
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Gentle floating animation
    window.bubbleInterval = setInterval(() => {
        if (document.getElementById('bubbleChart')) {
            simulation.alpha(0.1).restart();
        } else {
            clearInterval(window.bubbleInterval);
        }
    }, 4000);
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
        case 'bubbles': viewContent = renderBubblesView(); break;
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
