export function skipSymbol(p: PropertyKey) {
  if (p === 'inspect') {
    return true
  }
  if (typeof p !== 'symbol') {
    return false
  }
  switch (p) {
    case Symbol.iterator:
      return false;
    case Symbol.for('nodejs.util.inspect.custom'):
    case Symbol.toStringTag:
      return true;
    default:
      console.log('Symbol:', p);
      return true;
  }
}
