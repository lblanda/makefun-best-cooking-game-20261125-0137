// A tiny seeded random generator (mulberry32) so a ?seed=N game always deals the same
// orders and a screenshot staged from that seed always shows the same frame.
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    int(max) {
      return Math.floor(this.next() * max);
    },
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}
