import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET env var");
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  // Get Svix headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing required Svix headers" }, { status: 400 });
  }

  // Get raw body
  const payload = await req.text();
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }

  const eventType = evt.type;
  await connectToDatabase();

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const data = evt.data;
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address || "";
      const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || email.split("@")[0];
      const avatarUrl = data.image_url || "";

      await User.findOneAndUpdate(
        { clerkId },
        {
          clerkId,
          email,
          name,
          avatarUrl,
        },
        { upsert: true, new: true },
      );
      console.log(`Synced user: ${clerkId}`);
    } else if (eventType === "user.deleted") {
      const { id: clerkId } = evt.data;
      if (clerkId) {
        await User.deleteOne({ clerkId });
        console.log(`Deleted user: ${clerkId}`);
      }
    } else if (eventType === "organization.created") {
      const data = evt.data;
      const clerkOrgId = data.id;
      const name = data.name;
      const createdBy = data.created_by;

      // Find the owner user in DB
      const dbOwner = await User.findOne({ clerkId: createdBy });
      if (!dbOwner) {
        console.error(`Owner user ${createdBy} not found for org ${clerkOrgId}`);
        return NextResponse.json({ error: "Owner user not found in database" }, { status: 400 });
      }

      await Organization.findOneAndUpdate(
        { clerkOrgId },
        {
          clerkOrgId,
          name,
          ownerId: dbOwner._id,
          $addToSet: {
            members: { userId: dbOwner._id, role: "admin" },
          },
        },
        { upsert: true, new: true },
      );
      console.log(`Created organization: ${clerkOrgId}`);
    } else if (eventType === "organization.updated") {
      const data = evt.data;
      const clerkOrgId = data.id;
      const name = data.name;

      await Organization.findOneAndUpdate({ clerkOrgId }, { name });
      console.log(`Updated organization: ${clerkOrgId}`);
    } else if (eventType === "organization.deleted") {
      const data = evt.data;
      const clerkOrgId = data.id;

      await Organization.deleteOne({ clerkOrgId });
      console.log(`Deleted organization: ${clerkOrgId}`);
    } else if (eventType === "organizationMembership.created") {
      const data = evt.data;
      const clerkOrgId = data.organization.id;
      const clerkUserId = data.public_user_data.user_id;
      const clerkRole = data.role;

      const dbOrg = await Organization.findOne({ clerkOrgId });
      const dbUser = await User.findOne({ clerkId: clerkUserId });

      if (dbOrg && dbUser) {
        const mappedRole = clerkRole.includes("admin")
          ? "admin"
          : clerkRole.includes("member")
            ? "editor"
            : "viewer";

        // Remove if user already in members to avoid duplicate
        await Organization.updateOne(
          { clerkOrgId },
          { $pull: { members: { userId: dbUser._id } } },
        );

        // Add back with correct role
        await Organization.updateOne(
          { clerkOrgId },
          {
            $push: {
              members: { userId: dbUser._id, role: mappedRole },
            },
          },
        );
        console.log(`Added user ${clerkUserId} to org ${clerkOrgId} as ${mappedRole}`);
      }
    } else if (eventType === "organizationMembership.updated") {
      const data = evt.data;
      const clerkOrgId = data.organization.id;
      const clerkUserId = data.public_user_data.user_id;
      const clerkRole = data.role;

      const dbOrg = await Organization.findOne({ clerkOrgId });
      const dbUser = await User.findOne({ clerkId: clerkUserId });

      if (dbOrg && dbUser) {
        const mappedRole = clerkRole.includes("admin")
          ? "admin"
          : clerkRole.includes("member")
            ? "editor"
            : "viewer";

        await Organization.updateOne(
          { clerkOrgId, "members.userId": dbUser._id },
          {
            $set: {
              "members.$.role": mappedRole,
            },
          },
        );
        console.log(`Updated user ${clerkUserId} role in org ${clerkOrgId} to ${mappedRole}`);
      }
    } else if (eventType === "organizationMembership.deleted") {
      const data = evt.data;
      const clerkOrgId = data.organization.id;
      const clerkUserId = data.public_user_data.user_id;

      const dbOrg = await Organization.findOne({ clerkOrgId });
      const dbUser = await User.findOne({ clerkId: clerkUserId });

      if (dbOrg && dbUser) {
        await Organization.updateOne(
          { clerkOrgId },
          {
            $pull: {
              members: { userId: dbUser._id },
            },
          },
        );
        console.log(`Removed user ${clerkUserId} from org ${clerkOrgId}`);
      }
    }
  } catch (error) {
    console.error("Error processing Clerk webhook event:", error);
    return NextResponse.json({ error: "Database synchronization error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Webhook processed" });
}
