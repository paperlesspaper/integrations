// Standalone visual study. Fictional data; does not register an integration view.
const params = new URLSearchParams(location.search);
const view = ['magazine', 'program', 'spotlight'].includes(params.get('view')) ? params.get('view') : 'magazine';
PaperlessOpenIntegration.applyColorTheme(params.get('color') || 'blue-light');
const large = Math.min(innerWidth, innerHeight) >= 1000;
document.documentElement.style.setProperty('--u', large ? '1.65px' : '1px');
document.body.dataset.view = view;
document.body.dataset.large = String(large);

const events = [
  {day:'02', month:'OKT', weekday:'FR', time:'19:30', end:'22:00', title:'Jazz im Hof', place:'Kulturhof · Innenhof', category:'Konzert', color:'blue', image:'jazz.svg', excerpt:'Ein Abend unter freiem Himmel. Das Westend Quartett spielt zwischen Soul, Swing und spätem Sommer.', note:'Einlass 18:30 · ab 18 €'},
  {day:'03', month:'OKT', weekday:'SA', time:'10:00', end:'17:00', title:'Markt der schönen Dinge', place:'Alte Fabrik · Halle 2', category:'Designmarkt', color:'green', image:'market.svg', excerpt:'Keramik, kleine Labels und handgemachte Lieblingsstücke. Dazu Kaffee und frisches Brot.', note:'Eintritt frei'},
  {day:'03', month:'OKT', weekday:'SA', time:'20:15', end:'22:30', title:'Kino unter Sternen', place:'Stadtgarten · Wiese', category:'Open-Air-Kino', color:'red', image:'cinema.svg', excerpt:'Lieblingsfilme auf großer Leinwand. Decke mitbringen, zurücklehnen und den Abend genießen.', note:'Ab 8 €'},
  {day:'04', month:'OKT', weekday:'SO', time:'11:00', end:'13:00', title:'Offenes Atelier', place:'Kulturhof · Studio 4', category:'Kunst', color:'blue', image:null, excerpt:'Einblicke in neue Arbeiten und Gespräche mit den Menschen dahinter.', note:'Eintritt frei'},
  {day:'04', month:'OKT', weekday:'SO', time:'15:00', end:'17:00', title:'Druck & Papier', place:'Alte Fabrik · Werkstatt', category:'Workshop', color:'green', image:'print.svg', excerpt:'Eigene Postkarten drucken: mit Farbe, Papier und einfachen Formen.', note:'Anmeldung erforderlich'},
  {day:'07', month:'OKT', weekday:'MI', time:'18:30', end:'20:00', title:'Lesen am langen Tisch', place:'Kulturhof · Bibliothek', category:'Lesung', color:'red', image:null, excerpt:'Neue Geschichten und gute Gespräche im kleinen Kreis.', note:'Eintritt frei'}
];
const art = (e, cls='') => `<div class="art ${cls}" style="--event-color:var(--pp-${e.color})">${e.image ? `<img src="assets/${e.image}" alt="Gestaltetes Beispielplakat für ${e.title}">` : `<div class="fallback"><span class="fallback-symbol">✳</span><span>${e.category}</span></div>`}</div>`;
const tag = e => `<span class="tag" style="--event-color:var(--pp-${e.color})">${e.category}</span>`;
const date = e => `<div class="date"><span>${e.weekday}</span><strong>${e.day}</strong><span>${e.month}</span></div>`;
const header = `<header><div class="brand"><span class="brand-mark">k.</span><div><b>KULTURKALENDER</b><span>Kulturhof & Nachbarschaft</span></div></div><div class="edition">02 — 08 OKT<span>2026</span></div></header>`;
const footer = (shown) => `<footer><span>PROGRAMM · DIE NÄCHSTEN 7 TAGE</span><span>${shown < events.length ? `+ ${events.length-shown} weitere Termine · ` : ''}Stand 02.10., 09:00</span></footer>`;

const magazine = () => {
  const hero=events[0], count=large?6:4;
  return `${header}<div class="section-label">RAUSGEHEN. ENTDECKEN. DABEI SEIN.</div><section class="magazine"><article class="hero">${art(hero)}<div class="hero-copy">${tag(hero)}<h1>${hero.title}</h1><p class="hero-time">Heute · ${hero.time} Uhr</p><p>${hero.place}</p><p class="excerpt">${hero.excerpt}</p><span class="note">${hero.note}</span></div></article><div class="upcoming"><h2>Auch einen Besuch wert</h2>${events.slice(1,count).map(e=>`<article class="mini">${art(e)}<div>${tag(e)}<h3>${e.title}</h3><p><b>${e.weekday}, ${e.day}.10. · ${e.time}</b></p><p class="place">${e.place}</p></div></article>`).join('')}</div></section>${footer(count)}`;
};
const program = () => {
  const count=large?6:4;
  return `${header}<div class="program-heading"><h1>Deine Woche. Dein Programm.</h1><span>OKTOBER / 01</span></div><section class="program">${events.slice(0,count).map(e=>`<article class="program-row">${date(e)}${art(e)}<div class="program-copy">${tag(e)}<h2>${e.title}</h2><p>${e.place}</p><p class="excerpt">${e.excerpt}</p></div><div class="schedule"><b>${e.time}</b><span>bis ${e.end}</span><span class="note">${e.note}</span></div></article>`).join('')}</section>${footer(count)}`;
};
const spotlight = () => {
  const hero=events[0];
  return `${header}<section class="spotlight">${art(hero, 'spotlight-art')}<div class="spotlight-copy"><div class="eyebrow">HEUTE IM KULTURHOF</div>${tag(hero)}<h1>Jazz<br>im Hof.</h1><p class="lede">Musik draußen.<br>Der Abend gehört dir.</p><div class="facts"><div><span>FREITAG, 02. OKTOBER</span><b>19:30 — 22:00</b></div><div><span>WO</span><b>Innenhof · Kulturhof</b></div></div><p class="excerpt">${hero.excerpt}</p><p class="note">${hero.note}</p><div class="ticket"><b>Programm & Tickets ↗</b><span>kultur.example.org/jazz</span></div></div></section><div class="next-strip"><b>ALS NÄCHSTES</b>${events.slice(1,3).map(e=>`<div><span>${e.weekday}, ${e.day}.10. · ${e.time}</span><strong>${e.title}</strong></div>`).join('')}</div><footer><span>KONZERTE · KULTUR · BEGEGNUNG</span><span>Stand 02.10., 09:00</span></footer>`;
};
document.getElementById('app').innerHTML = ({magazine,program,spotlight})[view]();
await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
await document.fonts.ready;
document.documentElement.dataset.ready='true';
