/* Chapters use completed discoveries. A repeat visit, rating or purchase cannot advance them. */
const chapterScenes = Object.freeze({
  pond: { from: 50, family: 'garden', name: 'Dachgarten am Teich', image: 'rooftop-pond',
    alt: 'Der Pinguin steht auf der Teichbrücke. Neben ihm liest das Kaninchen auf einer Bank.',
    welcome: 'Du hast den Dachgarten erreicht!', story: 'Über den Dächern führt eine kleine Brücke zum Seerosenteich. Welchen Weg möchtest du erkunden?' },
  greenhouse: { from: 58, family: 'garden', name: 'Das Gewächshaus', image: 'greenhouse',
    alt: 'Maus und Einhorn betrachten eine große Sonnenblume im Gewächshaus.',
    welcome: 'Das Gewächshaus ist offen!', story: 'Zwischen Gießkanne und Blumentöpfen ist eine Sonnenblume gewachsen. Unter ihrem Blätterdach wartet deine nächste Entdeckung.' },
  dome: { from: 64, family: 'space', name: 'Die Sternwarte', image: 'observatory-bench',
    alt: 'Einhorn und Pinguin schauen durch das runde Fenster auf einen Ringplaneten.',
    welcome: 'Willkommen in der Sternwarte!', story: 'Hinter der Glaskuppel funkeln die Sterne. Such dir eine Station für deine nächste Entdeckung aus.' }
});
const chapterWords = {
  lift: { home:'Aufzug', journal:'Reisebuch', room:'Reisezimmer', rooms:'Deine Reisezimmer', where:'Am Aufzug', back:'Zum Aufzug', action:'Tür öffnen', unit:'Etage', choices:'Deine Türen', hint:'Tippe auf eine Tür und schau hinein!', shuffle:'Andere Türen zeigen' },
  garden: { home:'Dachgarten', journal:'Gartenbuch', room:'Gartenhaus', rooms:'Deine Gartenhäuser', where:'Im Dachgarten', back:'Zum Dachgarten', action:'Weg erkunden', unit:'Beet', choices:'Deine Wege', hint:'Tippe auf einen Weg und schau dich um!', shuffle:'Andere Wege zeigen' },
  space: { home:'Sternwarte', journal:'Sternenbuch', room:'Raumstation', rooms:'Deine Raumstation', where:'In der Sternwarte', back:'Zur Sternwarte', action:'Kurs setzen', unit:'Station', choices:'Deine Ziele', hint:'Tippe auf ein Ziel und schau dich um!', shuffle:'Andere Ziele zeigen' }
};
function discoveryCount() {
  return Object.values(state.records).filter(record => record.done).length;
}
function sceneAt(count) {
  if (count >= 64) return 'dome';
  if (count >= 58) return 'greenhouse';
  if (count >= 50) return 'pond';
  return null;
}
function knownScene(id) {
  return typeof id === 'string' && Object.hasOwn(chapterScenes, id) ? chapterScenes[id] : null;
}
function wordsFor(scene) {
  return chapterWords[scene?.family || 'lift'];
}
function currentWords() {
  return wordsFor(knownScene(sceneAt(discoveryCount())));
}
function homeDescription(count, scene) {
  if (scene) return scene.story;
  if (count >= 48) return 'Die Maus hat Seerosen auf dem Dach entdeckt. Bald öffnet sich die Tür zum Garten!';
  if (count >= 46) return 'Von ganz oben duftet es nach frischer Erde. Was wächst da wohl auf dem Dach?';
  return 'Hinter jeder Tür wartet eine andere Entdeckung.';
}
// An existing record or offer without a scene belongs to its original elevator destination.
function offeredScene(task) {
  const owner = state.records[task.id] || state.currentOffer;
  return knownScene(owner?.chapterScene);
}
function chapterPanel(scene, badge, tone, travelling = false) {
  const domeRide = travelling && scene.family === 'space';
  const image = domeRide ? 'star-dome' : scene.image;
  const alt = domeRide ? 'Kaninchen und Maus treten aus dem Aufzug unter die Sternenkuppel.' : scene.alt;
  return `<div class="scene chapter-scene ${tone}"><img class="scene-art" src="art/${image}.png" alt="${alt}"><span class="scene-label">${badge}</span></div>`;
}
function openLabel(task) {
  const words = wordsFor(offeredScene(task));
  return words.action + ' · ' + words.unit + ' ' + String(floorFor(task)).padStart(2, '0') + ' →';
}
function showChapterMilestone(before, after) {
  const scene = knownScene(sceneAt(after));
  if (!scene || before >= scene.from || after !== scene.from) return;
  dialog(`<section class="chapter-welcome" aria-labelledby="chapter-welcome-title">
    ${chapterPanel(scene, '★ ' + after + ' Entdeckungen', scene.family === 'space' ? 'lavender' : 'aqua', scene.family === 'space')}
    <div class="chapter-welcome-copy"><h2 id="chapter-welcome-title">${scene.welcome}</h2>
    <p>${scene.story}</p><button class="primary" onclick="closeDialog()">Weiter ${icon('arrow')}</button></div></section>`);
}
