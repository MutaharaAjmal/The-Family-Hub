import { supabase } from "../../../src/api/supabase";

export const eventService = {
  // Helper function for date/time formatting
  formatDateTime(date: Date, time: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    const formattedTime = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return { formattedDate, formattedTime };
  },

  async createEvent(
    title: string,
    date: Date,
    time: Date,
    familyId: string,
    userId: string,
    visibility: string, // 🚀 Naya Prop
    attendees: string[],
    color: string,
    isAllDay: boolean,
  ) {
    if (!familyId) throw new Error("You must be in a family to create events.");
    const { formattedDate, formattedTime } = this.formatDateTime(date, time);

    const { data, error } = await supabase.from("events").insert([
      {
        title: title.trim(),
        event_date: formattedDate,
        start_time: formattedTime,
        family_id: familyId, // ✅ Direct input
        created_by: userId, // ✅ Direct input
        category: "General",
        visibility: visibility, // 🚀 Save ho raha hai
        attendees: attendees,
        color: color,
        is_all_day: isAllDay,
      },
    ]);

    if (error) throw error;
    return data;
  },

  // ✅ Naya Update Function
  async updateEvent(
    id: string,
    title: string,
    date: Date,
    time: Date,
    visibility: string, // 🚀 Naya Prop
    attendees: string[],
    color: string,
    isAllDay: boolean,
  ) {
    const { formattedDate, formattedTime } = this.formatDateTime(date, time);

    const { data, error } = await supabase
      .from("events")
      .update({
        title: title.trim(),
        event_date: formattedDate,
        start_time: formattedTime,
        visibility: visibility, // 🚀 Update ho raha hai
        attendees: attendees,
        color: color,
        is_all_day: isAllDay,
      })
      .eq("id", id);

    if (error) throw error;
    return data;
  },

  // ✅ Fetch Single Event (Edit mode mein loading ke liye)
  async getEventById(id: string) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getEventsByDate(dateString: string, familyId: string) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_date", dateString)
      .eq("family_id", familyId)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data;
  },
};
