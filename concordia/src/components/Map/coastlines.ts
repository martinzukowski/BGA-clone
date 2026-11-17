/**
 * Hand-drawn coastlines, one set per map.
 *
 * These are deliberately *coarse*: a few dozen control points per landmass,
 * enough to fix the silhouette — the Adriatic, the boot of Italy, the Aegean,
 * the Strait of Gibraltar. `landscape.ts` roughens every edge with fractal
 * displacement, which is where the jagged detail comes from.
 *
 * Coordinates share the map's own SVG space, so a city is on land exactly when
 * it sits inside a `land` ring. A ring is a list of `[x, y]` points; a third
 * number `[x, y, k]` scales the roughness of the edge leaving that point
 * (`0` keeps it dead straight — used for the far edges of the world, which are
 * never meant to be seen). A `sea` ring is an inland sea cut out of the land.
 *
 * Presentation only: the rules never read any of this.
 */

export type CoastRing = ReadonlyArray<readonly [number, number] | readonly [number, number, number]>;

export interface CoastDefinition {
  readonly land: readonly CoastRing[];
  readonly seas: readonly CoastRing[];
}

/* ─────────────────────────────────────────────────── MARE NOSTRVM ── */

const mareNostrum: CoastDefinition = {
  land: [
    // Europe, Asia and Africa are one landmass, joined at Egypt; the inland
    // sea is a long inlet from the Atlantic at the Strait of Gibraltar.
    [
      // Atlantic seaboard, north to south
      [200, -220], [230, 20], [248, 124], [262, 190], [244, 236], [228, 292], [222, 352],
      [216, 408], [192, 436], [152, 446], [112, 454], [80, 470], [66, 508], [62, 550],
      [62, 594], [70, 632], [82, 664], [90, 694],
      // Iberia's south and east coast
      [112, 708], [142, 708], [176, 696], [212, 678], [244, 664], [268, 648], [280, 626],
      [284, 604], [274, 578], [282, 552], [298, 534], [320, 514], [340, 494], [352, 470],
      // The Gulf of Lion and the Ligurian coast
      [372, 476], [394, 488], [420, 496], [448, 496], [470, 488], [488, 474],
      // Italy's western shore down to the toe, round the heel
      [496, 482], [508, 494], [522, 504], [538, 516], [552, 532], [572, 548], [590, 566],
      [606, 584], [630, 590], [644, 606], [654, 626], [668, 642], [684, 652], [696, 646],
      [708, 630], [724, 616], [742, 602], [752, 584], [750, 566], [738, 550], [716, 542],
      // Up the Adriatic's western shore to its head, and down the Dalmatian side
      [694, 530], [672, 510], [652, 488], [634, 466], [618, 444], [608, 424], [602, 404],
      [598, 384], [600, 368], [608, 360], [618, 362], [630, 372], [640, 386], [650, 404],
      [664, 432], [684, 452], [704, 466], [728, 474], [742, 480], [754, 498], [766, 518],
      // Greece: the Ionian coast, the Peloponnese, and back up the Aegean
      [778, 544], [782, 572], [786, 596], [794, 618], [804, 640], [820, 652], [836, 654],
      [850, 640],
      [860, 622], [874, 608], [892, 604], [906, 590], [912, 570], [916, 546], [912, 520],
      [904, 498], [890, 486], [872, 484], [862, 474], [878, 466], [892, 460], [908, 456],
      [924, 452], [944, 456],
      // Anatolia, the Cilician coast and the Levant
      [956, 484], [960, 510], [968, 536], [976, 562], [984, 586], [998, 606], [1020, 616],
      [1048, 614], [1078, 618], [1108, 614], [1130, 602], [1144, 590], [1146, 612],
      [1148, 636], [1144, 660], [1140, 680], [1138, 696], [1110, 712], [1086, 728],
      [1064, 748], [1048, 768],
      // Egypt and the African shore, all the way back to the Strait
      [1030, 758], [1002, 752], [974, 746], [944, 742], [916, 738], [888, 734], [860, 730],
      [836, 726], [816, 722], [802, 718], [762, 708], [728, 700], [694, 694],
      [660, 690], [626, 686], [598, 680], [584, 688], [568, 690], [548, 692], [520, 698],
      [490, 706], [456, 714], [420, 722], [386, 728], [350, 732], [314, 734], [280, 732],
      [248, 728], [214, 724], [184, 724], [158, 726], [140, 732], [124, 742], [108, 760],
      [96, 792], [90, 840], [84, 900],
      // The far edges of the world — straight, and well off-screen
      [90, 1220, 0], [1800, 1220, 0], [1800, -220, 0],
    ],
    // Sardinia
    [
      [476, 528], [494, 520], [512, 534], [520, 560], [518, 586], [508, 606], [490, 610],
      [478, 596], [472, 570], [470, 548],
    ],
    // Sicily
    [
      [642, 630], [656, 644], [660, 664], [654, 684], [638, 698], [612, 700], [584, 694],
      [562, 684], [552, 668], [560, 652], [582, 642], [610, 636],
    ],
    // Mallorca
    [[318, 556], [338, 548], [354, 556], [352, 572], [332, 580], [316, 572]],
    // Crete
    [[836, 676], [870, 664], [912, 662], [952, 668], [948, 680], [908, 684], [868, 688], [840, 688]],
    // Cyprus
    [[1080, 654], [1100, 644], [1124, 648], [1114, 660], [1090, 664]],
  ],
  seas: [
    // The Black Sea
    [
      [978, 352], [974, 326], [990, 300], [1014, 278], [1040, 262], [1070, 248], [1110, 252],
      [1140, 236], [1176, 244], [1206, 232], [1246, 228], [1284, 236], [1312, 258], [1328, 290],
      [1326, 326], [1308, 356], [1274, 376], [1230, 388], [1190, 386], [1150, 394],
      [1108, 386], [1064, 390], [1024, 386], [996, 384],
    ],
  ],
};

