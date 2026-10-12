# OpenDyslexic web fonts

Place these four real WOFF2 files in this directory, using the names below.
Use “Download raw file” on the upstream author's compiled files (not the GitHub HTML page):

- [OpenDyslexic-Regular.woff2](https://github.com/antijingoist/opendyslexic/blob/main/compiled/OpenDyslexic-Regular.woff2)
- [OpenDyslexic-Bold.woff2](https://github.com/antijingoist/opendyslexic/blob/main/compiled/OpenDyslexic-Bold.woff2)
- [OpenDyslexic-Italic.woff2](https://github.com/antijingoist/opendyslexic/blob/main/compiled/OpenDyslexic-Italic.woff2)
- [OpenDyslexic-BoldItalic.woff2](https://github.com/antijingoist/opendyslexic/blob/main/compiled/OpenDyslexic-BoldItalic.woff2)

Also save the upstream [OFL.txt](https://github.com/antijingoist/opendyslexic/blob/main/OFL.txt)
as `OFL-OpenDyslexic.txt`, preserving the copyright and licence for redistribution.
The repository is the author's archived upstream distribution. No font is downloaded
by a builder or fetched from a third party by a website visitor. Rebuild the language
sites after adding the files so `dist/<code>/assets/fonts/` receives them.

The accessibility stylesheet uses only `/assets/fonts/` URLs and `font-display: swap`.
Missing files and characters outside the font's coverage fall back to the system sans-serif.
Do not use empty placeholder files with `.woff2` extensions.
