// "1 alias", "2 aliases"
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
