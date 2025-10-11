function getMonthBoundaries(month, year) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return { startOfMonth, endOfMonth };
}

function getTodayAndYesterday() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

  return { todayStart, todayEnd, yesterdayStart, yesterdayEnd };
}

module.exports = { getMonthBoundaries, getTodayAndYesterday };
