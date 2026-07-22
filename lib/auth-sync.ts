/**
 * lib/auth-sync.ts — Resilient User & Organization synchronization helper.
 *
 * Automatically detects missing User or Organization records in MongoDB
 * and synchronizes them from Clerk on demand.
 *
 * Ensures the repository connection, sync, and graph workflows never fail
 * due to missing or un-webhooked organization contexts.
 *
 * Server-side only. Never import this from a Client Component.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";
import { Organization, IOrganization } from "@/models/Organization";

/**
 * Get or create a User document in MongoDB using their Clerk User ID.
 * If the user does not exist in MongoDB, fetches profile details from Clerk.
 */
export async function getOrCreateUser(clerkUserId: string): Promise<IUser> {
  await connectToDatabase();

  let dbUser = await User.findOne({ clerkId: clerkUserId });
  if (dbUser) return dbUser;

  let email = `${clerkUserId}@placeholder.com`;
  let name = "User";
  let avatarUrl = "";

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    email = clerkUser.emailAddresses?.[0]?.emailAddress || email;
    name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      email.split("@")[0] ||
      name;
    avatarUrl = clerkUser.imageUrl || avatarUrl;
  } catch (err) {
    console.warn("[getOrCreateUser] Could not fetch user from Clerk SDK, using fallback:", err);
  }

  dbUser = await User.findOneAndUpdate(
    { clerkId: clerkUserId },
    {
      $setOnInsert: {
        clerkId: clerkUserId,
        email,
        name,
        avatarUrl,
        plan: "free",
      },
    },
    { upsert: true, new: true },
  );

  return dbUser!;
}

/**
 * Get or create an Organization document in MongoDB.
 *
 * @param clerkOrgId   Clerk Organization ID (e.g. "org_123") or null/undefined for personal workspace.
 * @param clerkUserId  Clerk User ID of the active user.
 */
export async function getOrCreateOrganization(
  clerkOrgId: string | null | undefined,
  clerkUserId: string,
): Promise<IOrganization> {
  await connectToDatabase();

  // Ensure owner user exists in MongoDB first
  const dbOwner = await getOrCreateUser(clerkUserId);

  // If no Clerk Organization is active, fallback to a personal workspace org
  const targetOrgId = clerkOrgId || `personal_${clerkUserId}`;

  let dbOrg = await Organization.findOne({ clerkOrgId: targetOrgId });

  if (dbOrg) {
    // Ensure user is present in org members list
    const isMember = dbOrg.members.some((m) => m.userId.toString() === dbOwner._id.toString());

    if (!isMember) {
      dbOrg = await Organization.findOneAndUpdate(
        { _id: dbOrg._id },
        {
          $addToSet: {
            members: { userId: dbOwner._id, role: "admin" },
          },
        },
        { new: true },
      );
    }

    return dbOrg!;
  }

  // Fetch organization name from Clerk if an actual org_ ID is provided
  let orgName = `${dbOwner.name}'s Workspace`;

  if (clerkOrgId && clerkOrgId.startsWith("org_")) {
    try {
      const client = await clerkClient();
      const clerkOrg = await client.organizations.getOrganization({
        organizationId: clerkOrgId,
      });
      if (clerkOrg?.name) {
        orgName = clerkOrg.name;
      }
    } catch (err) {
      console.warn("[getOrCreateOrganization] Could not fetch org from Clerk SDK:", err);
    }
  }

  dbOrg = await Organization.findOneAndUpdate(
    { clerkOrgId: targetOrgId },
    {
      $setOnInsert: {
        clerkOrgId: targetOrgId,
        name: orgName,
        ownerId: dbOwner._id,
        members: [{ userId: dbOwner._id, role: "admin" }],
        plan: "free",
      },
    },
    { upsert: true, new: true },
  );

  return dbOrg!;
}
