const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

function parseYearMonth(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(YEAR_MONTH_PATTERN);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  return {
    year,
    month,
    order: year * 12 + month
  };
}

function isValidYearMonth(value) {
  return parseYearMonth(value) !== null;
}

function formatYearMonth(value) {
  const parsed = parseYearMonth(value);

  if (!parsed) {
    return '';
  }

  const monthLabel = parsed.month < 10 ? `0${parsed.month}` : String(parsed.month);

  return `${parsed.year}.${monthLabel}`;
}

function formatYearMonthRange(startDate, endDate) {
  const startLabel = formatYearMonth(startDate);
  const endLabel = endDate ? formatYearMonth(endDate) : '2026.07';

  if (!startLabel) {
    return endLabel;
  }

  return `${startLabel} - ${endLabel}`;
}

function getYearMonthOrder(value, fallbackOrder) {
  const parsed = parseYearMonth(value);

  return parsed ? parsed.order : fallbackOrder;
}

function compareYearMonthDesc(left, right) {
  return getYearMonthOrder(right, 0) - getYearMonthOrder(left, 0);
}

module.exports = {
  parseYearMonth,
  isValidYearMonth,
  formatYearMonth,
  formatYearMonthRange,
  getYearMonthOrder,
  compareYearMonthDesc
};
