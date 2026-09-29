// URL slug for company pages, e.g. "D. E. Shaw & Co." -> "d-e-shaw-co".

export function slugify(name) {
    const slug = String(name ?? '')
        .normalize('NFKD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '');
    return slug || 'company';
}

// isTaken: async (slug) => boolean. Appends -2, -3, ... until the slug is free.
export async function uniqueSlug(name, isTaken) {
    const base = slugify(name);
    if (!(await isTaken(base))) return base;
    for (let n = 2; n < 1000; n++) {
        const candidate = `${base}-${n}`;
        if (!(await isTaken(candidate))) return candidate;
    }
    throw new Error(`Could not find a free slug for "${name}"`);
}
