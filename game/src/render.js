// Every pixel of Sizzle & Serve: the kitchen, the order board, the chef, the tickets and
// the title and game-over screens. All art is drawn with canvas paths — no image files,
// so the game stays a handful of kilobytes and loads offline.
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, CHEF_RADIUS, INGREDIENTS, RECIPES,
  STATIONS, TOP_BAR_HEIGHT, URGENCY,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const FLOOR_A = '#f2e2c0';
const FLOOR_B = '#ecd6ae';
const WOOD = '#a9713f';
const WOOD_DARK = '#8a5a2b';
const STEEL = '#c9ced6';
const CREAM = '#fff8e7';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function urgencyFor(fraction) {
  for (const band of URGENCY) {
    if (fraction > band.above) return band;
  }
  return URGENCY[URGENCY.length - 1];
}

/** Draw one ingredient as a little dish icon centred at (x, y) with radius r. */
export function drawIngredient(ctx, id, x, y, r) {
  const base = id.split(':')[0];
  const cooked = id.endsWith(':cooked');
  const chopped = id.endsWith(':chopped');
  const burnt = id.endsWith(':burnt');
  ctx.save();
  ctx.translate(x, y);
  if (base === 'bun') {
    ctx.fillStyle = '#e8a94e';
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d18f2f';
    ctx.fillRect(-r, 0, r * 2, r * 0.35);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.45, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.55, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (base === 'patty') {
    ctx.fillStyle = burnt ? '#2b2b2b' : cooked ? '#7a4a26' : '#d98a7a';
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.2, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.2, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    if (burnt) {
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.4);
      ctx.lineTo(r * 0.5, r * 0.4);
      ctx.moveTo(r * 0.5, -r * 0.4);
      ctx.lineTo(-r * 0.5, r * 0.4);
      ctx.stroke();
    }
  } else if (base === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a13a';
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.2, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.05, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (base === 'tomato') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    if (chopped) {
      ctx.fillStyle = '#ff7a6e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    ctx.arc(0, -r * 0.8, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (base === 'lettuce') {
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.arc(Math.cos(angle) * r * 0.45, Math.sin(angle) * r * 0.45, r * 0.5, 0, Math.PI * 2);
    }
    ctx.fill();
    if (chopped) {
      ctx.strokeStyle = '#2f7a3e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
    }
  } else if (base === 'onion') {
    ctx.fillStyle = '#c9a7eb';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8e6bbf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    if (chopped) {
      ctx.fillStyle = '#e8d9f7';
      ctx.beginPath();
      ctx.arc(-r * 0.4, -r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.arc(r * 0.4, r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCrate(ctx, crate, highlight) {
  ctx.fillStyle = highlight ? '#ffd166' : WOOD;
  roundRect(ctx, crate.x - 3, crate.y - 3, crate.w + 6, crate.h + 6, 10);
  ctx.fill();
  ctx.fillStyle = CREAM;
  roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 8);
  ctx.fill();
  const info = INGREDIENTS[crate.id];
  drawIngredient(ctx, crate.id, crate.x + crate.w / 2, crate.y + 30, 20);
  text(ctx, info.name, crate.x + crate.w / 2, crate.y + crate.h - 13, 13, '#5a3a1a', 'center');
}

function drawGrill(ctx, kitchen, highlight) {
  const rect = STATIONS.grill;
  ctx.fillStyle = highlight ? '#ffd166' : '#4a4a52';
  roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.fill();
  ctx.fillStyle = '#2e2e34';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#6a6a72';
  ctx.lineWidth = 3;
  for (let i = 1; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(rect.x + 8, rect.y + (rect.h / 6) * i);
    ctx.lineTo(rect.x + rect.w - 8, rect.y + (rect.h / 6) * i);
    ctx.stroke();
  }
  text(ctx, 'GRILL', rect.x + rect.w / 2, rect.y - 12, 13, '#5a3a1a', 'center');
  kitchen.grill.forEach((slot, i) => {
    const cx = rect.x + 60 + i * 120;
    const cy = rect.y + rect.h / 2;
    if (slot.phase === 'empty') return;
    // Flame glow under a cooking patty.
    if (slot.phase === 'cooking') {
      ctx.fillStyle = 'rgba(255,140,40,0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 34 + Math.sin(Date.now() / 90 + i) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    drawIngredient(ctx, slot.phase === 'cooked' ? 'patty:cooked' : slot.phase === 'burnt' ? 'patty:burnt' : 'patty', cx, cy, 26);
    const total = slot.phase === 'cooking'
      ? INGREDIENTS.patty.cookSeconds
      : slot.phase === 'cooked'
        ? INGREDIENTS.patty.burnSeconds
        : 1;
    const fraction = slot.phase === 'burnt' ? 1 : Math.min(1, slot.timer / total);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, cx - 30, cy + 34, 60, 8, 4);
    ctx.fill();
    ctx.fillStyle = slot.phase === 'cooked' ? '#e5484d' : slot.phase === 'burnt' ? '#888' : '#f7a928';
    roundRect(ctx, cx - 30, cy + 34, 60 * fraction, 8, 4);
    ctx.fill();
    if (slot.phase === 'cooked') text(ctx, 'READY!', cx, cy - 36, 12, '#ffd166', 'center');
    if (slot.phase === 'burnt') text(ctx, 'BURNT!', cx, cy - 36, 12, '#ff6b5e', 'center');
  });
}

function drawChopper(ctx, kitchen, highlight) {
  const rect = STATIONS.chopper;
  ctx.fillStyle = highlight ? '#ffd166' : WOOD;
  roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.fill();
  ctx.fillStyle = '#d9b380';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  text(ctx, 'CHOP BOARD', rect.x + rect.w / 2, rect.y - 12, 13, '#5a3a1a', 'center');
  const chopper = kitchen.chopper;
  if (chopper.phase !== 'empty') {
    drawIngredient(ctx, chopper.phase === 'done' ? `${chopper.item}:chopped` : chopper.item, rect.x + rect.w / 2, rect.y + 62, 30);
    if (chopper.phase === 'chopping') {
      const fraction = chopper.timer / INGREDIENTS[chopper.item].chopSeconds;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, rect.x + 30, rect.y + 108, rect.w - 60, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#58b368';
      roundRect(ctx, rect.x + 30, rect.y + 108, (rect.w - 60) * fraction, 10, 5);
      ctx.fill();
      // The knife, mid-chop.
      ctx.save();
      ctx.translate(rect.x + rect.w / 2 + 34, rect.y + 58);
      ctx.rotate(-0.5 + Math.sin(Date.now() / 120) * 0.25);
      ctx.fillStyle = STEEL;
      ctx.fillRect(0, -4, 52, 8);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(52, -5, 20, 10);
      ctx.restore();
    } else {
      text(ctx, 'CHOPPED!', rect.x + rect.w / 2, rect.y + 118, 13, '#2f7a3e', 'center');
    }
  } else {
    ctx.fillStyle = 'rgba(90,58,26,0.55)';
    text(ctx, 'drop tomato / lettuce / onion', rect.x + rect.w / 2, rect.y + 70, 12, 'rgba(90,58,26,0.7)', 'center');
  }
}

function drawAssembly(ctx, kitchen, highlight, board) {
  const rect = STATIONS.assembly;
  ctx.fillStyle = highlight ? '#ffd166' : WOOD;
  roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.fill();
  ctx.fillStyle = '#c98d5a';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  text(ctx, 'ASSEMBLY', rect.x + rect.w / 2, rect.y - 12, 13, '#5a3a1a', 'center');
  kitchen.plates.forEach((plate, i) => {
    const cx = rect.x + 78 + i * 156;
    const cy = rect.y + rect.h / 2 + 6;
    ctx.fillStyle = '#f4f6f8';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 48, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    plate.forEach((item, j) => {
      drawIngredient(ctx, item, cx + (j - (plate.length - 1) / 2) * 34, cy - 6, 17);
    });
    if (plate.length > 0) {
      const matched = board.orders.some((order) => {
        if (order.items.length !== plate.length) return false;
        const rest = [...order.items];
        return plate.every((item) => {
          const k = rest.indexOf(item);
          if (k === -1) return false;
          rest.splice(k, 1);
          return true;
        });
      });
      if (matched) {
        ctx.fillStyle = '#2f7a3e';
        roundRect(ctx, cx - 34, cy + 40, 68, 20, 10);
        ctx.fill();
        text(ctx, 'SERVE!', cx, cy + 50, 12, '#fff', 'center');
      }
    }
  });
}

function drawBin(ctx, highlight) {
  const rect = STATIONS.bin;
  ctx.fillStyle = highlight ? '#ffd166' : '#7d8a99';
  roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.fill();
  ctx.fillStyle = '#5d6b7a';
  roundRect(ctx, rect.x + 22, rect.y + 18, rect.w - 44, rect.h - 30, 8);
  ctx.fill();
  ctx.fillStyle = '#7d8a99';
  ctx.fillRect(rect.x + 12, rect.y + 10, rect.w - 24, 12);
  text(ctx, 'BIN', rect.x + rect.w / 2, rect.y + rect.h - 8, 13, '#fff', 'center');
}

function drawServeHatch(ctx, world) {
  const rect = STATIONS.serve;
  ctx.fillStyle = '#3d2b1f';
  roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  text(ctx, 'SERVICE HATCH', rect.x + rect.w / 2, rect.y + 22, 15, '#5a3a1a', 'center');
  text(ctx, 'served dishes fly out here', rect.x + rect.w / 2, rect.y + 46, 12, '#8a6a42', 'center');
  // A little bell on the hatch.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w / 2, rect.y + 82, 16, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(rect.x + rect.w / 2 - 20, rect.y + 80, 40, 5);
  text(ctx, `served: ${world.served}`, rect.x + rect.w / 2, rect.y + rect.h - 10, 12, '#5a3a1a', 'center');
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + CHEF_RADIUS - 2, CHEF_RADIUS, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, CHEF_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8eef4';
  ctx.beginPath();
  ctx.arc(x, y + 8, CHEF_RADIUS - 4, 0, Math.PI);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - 4, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 4 + chef.facing * 2, y - 6, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 4 + chef.facing * 2, y - 6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 7, y - 14, 7, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 14, 7, 0, Math.PI * 2);
  ctx.arc(x, y - 17, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 12, y - 16, 24, 6);
  // The carried ingredient rides above the chef's head.
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y - 42, 20, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, chef.carrying, x, y - 42, 15);
  }
}

function drawTickets(ctx, world) {
  const board = world.board;
  if (!board) return;
  text(ctx, 'ORDERS', 24, 24, 15, '#ffd166');
  board.orders.forEach((order, i) => {
    const x = 16 + i * 212;
    const y = 34;
    const w = 200;
    const h = 72;
    const fraction = Math.max(0, order.timeLeft / order.timeLimit);
    const urgency = urgencyFor(fraction);
    ctx.fillStyle = CREAM;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = urgency.bar;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    text(ctx, `#${order.id}  ${order.name}`, x + 10, y + 14, 13, '#3d2b1f');
    order.items.forEach((item, j) => {
      drawIngredient(ctx, item, x + 22 + j * 34, y + 40, 13);
    });
    text(ctx, `$${order.price}`, x + w - 10, y + 40, 14, '#2f7a3e', 'right');
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, x + 10, y + h - 12, w - 20, 6, 3);
    ctx.fill();
    ctx.fillStyle = urgency.bar;
    roundRect(ctx, x + 10, y + h - 12, (w - 20) * fraction, 6, 3);
    ctx.fill();
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 14, 12, urgency.bar, 'right');
  });
  if (board.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', 110, 70, 14, 'rgba(255,248,231,0.75)');
  }
}

