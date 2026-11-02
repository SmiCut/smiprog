# Tool image optimization

The ten runtime tool images use WebP at quality 95 with full-quality alpha.
Original PNGs are preserved in `tools/image-sources/thread-mills/`; they are not
included in the app distributions. The dimension illustration remains SVG.

## Result (2026-11-02)

| Asset set | Original | Optimized | Reduction |
|---|---:|---:|---:|
| Ten tool images | 761,440 bytes | 158,102 bytes | 79.2% |
| All images, including SVG | 788,411 bytes | 185,073 bytes | 76.5% |

All raster images keep their original 1000–1100 pixel width and height.
Decoded transparency channels are byte-identical to the original PNGs. Colour
compression is lossy: quality 95 was chosen after reviewing the tool edges,
flutes, coolant illustrations and metal gradients. Quality 90 was also compared;
quality 95 provides more margin for fine detail. Lossless WebP was tested but was
larger (405,246 bytes for the tool images).

The calculator/Compare tool image has a maximum CSS width of 500px, so even the
narrowest source supplies at least two image pixels per displayed pixel. The
start-card image is already capped at 260px. Do not upscale the images or lower
the source resolution without measuring the largest displayed size again.
This is a 2× Retina target, not a claim of full native detail on every 3× display.

## Rebuild

Install the `cwebp` command-line encoder, then run:

```bash
python3 tools/optimize-tool-images.py
```

The selected encoder was libwebp 1.6.0. The script retains full dimensions and
writes `docs/tool-image-optimization.json` with encoder settings, sizes and hashes.
Always encode from the original PNGs, never from already compressed WebP files.
Ordinary app/package builds use the checked-in WebP files and do not need cwebp.

## Verification

- Compared PNG, lossless WebP, quality 95 and quality 90 candidates.
- Checked the original and optimized dimensions and alpha bytes for all ten images.
- Reviewed all original/optimized tool images side by side and a magnified edge crop.
- Measured all ten images in Start, Calculator and Compare at viewport widths
  320, 390, 768, 1440 and 1920, with device pixel ratio 2. The smallest measured
  source-to-display ratio after the width cap was 2.22.
- Reviewed desktop/mobile screenshots and checked standalone and WordPress package
  image loading. Packaging checks also verify the existing calculator reference cases.

The assets remain local to the app. No external image host or Railway change is
needed. This change prepares optimized assets; it does not yet create the planned
single-file HTML distribution or deploy a production website.
