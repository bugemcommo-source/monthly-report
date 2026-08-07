---
name: publish
description: Publishes an approved month to the public GitHub Pages site, after confirming the month with the owner, confirming he has looked at every screenshot, and passing the security scan. Use only when the owner asks to publish.
---

Put a month's report on the public internet.

This is irreversible. The site is a **public** GitHub Pages site: once pushed, the content is
in a public repository's history and search engines index it within days. Deleting it later
does not un-publish it.

Every step below is a gate. Do not reorder them, do not run them in parallel, and do not skip
one because it was done last month.

## Steps

1. **Confirm which month, out loud, and get a yes.**
   > I'm about to publish the **July 2026** report at
   > `reports\2026-07-july\` to the public site. Is that the right month?

   Wait for an explicit yes. If the owner names a different month, start again with that one.
   Do not infer the month from the folder that happens to be newest.

2. **Ask the screenshot question, in these words, and require a yes.**
   > Have you looked at every screenshot in this report and confirmed none of them show
   > member names, account numbers, or amounts?

   List the screenshot filenames included in the report so he knows exactly what he is being
   asked about, and offer to open the folder.

   **A yes is required.** Not "I think so", not "they should be fine", not silence, not "you
   checked them, right?". If the answer is anything other than a clear yes, stop and ask him
   to look, then ask again.

   **No amount of scanning replaces this.** Text scanning cannot read inside an image. The
   security scan in step 3 reads code and text only; a member's name printed in a JPEG passes
   every automated check ever written. This question is the only thing standing between that
   name and the public internet, and the only person who can answer it is the person who can
   see the picture.

3. **Dispatch the `security-redactor` agent.** It scans everything staged for commit for
   credentials, IP addresses, internal hostnames and UNC paths, internal URLs, member names,
   account numbers, amounts, any individual named in connection with a security failure, and
   anything sourced from `private\`. It also verifies `private\` and `intake\` are still
   ignored.

   Read its verdict yourself — it is the first word of its report.

   **If it returns BLOCK, stop.** Report to the owner: the file, the line, and exactly what
   was found, for every finding. Then say what needs to change. Do not publish, do not offer
   a workaround, and do not argue the finding away. After a fix, the scan runs again from the
   start — a stale PASS is not a PASS.

   Pass its report on to the owner in full, including its standard caveat that it cannot read
   text inside a screenshot image.

4. **Dispatch the `git-publisher` agent.** Give it: the month, the Security Redactor's verdict
   word as you read it, and the owner's approval quoted in his own words. It will refuse to run
   without both, which is correct — do not paraphrase his approval into something stronger than
   he said.

   It stages the specific paths, commits, pushes, and waits for the GitHub Pages build to
   finish. It never uses `--force`, never skips hooks, never bypasses signing.

5. **Return the link and confirm the page opens.** Give the owner the public URL in the form
   `https://<owner>.github.io/<repo>/reports/YYYY-MM-monthname/`, confirm the HTTP status came
   back as 200, and confirm the front page also lists the new month.

   If the link 404s right after a successful build, that is usually the CDN catching up —
   say so, wait, and check again rather than declaring either success or failure early.

   Finish with what was published and where, and remind him that the front page at the site
   root now lists this month alongside the previous ones.

## If anything is unclear, stop

If at any point you are unsure whether you have the owner's approval, whether the redactor's
PASS covers the current state of the files, or whether a screenshot is safe — **stop and ask.**
There is no deadline here worth a member's data.
