/* filename: script.ui.js */
/* =====================================================================
   script.ui.js
   ---------------------------------------------------------------------
   Tactical Scouting & Player Efficiency Lab - DOM rendering layer.

   RESPONSIBILITIES:
     1. renderRoster(players, onSelect)
     2. renderComparison(playerA, playerB)
     3. renderActiveCard(player, savedNote, onNoteChange)

   DESIGN NOTES:
     - This module NEVER fetches data. It receives player objects from
       script.app.js and paints them into the DOM.
     - Optional chaining (player.metrics?.per) is used everywhere a
       metric is read so a missing nested key never throws.
     - Roster thumbnails carry alt="" because the player's name is
       already rendered as text in the same row. Screen readers would
       otherwise announce the name twice.
   ===================================================================== */

window.ScoutUI = (function () {

    /* =================================================================
       Private helpers
       ================================================================= */

    /* Escape HTML metacharacters before injecting user-controlled
       strings (names, teams) into innerHTML. */
    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* Format a metric to one decimal place with an em-dash fallback. */
    function fmt(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return '—';
        return value.toFixed(1);
    }

    /* =================================================================
       renderRoster(players, onSelect)
       -----------------------------------------------------------------
       Builds the sidebar roster inside #playerRosterList.

       ARGUMENTS:
         players  - Array of player objects.
         onSelect - Optional callback fired with the clicked player.

       NOTE ON IMAGE FALLBACKS:
         Each <img> has an inline onerror that swaps to fallback.jpg
         and then removes itself so we do not loop on repeated errors.
       ================================================================= */
    function renderRoster(players, onSelect) {
        const list = document.getElementById('playerRosterList');
        if (!list) return;

        list.innerHTML = '';

        // Edge case: nothing matched the current filters.
        if (!players || players.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'placeholder-text';
            empty.textContent = 'No players match your filters.';
            list.appendChild(empty);
            return;
        }

        players.forEach(function (player) {

            const li = document.createElement('li');
            li.dataset.playerId = player.id;

            // alt="" is intentional: the player's name is rendered as
            // text in the same row, so a descriptive alt would cause
            // screen readers to announce the name twice.
            li.innerHTML = `
                <div>
                    <div class="roster-name">${escapeHtml(player.name)}</div>
                    <div class="roster-meta">
                        ${escapeHtml(player.sport)} &middot; ${escapeHtml(player.position)}
                    </div>
                </div>
                <img
                    src="${escapeHtml(player.image)}"
                    alt=""
                    width="34"
                    height="34"
                    onerror="this.onerror=null; this.src='fallback.jpg';"
                >
            `;

            if (typeof onSelect === 'function') {
                li.addEventListener('click', function () {
                    onSelect(player);
                });
            }

            list.appendChild(li);
        });
    }

    /* =================================================================
       renderComparison(playerA, playerB)
       -----------------------------------------------------------------
       Builds a side-by-side metric diff inside #comparisonDisplay.

       EDGE CASES:
         - Neither player selected -> prompt the user.
         - Only one selected       -> prompt for the other.
         - Both selected           -> build the diff table.
       ================================================================= */
    function renderComparison(playerA, playerB) {
        const display = document.getElementById('comparisonDisplay');
        if (!display) return;

        // Edge case: one or both slots are empty.
        if (!playerA || !playerB) {
            display.classList.remove('has-data');
            display.innerHTML = `
                <p class="placeholder-text">
                    Select two players to generate a metrics comparison.
                </p>
            `;
            return;
        }

        display.classList.add('has-data');

        // Metric keys in display order, with human-friendly labels.
        const metricRows = [
            { key: 'per',    label: 'PER'  },
            { key: 'tsPct',  label: 'TS%'  },
            { key: 'usgPct', label: 'USG%' },
            { key: 'astPct', label: 'AST%' }
        ];

        // Build one row per metric. The higher value wins the
        // .is-win class (accent red background). Ties stay neutral.
        const rowsHtml = metricRows.map(function (metric) {

            // Optional chaining guards against a missing metrics
            // object or a missing individual key on either side.
            const aVal = playerA.metrics?.[metric.key];
            const bVal = playerB.metrics?.[metric.key];

            const aWins = (typeof aVal === 'number' && typeof bVal === 'number' && aVal > bVal)
                ? ' is-win' : '';
            const bWins = (typeof aVal === 'number' && typeof bVal === 'number' && bVal > aVal)
                ? ' is-win' : '';

            return `
                <tr>
                    <td class="diff-value${aWins}">${fmt(aVal)}</td>
                    <td class="diff-label">${metric.label}</td>
                    <td class="diff-value${bWins}">${fmt(bVal)}</td>
                </tr>
            `;
        }).join('');

        display.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>${escapeHtml(playerA.name)}</th>
                        <th>Metric</th>
                        <th>${escapeHtml(playerB.name)}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    }

    /* =================================================================
       renderActiveCard(player, savedNote, onNoteChange)
       -----------------------------------------------------------------
       Populates #activePlayerCard with the scouting journal.

       ARGUMENTS:
         player       - Player object (or null to show a prompt).
         savedNote    - Optional string to prefill the textarea.
         onNoteChange - Optional callback fired on every keystroke.
       ================================================================= */
    function renderActiveCard(player, savedNote, onNoteChange) {
        const card = document.getElementById('activePlayerCard');
        if (!card) return;

        // Edge case: nothing selected yet.
        if (!player) {
            card.innerHTML = `
                <p class="placeholder-text">
                    Select a player from the roster to open their scouting file.
                </p>
            `;
            return;
        }

        // Build the four metric tiles, using optional chaining to
        // tolerate a missing metrics object on the player.
        const tiles = [
            { label: 'PER',   value: player.metrics?.per    },
            { label: 'TS%',   value: player.metrics?.tsPct  },
            { label: 'USG%',  value: player.metrics?.usgPct },
            { label: 'AST%',  value: player.metrics?.astPct }
        ].map(function (tile) {
            return `
                <div class="metric-tile">
                    <span class="metric-tile__label">${tile.label}</span>
                    <span class="metric-tile__value">${fmt(tile.value)}</span>
                </div>
            `;
        }).join('');

        const noteText = typeof savedNote === 'string' ? savedNote : '';

        card.innerHTML = `
            <div class="scouting-card__portrait">
                <img
                    src="${escapeHtml(player.image)}"
                    alt="${escapeHtml(player.name)}"
                    onerror="this.onerror=null; this.src='fallback.jpg';"
                >
                <div class="scouting-card__name">${escapeHtml(player.name)}</div>
                <div class="scouting-card__team">
                    ${escapeHtml(player.team)} &middot; ${escapeHtml(player.position)}
                </div>
            </div>

            <div class="scouting-card__details">
                <div class="scouting-card__metrics">
                    ${tiles}
                </div>

                <div class="scouting-card__role">
                    <span class="scouting-card__role-label">Tactical Role</span>
                    <p class="scouting-card__role-text">
                        ${escapeHtml(player.tacticalRole)}
                    </p>
                </div>

                <div class="scouting-card__role" style="margin-top:1rem;">
                    <label for="scoutingNote" class="scouting-card__role-label">
                        Scouting Journal
                    </label>
                    <textarea
                        id="scoutingNote"
                        class="field"
                        rows="3"
                        placeholder="Type a note about this player..."
                        style="margin-top:0.5rem; resize:vertical;"
                    >${escapeHtml(noteText)}</textarea>
                </div>
            </div>
        `;

        // Wire the note textarea to the persistence callback.
        if (typeof onNoteChange === 'function') {
            const textarea = document.getElementById('scoutingNote');
            if (textarea) {
                textarea.addEventListener('input', function (event) {
                    onNoteChange(event.target.value);
                });
            }
        }
    }

    /* =================================================================
       Public API
       ================================================================= */
    return {
        renderRoster:     renderRoster,
        renderComparison: renderComparison,
        renderActiveCard: renderActiveCard
    };

})();