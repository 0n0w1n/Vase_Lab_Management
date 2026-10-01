export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function getCurrentUser(): Promise<User | null> {
  // Placeholder: replace with a real database/session lookup later
  return { id: "42", name: "Tun Tun Tun Sahur", email: "TripleT@example.com", role: "LAB MEMBER" };
}
