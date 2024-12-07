const expansionReleaseDate = new Date('2024-08-26');
const today = new Date();
const weeksSinceRelease = Math.floor((today - expansionReleaseDate) / (7 * 24 * 60 * 60 * 1000));
const fracturedSparks = weeksSinceRelease + 1;
const totalSparks = Math.floor(fracturedSparks / 2);
let usedSparks = 0;

let selectedCrestType = null; // Either "Runed" or "Gilded"

document.getElementById("fractured").innerText = `Fractured Spark of Omens: ${fracturedSparks}`;
document.getElementById("spark").innerText = `Spark of Omens: ${totalSparks}`;

const costPerItem = { "619": 45, "636": 90 };
const twoHandCrestCosts = { "619": costPerItem["619"], "636": costPerItem["636"] };
const oneHandOffhandCrestCosts = { "619": costPerItem["619"] * 2, "636": costPerItem["636"] * 2 };

function adjustSparks(amount) {
    usedSparks = Math.max(0, Math.min(totalSparks, usedSparks + amount));
    document.getElementById("usedSparksCounter").innerText = usedSparks;
    updateDisplay();
}

function handleCheckboxChange(selected) {
    const oneHandCheckbox = document.getElementById("oneHandCheckbox");
    const twoHandCheckbox = document.getElementById("twoHandCheckbox");

    if (selected === '1H') {
        twoHandCheckbox.checked = false;
    } else if (selected === '2H') {
        oneHandCheckbox.checked = false;
    }
    updateDisplay();
}

function handleCrestTypeChange(crestType) {
    const runedCheckbox = document.getElementById("runedCheckbox");
    const gildedCheckbox = document.getElementById("gildedCheckbox");

    if (crestType === 'Runed') {
        gildedCheckbox.checked = false;
        selectedCrestType = 'Runed';
    } else if (crestType === 'Gilded') {
        runedCheckbox.checked = false;
        selectedCrestType = 'Gilded';
    } else {
        selectedCrestType = null;
    }
    updateDisplay();
}

function calculateTotal(craftingType, remainingSparks) {
    const sparksRequired = 2; // Both weapon types use 2 Sparks
    const itemsCrafted = craftingType === "2H" ? 1 : 2; // 1 item for 2H, 2 for 1H + Offhand
    const remainingItems = Math.max(remainingSparks - sparksRequired, 0);

    const runedCrestsRequired = craftingType === "2H" ? twoHandCrestCosts["619"] : oneHandOffhandCrestCosts["619"];
    const gildedCrestsRequired = craftingType === "2H" ? twoHandCrestCosts["636"] : oneHandOffhandCrestCosts["636"];

    return {
        totalRuned: runedCrestsRequired + remainingItems * costPerItem["619"],
        totalGilded: gildedCrestsRequired + remainingItems * costPerItem["636"],
        totalItems: itemsCrafted + remainingItems,
        sparksUsed: sparksRequired + remainingItems,
    };
}

function calculateMythicRuns(totalCrests, crestsPerRun) {
    return Math.ceil(totalCrests / crestsPerRun);
}

function updateDisplay() {
    const isOneHandSelected = document.getElementById("oneHandCheckbox").checked;
    const isTwoHandSelected = document.getElementById("twoHandCheckbox").checked;
    const remainingSparks = Math.max(totalSparks - usedSparks, 0);

    if (!isOneHandSelected && !isTwoHandSelected) {
        document.getElementById("selected-craft").innerText = "Select a weapon option and crest type to see the total crest costs.";
        document.getElementById("mythic-runs").innerText = "";
        return;
    }

    if (!selectedCrestType) {
        document.getElementById("selected-craft").innerText = "Select a crest type to see the total crest costs.";
        document.getElementById("mythic-runs").innerText = "";
        return;
    }

    const craftingType = isOneHandSelected ? "1H" : "2H";
    const { totalRuned, totalGilded, totalItems, sparksUsed } = calculateTotal(craftingType, remainingSparks);

    const crestCost = selectedCrestType === 'Runed' ? totalRuned : totalGilded;
    const onTimeRuns = calculateMythicRuns(crestCost, 12);
    const failedRuns = calculateMythicRuns(crestCost, 5);

    document.getElementById("selected-craft").innerText = `
        Total Crest Costs (${craftingType === "2H" ? "Two-Handed Weapon" : "1H + Offhand"}):
        - Total Items Crafted: ${totalItems} (using ${sparksUsed} Sparks)
        - ${selectedCrestType}: ${crestCost} ${selectedCrestType} Harbinger's Crests
    `;

    document.getElementById("mythic-runs").innerText = `
        Mythic+ Runs Required (On Time):
        - ${onTimeRuns} runs at levels 4-7 for ${selectedCrestType} Harbinger's Crests

        Mythic+ Runs Required (Not On Time):
        - ${failedRuns} runs at levels 4-7 for ${selectedCrestType} Harbinger's Crests
    `;
}

const wowScript = `/run a=C_CurrencyInfo.GetCurrencyInfo(3023) print("You have earned " .. a.totalEarned .. " of " .. a.maxQuantity .. " possible Fractured Spark of Omens")`;
document.getElementById('wowScript').innerText = wowScript;

function copyToClipboard() {
    const scriptText = document.getElementById('wowScript').innerText;
    navigator.clipboard.writeText(scriptText).then(() => {
        alert('Script copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy script: ' + err);
    });
}

updateDisplay();
