#!/usr/bin/env python3
"""Normalize transparent UI PNG files without assuming any project layout."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def normalized_image(source: Path, canvas_size: int, padding: float) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"Image has no visible alpha pixels: {source}")

    cropped = image.crop(bounds)
    content_size = max(cropped.size)
    padded_size = max(1, round(content_size * (1 + padding)))
    canvas = Image.new("RGBA", (padded_size, padded_size), (0, 0, 0, 0))
    offset = ((padded_size - cropped.width) // 2, (padded_size - cropped.height) // 2)
    canvas.alpha_composite(cropped, offset)
    return canvas.resize((canvas_size, canvas_size), Image.Resampling.LANCZOS)


def destination_for(source: Path, output_dir: Path | None, overwrite: bool) -> Path:
    if overwrite:
        return source
    if output_dir is None:
        raise ValueError("Use --output-dir or explicitly opt in to --overwrite.")
    return output_dir / source.name


def main() -> None:
    parser = argparse.ArgumentParser(description="Trim transparent padding, center, and resize UI PNG files.")
    parser.add_argument("inputs", nargs="+", type=Path, help="PNG files to normalize")
    parser.add_argument("--output-dir", type=Path, help="Output directory; required unless --overwrite is set")
    parser.add_argument("--size", type=int, default=1024, help="Square output size in pixels (default: 1024)")
    parser.add_argument("--padding", type=float, default=0.08, help="Transparent padding ratio (default: 0.08)")
    parser.add_argument("--overwrite", action="store_true", help="Replace each input file in place")
    args = parser.parse_args()

    if args.size < 1 or args.padding < 0:
        parser.error("--size must be positive and --padding cannot be negative.")
    if args.output_dir:
        args.output_dir.mkdir(parents=True, exist_ok=True)

    for source in args.inputs:
        if source.suffix.lower() != ".png":
            parser.error(f"Only PNG input is supported: {source}")
        output = destination_for(source, args.output_dir, args.overwrite)
        normalized_image(source, args.size, args.padding).save(output, optimize=True)
        print(output)


if __name__ == "__main__":
    main()
