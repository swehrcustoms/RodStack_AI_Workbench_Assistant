/**
 * Generate a URL-safe slug from a company or customer name.
 */
export function generateSlug(name) {
  if (!name || typeof name !== "string") {
    return "client";
  }
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 30) || "client";
}

/**
 * Ensure slug is unique by checking the database and appending a counter if needed.
 */
export async function generateUniqueSlug(name, supabase) {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("clients")
      .select("id")
      .eq("client_slug", slug)
      .limit(1);

    if (error) {
      throw new Error(`Slug lookup failed: ${error.message}`);
    }
    if (!data || data.length === 0) {
      return slug;
    }
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}
