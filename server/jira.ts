import { Version3Client } from 'jira.js';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=jira',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  const hostName = connectionSettings?.settings?.site_url;

  if (!connectionSettings || !accessToken || !hostName) {
    throw new Error('Jira not connected');
  }

  return { accessToken, hostName };
}

export async function getJiraClient() {
  const { accessToken, hostName } = await getAccessToken();

  return new Version3Client({
    host: hostName,
    authentication: {
      oauth2: { accessToken },
    },
  });
}

export async function getJiraProjects() {
  const client = await getJiraClient();
  const projects = await client.projects.getAllProjects();
  return projects;
}

export async function getJiraUsers() {
  const client = await getJiraClient();
  try {
    const users = await client.userSearch.findAssignableUsers({
      project: '',
      maxResults: 100,
      query: ''
    });
    return users;
  } catch (e1) {
    try {
      const users = await client.userSearch.findUsers({
        maxResults: 100,
        query: ''
      });
      return users;
    } catch (e2) {
      const myself = await client.myself.getCurrentUser();
      return [myself];
    }
  }
}

export async function getJiraIssues(projectKey: string) {
  const client = await getJiraClient();
  const issues = await client.issueSearch.searchForIssuesUsingJql({
    jql: `project = ${projectKey} ORDER BY created DESC`,
    maxResults: 50
  });
  return issues;
}

export async function createJiraIssue(data: {
  projectKey: string;
  summary: string;
  description?: string;
  issueType?: string;
  assigneeAccountId?: string;
}) {
  const client = await getJiraClient();
  
  const issueData: any = {
    fields: {
      project: { key: data.projectKey },
      summary: data.summary,
      issuetype: { name: data.issueType || 'Task' }
    }
  };

  if (data.description) {
    issueData.fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: data.description }
          ]
        }
      ]
    };
  }

  if (data.assigneeAccountId) {
    issueData.fields.assignee = { accountId: data.assigneeAccountId };
  }

  const issue = await client.issues.createIssue(issueData);
  return issue;
}

export async function syncTaskToJira(task: {
  title: string;
  description?: string;
  projectKey: string;
  assigneeAccountId?: string;
}) {
  return createJiraIssue({
    projectKey: task.projectKey,
    summary: task.title,
    description: task.description,
    assigneeAccountId: task.assigneeAccountId
  });
}
