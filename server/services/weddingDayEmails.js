const User = require("../models/User");
const { sendWeddingDayCongratulationsEmail } = require("../utils/email");

const checkWeddingDaysToday = async () => {
  try {
    const today = new Date();
    const users = await User.find({
      weddingDate: { $ne: null },
      weddingEmailSent: { $ne: true }
    });

    for (const user of users) {
      const wDate = new Date(user.weddingDate);

      const wYear = wDate.getUTCFullYear();
      const wMonth = wDate.getUTCMonth();
      const wDay = wDate.getUTCDate();

      const tYearLocal = today.getFullYear();
      const tMonthLocal = today.getMonth();
      const tDayLocal = today.getDate();

      const tYearUTC = today.getUTCFullYear();
      const tMonthUTC = today.getUTCMonth();
      const tDayUTC = today.getUTCDate();

      const isWeddingToday = (wYear === tYearLocal && wMonth === tMonthLocal && wDay === tDayLocal) ||
        (wYear === tYearUTC && wMonth === tMonthUTC && wDay === tDayUTC);

      if (isWeddingToday) {
        const result = await sendWeddingDayCongratulationsEmail({
          coupleEmail: user.email,
          coupleName: `${user.partner1Name} & ${user.partner2Name}`,
        });

        // Provider acceptance is not proof of inbox delivery. Retry only on the normal cadence.
        if (!result?.accepted) continue;
        user.weddingEmailSent = true;
        await user.save();
        console.log("[SCHEDULER] Wedding day email accepted by provider.");
      }
    }
  } catch (err) {
    console.error("[SCHEDULER] Wedding day email check failed.");
  }
};

module.exports = { checkWeddingDaysToday };