function drawHud(ctx, world) {
  const x = CANVAS_WIDTH - 24;
  text(ctx, `🪙 $${world.coins}`, x, 26, 20, '#ffd166', 'right');
  const hearts = '♥'.repeat(Math.max(0, world.hearts)) + '♡'.repeat(Math.max(0, 3 - world.hearts));
  text(ctx, hearts, x, 54, 20, '#ff6b5e', 'right');
  text(ctx, `Day ${world.level}   •   ${world.served} served`, x, 82, 14, '#fff8e7', 'right');
}

function drawKitchenFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, TOP_BAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - TOP_BAR_HEIGHT);
  ctx.fillStyle = FLOOR_B;
  const tile = 64;
  for (let y = TOP_BAR_HEIGHT; y < CANVAS_HEIGHT; y += tile) {
    for (let x = 0; x < CANVAS_WIDTH; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // Wall trim and a menu poster on the back wall.
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, TOP_BAR_HEIGHT, CANVAS_WIDTH, 10);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 800, 128, 220, 14, 7);
  ctx.fill();
  text(ctx, 'TODAY: BURGERS • SALADS • DELUXE', 910, 135, 11, '#5a3a1a', 'center');
}

function drawMessage(ctx, world) {
  if (!world.message) return;
  ctx.fillStyle = 'rgba(61,43,31,0.92)';
  const w = Math.min(560, 40 + world.message.length * 8.5);
  roundRect(ctx, (CANVAS_WIDTH - w) / 2, CANVAS_HEIGHT - 52, w, 34, 17);
  ctx.fill();
  text(ctx, world.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 35, 15, '#fff8e7', 'center');
}

