document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("genPodsButton").addEventListener("click", () => {
        let preferPodOverflow = 3;
        if (document.getElementById("prefThrees").checked) {
            preferPodOverflow = 3;
        } else if (document.getElementById("prefFives").checked) {
            preferPodOverflow = 5;
        }
        let maxFourSeats = document.getElementById("maxSeats").valueAsNumber;
        let reportHeader = document.getElementById("podReportHeader").value;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const tabId = activeTab.id;
            chrome.scripting.executeScript({
                target: { tabId },
                function: genPods,
                args: [preferPodOverflow, maxFourSeats, reportHeader]
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
    if (document.body.contains(document.querySelector(".registered-player-list__tabel-action-column"))) {
        wizTabHeader = document.querySelector('.registered-player-list__tabel-action-column');
        console.log("WotC: fix your typo!");
    } else {
        wizTabHeader = document.querySelector('.registered-player-list__table-action-column');
    }
    const ntnoverridenumheader = document.createElement("span");
    ntnoverridenumheader.classList.add('playerlistpodderpodoverrideheader');
    ntnoverridenumheader.textContent = "Pod Override";
    wizTabHeader.parentNode.insertBefore(ntnoverridenumheader, wizTabHeader);
}

function genPods(preferPodOverflow, maxFourSeats, reportHeader) {
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
        case [3, 6].includes(numPlayers):
            podSizes["threes"] = Math.floor(numPlayers / 3);
            break;
        case numPlayers === 5:
            podSizes["fives"] = 1;
            break;
        case numPlayers === 7:
            podSizes["threes"] = 1;
            podSizes["fours"] = 1;
            break;
        case numPlayers === 9:
            if (preferPodOverflow === 3) {
                podSizes["threes"] = Math.floor(numPlayers / 3);
            } else if (preferPodOverflow === 5) {
                podSizes["fours"] = 1;
                podSizes["fives"] = 1;
            }
            break;
        case numPlayers === 11:
            podSizes["threes"] = 1;
            podSizes["fours"] = 2;
            break;
        case numPlayers > maxFourSeats:
            podSizes["fives"] = numPlayers - maxFourSeats;
            podSizes["fours"] = (maxFourSeats / 4) - podSizes["fives"];
            break;
        default:
            if (preferPodOverflow === 3) {
                podSizes["threes"] = 4 - (numPlayers % 4);
                podSizes["fours"] = Math.floor((numPlayers - podSizes["threes"] * 3) / 4);
            } else if (preferPodOverflow === 5) {
                podSizes["fives"] = numPlayers % 4;
                podSizes["fours"] = Math.floor((numPlayers - podSizes["fives"] * 5) / 4);
            }
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
    const gameDate = new Date();
    const titleText = `${reportHeader} ${gameDate.getFullYear() + ('0' + (gameDate.getMonth() + 1)).slice(-2) + ('0' + (gameDate.getDate())).slice(-2)}`;
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
    const win = window.open();
    win.document.write(prettyPods);
}