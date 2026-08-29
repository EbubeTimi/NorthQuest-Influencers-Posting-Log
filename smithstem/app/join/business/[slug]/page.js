import { notFound } from "next/navigation";

// The shared migration roster has been retired because Smithstem is launching
// with a fresh start. Individual, auditable invitations continue through
// /join/[token].
export default function RetiredMigrationJoinPage() {
  notFound();
}
