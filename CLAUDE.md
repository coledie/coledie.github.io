# Repository Notes for Agents

## Submodules

This repository uses git submodules. After cloning or pulling, always initialize and update them:

```
git submodule update --init --recursive
```

Current submodules:
- `fatbrownian` — static visualization embedded in a post via iframe
- `sp500benchmark` — Fidelity portfolio benchmarking tool embedded via iframe

## Starting the Dev Server

Ruby 3.1 (RubyInstaller) is required. With it on PATH:

```
gem install bundler
bundle install
bundle exec jekyll serve
```

If `bundle install` fails due to lockfile conflicts, run `bundle update` first.

## Adding Posts

Posts live in `_posts/` as `.markdown` files named `YYYY-MM-DD-title.markdown`.

Two post types are used:
- `layout: external` with `external_url` and `github: True` — redirects directly to a GitHub repo
- `layout: post` with an iframe — embeds a submodule's static frontend
