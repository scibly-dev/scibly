import { z } from "zod";

import { githubGraphQL, GitHubRequestError } from "./app-auth";

// GitHub's `IssueOrderField` cannot order by merge date, so collection walks
// UPDATED_AT descending and stops at its watermark.
const LIST_QUERY = `
  query($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: $pageSize
        states: MERGED
        orderBy: { field: UPDATED_AT, direction: DESC }
        after: $cursor
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          number
          title
          updatedAt
          mergedAt
          permalink
          totalCommentsCount
          author { __typename login }
          labels(first: 20) { nodes { name } }
        }
      }
    }
  }
`;

// Node count is bounded by the `first` arguments multiplied together (~760),
// well inside GitHub's limit.
const DETAIL_QUERY = `
  query($id: ID!) {
    node(id: $id) {
      ... on PullRequest {
        id
        number
        title
        bodyText
        permalink
        mergedAt
        updatedAt
        labels(first: 20) { nodes { name } }
        files(first: 100) { pageInfo { hasNextPage } nodes { path } }
        closingIssuesReferences(first: 10) { nodes { number title url } }
        comments(first: 50) { nodes { bodyText url author { login } } }
        reviewThreads(first: 30) {
          nodes {
            path
            isResolved
            comments(first: 20) {
              nodes { bodyText url diffHunk author { login } }
            }
          }
        }
      }
    }
  }
`;

const named = <T extends z.ZodTypeAny>(node: T) =>
  z.object({ nodes: z.array(node).nullable().optional() });

const summaryNode = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  updatedAt: z.string(),
  mergedAt: z.string().nullable(),
  permalink: z.string(),
  totalCommentsCount: z.number().nullable(),
  author: z.object({ __typename: z.string(), login: z.string() }).nullable(),
  labels: named(z.object({ name: z.string() })).nullable(),
});

type MergedNode = z.infer<typeof summaryNode> & { mergedAt: string };

const listResponse = z.object({
  repository: z
    .object({
      pullRequests: z.object({
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
        nodes: z.array(summaryNode.nullable()).nullable().optional(),
      }),
    })
    .nullable(),
});

const threadComment = z.object({
  bodyText: z.string(),
  url: z.string(),
  diffHunk: z.string().nullable().optional(),
  author: z.object({ login: z.string() }).nullable(),
});

const detailResponse = z.object({
  node: z
    .object({
      id: z.string(),
      number: z.number(),
      title: z.string(),
      bodyText: z.string(),
      permalink: z.string(),
      mergedAt: z.string().nullable(),
      updatedAt: z.string(),
      labels: named(z.object({ name: z.string() })).nullable(),
      files: named(z.object({ path: z.string() }))
        .extend({ pageInfo: z.object({ hasNextPage: z.boolean() }) })
        .nullable(),
      closingIssuesReferences: named(
        z.object({ number: z.number(), title: z.string(), url: z.string() }),
      ).nullable(),
      comments: named(threadComment).nullable(),
      reviewThreads: named(
        z.object({
          path: z.string().nullable(),
          isResolved: z.boolean(),
          comments: named(threadComment).nullable(),
        }),
      ).nullable(),
    })
    .nullable(),
});

const nodesOf = <T>(
  connection: { nodes?: (T | null)[] | null } | null | undefined,
): T[] => (connection?.nodes ?? []).filter((node): node is T => node !== null);

export interface PullRequestSummary {
  externalId: string;
  number: number;
  title: string;
  /** Null when the account was deleted. */
  authorLogin: string | null;
  /** GraphQL's own `__typename` — "Bot" for a GitHub App, "User" for a person. */
  authorType: string | null;
  labels: string[];
  commentCount: number;
  updatedAt: Date;
  mergedAt: Date;
  url: string;
}

export interface PullRequestComment {
  author: string | null;
  body: string;
  url: string;
  /** Only a review comment hangs off a diff. */
  diffHunk: string | null;
}

export interface PullRequestThread {
  path: string | null;
  isResolved: boolean;
  comments: PullRequestComment[];
}

export interface PullRequestDetail {
  externalId: string;
  number: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
  filePaths: string[];
  filesTruncated: boolean;
  linkedIssues: { number: number; title: string; url: string }[];
  comments: PullRequestComment[];
  threads: PullRequestThread[];
  mergedAt: Date;
  updatedAt: Date;
}

const asComment = (comment: z.infer<typeof threadComment>) => ({
  author: comment.author?.login ?? null,
  body: comment.bodyText,
  url: comment.url,
  diffHunk: comment.diffHunk ?? null,
});

// Takes `repositoryFullName` rather than the id the REST calls take: GraphQL
// has no way to reach a repository by its database id.
export async function listMergedPullRequests(
  token: string,
  repositoryFullName: string,
  options: { pageSize: number; cursor?: string | null },
): Promise<{
  pullRequests: PullRequestSummary[];
  nextCursor: string | null;
}> {
  const [owner, name] = repositoryFullName.split("/");
  const { repository } = await githubGraphQL(
    token,
    LIST_QUERY,
    {
      owner,
      name,
      pageSize: options.pageSize,
      cursor: options.cursor ?? null,
    },
    listResponse,
  );
  if (!repository) return { pullRequests: [], nextCursor: null };

  const { pageInfo, nodes } = repository.pullRequests;
  return {
    pullRequests: nodesOf({ nodes })
      // A null merge date would poison the watermark, so it is dropped rather than trusted.
      .filter((node): node is MergedNode => node.mergedAt !== null)
      .map((node) => ({
        externalId: node.id,
        number: node.number,
        title: node.title,
        authorLogin: node.author?.login ?? null,
        authorType: node.author?.__typename ?? null,
        labels: nodesOf(node.labels).map((label) => label.name),
        commentCount: node.totalCommentsCount ?? 0,
        updatedAt: new Date(node.updatedAt),
        mergedAt: new Date(node.mergedAt),
        url: node.permalink,
      })),
    nextCursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
  };
}

/** Null when the pull request has since been deleted or moved out of reach. */
export async function fetchPullRequestDetail(
  token: string,
  externalId: string,
): Promise<PullRequestDetail | null> {
  let node: z.infer<typeof detailResponse>["node"];
  try {
    ({ node } = await githubGraphQL(
      token,
      DETAIL_QUERY,
      { id: externalId },
      detailResponse,
    ));
  } catch (error) {
    // GitHub reports a deleted node as a NOT_FOUND error entry, not a null node.
    if (error instanceof GitHubRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
  if (!node?.mergedAt) return null;

  return {
    externalId: node.id,
    number: node.number,
    title: node.title,
    body: node.bodyText,
    url: node.permalink,
    labels: nodesOf(node.labels).map((label) => label.name),
    filePaths: nodesOf(node.files).map((file) => file.path),
    filesTruncated: node.files?.pageInfo.hasNextPage ?? false,
    linkedIssues: nodesOf(node.closingIssuesReferences),
    comments: nodesOf(node.comments).map(asComment),
    threads: nodesOf(node.reviewThreads).map((thread) => ({
      path: thread.path,
      isResolved: thread.isResolved,
      comments: nodesOf(thread.comments).map(asComment),
    })),
    mergedAt: new Date(node.mergedAt),
    updatedAt: new Date(node.updatedAt),
  };
}
