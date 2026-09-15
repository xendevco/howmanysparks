const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SPARKS_PER_STANDARD_CRAFT = 2;
const SPARKS_PER_TWO_HAND = 4;
const CRESTS_PER_INFUSED_ITEM = 80;
const WEEKLY_CREST_CAP = 100;
const PRESEASON_SPARKS = 2;
const SEASON_START_CAP = 4;

const seasonStartDates = {
    EU: '2026-08-19',
    US: '2026-08-18',
    OCE: '2026-08-18',
};

const crestKeyLevels = {
    Hero: [
        { key: '+5', crests: 12 },
        { key: '+8', crests: 18 },
    ],
    Myth: [
        { key: '+9', crests: 10 },
        { key: '+12', crests: 16 },
    ],
};

const itemLevelBands = {
    Champion: '292–305',
    Hero: '305–318',
    Myth: '318–331',
};

let selectedRegion = detectRegion();
let seasonStartDate = new Date(seasonStartDates[selectedRegion]);
let totalSparks = 0;
let usedSparks = 0;
let selectedCrestType = null;

function detectRegion() {
    const saved = localStorage.getItem('hms-region');
    if (saved && seasonStartDates[saved]) {
        return saved;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Europe/') || tz === 'Atlantic/Reykjavik') {
        return 'EU';
    }
    if (
        tz.startsWith('Australia/') ||
        tz.startsWith('Pacific/Auckland') ||
        tz.startsWith('Pacific/Chatham') ||
        tz === 'Pacific/Fiji'
    ) {
        return 'OCE';
    }
    return 'US';
}

function getWeeksSince(startDate) {
    const today = new Date();
    return Math.floor((today - startDate) / WEEK_MS);
}

function getAvailableSparks(startDate) {
    const weeksSinceStart = getWeeksSince(startDate);
    if (weeksSinceStart < 0) {
        return PRESEASON_SPARKS;
    }
    return SEASON_START_CAP + weeksSinceStart;
}

function getRemainingSparks() {
    return Math.max(totalSparks - usedSparks, 0);
}

function updateCraftableCounter() {
    const remainingSparks = getRemainingSparks();
    const itemsCraftable = Math.floor(remainingSparks / SPARKS_PER_STANDARD_CRAFT);
    const leftoverSparks = remainingSparks % SPARKS_PER_STANDARD_CRAFT;
    const twoHanders = Math.floor(remainingSparks / SPARKS_PER_TWO_HAND);

    document.getElementById('craftableCount').innerText = itemsCraftable;

    const leftoverNote = leftoverSparks > 0
        ? ` · ${leftoverSparks} spark leftover`
        : '';
    const twoHandNote = twoHanders > 0
        ? ` · or ${twoHanders} two-hander${twoHanders === 1 ? '' : 's'}`
        : '';

    document.getElementById('craftableNote').innerText =
        `from ${remainingSparks} remaining spark${remainingSparks === 1 ? '' : 's'}${leftoverNote}${twoHandNote}`;
}

function updateSparksCount() {
    totalSparks = getAvailableSparks(seasonStartDate);
    usedSparks = Math.min(usedSparks, totalSparks);
    document.getElementById('usedSparksCounter').innerText = usedSparks;
    document.getElementById('fractured').innerHTML = `
        Spark of Tides available: <span>${totalSparks}</span>
        &nbsp; | &nbsp;
        Week ${Math.max(getWeeksSince(seasonStartDate), 0) + 1} of Midnight S2 (${selectedRegion})
    `;
    updateDisplay();
}

function adjustSparks(amount) {
    usedSparks = Math.max(0, Math.min(totalSparks, usedSparks + amount));
    document.getElementById('usedSparksCounter').innerText = usedSparks;
    updateDisplay();
}

function handleCheckboxChange(selected) {
    const oneHandCheckbox = document.getElementById('oneHandCheckbox');
    const twoHandCheckbox = document.getElementById('twoHandCheckbox');

    if (selected === '1H') {
        twoHandCheckbox.checked = false;
    } else if (selected === '2H') {
        oneHandCheckbox.checked = false;
    }
    updateDisplay();
}

function handleCrestTypeChange(crestType) {
    const championCheckbox = document.getElementById('championCheckbox');
    const heroCheckbox = document.getElementById('heroCheckbox');
    const mythCheckbox = document.getElementById('mythCheckbox');

    championCheckbox.checked = crestType === 'Champion';
    heroCheckbox.checked = crestType === 'Hero';
    mythCheckbox.checked = crestType === 'Myth';
    selectedCrestType = crestType;
    updateDisplay();
}

function calculatePlan(craftingType, remainingSparks) {
    const firstSparkCost = SPARKS_PER_TWO_HAND;
    const firstItems = craftingType === '2H' ? 1 : 2;
    const crestsPerItem = selectedCrestType === 'Champion' ? 0 : CRESTS_PER_INFUSED_ITEM;

    if (remainingSparks < firstSparkCost) {
        return {
            canCraftWeapon: false,
            sparksNeeded: firstSparkCost - remainingSparks,
            leftoverSparks: remainingSparks,
            extraItems: Math.floor(remainingSparks / SPARKS_PER_STANDARD_CRAFT),
            unusedSparks: remainingSparks % SPARKS_PER_STANDARD_CRAFT,
            totalItems: 0,
            sparksUsed: 0,
            totalCrests: 0,
            crestsPerItem,
        };
    }

    const leftoverAfterWeapon = remainingSparks - firstSparkCost;
    const extraItems = Math.floor(leftoverAfterWeapon / SPARKS_PER_STANDARD_CRAFT);
    const unusedSparks = leftoverAfterWeapon % SPARKS_PER_STANDARD_CRAFT;
    const totalItems = firstItems + extraItems;
    const sparksUsed = firstSparkCost + extraItems * SPARKS_PER_STANDARD_CRAFT;

    return {
        canCraftWeapon: true,
        sparksNeeded: 0,
        leftoverSparks: leftoverAfterWeapon,
        extraItems,
        unusedSparks,
        totalItems,
        sparksUsed,
        totalCrests: totalItems * crestsPerItem,
        crestsPerItem,
    };
}

