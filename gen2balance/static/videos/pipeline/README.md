# Pipeline diagram clips

Clips used by the generation-pipeline figure in `index.html` (the
"How do we generate..." section). It shows 3 real exemplars in and 1 generated
clip out, for the **Robot Dancing** class.

Currently wired (see the <video src> tags in index.html):
  real exemplars : 0oeYbitjqgw.mp4, LFBjMlz2TSc.mp4, kLmpdgtN8yE.mp4
  generated      : 36_163.mp4
  (36_203.mp4 is a spare generated clip, not currently shown.)

Each box auto-loads its clip and fades it in; a missing file falls back to the
dashed placeholder. To showcase a different class, drop new mp4s here and update
the filenames in the <video src> tags (and the action-class label) in index.html.
Keep them short and muted; web-optimize large clips with:
  ffmpeg -i input.mp4 -an -movflags +faststart -vf "scale=360:-2" -crf 30 out.mp4
