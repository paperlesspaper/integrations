const entries = [
  {
    title: {
      en: 'Begin Again',
      de: 'Neu beginnen',
    },
    text: {
      en: 'Each breath is a small gate. Step through it without carrying the whole road behind you.',
      de: 'Jeder Atemzug ist ein kleines Tor. Geh hindurch, ohne den ganzen Weg hinter dir zu tragen.',
    },
  },
  {
    title: {
      en: 'Kind Attention',
      de: 'Freundliche Aufmerksamkeit',
    },
    text: {
      en: 'Attention becomes practice when it is gentle enough to include what is difficult.',
      de: 'Aufmerksamkeit wird zur Praxis, wenn sie freundlich genug ist, auch das Schwierige einzuschliessen.',
    },
  },
  {
    title: {
      en: 'Enough',
      de: 'Genug',
    },
    text: {
      en: 'A quiet mind does not need the day to be perfect before it can rest.',
      de: 'Ein stiller Geist braucht keinen perfekten Tag, um ruhen zu koennen.',
    },
  },
  {
    title: {
      en: 'The Cup',
      de: 'Die Tasse',
    },
    text: {
      en: 'Hold this moment as you would a warm cup: firmly enough not to spill, softly enough not to tense.',
      de: 'Halte diesen Moment wie eine warme Tasse: fest genug, um nichts zu verschuetten, weich genug, um nicht zu verkrampfen.',
    },
  },
  {
    title: {
      en: 'No Hurry',
      de: 'Keine Eile',
    },
    text: {
      en: 'When you stop hurrying the heart, even ordinary tasks remember their dignity.',
      de: 'Wenn du das Herz nicht antreibst, erinnern sich selbst gewoehnliche Aufgaben an ihre Wuerde.',
    },
  },
  {
    title: {
      en: 'Right Here',
      de: 'Genau hier',
    },
    text: {
      en: 'The path is not hidden elsewhere. It is the next honest step, taken with awake hands.',
      de: 'Der Weg ist nicht anderswo verborgen. Er ist der naechste ehrliche Schritt, mit wachen Haenden getan.',
    },
  },
  {
    title: {
      en: 'Soft Speech',
      de: 'Sanfte Rede',
    },
    text: {
      en: 'Before words leave the mouth, let them pass through the small room of compassion.',
      de: 'Bevor Worte den Mund verlassen, lass sie durch den kleinen Raum des Mitgefuehls gehen.',
    },
  },
  {
    title: {
      en: 'Weather',
      de: 'Wetter',
    },
    text: {
      en: 'Moods are weather, not identity. Bow to the clouds, then keep walking.',
      de: 'Stimmungen sind Wetter, nicht Identitaet. Verbeuge dich vor den Wolken und geh weiter.',
    },
  },
  {
    title: {
      en: 'One Bowl',
      de: 'Eine Schale',
    },
    text: {
      en: 'Gratitude begins when the simple bowl in front of you is no longer invisible.',
      de: 'Dankbarkeit beginnt, wenn die einfache Schale vor dir nicht mehr unsichtbar ist.',
    },
  },
  {
    title: {
      en: 'Less Grasping',
      de: 'Weniger Greifen',
    },
    text: {
      en: 'Letting go is not losing the world. It is releasing the hand that made the world too small.',
      de: 'Loslassen heisst nicht, die Welt zu verlieren. Es loest die Hand, die die Welt zu klein gemacht hat.',
    },
  },
  {
    title: {
      en: 'Small Bell',
      de: 'Kleine Glocke',
    },
    text: {
      en: 'Let one ordinary sound call you back: the kettle, the door, the rain, your own name.',
      de: 'Lass dich von einem gewoehnlichen Klang zurueckrufen: vom Kessel, von der Tuer, vom Regen, vom eigenen Namen.',
    },
  },
  {
    title: {
      en: 'The Pause',
      de: 'Die Pause',
    },
    text: {
      en: 'A pause is not emptiness. It is the place where habit can become choice.',
      de: 'Eine Pause ist keine Leere. Sie ist der Ort, an dem Gewohnheit zur Wahl werden kann.',
    },
  },
  {
    title: {
      en: 'Steady Hands',
      de: 'Ruhige Haende',
    },
    text: {
      en: 'Do the useful thing with steady hands, and let the result arrive in its own season.',
      de: 'Tu das Nuetzliche mit ruhigen Haenden und lass das Ergebnis in seiner eigenen Zeit ankommen.',
    },
  },
  {
    title: {
      en: 'Shared Breath',
      de: 'Geteilter Atem',
    },
    text: {
      en: 'No one breathes a private sky. Practice begins where separateness softens.',
      de: 'Niemand atmet einen privaten Himmel. Praxis beginnt dort, wo Getrenntheit weicher wird.',
    },
  },
  {
    title: {
      en: 'Enough Light',
      de: 'Genug Licht',
    },
    text: {
      en: 'You do not need to see the whole mountain to place one foot wisely.',
      de: 'Du musst nicht den ganzen Berg sehen, um einen Fuss weise zu setzen.',
    },
  },
  {
    title: {
      en: 'Mercy',
      de: 'Milde',
    },
    text: {
      en: 'Meet your mistake with enough mercy that it can teach rather than hide.',
      de: 'Begegne deinem Fehler mit genug Milde, damit er lehren kann, statt sich zu verstecken.',
    },
  },
  {
    title: {
      en: 'Clear Water',
      de: 'Klares Wasser',
    },
    text: {
      en: 'When the mind is stirred, do less. Clear water returns by not being shaken.',
      de: 'Wenn der Geist aufgewuehlt ist, tu weniger. Klares Wasser kehrt zurueck, wenn es nicht geschuettelt wird.',
    },
  },
  {
    title: {
      en: 'The Doorway',
      de: 'Die Tuer',
    },
    text: {
      en: 'Cross each doorway as if entering your life again. Because you are.',
      de: 'Ueberschreite jede Tuer, als wuerdest du dein Leben neu betreten. Denn genau das tust du.',
    },
  },
  {
    title: {
      en: 'Patient Roots',
      de: 'Geduldige Wurzeln',
    },
    text: {
      en: 'What grows quietly still grows. Trust the patient roots of practice.',
      de: 'Was still waechst, waechst trotzdem. Vertraue den geduldigen Wurzeln der Praxis.',
    },
  },
  {
    title: {
      en: 'Open Palm',
      de: 'Offene Hand',
    },
    text: {
      en: 'An open palm can receive, help, and release. This is why wisdom begins there.',
      de: 'Eine offene Hand kann empfangen, helfen und loslassen. Darum beginnt Weisheit dort.',
    },
  },
  {
    title: {
      en: 'The Guest',
      de: 'Der Gast',
    },
    text: {
      en: 'Welcome anger as a guest, not a ruler. Give it a chair, not the house.',
      de: 'Empfange Aerger als Gast, nicht als Herrscher. Gib ihm einen Stuhl, nicht das ganze Haus.',
    },
  },
  {
    title: {
      en: 'Ordinary Joy',
      de: 'Gewoehnliche Freude',
    },
    text: {
      en: 'Joy often arrives plainly dressed. Notice it before asking for something brighter.',
      de: 'Freude kommt oft schlicht gekleidet. Bemerke sie, bevor du nach etwas Hellerem verlangst.',
    },
  },
  {
    title: {
      en: 'Deep Listening',
      de: 'Tiefes Zuhoeren',
    },
    text: {
      en: 'To listen deeply is to make a safe shore where another person can land.',
      de: 'Tief zuzuhoeren heisst, ein sicheres Ufer zu schaffen, an dem ein Mensch landen kann.',
    },
  },
  {
    title: {
      en: 'This Step',
      de: 'Dieser Schritt',
    },
    text: {
      en: 'Peace is not waiting at the end of the path. Practice placing it in this step.',
      de: 'Frieden wartet nicht am Ende des Weges. Uebe, ihn in diesen Schritt zu legen.',
    },
  },
  {
    title: {
      en: 'A Wider View',
      de: 'Ein weiterer Blick',
    },
    text: {
      en: 'Suffering narrows the window. Compassion opens it without denying the rain.',
      de: 'Leiden verengt das Fenster. Mitgefuehl oeffnet es, ohne den Regen zu leugnen.',
    },
  },
  {
    title: {
      en: 'Daily Altar',
      de: 'Taeglicher Altar',
    },
    text: {
      en: 'The desk, the sink, the train seat: every place can become an altar when attention arrives.',
      de: 'Der Schreibtisch, das Waschbecken, der Sitz im Zug: Jeder Ort kann ein Altar werden, wenn Aufmerksamkeit ankommt.',
    },
  },
  {
    title: {
      en: 'Not Knowing',
      de: 'Nichtwissen',
    },
    text: {
      en: 'Not knowing is honest ground. Stand there gently and the next question will find you.',
      de: 'Nichtwissen ist ehrlicher Boden. Steh dort sanft, und die naechste Frage wird dich finden.',
    },
  },
  {
    title: {
      en: 'Shared Merit',
      de: 'Geteiltes Verdienst',
    },
    text: {
      en: 'A good act is not smaller when shared. It becomes a lamp in more than one window.',
      de: 'Eine gute Tat wird nicht kleiner, wenn man sie teilt. Sie wird zur Lampe in mehr als einem Fenster.',
    },
  },
  {
    title: {
      en: 'The Middle Way',
      de: 'Der mittlere Weg',
    },
    text: {
      en: 'Between forcing and drifting there is a faithful pace. Walk there today.',
      de: 'Zwischen Erzwingen und Treibenlassen gibt es ein treues Tempo. Geh heute dort.',
    },
  },
  {
    title: {
      en: 'Unclenched',
      de: 'Entspannt',
    },
    text: {
      en: 'Notice where the body clenches around a thought. Then offer both a little space.',
      de: 'Bemerke, wo der Koerper sich um einen Gedanken verkrampft. Dann gib beiden etwas Raum.',
    },
  },
  {
    title: {
      en: 'Before Replying',
      de: 'Vor der Antwort',
    },
    text: {
      en: 'Before replying, breathe once for truth and once for kindness.',
      de: 'Atme vor der Antwort einmal fuer die Wahrheit und einmal fuer die Freundlichkeit.',
    },
  },
  {
    title: {
      en: 'Home',
      de: 'Zuhause',
    },
    text: {
      en: 'Coming home can be as small as feeling both feet and telling the body: I am here.',
      de: 'Nach Hause kommen kann so klein sein, wie beide Fuesse zu spueren und dem Koerper zu sagen: Ich bin hier.',
    },
  },
];

