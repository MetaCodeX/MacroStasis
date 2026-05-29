import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Simple in-memory cache to prevent hitting GitHub rate limits
let cachedPayload: any = null
let lastFetchedTime = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceNoCache = searchParams.get("nocache") === "true"

  const now = Date.now()
  if (!forceNoCache && cachedPayload && (now - lastFetchedTime < CACHE_TTL)) {
    return NextResponse.json(cachedPayload)
  }

  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
  }

  const query = `
    query {
      viewer {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                weekday
              }
            }
          }
        }
        repositories(first: 10, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes {
            name
            description
            url
            createdAt
            owner {
              login
            }
            primaryLanguage {
              name
            }
            refs(first: 10, refPrefix: "refs/heads/") {
              nodes {
                name
                target {
                  ... on Commit {
                    history(first: 5) {
                      nodes {
                        message
                        committedDate
                        oid
                        author {
                          name
                          user {
                            login
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            defaultBranchRef {
              name
            }
          }
        }
      }
    }
  `

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Authorization": `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      // Cache response for 5 minutes to avoid rate limit issues
      next: { revalidate: 300 }
    })

    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}`)
    }

    const data = await res.json()
    if (data.errors) {
      console.error("GraphQL errors:", data.errors)
      return NextResponse.json({ error: "GraphQL query errors occurred" }, { status: 500 })
    }

    const viewer = data.data?.viewer
    if (!viewer) {
      return NextResponse.json({ error: "Failed to retrieve viewer data" }, { status: 500 })
    }

    // Transform repositories to flatten and sort commits across all branches
    const processedNodes = (viewer.repositories?.nodes || []).map((repo: any) => {
      const recentCommitsMap = new Map<string, any>()
      const defaultBranchName = repo.defaultBranchRef?.name || "main"

      repo.refs?.nodes?.forEach((ref: any) => {
        const branchName = ref.name
        const commits = ref.target?.history?.nodes || []

        commits.forEach((commit: any) => {
          const isDefaultBranch = branchName === defaultBranchName
          const existing = recentCommitsMap.get(commit.oid)

          const authorName = commit.author?.user?.login
            ? `@${commit.author.user.login}`
            : (commit.author?.name || "Unknown")

          // If commit isn't added yet, or if this instance is from the default branch, keep it
          if (!existing || isDefaultBranch) {
            recentCommitsMap.set(commit.oid, {
              message: commit.message,
              committedDate: commit.committedDate,
              oid: commit.oid,
              branch: branchName,
              isDefault: isDefaultBranch,
              author: authorName
            })
          }
        })
      })

      // Sort commits by committedDate descending and take top 3
      const recentCommits = Array.from(recentCommitsMap.values())
        .sort((a: any, b: any) => new Date(b.committedDate).getTime() - new Date(a.committedDate).getTime())
        .slice(0, 3)

      return {
        name: repo.name,
        description: repo.description,
        url: repo.url,
        createdAt: repo.createdAt,
        owner: repo.owner?.login || "MetaCodeX",
        primaryLanguage: repo.primaryLanguage,
        recentCommits
      }
    })

    // Construct the response matching the expected client structure
    const responsePayload = {
      user: {
        contributionsCollection: {
          contributionCalendar: viewer.contributionsCollection?.contributionCalendar
        },
        repositories: {
          nodes: processedNodes
        }
      }
    }

    cachedPayload = responsePayload
    lastFetchedTime = now

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    console.error("Error fetching GitHub data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
