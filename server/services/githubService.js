const axios = require('axios');

class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * Get user's GitHub profile
   */
  async getUserProfile(username) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${username}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch GitHub profile: ${error.message}`);
    }
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(username, token = null) {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await axios.get(
        `${this.baseUrl}/users/${username}/repos`,
        {
          headers,
          params: {
            sort: 'updated',
            per_page: 100
          }
        }
      );

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        language: repo.language,
        topics: repo.topics || [],
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        homepage: repo.homepage,
        isPrivate: repo.private,
        isFork: repo.fork,
        openIssues: repo.open_issues_count,
        defaultBranch: repo.default_branch
      }));
    } catch (error) {
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  /**
   * Get pinned repositories (requires GraphQL API)
   */
  async getPinnedRepositories(username, token) {
    try {
      const query = `
        query {
          user(login: "${username}") {
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes {
                ... on Repository {
                  id
                  databaseId
                  name
                  description
                  url
                  stargazerCount
                  forkCount
                  primaryLanguage {
                    name
                  }
                  repositoryTopics(first: 10) {
                    nodes {
                      topic {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query },
        {
          headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const pinnedRepos = response.data.data.user.pinnedItems.nodes;
      return pinnedRepos.map(repo => ({
        id: repo.databaseId,
        name: repo.name,
        description: repo.description,
        url: repo.url,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language: repo.primaryLanguage?.name,
        topics: repo.repositoryTopics.nodes.map(t => t.topic.name)
      }));
    } catch (error) {
      console.error('Failed to fetch pinned repos:', error);
      return [];
    }
  }

  /**
   * Get user's contribution stats
   */
  async getUserStats(username, token) {
    try {
      const query = `
        query {
          user(login: "${username}") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalRepositoryContributions
            }
            repositories {
              totalCount
            }
            followers {
              totalCount
            }
            following {
              totalCount
            }
          }
        }
      `;

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query },
        {
          headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const user = response.data.data.user;
      const contributions = user.contributionsCollection;

      return {
        totalRepos: user.repositories.totalCount,
        totalCommits: contributions.totalCommitContributions,
        totalPRs: contributions.totalPullRequestContributions,
        totalIssues: contributions.totalIssueContributions,
        contributionsLastYear: contributions.contributionCalendar.totalContributions,
        followers: user.followers.totalCount,
        following: user.following.totalCount
      };
    } catch (error) {
      console.error('Failed to fetch GitHub stats:', error);
      return null;
    }
  }

  /**
   * Get total stars across all repositories
   */
  async getTotalStars(repositories) {
    return repositories.reduce((total, repo) => total + (repo.stars || 0), 0);
  }

  /**
   * Sync GitHub data for a user
   */
  async syncGitHubData(username, token = null) {
    try {
      // Get all repositories
      const repositories = await this.getUserRepositories(username, token);
      
      // Get stats if token is available
      let stats = null;
      let pinnedRepos = [];
      
      if (token) {
        stats = await this.getUserStats(username, token);
        pinnedRepos = await this.getPinnedRepositories(username, token);
      }

      // Calculate total stars
      const totalStars = await this.getTotalStars(repositories);

      // Format repositories for portfolio
      const formattedRepos = repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.url,
        stars: repo.stars,
        forks: repo.forks,
        language: repo.language,
        topics: repo.topics,
        pinned: pinnedRepos.some(p => p.id === repo.id),
        lastUpdated: new Date(repo.updatedAt),
        showInPortfolio: true
      }));

      return {
        repositories: formattedRepos,
        stats: stats || {
          totalRepos: repositories.length,
          totalStars: totalStars,
          totalCommits: 0,
          totalPRs: 0,
          contributionsLastYear: 0,
          lastSynced: new Date()
        },
        pinnedRepos: pinnedRepos.map(p => p.id)
      };
    } catch (error) {
      throw new Error(`Failed to sync GitHub data: ${error.message}`);
    }
  }

  /**
   * Validate GitHub token
   */
  async validateToken(token) {
    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      return {
        valid: true,
        username: response.data.login,
        name: response.data.name,
        email: response.data.email
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new GitHubService();
