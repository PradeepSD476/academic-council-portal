// Branch names as employers write them -> IIT Patna roll-number branch codes (User.branchName is the
// 2-letter code from the roll number, e.g. 2401CS98 -> CS). Names we can't map are dropped and the
// posting is flagged, never guessed. Pure.
// Abbreviations must be whole words ("ce" must not match "certified"); full names match as prefixes.
const NAMES = [
    ['CS', /\b(cs|cse)\b|\bcomputer (science|engineering)/i],
    ['EE', /\b(ee|eee)\b|\belectrical/i],
    ['EC', /\b(ec|ece)\b|\belectronics/i],
    ['ME', /\bme\b|\bmechanical/i],
    ['CE', /\bce\b|\bcivil/i],
    ['CB', /\b(cb|che)\b|\bchemical/i],
    ['MM', /\b(mm|mme)\b|\bmetallurg|\bmaterials/i],
    ['EP', /\bep\b|\bengineering physics/i],
    ['MC', /\b(mc|mnc)\b|\bmath(ematics)? (and|&) computing/i],
    ['AI', /\b(ai|aids|ai ?(&|and) ?ds)\b|\bartificial intelligence|\bdata science/i],
];

// Returns { codes, unknown } for a list of free-text branch names.
export function branchCodes(names) {
    const codes = new Set();
    const unknown = [];
    for (const name of names ?? []) {
        const hit = NAMES.find(([, pattern]) => pattern.test(String(name).trim()));
        if (hit) codes.add(hit[0]);
        else unknown.push(name);
    }
    return { codes: [...codes], unknown };
}
