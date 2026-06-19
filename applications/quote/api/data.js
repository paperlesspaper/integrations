const quotes = [
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Well done is better than well said.', 'Benjamin Franklin'],
  ['Everything you can imagine is real.', 'Pablo Picasso'],
  ['Act as if what you do makes a difference. It does.', 'William James'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
  ['No great thing is created suddenly.', 'Epictetus'],
  ['Stay hungry, stay foolish.', 'Stewart Brand'],
  ['The only way out is through.', 'Robert Frost'],
  ['What we think, we become.', 'Buddha'],
  ['The future depends on what you do today.', 'Mahatma Gandhi'],
  ['Turn your wounds into wisdom.', 'Oprah Winfrey'],
  ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
  ['Do one thing well.', 'David Hieatt'],
  ['A goal without a plan is just a wish.', 'Antoine de Saint-Exupery'],
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['Dreams are maps.', 'Unknown'],
  ['Small steps every day.', 'Unknown'],
  ['Make it work, make it right, make it fast.', 'Kent Beck'],
  ['Less, but better.', 'Dieter Rams'],
];

function normalizeIndex(value) {
  const number = Number(value);
  if (Number.isFinite(number)) {
    return Math.abs(Math.floor(number)) % quotes.length;
  }

  const start = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 0));
  const today = new Date();
  const diff = today - start;
  const day = Math.floor(diff / 86400000);
  return day % quotes.length;
}

export default async function handler({ query }) {
  const index = normalizeIndex(query.index);
  const [quote, author] = quotes[index];

  return {
    quote,
    author,
    updatedAt: new Date().toISOString(),
  };
}
