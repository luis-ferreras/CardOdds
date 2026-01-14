import { loadData, getAvailableSports, getYearsBySport, getProducts, getAvailableConfigs, PRODUCTS } from './data.js';
import { state, updateURL } from './state.js';
import { renderProductContent } from './render.js';

// Event Handlers
function onSportChange(sport, doUpdateUrl = true) {
    state.sport = sport;
    state.year = null;
    state.product = null;
    
    const yearSelect = document.getElementById('yearSelect');
    const years = getYearsBySport(sport);
    yearSelect.innerHTML = '<option value="" disabled selected>Year...</option>';
    years.forEach(y => yearSelect.innerHTML += `<option value="${y}">${y}</option>`);
    yearSelect.disabled = false;
    
    document.getElementById('productSelect').innerHTML = '<option value="" disabled selected>Product...</option>';
    document.getElementById('productSelect').disabled = true;
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('productContent').classList.add('hidden');
    
    if (doUpdateUrl) updateURL();
}

function onYearChange(year, doUpdateUrl = true) {
    state.year = year;
    state.product = null;
    
    const productSelect = document.getElementById('productSelect');
    const products = getProducts(state.sport, year);
    productSelect.innerHTML = '<option value="" disabled selected>Product...</option>';
    products.forEach(p => productSelect.innerHTML += `<option value="${p.id}">${p.brand}</option>`);
    productSelect.disabled = false;
    
    if (doUpdateUrl) updateURL();
}

function onProductChange(productId, doUpdateUrl = true) {
    state.product = productId;
    
    const availableConfigs = getAvailableConfigs(productId);
    if (availableConfigs.length > 0 && !availableConfigs.includes(state.config)) {
        state.config = availableConfigs[0];
    }
    
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('productContent').classList.remove('hidden');
    renderProductContent();
    
    if (doUpdateUrl) updateURL();
}

function setConfig(config) {
    state.config = config;
    renderProductContent();
    updateURL();
}

function setView(view) {
    state.view = view;
    renderProductContent();
    updateURL();
}

// Make handlers available globally for onclick
window.setConfig = setConfig;
window.setView = setView;

// URL loading helper
function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const sport = params.get('sport');
    const year = params.get('year');
    const product = params.get('product');
    const config = params.get('config');
    const view = params.get('view');
    
    if (config) state.config = config;
    if (view && ['compare', 'ladder', 'calculator', 'insights'].includes(view)) state.view = view;
    
    if (sport && getAvailableSports().includes(sport)) {
        document.getElementById('sportSelect').value = sport;
        onSportChange(sport, false);
        if (year && getYearsBySport(sport).includes(year)) {
            document.getElementById('yearSelect').value = year;
            onYearChange(year, false);
            if (product && PRODUCTS[product]) {
                document.getElementById('productSelect').value = product;
                onProductChange(product, false);
            }
        }
    }
}

// Initialize
async function init() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    
    const success = await loadData();
    
    loadingState.classList.add('hidden');
    
    if (!success) {
        errorState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.remove('hidden');
    
    const sportSelect = document.getElementById('sportSelect');
    getAvailableSports().forEach(sport => {
        sportSelect.innerHTML += `<option value="${sport}">${sport}</option>`;
    });
    
    sportSelect.addEventListener('change', e => onSportChange(e.target.value));
    document.getElementById('yearSelect').addEventListener('change', e => onYearChange(e.target.value));
    document.getElementById('productSelect').addEventListener('change', e => onProductChange(e.target.value));
    
    loadStateFromURL();
}

document.addEventListener('DOMContentLoaded', init);