function drawFloats(ctx, world) {
  for (const item of world.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, item.life));
    text(ctx, item.text, item.x, item.y, 22, item.color, 'center');
  }
  ctx.globalAlpha = 1;
  for (const item of world.particles) {
    ctx.globalAlpha = Math.max(0, item.life / item.maxLife);
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawKitchenScene(ctx, world) {
  drawKitchenFloor(ctx);
  const near = world.nearStation;
  const isNear = (kind, index = 0) => near && near.kind === kind && near.index === index;
  STATIONS.crates.forEach((crate, i) => drawCrate(ctx, crate, isNear('crate', i)));
  drawGrill(ctx, world.kitchen, isNear('grill'));
  drawChopper(ctx, world.kitchen, isNear('chopper'));
  drawAssembly(ctx, world.kitchen, isNear('assembly'), world.board);
  drawBin(ctx, isNear('bin'));
  drawServeHatch(ctx, world);
  drawChef(ctx, world);
  drawFloats(ctx, world);
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(0, 0, CANVAS_WIDTH, TOP_BAR_HEIGHT);
  drawTickets(ctx, world);
  drawHud(ctx, world);
}

function drawTitle(ctx, world, best) {
  drawTopBar(ctx, world);
  drawKitchenScene(ctx, world);
  ctx.fillStyle = 'rgba(40,24,12,0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 290, 150, 700, 420, 24);
  ctx.fill();
  ctx.strokeStyle = '#e8a94e';
  ctx.lineWidth = 4;
  roundRect(ctx, 290, 150, 700, 420, 24);
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 220, 56, '#c0392b', 'center');
  text(ctx, 'a fast-paced cooking game', 640, 268, 20, '#5a3a1a', 'center');
  text(ctx, 'Grab ingredients, chop and grill, build the dish,', 640, 330, 18, '#3d2b1f', 'center');
  text(ctx, 'and serve it before the ticket runs out!', 640, 356, 18, '#3d2b1f', 'center');
  text(ctx, 'WASD / arrows — move      E / Space — use station', 640, 408, 16, '#5a3a1a', 'center');
  text(ctx, 'Click a station — walk over and use it      P — pause      M — mute', 640, 434, 16, '#5a3a1a', 'center');
  text(ctx, '3 missed orders ends the day. Tips grow when you serve fast.', 640, 470, 15, '#8a6a42', 'center');
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, 490, 500, 300, 48, 24);
  ctx.fill();
  text(ctx, 'PRESS SPACE TO COOK', 640, 524, 18, '#fff', 'center');
  if (best > 0) text(ctx, `Best service: $${best}`, 640, 560, 15, '#2f7a3e', 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(40,24,12,0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, 'PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, 48, '#fff8e7', 'center');
  text(ctx, 'Press P or Space to keep cooking', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30, 18, '#ffd166', 'center');
}

function drawOver(ctx, world, best) {
  drawKitchenScene(ctx, world);
  ctx.fillStyle = 'rgba(40,24,12,0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = CREAM;
  roundRect(ctx, 340, 190, 600, 380, 24);
  ctx.fill();
  ctx.strokeStyle = '#e8a94e';
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 190, 600, 380, 24);
  ctx.stroke();
  text(ctx, 'SERVICE OVER!', 640, 250, 44, '#c0392b', 'center');
  text(ctx, 'The kitchen is closed — three orders walked out.', 640, 296, 16, '#5a3a1a', 'center');
  text(ctx, `Coins earned: $${world.coins}`, 640, 350, 24, '#2f7a3e', 'center');
  text(ctx, `Dishes served: ${world.served}      Best: $${Math.max(best, world.coins)}`, 640, 390, 18, '#3d2b1f', 'center');
  text(ctx, `You reached Day ${world.level}`, 640, 420, 16, '#8a6a42', 'center');
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, 490, 470, 300, 48, 24);
  ctx.fill();
  text(ctx, 'PRESS SPACE TO COOK AGAIN', 640, 494, 16, '#fff', 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(world, screen, best) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (screen === SCREEN_TITLE) {
        drawTitle(ctx, world, best);
        return;
      }
      if (screen === SCREEN_OVER) {
        drawOver(ctx, world, best);
        return;
      }
      drawTopBar(ctx, world);
      drawKitchenScene(ctx, world);
      drawMessage(ctx, world);
      if (screen === SCREEN_PAUSED) drawPaused(ctx);
    },
  };
}
