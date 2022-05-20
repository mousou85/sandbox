/**
 * number separate comma
 * @param val
 * @return {string}
 */
function numberComma(val) {
  if (typeof val != 'string') {
    val = String(val);
  }

  let parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * remove separate comma
 * @param val
 * @return {string}
 */
function numberUncomma(val) {
  if (typeof val != 'string') {
    val = String(val);
  }
  
  let parts = val.split('.');
  parts[0] = parts[0].replace(/[^0-9\-]/g, '');
  return parts.join('.');
}


export  {
  numberComma,
  numberUncomma
}