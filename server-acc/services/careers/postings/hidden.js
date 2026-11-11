// "Not for me" (P6-T9, F-12): postings a student hid from their own jobs list.

// Pure. showHidden = false: everything except what this student hid; true: only those.
export function hiddenWhere(userId, showHidden) {
    return { hiddenBy: { [showHidden ? 'some' : 'none']: { userId } } };
}
