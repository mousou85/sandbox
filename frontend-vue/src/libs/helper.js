/**
 * number separate comma
 * @param val
 * @return {string}
 */
function numberComma(val) {
  if (typeof val != 'string') {
    val = String(val);
  }
  val = numberUncomma(val);
  return val.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
  
  return val.replace(/[^0-9]/g, '');
}


export  {
  numberComma,
  numberUncomma
}