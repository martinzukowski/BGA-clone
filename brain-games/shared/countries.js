// Country names for the Brain Games map data (world-atlas 50m): friendlier display names, typed
// aliases, and which shapes are territories rather than guessable countries. Same lists as Globle,
// which keeps its own inline copy.
window.BrainCountries = (() => {
  const RENAME = {
    "Antigua and Barb.": "Antigua and Barbuda",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
    "Central African Rep.": "Central African Republic",
    "Congo": "Republic of the Congo",
    "Dem. Rep. Congo": "DR Congo",
    "Dominican Rep.": "Dominican Republic",
    "Eq. Guinea": "Equatorial Guinea",
    "Macedonia": "North Macedonia",
    "Marshall Is.": "Marshall Islands",
    "S. Sudan": "South Sudan",
    "Solomon Is.": "Solomon Islands",
    "St. Kitts and Nevis": "Saint Kitts and Nevis",
    "St. Vin. and Gren.": "Saint Vincent and the Grenadines",
    "eSwatini": "Eswatini",
    "United States of America": "United States",
    "Vatican": "Vatican City",
    "São Tomé and Principe": "São Tomé and Príncipe",
  };
  // Territories / disputed areas: drawn on the globe but not guessable.
  const NOT_PLAYABLE = new Set([
    "American Samoa", "Anguilla", "Antarctica", "Aruba", "Ashmore and Cartier Is.", "Bermuda",
    "Br. Indian Ocean Ter.", "British Virgin Is.", "Cayman Is.", "Cook Is.", "Curaçao", "Faeroe Is.",
    "Falkland Is.", "Fr. Polynesia", "Fr. S. Antarctic Lands", "Greenland", "Guam", "Guernsey",
    "Heard I. and McDonald Is.", "Hong Kong", "Indian Ocean Ter.", "Isle of Man", "Jersey", "Macao",
    "Montserrat", "N. Cyprus", "N. Mariana Is.", "New Caledonia", "Niue", "Norfolk Island",
    "Pitcairn Is.", "Puerto Rico", "S. Geo. and the Is.", "Saint Helena", "Siachen Glacier",
    "Sint Maarten", "Somaliland", "St-Barthélemy", "St-Martin", "St. Pierre and Miquelon",
    "Turks and Caicos Is.", "U.S. Virgin Is.", "W. Sahara", "Wallis and Futuna Is.", "Åland",
  ]);
  const ALIASES = {
    "United States": ["usa", "us", "america", "united states of america", "the us"],
    "United Kingdom": ["uk", "britain", "great britain", "england", "scotland", "wales", "gb"],
    "Côte d'Ivoire": ["ivory coast", "cote divoire"],
    "DR Congo": ["drc", "democratic republic of the congo", "congo kinshasa", "zaire"],
    "Republic of the Congo": ["congo", "congo brazzaville"],
    "Eswatini": ["swaziland"],
    "Myanmar": ["burma"],
    "Czechia": ["czech republic"],
    "Timor-Leste": ["east timor"],
    "Netherlands": ["holland", "the netherlands"],
    "United Arab Emirates": ["uae", "emirates"],
    "Cabo Verde": ["cape verde"],
    "North Macedonia": ["macedonia"],
    "Turkey": ["turkiye"],
    "Russia": ["russian federation"],
    "South Korea": ["korea", "republic of korea"],
    "North Korea": ["dprk"],
    "Vatican City": ["vatican", "holy see"],
    "Bosnia and Herzegovina": ["bosnia"],
    "Micronesia": ["federated states of micronesia"],
    "Laos": ["lao"],
    "Palestine": ["state of palestine"],
  };


  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/\bst\.?\s/g, 'saint ').replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/^the /, '');

  // Largest polygon's centroid, so e.g. France centres on France rather than between its territories.
  function mainCentroid(f) {
    const g = f.geometry;
    if (!g) return [0, 0];
    if (g.type !== 'MultiPolygon') return d3.geoCentroid(f);
    let best = null, bestA = -1;
    for (const poly of g.coordinates) {
      const p = { type: 'Polygon', coordinates: poly };
      const a = d3.geoArea(p);
      if (a > bestA) { bestA = a; best = p; }
    }
    return d3.geoCentroid(best);
  }

  /** Countries from a world-atlas topology: [{ i, raw, name, feature, playable, center }], a lookup by typed name, and neighbours. */
  function build(topo) {
    const features = topojson.feature(topo, topo.objects.countries).features;
    const neighbors = topojson.neighbors(topo.objects.countries.geometries);
    const countries = features.map((f, i) => ({
      i, raw: f.properties.name, name: RENAME[f.properties.name] || f.properties.name, feature: f,
      playable: !NOT_PLAYABLE.has(f.properties.name), center: mainCentroid(f),
    }));
    const lookup = new Map(), aliases = [];
    for (const c of countries) if (c.playable) { lookup.set(norm(c.name), c); lookup.set(norm(c.raw), c); }
    for (const [name, list] of Object.entries(ALIASES)) {
      const c = lookup.get(norm(name));
      if (c) for (const a of list) { lookup.set(norm(a), c); aliases.push([norm(a), a, c]); }
    }
    const playable = countries.filter(c => c.playable).sort((a, b) => a.name.localeCompare(b.name));
    return { countries, playable, lookup, aliases, neighbors, byName: name => lookup.get(norm(name)) };
  }

  return { RENAME, NOT_PLAYABLE, ALIASES, norm, build };
})();
