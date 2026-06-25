const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

function findProjectRoot() {
  const candidates = [
    process.cwd(),
    __dirname,
    path.resolve(__dirname, '..'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'src', 'environment.ts'))) {
      return dir;
    }
  }
  return process.cwd();
}
const PROJECT_ROOT = findProjectRoot();
const ENV_FILE = path.join(PROJECT_ROOT, 'src', 'environment.ts');

app.use(express.json());

function getLinks() {
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const links = [];
  const regex = /\{\s*href:\s*'([^']*)'(?:,\s*headerKey:\s*'([^']*)')?,\s*description:\s*'([^']*)'\s*\}/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    links.push({ href: m[1], headerKey: m[2] || '', description: m[3] });
  }
  return links;
}

function setLinks(links) {
  const items = links
    .map(l => {
      const href = l.href.replace(/'/g, "\\'");
      const key = l.headerKey ? l.headerKey.replace(/'/g, "\\'") : '';
      const desc = l.description.replace(/'/g, "\\'");
      if (!key) return `    { href: '${href}', description: '${desc}' }`;
      return `    { href: '${href}', headerKey: '${key}', description: '${desc}' }`;
    })
    .join(',\n');
  const content = `export let environment = {\n  links: [\n${items},\n  ],\n};\n`;
  fs.writeFileSync(ENV_FILE, content, 'utf-8');
}

app.get('/api/links', (req, res) => {
  try {
    res.json(getLinks());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/links', (req, res) => {
  try {
    const { href, headerKey, description } = req.body;
    if (!href || !description) {
      return res.status(400).json({ error: 'href and description are required' });
    }
    const links = getLinks();
    links.push({ href, headerKey: headerKey || '', description });
    setLinks(links);
    res.json({ success: true, links });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/links/:index', (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const links = getLinks();
    if (idx < 0 || idx >= links.length) {
      return res.status(404).json({ error: 'Link not found' });
    }
    links.splice(idx, 1);
    setLinks(links);
    res.json({ success: true, links });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function runDeploy(res) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('log', '▶ Building Angular app...\n');

  const build = spawn(npmCmd, ['run', 'build:prod'], {
    cwd: PROJECT_ROOT,
    shell: true,
  });

  build.stdout.on('data', (data) => send('log', data.toString()));
  build.stderr.on('data', (data) => send('log', data.toString()));

  build.on('close', (code) => {
    if (code !== 0) {
      send('error', `✖ Build failed with code ${code}`);
      send('result', { success: false });
      res.end();
      return;
    }

    send('log', '✅ Build succeeded!\n');
    send('log', '▶ Deploying to Netlify...\n');

    const deploy = spawn(npxCmd, ['netlify', 'deploy', '--prod'], {
      cwd: PROJECT_ROOT,
      shell: true,
      env: {
        ...process.env,
        NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN || '',
        NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID || '',
      },
    });

    deploy.stdout.on('data', (data) => send('log', data.toString()));
    deploy.stderr.on('data', (data) => send('log', data.toString()));

    deploy.on('close', (deployCode) => {
      if (deployCode !== 0) {
        send('error', `✖ Deploy failed with code ${deployCode}`);
        send('result', { success: false });
      } else {
        send('log', '✅ Deploy complete!\n');
        send('result', { success: true });
      }
      res.end();
    });
  });
}

app.get('/api/deploy', (req, res) => {
  runDeploy(res);
});

app.post('/api/deploy', (req, res) => {
  runDeploy(res);
});

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BeautyPicks Admin</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f1117; color: #e1e4e8; padding: 2rem; max-width: 960px; margin: auto;
  }
  h1 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #f0f6fc; }
  h1 span { color: #58a6ff; }
  h2 { font-size: 1rem; margin-bottom: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
  section { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
  .form-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  input { flex: 1; min-width: 200px; padding: 0.5rem 0.75rem; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; color: #e1e4e8; font-size: 0.875rem; }
  input:focus { border-color: #58a6ff; outline: none; }
  button {
    padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;
    font-size: 0.875rem; font-weight: 600; transition: background 0.15s;
  }
  .btn-primary { background: #238636; color: #fff; }
  .btn-primary:hover { background: #2ea043; }
  .btn-danger { background: #da3633; color: #fff; }
  .btn-danger:hover { background: #f85149; }
  .btn-deploy { background: #1f6feb; color: #fff; }
  .btn-deploy:hover { background: #388bfd; }
  .btn-deploy:disabled { opacity: 0.5; cursor: not-allowed; }

  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid #30363d; color: #8b949e; font-weight: 600; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #21262d; vertical-align: middle; }
  tr:hover td { background: #1c2128; }
  .num { color: #8b949e; width: 2rem; text-align: center; }
  .url-cell { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .url-cell a { color: #58a6ff; text-decoration: none; }
  .url-cell a:hover { text-decoration: underline; }
  .key-cell { color: #58a6ff; font-weight: 600; white-space: nowrap; }
  .desc-cell { color: #f0f6fc; }
  .empty { text-align: center; padding: 2rem; color: #484f58; font-style: italic; }

  .log-area {
    background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
    padding: 1rem; font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.8rem; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
    margin-top: 0.75rem; display: none; line-height: 1.5;
  }
  .log-area .error { color: #f85149; }
  .log-area .success { color: #3fb950; }

  .toast {
    position: fixed; bottom: 1rem; right: 1rem; padding: 0.75rem 1.25rem;
    border-radius: 6px; color: #fff; font-size: 0.875rem; z-index: 100;
    transform: translateY(100px); opacity: 0; transition: all 0.3s;
  }
  .toast.show { transform: translateY(0); opacity: 1; }
  .toast.success { background: #238636; }
  .toast.error { background: #da3633; }
</style>
</head>
<body>



<section id="add-section">
  <h2>Add New Link</h2>
  <div class="form-row">
    <input id="input-key" type="text" placeholder="Header / title" autocomplete="off">
    <input id="input-href" type="url" placeholder="https://example.com/?ref=..." autocomplete="off">
    <input id="input-desc" type="text" placeholder="Link description" autocomplete="off">
    <button class="btn-primary" onclick="addLink()">Add</button>
  </div>
</section>

<section id="list-section">
  <h2>Current Links</h2>
  <div id="links-container">
    <p class="empty">Loading...</p>
  </div>
</section>

<section id="deploy-section">
  <h2>Deploy</h2>
  <p style="color:#8b949e;font-size:0.875rem;margin-bottom:0.75rem;">
    Saves current links, builds, and deploys to Netlify.
  </p>
  <button id="btn-deploy" class="btn-deploy" onclick="doDeploy()">Deploy to Netlify</button>
  <div id="log-area" class="log-area"></div>
</section>

<div id="toast" class="toast"></div>

<script>
let links = [];

async function fetchLinks() {
  const res = await fetch('/api/links');
  links = await res.json();
  renderLinks();
}

function renderLinks() {
  const container = document.getElementById('links-container');
  if (links.length === 0) {
    container.innerHTML = '<p class="empty">No links yet. Add one above.</p>';
    return;
  }
  let html = '<table><thead><tr><th></th><th>Header</th><th>URL</th><th>Description</th><th></th></tr></thead><tbody>';
  links.forEach((link, i) => {
    const safeUrl = link.href.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeKey = link.headerKey ? link.headerKey.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    const safeDesc = link.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += '<tr>\\n      <td class="num">' + (i + 1) + '</td>\\n      <td class="key-cell">' + safeKey + '</td>\\n      <td class="url-cell"><a href="' + safeUrl + '" target="_blank" rel="noopener">' + safeUrl + '</a></td>\\n      <td class="desc-cell">' + safeDesc + '</td>\\n      <td><button class="btn-danger" onclick="deleteLink(' + i + ')">Delete</button></td>\\n    </tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

async function addLink() {
  const href = document.getElementById('input-href').value.trim();
  const headerKey = document.getElementById('input-key').value.trim();
  const description = document.getElementById('input-desc').value.trim();
  if (!href || !description) {
    showToast('Please fill in href and description', 'error');
    return;
  }
  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href, headerKey, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    links = data.links;
    renderLinks();
    document.getElementById('input-key').value = '';
    document.getElementById('input-href').value = '';
    document.getElementById('input-desc').value = '';
    showToast('Link added', 'success');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

async function deleteLink(index) {
  try {
    const res = await fetch('/api/links/' + index, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    links = data.links;
    renderLinks();
    showToast('Link removed', 'success');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

let deployActive = false;

function doDeploy() {
  if (deployActive) return;
  deployActive = true;

  const btn = document.getElementById('btn-deploy');
  const logArea = document.getElementById('log-area');
  logArea.style.display = 'block';
  logArea.innerHTML = '';
  btn.disabled = true;
  btn.textContent = 'Deploying...';

  const evtSource = new EventSource('/api/deploy');

  evtSource.addEventListener('log', (e) => {
    const text = e.data ? JSON.parse(e.data) : '';
    const span = document.createElement('span');
    span.textContent = text;
    logArea.appendChild(span);
    logArea.scrollTop = logArea.scrollHeight;
  });

  evtSource.addEventListener('error', (e) => {
    const text = e.data ? JSON.parse(e.data) : '';
    const span = document.createElement('span');
    span.className = 'error';
    span.textContent = text;
    logArea.appendChild(span);
    logArea.scrollTop = logArea.scrollHeight;
  });

  evtSource.addEventListener('result', (e) => {
    const data = JSON.parse(e.data);
    evtSource.close();
    deployActive = false;
    btn.disabled = false;
    btn.textContent = 'Deploy to Netlify';
    if (data.success) {
      showToast('Deploy succeeded!', 'success');
    } else {
      showToast('Deploy failed. Check logs.', 'error');
    }
  });

  evtSource.onerror = () => {
    evtSource.close();
    deployActive = false;
    btn.disabled = false;
    btn.textContent = 'Deploy to Netlify';
    showToast('Connection lost', 'error');
  };
}

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

fetchLinks();
</script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.type('html').send(INDEX_HTML);
});

app.listen(PORT, () => {
  console.log(`\n  Admin dashboard → http://localhost:${PORT}\n`);
});
