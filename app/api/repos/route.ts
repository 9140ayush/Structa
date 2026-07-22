import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { Repository } from "@/models/Repository";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "octokit";

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const source = url.searchParams.get("source");

    if (source === "github") {
      try {
        const client = await clerkClient();
        const oauthRes = await client.users.getUserOauthAccessToken(userId, "oauth_github");

        const token = oauthRes.data[0]?.token;

        if (!token) {
          return NextResponse.json(
            { error: "GitHub OAuth token not found. Please log in with GitHub." },
            { status: 400 },
          );
        }

        const octokit = new Octokit({ auth: token });

        // Fetch repositories for authenticated user
        const reposRes = await octokit.rest.repos.listForAuthenticatedUser({
          per_page: 100,
          sort: "updated",
        });

        const repos = reposRes.data.map((repo) => ({
          id: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          private: repo.private,
          description: repo.description,
        }));

        return NextResponse.json({ repos });
      } catch (err: unknown) {
        console.error("Error fetching GitHub repos:", err);
        return NextResponse.json(
          { error: (err as Error).message || "Failed to fetch repositories from GitHub" },
          { status: 500 },
        );
      }
    }

    // Default: List connected repositories for the organization
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization active. Please select or create an organization." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Find the organization in MongoDB using clerkOrgId
    const dbOrg = await Organization.findOne({ clerkOrgId: orgId });
    if (!dbOrg) {
      return NextResponse.json({ repos: [] });
    }

    const repos = await Repository.find({ orgId: dbOrg._id }).sort({ name: 1 });

    return NextResponse.json({ repos });
  } catch (err: unknown) {
    console.error("Error listing repositories:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized or no active organization selected" },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { githubRepoId, name, url, isPrivate } = body;

    if (!githubRepoId || !name || !url) {
      return NextResponse.json(
        { error: "Missing required fields: githubRepoId, name, url" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Find the organization in MongoDB
    const dbOrg = await Organization.findOne({ clerkOrgId: orgId });
    if (!dbOrg) {
      return NextResponse.json(
        { error: "Organization context not synchronized in database. Please wait or recreate." },
        { status: 404 },
      );
    }

    // Check if the repository is already connected to this organization
    const existingRepo = await Repository.findOne({
      orgId: dbOrg._id,
      githubRepoId: githubRepoId.toString(),
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: "Repository is already connected to this organization" },
        { status: 400 },
      );
    }

    const newRepo = await Repository.create({
      orgId: dbOrg._id,
      githubRepoId: githubRepoId.toString(),
      name,
      url,
      isPrivate: !!isPrivate,
      healthScore: 100,
    });

    return NextResponse.json({
      repoId: newRepo._id.toString(),
      name: newRepo.name,
      status: "syncing",
    });
  } catch (err: unknown) {
    console.error("Error connecting repository:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