/* ─────────────────────────────────────────────────── ITALIA ANTIQVA ── */

const italiaAntiqua: CoastDefinition = {
  land: [
    // Europe: France and the Alps to the north, Italy, and the Balkans across the Adriatic
    [
      [-300, 340, 0],
      // The Ligurian coast and Tuscany
      [60, 334], [110, 338], [148, 334], [186, 336], [232, 338], [270, 334], [300, 340],
      [304, 362], [306, 386], [312, 412], [326, 430], [346, 448], [362, 466], [376, 484],
      [398, 500], [420, 520], [440, 540], [460, 556],
      // Latium and Campania, then down Calabria's western shore to the toe
      [482, 568], [494, 586], [500, 606], [506, 630], [516, 654], [532, 670], [556, 680],
      [578, 694], [584, 716], [582, 744], [588, 776], [604, 806], [630, 834], [656, 860],
      // Up the Ionian side, round the heel
      [684, 852], [700, 830], [722, 806], [748, 784], [774, 764], [800, 746], [814, 722], [814, 698],
      [802, 678], [820, 688], [840, 704], [858, 724], [866, 700], [860, 664],
      [846, 632], [826, 604], [812, 580], [800, 566],
      // The Adriatic's western shore to the head of the gulf
      [772, 552], [742, 532], [706, 512], [670, 494], [640, 482], [618, 474], [606, 440],
      [598, 414], [592, 394], [570, 364], [540, 352], [514, 346], [522, 322], [528, 298],
      [540, 268], [534, 244], [526, 224], [530, 208], [560, 206], [588, 214],
      // Istria and the Dalmatian coast, south-east towards Greece
      [598, 226], [612, 246], [606, 268], [624, 280], [646, 282], [668, 308], [694, 336],
      [722, 364], [752, 394], [786, 426], [820, 458], [852, 492], [880, 524], [900, 560],
      [912, 600], [920, 640], [934, 684], [958, 730], [986, 776], [1006, 826], [1020, 876],
      [1040, 926], [1070, 970],
      // The far edges of the world — straight, and well off-screen
      [1100, 1110, 0], [1500, 1110, 0], [1500, -300, 0], [-300, -300, 0],
    ],
    // Sicily
    [
      [634, 874], [652, 880], [668, 900], [664, 922], [650, 936], [610, 944], [560, 934],
      [520, 912], [486, 888], [470, 866], [474, 836], [500, 818], [540, 826], [584, 840],
      [614, 856],
    ],
    // Sardinia
    [
      [238, 552], [262, 544], [282, 566], [290, 610], [286, 660], [270, 712], [246, 738],
      [228, 720], [222, 670], [226, 616], [232, 580],
    ],
    // Corsica
    [[236, 420], [254, 410], [266, 440], [262, 484], [246, 498], [232, 470]],
    // The coast of Africa, glimpsed along the bottom edge
    [
      [60, 1100], [60, 960], [140, 950], [220, 946], [300, 938], [360, 920], [392, 900],
      [410, 920], [420, 960], [430, 1100],
    ],
  ],
  seas: [],
};

export const COASTLINES: Readonly<Record<string, CoastDefinition>> = {
  'mare-nostrum': mareNostrum,
  'italia-antiqua': italiaAntiqua,
};
