/* filename: script.io.js */
/* =====================================================================
   script.io.js
   ---------------------------------------------------------------------
   Tactical Scouting & Player Efficiency Lab - data & storage layer.

   RESPONSIBILITIES:
     1. Fetch the player dataset from players.php.
     2. Persist and restore scouting notes in localStorage.

   The module NEVER touches the DOM. All rendering lives in
   script.ui.js. All orchestration lives in script.app.js.
   ===================================================================== */

window.ScoutIO = (function () {

    /* Endpoint for the JSON dataset. */
    const PLAYERS_ENDPOINT = 'players.php';

    /* Prefix applied to every localStorage key so notes are namespaced. */
    const STORAGE_PREFIX = 'scoutNote::';

    /* =================================================================
       fetchPlayers()
       -----------------------------------------------------------------
       Async function that retrieves the dataset from players.php.

       FLOW:
         1. Await fetch(). Network errors reject and jump to catch.
         2. Check response.ok — fetch resolves on HTTP 4xx/5xx.
         3. Await response.json() to parse the body.
         4. Sanity-check that the parsed payload is an array.

       RETURNS: Promise<Array> on success, throws Error on failure.
       ================================================================= */
    async function fetchPlayers() {
        try {
            console.log('[ScoutIO] Fetching player dataset from:', PLAYERS_ENDPOINT);

            // Step 1: fire the request, wait for the response headers.
            const response = await fetch(PLAYERS_ENDPOINT);

            // Step 2: fetch() only rejects on network errors. A 404 or
            // 500 still resolves, so we must check response.ok manually.
            if (!response.ok) {
                throw new Error(
                    'HTTP ' + response.status + ' ' + response.statusText +
                    ' while requesting ' + PLAYERS_ENDPOINT
                );
            }

            // Step 3: parse the JSON body into a JavaScript array.
            const players = await response.json();

            // Step 4: sanity-check the shape. Fail loudly rather than
            // silently passing a non-array to the UI layer.
            if (!Array.isArray(players)) {
                throw new Error('Player dataset is not an array.');
            }

            console.log('[ScoutIO] Loaded ' + players.length + ' players.');
            return players;

        } catch (error) {
            // Log for debugging and re-throw so the caller can react.
            console.error('[ScoutIO] Failed to fetch players:', error);
            throw error;
        }
    }

    /* =================================================================
       Local storage helpers
       ================================================================= */

    /* Build the namespaced storage key for a player id. */
    function noteKey(playerId) {
        return STORAGE_PREFIX + playerId;
    }

    /* -----------------------------------------------------------------
       saveScoutingNote(playerId, noteText)
       -----------------------------------------------------------------
       Wraps the localStorage write in try...catch because localStorage
       can throw when the browser is in private mode with storage
       disabled, or when the storage quota has been exceeded.
       ----------------------------------------------------------------- */
    function saveScoutingNote(playerId, noteText) {
        try {
            localStorage.setItem(noteKey(playerId), noteText);
            console.log('[ScoutIO] Saved note for player ' + playerId + '.');
            return true;
        } catch (error) {
            console.warn('[ScoutIO] Could not save note to localStorage:', error);
            return false;
        }
    }

    /* -----------------------------------------------------------------
       loadScoutingNote(playerId)
       -----------------------------------------------------------------
       Reads a stored note. Returns '' when no note exists so callers
       can always assign the result to a <textarea> without null checks.
       ----------------------------------------------------------------- */
    function loadScoutingNote(playerId) {
        try {
            const stored = localStorage.getItem(noteKey(playerId));
            return stored === null ? '' : stored;
        } catch (error) {
            console.warn('[ScoutIO] Could not read note from localStorage:', error);
            return '';
        }
    }

    /* -----------------------------------------------------------------
       Public API
       ----------------------------------------------------------------- */
    return {
        fetchPlayers:     fetchPlayers,
        saveScoutingNote: saveScoutingNote,
        loadScoutingNote: loadScoutingNote
    };

})();