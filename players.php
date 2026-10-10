<?php /* filename: players.php */
/**
 * =====================================================================
 * players.php
 * ---------------------------------------------------------------------
 * Tactical Scouting & Player Efficiency Lab - JSON endpoint.
 *
 * Serialization is wrapped in try...catch with JSON_THROW_ON_ERROR so
 * any encoding failure is caught rather than silently returning false.
 *
 * NOTE: In production, log the JsonException details server-side and
 * return a generic error payload to the client. We keep $e->getMessage()
 * OUT of the client response here to avoid leaking internals.
 * =====================================================================
 */

header('Content-Type: application/json; charset=UTF-8');

$players = [

    // ============================ BASKETBALL ============================
    [
        'id'          => 1,
        'name'        => 'Marcus Chen',
        'sport'       => 'Basketball',
        'team'        => 'Metro City Comets',
        'position'    => 'Point Guard',
        'image'       => 'https://placehold.co/120x120/1a1a1a/e63946?text=MC',
        'metrics'     => [
            'per'    => 24.8,
            'tsPct'  => 61.2,
            'usgPct' => 27.4,
            'astPct' => 38.1
        ],
        'tacticalRole' => 'Primary ball-handler and floor general. Initiates pick-and-roll, '
                        . 'sets pace, and creates secondary rim pressure when the offense stalls.'
    ],
    [
        'id'          => 2,
        'name'        => 'Dre Thompson',
        'sport'       => 'Basketball',
        'team'        => 'Harborview Waves',
        'position'    => 'Shooting Guard',
        'image'       => 'https://placehold.co/120x120/1a1a1a/f1faee?text=DT',
        'metrics'     => [
            'per'    => 19.3,
            'tsPct'  => 58.7,
            'usgPct' => 22.1,
            'astPct' => 14.6
        ],
        'tacticalRole' => 'Off-ball spacer and secondary creator. Heats up from the '
                        . 'catch-and-shoot three and punishes closeouts off the bounce.'
    ],
    [
        'id'          => 3,
        'name'        => 'Jamal Owusu',
        'sport'       => 'Basketball',
        'team'        => 'Metro City Comets',
        'position'    => 'Power Forward',
        'image'       => 'https://placehold.co/120x120/1a1a1a/e63946?text=JO',
        'metrics'     => [
            'per'    => 21.1,
            'tsPct'  => 55.4,
            'usgPct' => 24.9,
            'astPct' => 11.2
        ],
        'tacticalRole' => 'Inside-out big who anchors the defensive glass and short-rolls '
                        . 'into the pocket. Extension threat keeps the paint open.'
    ],
    [
        'id'          => 4,
        'name'        => 'Ryan Okafor',
        'sport'       => 'Basketball',
        'team'        => 'Harborview Waves',
        'position'    => 'Center',
        'image'       => 'https://placehold.co/120x120/1a1a1a/f1faee?text=RO',
        'metrics'     => [
            'per'    => 17.6,
            'tsPct'  => 63.9,
            'usgPct' => 18.3,
            'astPct' => 6.4
        ],
        'tacticalRole' => 'Rim-running defensive anchor. Converts high-percentage looks at '
                        . 'the rim, protects the paint, and deters drives without fouling.'
    ],

    // ============================== FOOTBALL =============================
    [
        'id'          => 5,
        'name'        => 'Luca Bellini',
        'sport'       => 'Football',
        'team'        => 'Northside United',
        'position'    => 'Central Midfielder',
        'image'       => 'https://placehold.co/120x120/1a1a1a/457b9d?text=LB',
        'metrics'     => [
            'per'    => 22.4,
            'tsPct'  => 84.1,
            'usgPct' => 19.7,
            'astPct' => 31.8
        ],
        'tacticalRole' => 'Deep-lying playmaker. Progresses the ball through line-breaking '
                        . 'passes and controls the tempo of the midfield block.'
    ],
    [
        'id'          => 6,
        'name'        => 'Andre Silva',
        'sport'       => 'Football',
        'team'        => 'Riverton FC',
        'position'    => 'Striker',
        'image'       => 'https://placehold.co/120x120/1a1a1a/457b9d?text=AS',
        'metrics'     => [
            'per'    => 26.9,
            'tsPct'  => 88.7,
            'usgPct' => 29.2,
            'astPct' => 9.3
        ],
        'tacticalRole' => 'Penalty-box poacher and pressing trigger. Elite off-ball movement '
                        . 'in the channels to attack crosses and through-balls.'
    ],
    [
        'id'          => 7,
        'name'        => 'Kwame Mensah',
        'sport'       => 'Football',
        'team'        => 'Northside United',
        'position'    => 'Right Winger',
        'image'       => 'https://placehold.co/120x120/1a1a1a/457b9d?text=KM',
        'metrics'     => [
            'per'    => 18.9,
            'tsPct'  => 79.3,
            'usgPct' => 21.4,
            'astPct' => 17.6
        ],
        'tacticalRole' => 'Inverted winger. Attacks the half-space, drives the byline, '
                        . 'and delivers cut-backs into the striker corridor.'
    ],
    [
        'id'          => 8,
        'name'        => 'Tomas Keller',
        'sport'       => 'Football',
        'team'        => 'Riverton FC',
        'position'    => 'Centre-Back',
        'image'       => 'https://placehold.co/120x120/1a1a1a/457b9d?text=TK',
        'metrics'     => [
            'per'    => 15.2,
            'tsPct'  => 91.4,
            'usgPct' => 12.8,
            'astPct' => 8.1
        ],
        'tacticalRole' => 'Ball-playing defender. Steps into midfield to break lines and '
                        . 'leads the offside trap in a high defensive block.'
    ]
];

try {
    $json = json_encode(
        $players,
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE
    );
    echo $json;

} catch (JsonException $e) {
    // Log the details server-side only.
    error_log('[players.php] JSON encoding failed: ' . $e->getMessage());

    // Return a generic message to the client. No internals leaked.
    http_response_code(500);
    echo json_encode(['error' => 'Serialization failure']);
}