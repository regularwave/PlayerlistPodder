document.addEventListener('DOMContentLoaded', function () {

    document.getElementById("genPodsButton").addEventListener("click", () => {
        let preferPodOverflow = document.getElementById("prefThrees").checked ? 3 : 5;
        let maxFourSeats = document.getElementById("maxSeats").valueAsNumber;
        let reportHeader = document.getElementById("podReportHeader").value;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: genPods,
                args: [preferPodOverflow, maxFourSeats, reportHeader]
            });
        });
    });

    document.getElementById("podOvrdButton").addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: podOvrd,
            });
        });
    });

    document.getElementById("clearOvrdButton").addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clearOvrd,
            });
        });
    });

    // storage setup
    const reportInput = document.getElementById("podReportHeader");
    const maxSeatsInput = document.getElementById("maxSeats");
    const prefThrees = document.getElementById("prefThrees");
    const prefFives = document.getElementById("prefFives");

    // load saved settings
    chrome.storage.local.get(['podReportHeader', 'maxSeats', 'podSizePref'], (result) => {
        if (result.podReportHeader !== undefined) reportInput.value = result.podReportHeader;
        if (result.maxSeats !== undefined) maxSeatsInput.value = result.maxSeats;
        if (result.podSizePref === '5s') {
            prefFives.checked = true;
        } else {
            prefThrees.checked = true;
        }
    });

    // save settings on change
    const saveSettings = () => {
        chrome.storage.local.set({
            podReportHeader: reportInput.value,
            maxSeats: maxSeatsInput.valueAsNumber,
            podSizePref: prefFives.checked ? '5s' : '3s'
        });
    };

    reportInput.addEventListener('input', saveSettings);
    maxSeatsInput.addEventListener('input', saveSettings);
    prefThrees.addEventListener('change', saveSettings);
    prefFives.addEventListener('change', saveSettings);
}, false);

// inject functions

function clearOvrd() {
    const overrideInputs = document.querySelectorAll('.playerlistpodderoverrideinput');
    const cedhCheckboxes = document.querySelectorAll('.playerlistpoddercedhcheckbox');

    overrideInputs.forEach(input => input.value = "0");
    cedhCheckboxes.forEach(cb => cb.checked = false);

    // clear storage for this specific event page
    const eventKey = 'playerlist_podder_' + window.location.pathname;
    sessionStorage.removeItem(eventKey);
}

function podOvrd() {
    // create a unique key for the current event based on URL
    const eventKey = 'playerlist_podder_' + window.location.pathname;
    let savedState = {};
    try {
        const stored = sessionStorage.getItem(eventKey);
        if (stored) savedState = JSON.parse(stored);
    } catch (e) { }

    const saveCurrentState = () => {
        const lnameInputs = document.querySelectorAll('.registered-player__last-name input[type="text"]');
        const fnameInputs = document.querySelectorAll('.registered-player__first-name input[type="text"]');
        const overrideInputs = document.querySelectorAll('.playerlistpodderoverrideinput');
        const cedhCheckboxes = document.querySelectorAll('.playerlistpoddercedhcheckbox');

        let stateToSave = {};
        for (let i = 0; i < lnameInputs.length; i++) {
            if (overrideInputs[i] && cedhCheckboxes[i]) {
                const fullName = (fnameInputs[i] ? fnameInputs[i].value : "") + " " + (lnameInputs[i] ? lnameInputs[i].value : "");
                stateToSave[fullName] = {
                    override: overrideInputs[i].value,
                    cedh: cedhCheckboxes[i].checked
                };
            }
        }
        sessionStorage.setItem(eventKey, JSON.stringify(stateToSave));
    };

    let wizTabNumElements = document.querySelectorAll('.registered-player__tableNumber');
    const lnameInputs = document.querySelectorAll('.registered-player__last-name input[type="text"]');
    const fnameInputs = document.querySelectorAll('.registered-player__first-name input[type="text"]');

    let index = 0;
    for (const wpageelement of wizTabNumElements) {
        // prevent duplicate table injection
        if (wpageelement.parentNode.querySelector('.playerlistpodderoverridecontainer')) {
            index++;
            continue;
        }

        let fName = fnameInputs[index] ? fnameInputs[index].value : "";
        let lName = lnameInputs[index] ? lnameInputs[index].value : "";
        let fullName = fName + " " + lName;

        // revert to saved memory or default to 0/false
        let playerState = savedState[fullName] || { override: "0", cedh: false };

        const containerDiv = document.createElement("div");
        containerDiv.classList.add('playerlistpodderoverridecontainer');
        containerDiv.style.display = "flex";
        containerDiv.style.flexDirection = "column";
        containerDiv.style.alignItems = "center";
        containerDiv.style.justifyContent = "center";
        containerDiv.style.gap = "4px";

        const numInput = document.createElement("input");
        numInput.classList.add('playerlistpodderoverrideinput');
        numInput.type = "number";
        numInput.setAttribute("min", "0");
        numInput.value = playerState.override;
        numInput.style.width = "40px";
        numInput.style.textAlign = "center";
        numInput.title = "Pod Group Override";
        numInput.addEventListener('change', saveCurrentState);

        const cedhLabel = document.createElement("label");
        cedhLabel.style.display = "flex";
        cedhLabel.style.alignItems = "center";
        cedhLabel.style.gap = "4px";
        cedhLabel.style.fontSize = "11px";
        cedhLabel.style.cursor = "pointer";

        const cedhCheckbox = document.createElement("input");
        cedhCheckbox.type = "checkbox";
        cedhCheckbox.classList.add('playerlistpoddercedhcheckbox');
        cedhCheckbox.checked = playerState.cedh;
        cedhCheckbox.addEventListener('change', saveCurrentState);

        cedhLabel.appendChild(cedhCheckbox);
        cedhLabel.appendChild(document.createTextNode("cEDH"));

        containerDiv.appendChild(numInput);
        containerDiv.appendChild(cedhLabel);

        wpageelement.parentNode.insertBefore(containerDiv, wpageelement);
        index++;
    }

    // header injection for our column
    let wizTabHeader = document.querySelector('.registered-player-list__tabel-action-column') || document.querySelector('.registered-player-list__table-action-column');

    if (wizTabHeader && !document.querySelector('.playerlistpodderpodoverrideheader')) {
        const headerSpan = document.createElement("span");
        headerSpan.classList.add('playerlistpodderpodoverrideheader');
        headerSpan.innerHTML = "Pod/<br>cEDH";
        headerSpan.style.textAlign = "center";
        headerSpan.style.lineHeight = "1.2";
        headerSpan.style.fontWeight = "bold";
        wizTabHeader.parentNode.insertBefore(headerSpan, wizTabHeader);
    }
}

