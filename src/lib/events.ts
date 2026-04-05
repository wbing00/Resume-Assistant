export async function logProductEvent(
  supabase: {
    from: (table: string) => {
      insert: (payload: unknown) => PromiseLike<{ error: { message: string } | null }>;
    };
  },
  userId: string | null,
  eventName: string,
  eventPayload: Record<string, string | number | boolean | null>,
) {
  const { error } = await supabase.from("events").insert({
    user_id: userId,
    event_name: eventName,
    event_payload: eventPayload,
  });

  if (error) {
    throw new Error(error.message);
  }
}
