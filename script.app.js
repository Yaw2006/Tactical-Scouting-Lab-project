/* filename: script.app.js */
/* =====================================================================
   script.app.js
   ---------------------------------------------------------------------
   Tactical Scouting & Player Efficiency Lab - application controller.

   ROLE:
     The orchestrator. It owns application state, wires up events, and
     decides WHEN to call ScoutUI.render*() and ScoutIO.* functions.

   DEPENDENCY GRAPH:
       script.io.js   -> data (no DOM, no state)
       script.ui.js   -> rendering (no data, no state)
       script.app.js  -> state + orchestration (uses both)

   DESIGN NOTES:
     - State is centralised in AppState. Nothing outside this file
       mutates it directly; all changes flow through small helper
       functions that re-render the affected UI afterwards.
   ===================================================================== */

/* =====================================================================
   1. CENTRALIZED APPLICATION STATE
   ===================================================================== */
const AppState = {
    players:          [],       // full dataset
    filteredPlayers:  [],       // roster after search + sport filter
    searchQuery:      '',       // lowercase, trimmed
    sportFilter:      'all',    // 'all' | 'Basketball' | 'Football'
    selectedPlayerId: null,     // active scouting card
    compareAId:       null,     // left comparison slot
    compareBId:       null      // right comparison slot
};


/* =====================================================================
   2. DOM REFERENCES
   =====================================================================
   Cache the elements touched repeatedly so we do not call
   getElementById() in every render pass.
   ===================================================================== */
const DOM = {
    searchInput:       null,
    sportFilter:       null,
    playerRosterList:  null,
    compareA:          null,
    compareB:          null,
    comparisonDisplay: null,
    activePlayerCard:  null
};

function cacheDomReferences() {
    DOM.searchInput       = document.getElementById('searchInput');
    DOM.sportFilter       = document.getElementById('sportFilter');
    DOM.playerRosterList  = document.getElementById('playerRosterList');
    DOM.compareA          = document.getElementById('compareA');
    DOM.compareB          = document.getElementById('compareB');
    DOM.comparisonDisplay = document.getElementById('comparisonDisplay');
    DOM.activePlayerCard  = document.getElementById('activePlayerCard');

    Object.keys(DOM).forEach(function (key) {
        if (!DOM[key]) {
            console.warn('[ScoutApp] Missing DOM element:', key);
        }
    });
}


/* =====================================================================
   3. STATE HELPERS
   ===================================================================== */

/* Look up a player object by id from the full dataset. */
function findPlayerById(id) {
    if (id === null || id === undefined) return null;
    return AppState.players.find(function (player) {
        return player.id === id;
    }) || null;
}

/* Set the search query and re-run the filter pipeline. */
function setSearchQuery(query) {
    AppState.searchQuery = query.toLowerCase().trim();
    applyFiltersAndRender();
}

/* Set the sport filter and re-run the filter pipeline. */
function setSportFilter(sport) {
    AppState.sportFilter = sport;
    applyFiltersAndRender();
}

/* Activate a player and open their scouting card. */
function setSelectedPlayer(playerId) {
    AppState.selectedPlayerId = playerId;

    const player = findPlayerById(playerId);

    // Load persisted note. ScoutIO returns '' when no note exists so
    // the textarea is always safe to render.
    const savedNote = player ? ScoutIO.loadScoutingNote(player.id) : '';

    // Hand off to the UI layer with a callback that persists the note.
    ScoutUI.renderActiveCard(
        player,
        savedNote,
        function (newNoteText) {
            if (player) {
                ScoutIO.saveScoutingNote(player.id, newNoteText);
            }
        }
    );

    highlightActiveRosterRow();
}

/* Set the left comparison slot and re-render the comparison. */
function setCompareA(playerId) {
    AppState.compareAId = playerId;
    renderComparisonFromState();
}

/* Set the right comparison slot and re-render the comparison. */
function setCompareB(playerId) {
    AppState.compareBId = playerId;
    renderComparisonFromState();
}


/* =====================================================================
   4. FILTERING PIPELINE
   ===================================================================== */
function applyFiltersAndRender() {

    // Start from a shallow copy of the full dataset.
    let result = AppState.players.slice();

    // Sport filter ('all' is a passthrough).
    if (AppState.sportFilter !== 'all') {
        result = result.filter(function (player) {
            return player.sport === AppState.sportFilter;
        });
    }

    // Case-insensitive partial match against name OR team.
    if (AppState.searchQuery !== '') {
        const q = AppState.searchQuery;
        result = result.filter(function (player) {
            const nameMatch = player.name.toLowerCase().includes(q);
            const teamMatch = player.team.toLowerCase().includes(q);
            return nameMatch || teamMatch;
        });
    }

    AppState.filteredPlayers = result;

    // Render the roster with a click handler for activating players.
    ScoutUI.renderRoster(AppState.filteredPlayers, function (player) {
        setSelectedPlayer(player.id);
    });

    // Re-apply the active highlight in case the selected player is
    // still present in the filtered list.
    highlightActiveRosterRow();
}

