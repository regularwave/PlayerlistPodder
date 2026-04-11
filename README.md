
# Playerlist Podder

> Small indie companies don't have the resources to add features to their event creation systems.

Playerlist Podder is a Chrome extension that will generate Commander pods for Magic: the Gathering events directly from the EventLink player registration page.

## How to Use

1. Navigate to your event's registration page in EventLink (the page that shows the "Registered Players" and "Companion App Lobby" sections).
2. Register players into the event as you normally would.
3. Once all players are showing up in the "Registered Players" section, click the Playerlist Podder extension icon in your Chrome toolbar to open the side panel.
4. Configure your settings, apply any necessary overrides, and generate your pods!

## Features & Configuration

* **Pod Report Header**: Customize the title that prints at the top of your generated pod report (e.g., "Friday Night Commander").
* **Non-4 Pref**: Playerlist Podder prioritizes pods of 4, but the math doesn't always work out perfectly. This setting lets you decide how to handle the remainder. For example, with 10 players, do you prefer one pod of 4 and two pods of 3 (select **3s**), or two pods of 5 (select **5s**)?
* **Total Seats**: Set a strict limit on how many physical seats are available in your play space. The extension will optimize pods to fit within this capacity (and may need to ignore the *Non-4 Pref* setting to do so).
* **Show Pod & cEDH Overrides**: Clicking this button injects a new column directly into the EventLink Registered Players table. Have a cEDH group or a pod of new players that requested to stay together? This allows you to assign specific grouping numbers to players and provides a cEDH toggle so those players are separated and podded independently from the casual groups.
* **Generate Pods** / **Copy Pods** (on the printable pod page): Randomize players and set up the pods based on your parameters. You can print a formatted sheet directly from the browser (complete with write-in lines for latecomers) or copy the text to your clipboard for Discord/Facebook pairings.

## Privacy & Data

The extension runs completely locally and does not collect or transmit any data from EventLink. For your convenience, it does utilize local browser storage to remember your custom "Pod Report Header" and settings for future events. It also uses temporary session storage to remember your manual overrides (like cEDH toggles) in case you accidentally refresh the EventLink page while setting up your tournament. None of this information ever leaves your device.

## Legal Disclaimer

Playerlist Podder is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.