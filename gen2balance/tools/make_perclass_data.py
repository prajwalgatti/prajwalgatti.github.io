#!/usr/bin/env python3
"""Build webpage/static/data/perclass.json for the per-class explorer.

What is REAL vs PLACEHOLDER
---------------------------
REAL (read from the repo, do not need editing):
  * class names            <- annotations/<bench>/misc/label_id_to_label.json
  * head/tail/fewshot/...   <- annotations/<bench>/misc/lt_mapping.json
  * n_real  per class       <- count in annotations/<bench>/real/train.csv
  * n_generated per class   <- (count in balanced/train.csv) - n_real
  * a sample source clip path (real + generated) for the export step

PLACEHOLDER (synthetic, replace with your numbers before publishing):
  * acc_ce, acc_bsce, acc_ours  (per-class accuracies)
  * real_clip / gen_clip web paths  (null until you export clips)

Usage:
  python webpage/tools/make_perclass_data.py            # from repo root
  python webpage/tools/make_perclass_data.py --real-acc path/to/your_accuracies.json

If --real-acc is given (a JSON mapping "<bench>|<label_id>" -> {ce,bsce,ours}),
those numbers are used instead of the synthetic placeholders.
"""
import argparse, json, os, random
from collections import Counter

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ANN = os.path.join(REPO, "annotations")
OUT = os.path.join(REPO, "webpage", "static", "data", "perclass.json")
BENCHMARKS = ["K100-LT", "UCF-LT", "RareAct-K100-LT"]
GEN_MARKER = "_generated_videos"  # generated clip paths contain this


def label_of(line):
    # CSV format: "<relative_path> <label_id>", split on the LAST space.
    return line.rstrip("\n").rsplit(" ", 1)


def count_split(csv_path):
    counts, sample = Counter(), {}
    if not os.path.exists(csv_path):
        return counts, sample
    with open(csv_path) as f:
        for line in f:
            if not line.strip():
                continue
            path, lab = label_of(line)
            counts[lab] += 1
            sample.setdefault(lab, path)
    return counts, sample


def gen_sample(csv_path):
    sample = {}
    if not os.path.exists(csv_path):
        return sample
    with open(csv_path) as f:
        for line in f:
            if GEN_MARKER not in line:
                continue
            path, lab = label_of(line)
            sample.setdefault(lab, path)
    return sample


def placeholder_acc(group, n_real, rng):
    """Synthetic but plausible: weak baseline on tail/few-shot, larger gain there."""
    base = {"head": 74, "tail": 52, "fewshot": 34, "rareact": 22}.get(group, 50)
    ce = max(2, min(96, base + rng.uniform(-8, 8) - (0 if n_real > 200 else 4)))
    bsce = min(97, ce + rng.uniform(1, 6))
    gain = {"head": rng.uniform(-3, 4), "tail": rng.uniform(2, 14),
            "fewshot": rng.uniform(6, 22), "rareact": rng.uniform(10, 30)}.get(group, 5)
    ours = max(2, min(98, bsce + gain))
    return round(ce, 1), round(bsce, 1), round(ours, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--real-acc", default=None, help="JSON of real accuracies to use instead of placeholders")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    rng = random.Random(args.seed)

    real_acc = {}
    if args.real_acc and os.path.exists(args.real_acc):
        real_acc = json.load(open(args.real_acc))

    classes, any_placeholder = [], False
    for bench in BENCHMARKS:
        misc = os.path.join(ANN, bench, "misc")
        id2name = json.load(open(os.path.join(misc, "label_id_to_label.json")))
        name2grp = json.load(open(os.path.join(misc, "lt_mapping.json")))
        real_c, real_s = count_split(os.path.join(ANN, bench, "real", "train.csv"))
        bal_c, _ = count_split(os.path.join(ANN, bench, "balanced", "train.csv"))
        gen_s = gen_sample(os.path.join(ANN, bench, "balanced", "train.csv"))

        for lid, name in id2name.items():
            n_real = real_c.get(lid, 0)
            n_total = bal_c.get(lid, n_real)
            n_gen = max(0, n_total - n_real)
            group = name2grp.get(name, "tail")
            key = f"{bench}|{lid}"
            if key in real_acc:
                a = real_acc[key]
                ce, bsce, ours = a["ce"], a["bsce"], a["ours"]
            else:
                any_placeholder = True
                ce, bsce, ours = placeholder_acc(group, n_real, rng)
            classes.append({
                "id": int(lid), "name": name, "benchmark": bench, "group": group,
                "n_real": n_real, "n_generated": n_gen,
                "acc_ce": ce, "acc_bsce": bsce, "acc_ours": ours,
                "real_clip": None, "gen_clip": None,
                "src_real": real_s.get(lid), "src_gen": gen_s.get(lid),
            })

    data = {
        "meta": {
            "placeholder_accuracies": any_placeholder,
            "note": ("Counts, class names and head/tail/fewshot groups are REAL "
                     "(from annotations/). Accuracies are PLACEHOLDER until you run "
                     "with --real-acc. Clip paths are null until you export clips."),
            "groups_order": ["head", "tail", "fewshot", "rareact"],
        },
        "classes": classes,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(data, open(OUT, "w"), indent=1)
    print(f"Wrote {len(classes)} classes -> {os.path.relpath(OUT, REPO)} "
          f"(placeholder_accuracies={any_placeholder})")


if __name__ == "__main__":
    main()