/* Toggle .is-active on the roster row matching selectedPlayerId. */
function highlightActiveRosterRow() {
    if (!DOM.playerRosterList) return;

    const rows = DOM.playerRosterList.querySelectorAll('li[data-player-id]');
    rows.forEach(function (row) {
        const rowId = Number(row.dataset.playerId);
        row.classList.toggle('is-active', rowId === AppState.selectedPlayerId);
    });
}


/* =====================================================================
   5. COMPARISON RENDERING
   ===================================================================== */
function renderComparisonFromState() {
    const playerA = findPlayerById(AppState.compareAId);
    const playerB = findPlayerById(AppState.compareBId);
    ScoutUI.renderComparison(playerA, playerB);
}


/* =====================================================================
   6. POPULATE COMPARISON DROPDOWNS
   =====================================================================
   Fills #compareA and #compareB with a placeholder followed by one
   option per player. Player names go through a DOM-based escaper
   so any special characters are safely serialized into the option.
   ===================================================================== */
function populateComparisonDropdowns() {

    // DOM-based escaper: assign the raw string to textContent, then
    // read it back as innerHTML. This serializes the string exactly
    // the same way the browser would when rendering the option text.
    function esc(value) {
        const tmp = document.createElement('div');
        tmp.textContent = value;
        return tmp.innerHTML;
    }

    const optionsHtml = AppState.players.map(function (player) {
        return '<option value="' + player.id + '">' +
               esc(player.name) + ' — ' + esc(player.position) +
               '</option>';
    }).join('');

    const placeholder = '<option value="">— Select a player —</option>';

    if (DOM.compareA) DOM.compareA.innerHTML = placeholder + optionsHtml;
    if (DOM.compareB) DOM.compareB.innerHTML = placeholder + optionsHtml;
}


/* =====================================================================
   7. EVENT WIRING
   ===================================================================== */
function wireEvents() {

    // 'input' fires on every keystroke so search feels live.
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', function (event) {
            setSearchQuery(event.target.value);
        });
    }

    // 'change' fires when the user commits a new sport filter.
    if (DOM.sportFilter) {
        DOM.sportFilter.addEventListener('change', function (event) {
            setSportFilter(event.target.value);
        });
    }

    if (DOM.compareA) {
        DOM.compareA.addEventListener('change', function (event) {
            const id = event.target.value === '' ? null : Number(event.target.value);
            setCompareA(id);
        });
    }

    if (DOM.compareB) {
        DOM.compareB.addEventListener('change', function (event) {
            const id = event.target.value === '' ? null : Number(event.target.value);
            setCompareB(id);
        });
    }

    // NOTE: The roster <ul> does NOT get a delegated click listener
    // here because script.ui.js already attaches a per-row handler
    // during renderRoster(). Adding one here would double-fire.
}


/* =====================================================================
   8. ERROR STATE
   =====================================================================
   Rendered into the roster list when the fetch fails, so users see
   a friendly message rather than an empty list. The message text is
   escaped before injection.
   ===================================================================== */
function renderFetchError(message) {
    if (!DOM.playerRosterList) return;

    const safe = String(message)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    DOM.playerRosterList.innerHTML =
        '<li class="placeholder-text" style="color:#cc0000;">' +
        'Could not load the roster.<br>' + safe +
        '</li>';
}


/* =====================================================================
   9. BOOTSTRAP
   ===================================================================== */
async function initializeApp() {

    console.log('[ScoutApp] Bootstrapping application...');

    // Step 1: cache DOM references first.
    cacheDomReferences();

    // Step 2: wire events before the fetch so the UI is responsive
    // even on a slow network.
    wireEvents();

    // Step 3: show an immediate loading placeholder.
    if (DOM.playerRosterList) {
        DOM.playerRosterList.innerHTML =
            '<li class="placeholder-text">Loading roster…</li>';
    }

    // Step 4: fetch the dataset.
    try {
        const players = await ScoutIO.fetchPlayers();

        AppState.players = players;
        applyFiltersAndRender();
        populateComparisonDropdowns();
        renderComparisonFromState();
        ScoutUI.renderActiveCard(null, '', null);

        console.log('[ScoutApp] Ready with ' + players.length + ' players.');

    } catch (error) {
        // Step 5: graceful failure. The search box and filters remain
        // interactive, but the roster shows a friendly error.
        console.error('[ScoutApp] Initialization failed:', error);
        renderFetchError(error.message || 'Unknown error.');
    }
}


/* =====================================================================
   10. KICKOFF
   =====================================================================
   `defer` on every <script> tag means DOMContentLoaded fires after
   the DOM is fully parsed but before images finish loading — the
   correct moment to run our bootstrap.
   ===================================================================== */
document.addEventListener('DOMContentLoaded', initializeApp);