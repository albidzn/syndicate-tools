# Syndicate Tools

Tools for The Syndicate family in [Mafia Reborn](https://mafiareborn.com).

| File | What it is |
| --- | --- |
| `syndicate-activity-reporter.user.js` | Tampermonkey script for leaders: the leader panel on the Family tab, Discord reports, leaderboard, war alerts, recruits and invites, boost reminders and auto-renew. |
| `syndicate-mission-picker.html` | The Mission Reader bookmarklet, for members without the reporter script (the reporter has the same picker in its Personal tab). Open the file and drag the button to the bookmarks bar. |
| `screenshots/` | Pictures for the Discord posts. |

## Installing the reporter

1. Install [Tampermonkey](https://www.tampermonkey.net/) and allow user scripts in the browser's extension settings.
2. Open [the script's raw file](https://raw.githubusercontent.com/albidzn/syndicate-tools/main/syndicate-activity-reporter.user.js). Tampermonkey offers to install it.
3. Open the game's Family tab. The panel appears at the top right.

Tampermonkey checks this repository for new versions by itself, about once a day. To update right away: Tampermonkey dashboard → Installed scripts → Syndicate Activity Reporter → Check for updates.

Discord webhook links, member links and history are saved only in each browser, never in this repository. Use the panel's backup button to move them between PCs.

## Making a change

1. Edit `syndicate-activity-reporter.user.js`.
2. Raise the version in **both** places: `// @version` in the header and `var VERSION` near the top. Tampermonkey only updates when `@version` goes up. Versions are `major.minor.patch`:
   - **patch** (2.0.0 → 2.0.1) for fixes and small tweaks,
   - **minor** (2.0.1 → 2.1.0) for new features,
   - **major** (2.x → 3.0.0) only for big redesigns.
3. Add a short entry for the new version to `CHANGES` near the top of the script. The first time the new version runs on the PC with the leadership webhook, these notes are posted to the leadership chat.
4. Commit and push to `main`. Everyone gets the new version with the next update check.

The Mission Reader has no automatic updates: after a change, raise its `VERSION`, and members re-add the bookmark from the new file.
