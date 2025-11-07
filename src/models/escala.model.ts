export interface Shift {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
}

export interface Schedule {
  id: string;
  week_start_date: string;
  is_published: boolean;
  shifts: Shift[];
}
