import isRegExp from './isRegExp';

type Pattern = string | string[] | RegExp;

function matches(pattern: Pattern, name: string) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1;
  } if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1;
  } if (isRegExp(pattern)) {
    return pattern.test(name);
  }
  return false;
}

export default function getKeepAlive(
  name: string,
  include?: Pattern,
  exclude?: Pattern,
  disabled?: boolean,
) {
  if (disabled !== undefined) {
    return !disabled;
  }
  return !((include && (!name || !matches(include, name)))
    || (exclude && name && matches(exclude, name)));
}
