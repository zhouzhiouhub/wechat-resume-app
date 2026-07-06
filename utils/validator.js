function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value) {
  return value === undefined || value === null || typeof value === 'string';
}

function isValidEmail(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidSkillLevel(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function isStringArray(value, options) {
  const allowEmpty = options && options.allowEmpty === true;

  if (!Array.isArray(value)) {
    return false;
  }

  if (!allowEmpty && value.length === 0) {
    return false;
  }

  return value.every(isNonEmptyString);
}

function hasUniqueValues(values) {
  if (!Array.isArray(values)) {
    return false;
  }

  return new Set(values).size === values.length;
}

module.exports = {
  isPlainObject,
  isNonEmptyString,
  isOptionalString,
  isValidEmail,
  isValidSkillLevel,
  isStringArray,
  hasUniqueValues
};
