import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000';
let cookie = '';

async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function runTests() {
  console.log('--- STARTING E2E API TESTS ---');

  // 1. Health check
  console.log('\\n1. Testing /health...');
  let res = await fetchAPI('/health');
  if (res.status !== 200) { console.error('Health check failed', res.data); process.exit(1); }
  console.log('Health check passed!');

  // 2. Register
  console.log('\\n2. Testing Registration...');
  const username = `testuser_${Date.now()}`;
  res = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email: `${username}@example.com`, password: 'password123' }),
  });
  if (res.status !== 201) { console.error('Registration failed', res.data); process.exit(1); }
  console.log('Registration passed! User ID:', res.data.user.id);

  // 3. Login
  console.log('\\n3. Testing Login...');
  res = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: `${username}@example.com`, password: 'password123' }),
  });
  if (res.status !== 200) { console.error('Login failed', res.data); process.exit(1); }
  console.log('Login passed!');

  // 4. Create Repo
  console.log('\\n4. Creating Repository...');
  const repoName = `repo_${Date.now()}`;
  res = await fetchAPI('/repos', {
    method: 'POST',
    body: JSON.stringify({ name: repoName, description: 'Test repo', visibility: 'public' }),
  });
  if (res.status !== 201) { console.error('Create repo failed', res.data); process.exit(1); }
  const repoId = res.data._id;
  console.log('Repository created! ID:', repoId);

  // 5. Create File (Commit)
  console.log('\\n5. Committing File...');
  res = await fetchAPI('/api/git/files/commit', {
    method: 'POST',
    body: JSON.stringify({
      repoName,
      path: 'test.txt',
      content: 'Hello World',
      message: 'Initial test commit'
    })
  });
  if (res.status !== 200) { console.error('Commit file failed', res.data); process.exit(1); }
  console.log('File committed successfully!');

  // 6. Create Branch
  console.log('\\n6. Creating Branch...');
  res = await fetchAPI('/api/git/branch', {
    method: 'POST',
    body: JSON.stringify({ repoName, branchName: 'feature-test' })
  });
  if (res.status !== 200) { console.error('Create branch failed', res.data); process.exit(1); }
  console.log('Branch created successfully!');

  // 7. Open PR
  console.log('\\n7. Opening Pull Request...');
  res = await fetchAPI('/api/pr', {
    method: 'POST',
    body: JSON.stringify({
      repoName,
      title: 'Add feature',
      description: 'Testing PR',
      sourceBranch: 'feature-test',
      targetBranch: 'main'
    })
  });
  if (res.status !== 200 && res.status !== 201) { console.error('Open PR failed', res.data); process.exit(1); }
  const prId = res.data._id || res.data.pr?._id || res.data.pullRequest?._id;
  console.log('PR created! ID:', prId);

  // 7.5 Approve PR
  console.log('\\n7.5 Approving Pull Request...');
  res = await fetchAPI(`/api/pr/${prId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'approved', body: 'Looks good to me!' })
  });
  if (res.status !== 200 && res.status !== 201) { console.error('Approve PR failed', res.data); process.exit(1); }
  console.log('PR approved successfully!');

  // 8. Merge PR
  console.log('\\n8. Merging Pull Request...');
  res = await fetchAPI(`/api/pr/${prId}/merge`, {
    method: 'PUT'
  });
  if (res.status !== 200) { console.error('Merge PR failed', res.data); process.exit(1); }
  console.log('PR merged successfully!');

  console.log('\\n--- ALL E2E API TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