const supportedLanguages = new Set(['en', 'de']);

function pickLanguage(value) {
  const requested = String(value || 'en').toLowerCase();
  const base = requested.split('-')[0];
  return supportedLanguages.has(requested)
    ? requested
    : supportedLanguages.has(base)
      ? base
      : 'en';
}

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
  return Math.floor(diff / 86400000);
}

function normalizeDay(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) {
    return null;
  }
  return Math.min(366, Math.floor(number));
}

function wrapDay(day) {
  return ((day - 1) % 366 + 366) % 366 + 1;
}

export default async function handler({ query }) {
  const language = pickLanguage(query.language);
  const fixedDay = normalizeDay(query.day);
  const offset = Number.isFinite(Number(query.dayOffset))
    ? Math.trunc(Number(query.dayOffset))
    : 0;
  const dayOfYear = wrapDay((fixedDay || getDayOfYear()) + offset);
  const entry = entries[(dayOfYear - 1) % entries.length];

  return {
    dayOfYear,
    entryCount: entries.length,
    title: entry.title[language] || entry.title.en,
    text: entry.text[language] || entry.text.en,
    attribution:
      language === 'de'
        ? 'Originale Reflexion, inspiriert von buddhistischer Praxis'
        : 'Original reflection inspired by Buddhist practice',
    updatedAt: new Date().toISOString(),
  };
}