function formatRunLine(key, crestsPerRun, totalCrests) {
    const runs = Math.ceil(totalCrests / crestsPerRun);
    return `<li><strong>${key}:</strong> ${runs} run${runs === 1 ? '' : 's'} (${crestsPerRun} crests each)</li>`;
}

function updateDisplay() {
    updateCraftableCounter();

    const isOneHandSelected = document.getElementById('oneHandCheckbox').checked;
    const isTwoHandSelected = document.getElementById('twoHandCheckbox').checked;
    const remainingSparks = getRemainingSparks();

    if (!isOneHandSelected && !isTwoHandSelected) {
        document.getElementById('selected-craft').innerHTML = `
            <p class="warning">Select a weapon type and craft track to see costs.</p>`;
        return;
    }

    if (!selectedCrestType) {
        document.getElementById('selected-craft').innerHTML = `
            <p class="warning">Select a craft track to see Mistcrest costs.</p>`;
        return;
    }

    const craftingType = isOneHandSelected ? '1H' : '2H';
    const plan = calculatePlan(craftingType, remainingSparks);
    const weaponLabel = craftingType === '2H' ? 'two-handed weapon' : '1H + offhand pair';
    const crestLabel = selectedCrestType === 'Champion'
        ? 'no Mistcrests'
        : `${selectedCrestType} Mistcrests`;

    if (!plan.canCraftWeapon) {
        const extraNote = plan.extraItems > 0
            ? ` You could still make ${plan.extraItems} standard Tidal piece${plan.extraItems === 1 ? '' : 's'} (2 sparks each) while you wait.`
            : '';
        document.getElementById('selected-craft').innerHTML = `
            <div class="result">
                <p class="warning">Need ${plan.sparksNeeded} more Spark${plan.sparksNeeded === 1 ? '' : 's'} of Tides for a ${weaponLabel} (4 required, ${remainingSparks} remaining).</p>
                <p>${extraNote}</p>
            </div>`;
        return;
    }

    let extraLine = '';
    if (plan.extraItems > 0) {
        extraLine = `<p><strong>Extra pieces after the weapon:</strong> ${plan.extraItems} (2 sparks each)</p>`;
    }
    if (plan.unusedSparks > 0) {
        extraLine += `<p><strong>Leftover Spark:</strong> ${plan.unusedSparks} (not enough for another piece)</p>`;
    }

    let crestBlock = `<p><strong>Craft track:</strong> ${selectedCrestType} · item level ${itemLevelBands[selectedCrestType]}</p>`;
    if (plan.totalCrests === 0) {
        crestBlock += `<p><strong>Mistcrests:</strong> none. Champion Tidal crafts use sparks only.</p>`;
    } else {
        const crestWeeks = Math.ceil(plan.totalCrests / WEEKLY_CREST_CAP);
        const runLines = crestKeyLevels[selectedCrestType]
            .map(({ key, crests }) => formatRunLine(key, crests, plan.totalCrests))
            .join('');
        crestBlock += `
            <p><strong>${selectedCrestType} Mistcrests:</strong> ${plan.totalCrests} (${plan.crestsPerItem} per item)</p>
            <p><strong>Weekly crest cap:</strong> ${crestWeeks} week${crestWeeks === 1 ? '' : 's'} at 100 ${selectedCrestType} Mistcrests</p>
            <div class="runs">
                <p><strong>Mythic+ runs for those crests:</strong></p>
                <ul>${runLines}</ul>
            </div>`;
    }

    document.getElementById('selected-craft').innerHTML = `
        <div class="result">
            <p><strong>First craft:</strong> ${weaponLabel} (${crestLabel})</p>
            <p><strong>Total items:</strong> ${plan.totalItems} (using ${plan.sparksUsed} of ${remainingSparks} remaining Sparks)</p>
            ${extraLine}
            ${crestBlock}
        </div>
    `;
}

function copyToClipboard() {
    const scriptText = document.getElementById('wowScript').innerText;
    navigator.clipboard.writeText(scriptText).then(() => {
        alert('Script copied to clipboard!');
    }).catch((err) => {
        alert('Failed to copy script: ' + err);
    });
}

function toggleRegionSelector() {
    const selector = document.getElementById('regionSelector');
    selector.classList.toggle('expanded');
}

function selectRegion(region) {
    selectedRegion = region;
    localStorage.setItem('hms-region', region);
    seasonStartDate = new Date(seasonStartDates[region]);
    document.getElementById('regionLabel').innerText = region;
    updateSparksCount();
    toggleRegionSelector();
}

const wowScript = `/run local d=C_CurrencyInfo.GetCurrencyInfo(3509) local n=C_Item.GetItemCount(274476,true) print("Spark of Tides in bags/bank: "..n) print("Tidal Spark Dust: "..(d.quantity or 0).." / "..(d.maxQuantity or "?").." seasonal cap")`;
document.getElementById('wowScript').innerText = wowScript;

document.body.classList.add('dark-mode');
document.getElementById('regionLabel').innerText = selectedRegion;
updateSparksCount();
