# Shareholder Agreement Quote Tool — live version

This version looks up real companies on the UK public register (Companies
House) instead of the three demo companies. It needs a small piece of
"backend" to keep your API key private, which is why it can no longer be
deployed with a simple drag-and-drop — a few extra one-off steps are needed.

## What's in this folder

```
index.html                          the tool itself (unchanged design/branding)
netlify.toml                        tells Netlify where the backend functions live
netlify/functions/company-search.js looks up companies as you type
netlify/functions/company-detail.js fetches directors/PSC/charges for one company
```

## One-off setup (about 15 minutes)

### 1. Get a free Companies House API key
- Go to https://developer.company-information.service.gov.uk/
- Register for an account and create an application (any name, e.g. "Trust Lawyer quote tool")
- Copy the API key it gives you — keep this private, don't share it or paste it into chat

### 2. Get this folder onto Netlify
Drag-and-drop deploy doesn't run backend code, so this needs one of:

**Option A — Netlify CLI (quickest if you're comfortable with a terminal)**
```
npm install -g netlify-cli
cd quote-tool-full
netlify deploy --prod
```
Follow the prompts to log in and create a new site.

**Option B — GitHub (better long-term, easier to update later)**
1. Create a new repository on GitHub and upload this folder's contents.
2. In Netlify: "Add new site" → "Import an existing project" → connect the repo.
3. Netlify will detect `netlify.toml` automatically — no build settings needed.

Either way, you'll end up with a working `something.netlify.app` address, same
as before.

### 3. Add your API key to Netlify (never to this code)
In Netlify: Site settings → Environment variables → Add a variable:
- Key: `COMPANIES_HOUSE_API_KEY`
- Value: (the key from step 1)

Then trigger a redeploy (Netlify does this automatically after adding an
environment variable on most plans; if not, use "Trigger deploy").

### 4. Point your subdomain at it
Same as before — add `business.trustlawyer.co.uk` as a custom domain in
Netlify, and I'll add the matching DNS record on the Trust Lawyer side once
you send me what Netlify shows you.

## Testing before going live

Try searching for a handful of real companies you know (including your own)
and check:
- The record details look right
- The "what the record tells us" signals make sense
- A full run through the questions produces a sensible estimate

## Known limitation (unchanged from the prototype)

Companies House doesn't reliably expose full shareholder lists or share-class
detail through this API — that data mostly lives inside confirmation
statement filings, which aren't practical to parse automatically. The tool
now asks about share classes directly as its first question instead of
guessing from the record.
