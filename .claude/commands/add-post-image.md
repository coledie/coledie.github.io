# add-post-image

Add a preview image to a blog post card on the home page.

Images live in `assets/img/posts/` and are referenced via `image:` in each post's front matter.
The home layout at `_layouts/home.html` picks up `post.image` first, then falls back to auto-extracting
the first `<img>` from rendered post content, then falls back to a dark gradient placeholder.

---

## GitHub repos — automated

```bash
# 1. Find image paths in the README
gh api repos/coledie/<repo> --jq '.content' | base64 -d | grep -oE '!\[[^]]*\]\([^)]+\)' | head -3

# 2. Get default branch
gh api repos/coledie/<repo> --jq '.default_branch'

# 3. Construct raw URL
# https://raw.githubusercontent.com/coledie/<repo>/<branch>/<img-path>

# 4. Add to post front matter
image: https://raw.githubusercontent.com/coledie/<repo>/<branch>/<img-path>
```

---

## Kaggle notebooks — manual (JS-rendered, requires browser)

Kaggle notebooks require a logged-in browser session to see output images.
The OG image endpoint (`kaggle.com/open-graph/images/Notebooks/<id>`) returns 404 — not a real image URL.

**Steps:**

1. Open the notebook in your browser (e.g. `kaggle.com/coledie/intro-to-computer-vision`)
2. Find the first output image/plot in the notebook
3. Right-click → **Save image as** → save to `assets/img/posts/<slug>.png`
4. Add to the post's front matter:

```yaml
image: /assets/img/posts/<slug>.png
```

**Notebooks that need images:**

| Post file | Kaggle URL | Status |
|---|---|---|
| `2019-09-01-IntroComputerVision.markdown` | kaggle.com/coledie/intro-to-computer-vision | ✓ `/assets/img/posts/cv.png` |
| `2019-09-12-ComputerVision2.markdown` | kaggle.com/coledie/intro-to-computer-vision-2 | ✓ `/assets/img/posts/cv2.png` |
| `2020-01-15-NeuralNetworkNumpy.markdown` | kaggle.com/coledie/neural-network-w-numpy | ✓ `/assets/img/posts/numpynetworks.png` |
| `2020-05-20-IntroNumpy.markdown` | kaggle.com/coledie/intro-to-numpy | ✓ `/assets/img/posts/intronumpy.png` |
| `2023-10-15-NNFromLinear.markdown` | kaggle.com/code/coledie/linear-regression-to-nn | ✓ `/assets/img/posts/nnfromlinearregressor.png` |

---

## Local post images — auto-extracted

Posts with inline images (e.g. `![alt](/img/...)`) don't need `image:` front matter — the home
layout extracts the first `<img src=` from the rendered HTML automatically.

Currently working: `2019-07-12-DelayEmbedding.markdown` (uses `/img/2019-07-12/logistic_39.PNG`)

---

## Placeholder fallback

Posts with no image get a dark gradient card with the post title overlaid.
To improve a placeholder, just add `image:` front matter pointing to any accessible image URL or local path.