function genPods(preferPodOverflow, maxFourSeats, reportHeader) {
    const lnames = Array.from(document.querySelectorAll('.registered-player__last-name input[type="text"]')).map(el => el.value);
    const fnames = Array.from(document.querySelectorAll('.registered-player__first-name input[type="text"]')).map(el => el.value);

    const overrideInputs = document.querySelectorAll('.playerlistpodderoverrideinput');
    const cedhCheckboxes = document.querySelectorAll('.playerlistpoddercedhcheckbox');
    const hasOverrides = overrideInputs.length > 0;

    let players = [];
    for (let i = 0; i < lnames.length; i++) {
        players.push({
            name: fnames[i] + " " + lnames[i],
            overrideNum: hasOverrides ? (parseInt(overrideInputs[i].value, 10) || 0) : 0,
            isCedh: hasOverrides ? cedhCheckboxes[i].checked : false
        });
    }

    // randomize ALL players
    for (let m = players.length - 1; m > 0; m--) {
        const i = Math.floor(Math.random() * (m + 1));
        [players[m], players[i]] = [players[i], players[m]];
    }

    // separate out cEDH players
    let cedhPlayers = players.filter(p => p.isCedh);
    let casualPlayers = players.filter(p => !p.isCedh);

    // sort each pool by override number
    cedhPlayers.sort((a, b) => a.overrideNum - b.overrideNum);
    casualPlayers.sort((a, b) => a.overrideNum - b.overrideNum);

    // pool logic
    function getPodSizes(numPlayers, pref, max) {
        let sizes = { threes: 0, fours: 0, fives: 0 };
        if (numPlayers < 3 && numPlayers > 0) { console.log(numPlayers + " players?! tsk tsk"); }
        else if (numPlayers % 4 === 0) { sizes.fours = numPlayers / 4; }
        else if ([3, 6].includes(numPlayers)) { sizes.threes = numPlayers / 3; }
        else if (numPlayers === 5) { sizes.fives = 1; }
        else if (numPlayers === 7) { sizes.threes = 1; sizes.fours = 1; }
        else if (numPlayers === 9) {
            if (pref === 3) { sizes.threes = 3; }
            else { sizes.fours = 1; sizes.fives = 1; }
        }
        else if (numPlayers === 11) { sizes.threes = 1; sizes.fours = 2; }
        else if (numPlayers > max) {
            sizes.fives = numPlayers - max;
            sizes.fours = (max / 4) - sizes.fives;
        } else {
            if (pref === 3) {
                sizes.threes = 4 - (numPlayers % 4);
                sizes.fours = Math.floor((numPlayers - sizes.threes * 3) / 4);
            } else {
                sizes.fives = numPlayers % 4;
                sizes.fours = Math.floor((numPlayers - sizes.fives * 5) / 4);
            }
        }
        return sizes;
    }

    let pods = {};
    let globalPodNumber = 1;

    function assignPods(playerPool, isCedh) {
        let sizes = getPodSizes(playerPool.length, preferPodOverflow, maxFourSeats);
        let indexPos = 0;

        const createPods = (count, size) => {
            for (let i = 0; i < count; i++) {
                const podName = isCedh ? `Pod ${globalPodNumber} [cEDH]` : `Pod ${globalPodNumber}`;
                pods[podName] = playerPool.slice(indexPos, indexPos + size);
                globalPodNumber++;
                indexPos += size;
            }
        };

        createPods(sizes.fives, 5);
        createPods(sizes.threes, 3);
        createPods(sizes.fours, 4);
    }

    // generate separate pods
    if (casualPlayers.length > 0) assignPods(casualPlayers, false);
    if (cedhPlayers.length > 0) assignPods(cedhPlayers, true);

    const gameDate = new Date();
    const titleText = `${reportHeader} ${gameDate.getFullYear() + ('0' + (gameDate.getMonth() + 1)).slice(-2) + ('0' + (gameDate.getDate())).slice(-2)}`;

    // create clipboard text
    let plainTextPods = `${titleText}\n\n`;
    Object.entries(pods).forEach(([podName, players]) => {
        plainTextPods += `**${podName}**\n`;
        players.forEach(p => plainTextPods += `- ${p.name}\n`);

        // add a blank line for 3-player pods
        if (players.length === 3) {
            plainTextPods += `- _________________\n`;
        }

        plainTextPods += `\n`;
    });

    // generate pretty HTML pods
    let prettyPods = `<!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${titleText}</title>
                <style>
                    @font-face {
                        font-family: 'Beleren';
                        src: url('https://cdn.jsdelivr.net/npm/@regularwave/beleren-bold-woff2/beleren-bold.woff2') format('woff2');
                        font-weight: bold;
                        font-style: normal;
                    }
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        padding: 20px;
                        background: white;
                        color: black;
                    }
                    h2 { 
                        text-align: center; 
                        color: black; 
                        font-family: 'Beleren', system-ui, sans-serif;
                        letter-spacing: 0.5px;
                        font-size: 2rem;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .pod-card {
                        background: white;
                        border: 2px solid black;
                        border-radius: 8px;
                        padding: 16px;
                    }
                    .pod-title {
                        font-weight: bold;
                        font-size: 1.25rem;
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid black;
                    }
                    .player {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 6px 0;
                        font-size: 1.1rem;
                    }
                    .box {
                        width: 16px;
                        height: 16px;
                        border: 2px solid black;
                        border-radius: 3px;
                        flex-shrink: 0;
                    }
                    .write-in-line {
                        flex-grow: 1;
                        border-bottom: 1px solid black;
                        margin-right: 16px;
                        transform: translateY(16px);
                    }
                    .no-print {
                        display: block;
                    }
                    @media print {
                        body { padding: 0; }
                        .pod-card { page-break-inside: avoid; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
            <div class="no-print" style="max-width: 1200px; margin: 0 auto 20px auto; text-align: right;">
                <button id="copyBtn" style="padding: 10px 16px; background-color: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; font-family: system-ui, sans-serif;">Copy to Clipboard</button>
            </div>
            <h2>${titleText}</h2>
            <div class="grid">`;

    Object.entries(pods).forEach(([podName, players]) => {
        let playerHtml = players.map(p => `
            <div class="player">
                <div class="box"></div>
                <span>${p.name}</span>
            </div>
        `).join('');

        // add a blank row for latecomers if the pod size is 3
        if (players.length === 3) {
            playerHtml += `
            <div class="player">
                <div class="box"></div>
                <span class="write-in-line"></span>
            </div>`;
        }

        prettyPods += `
            <div class="pod-card">
                <div class="pod-title">${podName}</div>
                ${playerHtml}
            </div>`;
    });

    prettyPods += `</div></body></html>`;

    // open new window and write the HTML
    const win = window.open();
    win.document.write(prettyPods);
    win.document.close();

    // attach clipboard event listener
    const copyBtn = win.document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textArea = win.document.createElement("textarea");
            textArea.value = plainTextPods;
            win.document.body.appendChild(textArea);
            textArea.select();
            win.document.execCommand("copy");
            win.document.body.removeChild(textArea);

            copyBtn.innerText = "Copied!";
            copyBtn.style.backgroundColor = "#059669";
            setTimeout(() => {
                copyBtn.innerText = "Copy to Clipboard";
                copyBtn.style.backgroundColor = "#4F46E5";
            }, 2000);
        });
    }
}