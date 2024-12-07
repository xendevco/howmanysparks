// Set up variables
const expansionReleaseDate = new Date('2024-08-26');
const today = new Date();
const weeksSinceRelease = Math.floor((today - expansionReleaseDate) / (7 * 24 * 60 * 60 * 1000));
const fracturedSparks = weeksSinceRelease + 1; // Including the extra spark from the quest
const totalSparks = Math.floor(fracturedSparks / 2);
let usedSparks = 0;

let selectedCrestType = null; // Either "Runed" or "Gilded"

// Display initial progress
document.getElementById("fractured").innerHTML = `
    Fractured Spark of Omens: ${fracturedSparks} &nbsp; | &nbsp; Spark of Omens: ${totalSparks}
`;

// Adjust the number of Sparks used
function adjustSparks(amount) {
    usedSparks = Math.max(0, Math.min(totalSparks, usedSparks + amount));
    document.getElementById("usedSparksCounter").innerText = usedSparks;
    updateDisplay();
}

// Handle weapon type selection
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

// Handle crest type selection
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

// Calculate total items and crests needed
function calculateTotal(craftingType, remainingSparks) {
    const sparksRequired = 2; // Both weapon types use 2 Sparks
    const itemsCrafted = craftingType === "2H" ? 1 : 2; // 1 item for 2H, 2 for 1H + Offhand
    const remainingItems = Math.max(remainingSparks - sparksRequired, 0);

    const runedCrestsRequired = craftingType === "2H" ? 45 : 90; // Cost per spark for Runed
    const gildedCrestsRequired = craftingType === "2H" ? 90 : 180; // Cost per spark for Gilded

    return {
        totalRuned: runedCrestsRequired + remainingItems * 45,
        totalGilded: gildedCrestsRequired + remainingItems * 90,
        totalItems: itemsCrafted + remainingItems,
        sparksUsed: sparksRequired + remainingItems,
    };
}

// Calculate the number of Mythic+ runs required
function calculateMythicRuns(totalCrests, crestsPerRun) {
    return Math.ceil(totalCrests / crestsPerRun);
}

// Update the display with results
function updateDisplay() {
    const isOneHandSelected = document.getElementById("oneHandCheckbox").checked;
    const isTwoHandSelected = document.getElementById("twoHandCheckbox").checked;
    const remainingSparks = Math.max(totalSparks - usedSparks, 0);

    if (!isOneHandSelected && !isTwoHandSelected) {
        document.getElementById("selected-craft").innerHTML = `
            <p class="warning">Select options above to see the total crest costs.</p>`;
        return;
    }

    if (!selectedCrestType) {
        document.getElementById("selected-craft").innerHTML = `
            <p class="warning">Select a crest type to see the total crest costs.</p>`;
        return;
    }

    const craftingType = isOneHandSelected ? "1H" : "2H";
    const { totalRuned, totalGilded, totalItems, sparksUsed } = calculateTotal(craftingType, remainingSparks);

    const crestCost = selectedCrestType === 'Runed' ? totalRuned : totalGilded;
    const onTimeRuns = calculateMythicRuns(crestCost, 12);
    const failedRuns = calculateMythicRuns(crestCost, 5);

    // Update the results display
    document.getElementById("selected-craft").innerHTML = `
        <div class="result">
            <p><strong>Total Items:</strong> ${totalItems} (using ${sparksUsed} Sparks)</p>
            <p><strong>${selectedCrestType} Crests:</strong> ${crestCost}</p>
            <div class="runs">
                <p><strong>Mythic+ Runs Required:</strong></p>
                <ul>
                    <li><strong>On Time:</strong> ${onTimeRuns} runs</li>
                    <li><strong>Not On Time:</strong> ${failedRuns} runs</li>
                </ul>
            </div>
        </div>
    `;
}

// Copy the in-game script to clipboard
function copyToClipboard() {
    const scriptText = document.getElementById('wowScript').innerText;
    navigator.clipboard.writeText(scriptText).then(() => {
        alert('Script copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy script: ' + err);
    });
}

// Toggle between light and dark mode
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById("themeToggle");

    body.classList.toggle("dark-mode");
    body.classList.toggle("light-mode");

    themeToggle.innerText = body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
}

// Generate the in-game WoW script
const wowScript = `/run a=C_CurrencyInfo.GetCurrencyInfo(3023) print("You have earned " .. a.totalEarned .. " of " .. a.maxQuantity .. " possible Fractured Spark of Omens")`;
document.getElementById('wowScript').innerText = wowScript;

// Set dark mode as default on page load
document.body.classList.add("dark-mode");

// Initial display update
updateDisplay();
