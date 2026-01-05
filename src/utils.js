// Get today's date in YYYY-MM-DD format
export const getTodayDateString = function () {
    let date = new Date();
    date.setMinutes(date.getMinutes()+330)
    return date.toISOString().split('T')[0];
}