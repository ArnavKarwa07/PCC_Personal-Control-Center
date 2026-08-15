import { useCalendarStore } from '../stores/calendarStore';

export const useCalendar = () => {
  const store = useCalendarStore();
  return store;
};
