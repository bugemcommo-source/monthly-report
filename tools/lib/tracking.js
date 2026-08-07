/**
 * Reads the department's plain-text tracking files.
 *
 * These files are written and edited by a non-programmer in Notepad, so the
 * parser is forgiving: missing sections yield empty results rather than errors.
 */

function section(md, heading) {
  // Note: JavaScript has no \Z anchor — `$(?![\s\S])` is the end-of-input
  // equivalent that still works with the `m` flag switched on.
  const re = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))`, 'mi');
  const m = md.match(re);
  return m ? m[1].trim() : '';
}

export function parseProject(md) {
  const name = (md.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const summary = (md.match(/^Status:.*$/m) || [''])[0];

  const status = (summary.match(/Status:\s*([^·|]+)/) || [, ''])[1].trim();
  const progress = Number((summary.match(/Progress:\s*(\d+)\s*%/) || [, 0])[1]);
  const targetCompletion = (summary.match(/Target completion:\s*([^·|]+)/) || [, ''])[1].trim();
  const linkedTo = (md.match(/^Linked to:\s*(.+)$/m) || [, ''])[1].trim();

  const modules = section(md, 'Modules').split('\n')
    .map((l) => l.match(/^-\s*\[( |x|X)\]\s*(.+?)(?:\s*\((\d+)%\))?\s*$/))
    .filter(Boolean)
    .map((m) => ({
      name: m[2].trim(),
      done: m[1].toLowerCase() === 'x',
      percent: m[3] ? Number(m[3]) : (m[1].toLowerCase() === 'x' ? 100 : 0)
    }));

  const blockers = section(md, 'Blockers').split('\n')
    .map((l) => l.replace(/^-\s*/, '').trim())
    .filter((l) => l.length > 0);

  // `(.+?)\s*$` not `(.+)$`. The owner edits these files in Notepad, which
  // saves CRLF. After splitting on \n every line keeps a trailing \r, and `.`
  // does not match \r — so `(.+)$` failed on every line except the last one,
  // whose \r had already been removed by the section trim. Because the list
  // sorts newest-first, the single survivor was the OLDEST entry: the current
  // month vanished silently, with no error to notice.
  const log = section(md, 'Monthly log').split('\n')
    .map((l) => l.match(/^-\s*(\d{4}-\d{2})\s*[—–-]\s*(.+?)\s*$/))
    .filter(Boolean)
    .map((m) => ({ month: m[1], text: m[2].trim() }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return {
    name, status, progress, targetCompletion, linkedTo,
    modules, blockers, log,
    entryFor(month) {
      const hit = log.find((e) => e.month === month);
      return hit ? hit.text : null;
    }
  };
}
