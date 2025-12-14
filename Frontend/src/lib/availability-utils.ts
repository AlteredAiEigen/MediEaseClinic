/**
 * Utility functions for checking user availability based on their weekly schedule
 */

export interface AvailabilitySchedule {
  [day: string]: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    enabled: boolean;
  };
}

/**
 * Check if a user is currently available based on their weekly schedule
 * @param availability The user's weekly availability schedule
 * @returns "available" | "off-duty"
 */
export function checkCurrentAvailability(
  availability: AvailabilitySchedule | null | undefined
): "available" | "off-duty" {
  if (!availability) {
    return "off-duty";
  }

  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = dayNames[now.getDay()];
  
  const todaySchedule = availability[currentDay];
  
  // If the day is not enabled or doesn't exist, user is off-duty
  if (!todaySchedule || !todaySchedule.enabled) {
    return "off-duty";
  }

  // Parse current time
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  // Parse start time
  const [startHours, startMinutes] = todaySchedule.startTime.split(":").map(Number);
  const startTimeInMinutes = startHours * 60 + startMinutes;

  // Parse end time
  const [endHours, endMinutes] = todaySchedule.endTime.split(":").map(Number);
  const endTimeInMinutes = endHours * 60 + endMinutes;

  // Check if current time is within the schedule
  if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
    return "available";
  }

  return "off-duty";
}

/**
 * Get formatted availability hours for a specific day
 * @param availability The user's weekly availability schedule
 * @param day The day to check (e.g., "Monday")
 * @returns Formatted string like "09:00 - 17:00" or "Off"
 */
export function getAvailabilityHours(
  availability: AvailabilitySchedule | null | undefined,
  day: string
): string {
  if (!availability || !availability[day] || !availability[day].enabled) {
    return "Off";
  }

  const schedule = availability[day];
  return `${schedule.startTime} - ${schedule.endTime}`;
}

/**
 * Get the next available time for a user
 * @param availability The user's weekly availability schedule
 * @returns A descriptive string of when the user will be available next
 */
export function getNextAvailableTime(
  availability: AvailabilitySchedule | null | undefined
): string {
  if (!availability) {
    return "Schedule not set";
  }

  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = dayNames[now.getDay()];
  const currentDayIndex = now.getDay();

  // Check the rest of today
  const todaySchedule = availability[currentDay];
  if (todaySchedule && todaySchedule.enabled) {
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const [startHours, startMinutes] = todaySchedule.startTime.split(":").map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;

    if (currentTimeInMinutes < startTimeInMinutes) {
      return `Today at ${todaySchedule.startTime}`;
    }
  }

  // Check the next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = dayNames[nextDayIndex];
    const nextSchedule = availability[nextDay];

    if (nextSchedule && nextSchedule.enabled) {
      if (i === 1) {
        return `Tomorrow at ${nextSchedule.startTime}`;
      } else {
        return `${nextDay} at ${nextSchedule.startTime}`;
      }
    }
  }

  return "No schedule set";
}
