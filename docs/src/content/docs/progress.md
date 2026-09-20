---
title: Your progress
description: Everything the site remembers about you lives in this browser.
---

Progress is stored in this browser only, under the local-storage key
`ai-training-progress-v1`. Nothing is sent anywhere. Export it to move to
another browser or to show a tutor; import replaces what is here.

<div class="not-content">
<button type="button" data-export>Export JSON</button>
<label>Import: <input type="file" accept="application/json" data-import></label>
<button type="button" data-reset>Reset all</button>
</div>

## Current record

<pre class="progress-dump" data-progress-dump></pre>

<script src="/ai-training/spike/lesson.js" defer></script>
