// Sizzle & Serve — configuration: canvas, kitchen layout, ingredients, recipes, pacing.
// Every number the rules use lives here, so tuning the game never touches the logic.
export const STEP = 1 / 60;
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const TOP_BAR_HEIGHT = 116;
export const BEST_KEY = 'sizzle-and-serve-best';

// The chef's movement and size.
export const CHEF_RADIUS = 22;
export const CHEF_SPEED = 300;

// One station is a rectangle the chef walks up to and presses E (or clicks) to use.
export const STATIONS = {
  crates: [
    { id: 'bun', label: 'Buns', x: 48, y: 148, w: 104, h: 76 },
    { id: 'patty', label: 'Patties', x: 168, y: 148, w: 104, h: 76 },
    { id: 'cheese', label: 'Cheese', x: 288, y: 148, w: 104, h: 76 },
    { id: 'tomato', label: 'Tomatoes', x: 408, y: 148, w: 104, h: 76 },
    { id: 'lettuce', label: 'Lettuce', x: 528, y: 148, w: 104, h: 76 },
    { id: 'onion', label: 'Onions', x: 648, y: 148, w: 104, h: 76 },
  ],
  grill: { x: 48, y: 300, w: 240, h: 150, slots: 2 },
  chopper: { x: 336, y: 300, w: 210, h: 150, slots: 1 },
  assembly: { x: 920, y: 300, w: 312, h: 150, plates: 2 },
  bin: { x: 48, y: 560, w: 130, h: 120 },
  // The service hatch is scenery, not a station: dishes are served from the assembly
  // counter itself, and the hatch only shows the count. It still blocks the chef.
  serve: { x: 920, y: 560, w: 312, h: 120 },
};

// An ingredient id is its raw form; a prepared form is "<id>:cooked" or "<id>:chopped".
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8a94e', prep: 'ready' },
  patty: { name: 'Patty', color: '#c96f5a', prep: 'grill', cookSeconds: 6, burnSeconds: 5 },
  cheese: { name: 'Cheese', color: '#f7c948', prep: 'ready' },
  tomato: { name: 'Tomato', color: '#e5484d', prep: 'chop', chopSeconds: 2.5 },
  lettuce: { name: 'Lettuce', color: '#58b368', prep: 'chop', chopSeconds: 2.5 },
  onion: { name: 'Onion', color: '#b388eb', prep: 'chop', chopSeconds: 2.5 },
};

// A recipe is the exact set of prepared ingredients a plate must hold to serve.
export const RECIPES = {
  burger: {
    name: 'Classic Burger', price: 12, minLevel: 1,
    items: ['bun', 'patty:cooked', 'lettuce:chopped'],
  },
  salad: {
    name: 'Garden Salad', price: 14, minLevel: 1,
    items: ['lettuce:chopped', 'tomato:chopped', 'onion:chopped'],
  },
  cheeseburger: {
    name: 'Cheeseburger', price: 18, minLevel: 2,
    items: ['bun', 'patty:cooked', 'cheese', 'tomato:chopped'],
  },
  deluxe: {
    name: 'Deluxe Burger', price: 24, minLevel: 3,
    items: ['bun', 'patty:cooked', 'cheese', 'tomato:chopped', 'lettuce:chopped'],
  },
};
export const RECIPE_IDS = ['burger', 'salad', 'cheeseburger', 'deluxe'];

// Pacing: orders arrive faster and expire sooner as the day wears on.
export const ORDER_FIRST_AT = 2;
export const ORDER_INTERVAL_START = 15;
export const ORDER_INTERVAL_MIN = 7;
export const ORDER_INTERVAL_SHRINK = 0.55;
export const ORDER_TIME_LIMIT_START = 48;
export const ORDER_TIME_LIMIT_MIN = 32;
export const ORDER_TIME_LIMIT_SHRINK = 0.9;
export const MAX_ORDERS = 4;
export const HEARTS = 3;
export const LEVEL_SECONDS = 45;
export const TIP_MAX = 8;

// A ticket's urgency colours, by the fraction of its time left.
export const URGENCY = [
  { above: 0.5, bar: '#58b368', label: 'fresh' },
  { above: 0.25, bar: '#f7a928', label: 'hurry' },
  { above: 0, bar: '#e5484d', label: 'late' },
];
