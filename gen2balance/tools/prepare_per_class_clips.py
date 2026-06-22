#!/usr/bin/env python3
"""Compress the per-class real/generated clips for the explorer detail panel.

Source layout (as dropped in):
  webpage/static/videos/per_class_videos/{real,generated}/<class_name_with_underscores>/<one>.mp4

Output (web-optimized, what the page actually serves):
  webpage/static/videos/per_class/<k100_label_id>_real.mp4
  webpage/static/videos/per_class/<k100_label_id>_gen.mp4   (skipped if no generated clip)

make_perclass_data.py then auto-links any clip it finds here into perclass.json.
Idempotent: skips files that already exist (use --force to re-encode).

Usage:  python webpage/tools/prepare_per_class_clips.py [--force]
"""
import argparse, glob, json, os, subprocess

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # .../webpage
REPO = os.path.dirname(WEB)
SRC = os.path.join(WEB, "static", "videos", "per_class_videos")
OUT = os.path.join(WEB, "static", "videos", "per_class")
ANN = os.path.join(REPO, "data", "annotations")
if not os.path.isdir(ANN):
    ANN = os.path.join(REPO, "annotations")


def first_clip(d):
    cs = sorted(glob.glob(os.path.join(d, "*.mp4")))
    return cs[0] if cs else None


def encode(src, dst, force):
    if os.path.exists(dst) and not force:
        return "skip"
    # short, muted, ~360px tall, faststart — small looping thumbnail
    cmd = ["ffmpeg", "-y", "-i", src, "-an", "-movflags", "+faststart",
           "-vf", "scale=-2:360", "-c:v", "libx264", "-preset", "veryfast",
           "-crf", "30", dst, "-loglevel", "error"]
    subprocess.run(cmd, check=True)
    return "done"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    id2name = json.load(open(os.path.join(ANN, "K100-LT", "misc", "label_id_to_label.json")))

    n_real = n_gen = n_missing_gen = 0
    for lid, name in id2name.items():
        folder = name.replace(" ", "_")
        sr = first_clip(os.path.join(SRC, "real", folder))
        sg = first_clip(os.path.join(SRC, "generated", folder))
        if sr:
            encode(sr, os.path.join(OUT, f"{lid}_real.mp4"), args.force); n_real += 1
        if sg:
            encode(sg, os.path.join(OUT, f"{lid}_gen.mp4"), args.force); n_gen += 1
        else:
            n_missing_gen += 1
    print(f"real clips: {n_real}/{len(id2name)} | generated clips: {n_gen} "
          f"| classes with no generated clip: {n_missing_gen}")
    print(f"-> {os.path.relpath(OUT, REPO)}")


if __name__ == "__main__":
    main()
