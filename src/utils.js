// Get today's date in YYYY-MM-DD format
export const getTodayDateString = function (date = new Date(), isIST = false) {
  if (!isIST) date.setMinutes(date.getMinutes() + 330);
  return date.toISOString().split('T')[0];
};

export const executeCallbackForDateRange = async (start, end, callback) => {
  let currentDate = new Date(start);
  const endDate = new Date(end);

  const callbacks = [];
  while (currentDate <= endDate) {
    callbacks.push(callback(getTodayDateString(currentDate, true)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  await Promise.all(callbacks);
};
