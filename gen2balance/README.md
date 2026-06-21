# Gen2Balance — project webpage

A self-contained static project page (no build step) for *Gen2Balance: Generative
Balancing for Long-Tailed Video Action Recognition*.

```
webpage/
├── index.html                 # the whole page
├── tools/
│   └── make_perclass_data.py  # builds static/data/perclass.json
└── static/
    ├── css/style.css
    ├── js/index.js            # BibTeX copy button
    ├── js/explorer.js         # interactive per-class explorer (Fig. 4, live)
    ├── paper.pdf              # linked by the "Paper (PDF)" button
    ├── data/perclass.json     # per-class data for the explorer
    ├── videos/               # (optional) sample .mp4 clips for gallery + explorer
    └── images/
        ├── teaser.png         # Fig. 1  (hero)
        ├── fig_pipeline.png   # Fig. 2  (generation pipeline)
        ├── fig_training.png   # Fig. 3  (two-stage training)
        ├── fig_perclass.png   # Fig. 4  (per-class gains)
        └── fig_qualitative.png# Fig. 5  (qualitative comparison)
```

## Preview locally

```bash
cd webpage
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

Serve the `webpage/` folder as the site root. Two common options:

**Option A — `docs/` on the main branch** (simplest)
```bash
git mv webpage docs           # or: cp -r webpage docs
# GitHub repo → Settings → Pages → Source: "Deploy from a branch"
#   Branch: main   Folder: /docs
```
The page will be at `https://<user>.github.io/<repo>/`.

**Option B — `gh-pages` branch**
Push the contents of `webpage/` to the root of a `gh-pages` branch and point
Pages at that branch.

All asset paths are **relative**, so the site works from any sub-path.

## Before publishing — fill in the placeholders

Search `index.html` for `TODO(author)` and the on-page orange notes. To replace:

| Placeholder | Where | What to put |
|---|---|---|
| Author homepages | hero `.authors` block | homepage URLs for Simon Jenni and Fabian Caba Heilbron (`href="#"`); Prajwal Gatti and Dima Damen are already linked |
| arXiv link | "arXiv" button (`href="#"`) | arXiv abstract URL |
| Code link | "Code" button | currently points to `github.com/prajwalgatti/gen2balance` — fix if the repo differs |
| Dataset link | "Dataset (140K clips)" button (`href="#"`) | Hugging Face / Drive download URL |
| Twitter/X thread | "Thread" button (`href="#"`) | URL of the announcement thread |
| Main results table | `#results` → `.table-wrap` | exact Head / Tail / Few-shot / CA numbers from the paper's main table (remove the orange warning line) |
| Video gallery | `#gallery` | drop `.mp4`s into `static/videos/`, then uncomment the `<div class="gallery">` block |
| BibTeX | `#bibtex` block | final author list + venue once the camera-ready/arXiv entry exists |
| Per-class explorer accuracies | `static/data/perclass.json` | regenerate with real numbers (see below) |
| Per-class explorer clips | `static/data/perclass.json` `real_clip`/`gen_clip` | web paths to exported clips |

## Interactive per-class explorer (live Fig. 4)

The explorer in the Results section reads `static/data/perclass.json`, built by
`tools/make_perclass_data.py`. **Class names, head/tail/few-shot groups, and the
real/generated counts are pulled directly from `annotations/` — those are already
real.** Only the per-class accuracies start as plausible placeholders.

**1. Drop in your real accuracies.** Create a JSON mapping `"<bench>|<label_id>"`
to `{ce, bsce, ours}`, e.g.:
```json
{ "K100-LT|3": {"ce": 41.2, "bsce": 55.0, "ours": 79.8}, "RareAct-K100-LT|105": {"ce": 15.1, "bsce": 20.6, "ours": 48.5} }
```
then regenerate (the on-page placeholder warning disappears once every class has real numbers):
```bash
python webpage/tools/make_perclass_data.py --real-acc your_accuracies.json
```

**2. (Optional) add sample clips per class.** Export a real + generated clip for
the classes you want clickable, place them under `static/videos/`, and set the
`real_clip` / `gen_clip` web paths in `perclass.json` (the generator records the
source `DATA_ROOT`-relative paths in `src_real` / `src_gen` to help you locate
them). Until then the explorer shows tasteful "clip not exported yet" placeholders.

> Keep exported clips short, muted, and ~480p H.264 MP4 so the page stays light.

> **Double-blind note:** the paper is currently an anonymous ECCV 2026 submission
> (Paper #805). Only push real names/links once that is no longer a concern.

## Regenerating the figures (optional)

The figures were cropped from `paper.pdf` with poppler + ImageMagick, e.g.:
```bash
pdftoppm -png -r 200 -f 5 -l 5 paper.pdf hp        # render page 5 at 200 dpi
magick hp-05.png -crop 1150x352+0+80 +repage static/images/fig_pipeline.png
```
Re-crop from the source PDF if you update the paper.
