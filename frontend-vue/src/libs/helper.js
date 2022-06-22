/**
 * number separate comma
 * @param {*|string} val
 * @return {string}
 */
export const numberComma = (val) => {
  if (typeof val != 'string') {
    val = String(val);
  }

  let parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
/**
 * remove separate comma
 * @param {*|string} val
 * @return {string}
 */
export const numberUncomma = (val) => {
  if (typeof val != 'string') {
    val = String(val);
  }
  
  let parts = val.split('.');
  parts[0] = parts[0].replace(/[^0-9\-]/g, '');
  return parts.join('.');
}
/**
 * set session storage data
 * @param {string} key
 * @param {string} val
 */
export const setSessionStorage = (key, val) => {
  window.sessionStorage.setItem(key, val);
}
/**
 * get session storage data
 * @param {string} key
 * @returns {string}
 */
export const getSessionStorage = (key) => {
  return window.sessionStorage.getItem(key);
}
/**
 * delete session storage data
 * @param {string} key
 */
export const delSessionStorage = (key) => {
  window.sessionStorage.removeItem(key);
}
/**
 * check session storage data
 * @param {string} key
 * @returns {boolean}
 */
export const hasSessionStorage = (key) => {
  return (window.sessionStorage.getItem(key) !== null);
}