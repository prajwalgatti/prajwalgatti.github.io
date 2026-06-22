# RareAct gallery clips

Short, muted, web-optimized mp4 clips for the "Real vs. generated rare actions"
gallery in the RareAct section of index.html. Filenames (lowercase, underscores):

  <class>_real.mp4   # a real RareAct clip for that class
  <class>_gen.mp4    # a generated clip for that class

The 6 classes currently shown in the gallery:
  cut_keyboard, drill_phone, hammer_phone, peel_corn, spray_shoes, weigh_tomato

Each slot auto-loads its clip and falls back to a dashed placeholder if the file
is missing, so you can add them one at a time. To feature different classes, edit
the .ra-card blocks in index.html (the 22 RareAct classes are ids 100-121 in
data/annotations/RareAct-K100-LT/misc/label_id_to_label.json).

Web-optimize raw clips with:
  ffmpeg -i in.mp4 -an -movflags +faststart -vf "scale=-2:360" -crf 30 cut_keyboard_real.mp4
