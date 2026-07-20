const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SLOT_LENGTH_MINUTES = 30; // fixed 30-min meeting blocks — keeps the UI simple and predictable

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Projects a faculty's recurring weekly availability onto real calendar dates
 * for the next `daysAhead` days, splits each block into fixed-length slots,
 * and removes any slot that overlaps an existing booked appointment.
 */
function generateAvailableSlots({ availabilityRows, bookedSlots, daysAhead = 14 }) {
  const today = new Date();
  const slots = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = DAY_NAMES[date.getDay()];

    const dayTemplates = availabilityRows.filter((a) => a.day_of_week === dayName);

    for (const template of dayTemplates) {
      let cursor = template.start_time.slice(0, 5); // "HH:MM"
      const end = template.end_time.slice(0, 5);

      while (timeToMinutes(cursor) + SLOT_LENGTH_MINUTES <= timeToMinutes(end)) {
        const slotEnd = addMinutes(cursor, SLOT_LENGTH_MINUTES);

        // Skip slots that start in the past (today, earlier time)
        const slotDateTime = new Date(`${dateStr}T${cursor}`);
        if (slotDateTime > new Date()) {
          const isBooked = bookedSlots.some(
            (b) =>
              b.appointment_date.toISOString().split('T')[0] === dateStr &&
              b.start_time.slice(0, 5) === cursor
          );

          if (!isBooked) {
            slots.push({ date: dateStr, dayOfWeek: dayName, startTime: cursor, endTime: slotEnd });
          }
        }

        cursor = slotEnd;
      }
    }
  }

  return slots;
}

module.exports = { generateAvailableSlots, SLOT_LENGTH_MINUTES };