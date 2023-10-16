document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("genPodsButton").addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const tabId = activeTab.id;
            chrome.scripting.executeScript({
                target: { tabId },
                function: genPods,
            });
        });
    });
    document.getElementById("podOvrdButton").addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const tabId = activeTab.id;
            chrome.scripting.executeScript({
                target: { tabId },
                function: podOvrd,
            });
        });
    });
}, false);

function podOvrd() {
    wizTabNumElements = document.querySelectorAll('.registered-player__tableNumber');
    for (const wpageelement of wizTabNumElements) {
        const ntndiv = document.createElement("div");
        ntndiv.classList.add('playerlistpodderoverridecontainer');

        const ntnoverridenuminput = document.createElement("input");
        ntnoverridenuminput.classList.add('playerlistpodderoverrideinput');
        ntnoverridenuminput.type = "number";
        ntnoverridenuminput.setAttribute("min", "0");
        ntnoverridenuminput.value = "0";
        ntndiv.appendChild(ntnoverridenuminput);

        wpageelement.parentNode.insertBefore(ntndiv, wpageelement);
    }
    wizTabHeader = document.querySelector('.registered-player-list__tabel-action-column');
    const ntnoverridenumheader = document.createElement("span");
    ntnoverridenumheader.classList.add('playerlistpodderpodoverrideheader');
    ntnoverridenumheader.textContent = "Pod Override";

    wizTabHeader.parentNode.insertBefore(ntnoverridenumheader, wizTabHeader);

}

function genPods() {
    var namearray = [];
    document.querySelectorAll('input.editable-text__input').forEach(pname => {
        namearray.push(pname.value)
    });
    const pfullnamelist = Array.from({ length: (namearray.length) / 2 }, (_, i) => namearray[2 * i] + " " + namearray[2 * i + 1]);
    var tablearray = [];
    if (document.body.contains(document.querySelector(".playerlistpodderoverrideinput"))) {
        document.querySelectorAll('.playerlistpodderoverrideinput').forEach(tnum => {
            tablearray.push(tnum.value)
        });
    } else {
        tablearray = Array(pfullnamelist.length).fill(0);
    }
    const players = pfullnamelist.map((name, index) => ({ name, tableNum: tablearray[index] }));
    var m = players.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = players[m];
        players[m] = players[i];
        players[i] = t;
    }
    players.sort((a, b) => a.tableNum - b.tableNum);
    let numPlayers = pfullnamelist.length;
    let podSizes = { "threes": 0, "fours": 0, "fives": 0 };
    let pods = {};
    switch (true) {
        case numPlayers < 3:
            console.log(numPlayers + " players?! tsk tsk");
            break;
        case numPlayers % 4 === 0:
            podSizes["fours"] = Math.floor(numPlayers / 4);
            break;
        case [3, 6, 9].includes(numPlayers):
            podSizes["threes"] = Math.floor(numPlayers / 3);
            break;
        case numPlayers === 5:
            podSizes["fives"] = 1;
            break;
        case numPlayers > 28:
            podSizes["fives"] = numPlayers - 28;
            podSizes["fours"] = 7 - podSizes["fives"];
            break;
        default:
            podSizes["threes"] = 4 - (numPlayers % 4);
            podSizes["fours"] = Math.floor((numPlayers - podSizes["threes"] * 3) / 4);
    }
    let indexPos = 0;
    let podNumber = 1;
    for (let i = 0; i < podSizes["fives"]; i++) {
        let podName = "Pod " + podNumber;
        pods[podName] = players.slice(indexPos, indexPos + 5);
        podNumber++;
        indexPos += 5;
    }
    for (let i = 0; i < podSizes["threes"]; i++) {
        let podName = "Pod " + podNumber;
        pods[podName] = players.slice(indexPos, indexPos + 3);
        podNumber++;
        indexPos += 3;
    }
    for (let i = 0; i < podSizes["fours"]; i++) {
        let podName = "Pod " + podNumber;
        pods[podName] = players.slice(indexPos, indexPos + 4);
        podNumber++;
        indexPos += 4;
    }
    const gameDate = new Date().toISOString();
    const titleText = `Commander Pods ${gameDate.split('T')[0]}`;
    let prettyPods = `<!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${titleText}</title>
                <style>
                  * {
                    box-sizing: border-box;
                    padding: 2px;
                    gap: 2px;
                    font-size: 4vw;
                    font-family: Sans-Serif;
                    }
                    .row {
                    display: flex;
                    }
                    .column {
                    flex: 50%;
                    padding: 10px;
                    border: 1px solid black;
                    border-radius: 10px 30px;
                    }
                </style>
            </head>
            <body>
            <h2>${titleText}</h2>`;
    let htmlRows = '';
    Object.entries(pods).forEach(([key, value], i) => {
        if (i % 2 === 0) {
            htmlRows += '<div class="row">';
        }
        htmlRows += `
        <div class="column">
            <strong>${key}</strong>
            <br>&#x25a2;
            ${value.map(player => player.name).join('<br>&#x25a2; ')}
        </div>`;
        if (i % 2 === 1) {
            htmlRows += '</div>';
        }
    });
    prettyPods += `${htmlRows}</body></html>`;
    const blob = new Blob([prettyPods], { type: "text/html" });
    // const url = URL.createObjectURL(blob);
    const win = window.open();
    win.document.write(prettyPods);
}