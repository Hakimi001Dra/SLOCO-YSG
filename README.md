# SLOCO–YSG Website

Website for the Office of the Senior Liaison Officer to the Executive Governor of
Yobe State on Community Outreach (SLOCO–YSG).

It's a static, no-build website (plain HTML/CSS/JS). All page content lives in
[`content.json`](./content.json), and `admin.html` is a companion dashboard that
edits that same file — no server or database required.

Every file sits in one flat folder — no subfolders — so it's easy to review and
upload anywhere, including GitHub's drag-and-drop uploader.

```
index.html          the public website
admin.html           the admin dashboard — open this to edit content
admin.js
admin.css
content.json         ← all editable content lives here
render.js             renders index.html from content.json
data-store.js         shared data-loading logic (used by both pages)
styles.css
README.md
.gitignore
*.jpg / *.png         photos, logo, favicon
```

## Deploying to GitHub Pages

1. Create a new repository on GitHub.
2. Upload every file above into the repository root (drag-and-drop all of them
   at once via "Add file → Upload files" — there are no folders to worry about).
3. Commit.
4. Go to **Settings → Pages**. Under **Source**, choose **Deploy from a branch**,
   pick `main` and `/ (root)`, then **Save**.
5. Wait a minute, refresh that page — GitHub will show your live URL, something
   like `https://<username>.github.io/<repo>/`.

If you use a custom domain, add a `CNAME` file at the repo root with your domain
name, and point your DNS at GitHub per
[GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Editing content — the admin dashboard

Open `admin.html` on your deployed site (e.g. `https://<username>.github.io/<repo>/admin.html`),
or open the local file directly through a local server (see below). Default
passcode: **`sloco2026`**.

**Read this before you rely on it in production:**

- This is a fully static site — there is no server, database, or real backend.
- **Save changes** in the dashboard writes your edits to that browser's local
  storage only. The public site, opened in the *same browser*, will immediately
  show them — this is meant for previewing before you publish.
- **Export content.json** downloads your edited file. To actually publish changes
  for every visitor, replace `content.json` in your repo with the downloaded file
  and commit it (via GitHub's web editor, or by re-uploading it). That's the real
  "publish" step.
- **Import JSON** lets you load a previously exported `content.json` back into
  the dashboard to keep editing it.
- **Reset to shipped** discards local edits and reloads whatever `content.json`
  is currently committed in the repo.
- The passcode screen is a convenience lock for a shared office device — **not**
  real authentication. Since this is a public GitHub repo, anyone can read the
  passcode directly from `admin.js`. Change the `ADMIN_PASSCODE` constant near
  the top of that file before you publish, and don't rely on it to keep anything
  truly private. If you need real access control, put a proper login (a small
  backend, or your host's built-in password/IP protection) in front of
  `admin.html` — the dashboard's "Save" action is a single, clearly-marked
  function you can point at a real API instead of local storage.

### What you can edit
Every piece of on-page content: hero text/photo/stats, About/Mission/Vision,
the Impact Ledger rows, the Featured Project, the full 13-item Programs register
(add/edit/delete/reorder, with categories and tags), the Photo Gallery, Team &
Contacts (including an optional photo per person), Partners, the Impact Report
CTA, the Contact section, the Footer, and Site Identity (logo, favicon, browser
tab title, SEO description).

Photo fields let you either paste a filename/URL, or click **Upload photo** to
embed a resized picture directly into the field — it shows up on the site as
soon as you click **Save changes**, no extra steps. A lightweight copy of the
same picture also downloads to your computer automatically; if you'd rather
keep `content.json` small and host that picture as a real file instead (the
way the images already in this repo work), see "Using a real file instead"
below.

### Using a real file instead of an embedded photo
Embedding is the easiest default, but every embedded photo makes
`content.json` bigger (and unlike a real image file, an embedded one isn't
cached separately by the browser). If you'd rather avoid that for a photo
you're keeping long-term:

1. Click **Upload photo** as normal — this both embeds the picture *and*
   downloads a plain image file to your computer (e.g. `team-photo-a1b2.jpg`).
2. Go to your GitHub repo → **Add file → Upload files**, drag in that
   downloaded file, and commit it.
3. Back in the dashboard, replace the long embedded text in that field with
   just the filename (e.g. `team-photo-a1b2.jpg`), then Save/Export again.

That's optional housekeeping, not something you need to do for the site to work.

## Running locally

No build tools needed — just serve the folder over HTTP (opening `index.html`
directly via `file://` won't work, because the browser blocks the `fetch()` call
that loads `content.json`).

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000/index.html and http://localhost:8000/admin.html
```

Any static server works equally well (`npx serve`, VS Code's Live Server, etc.).

## Content & credits

Text and photographs are drawn from the Office's own outreach flyers and the
*Impact Beyond Office* documentary report. The full report is linked from the
site's Report section: https://bit.ly/SlocoimpactReport2025
