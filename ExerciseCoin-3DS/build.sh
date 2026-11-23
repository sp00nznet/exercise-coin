#!/bin/sh
# Build excoin.3dsx in the shelf-3ds-rust container (devkitARM + nightly Rust + cargo-3ds + clang; 3ds.Dockerfile).
#   ./build.sh                     -> target/armv6k-nintendo-3ds/release/excoin.3dsx
#   EXCOIN_SELFTEST=1 ./build.sh   an unattended build for Azahar (fake walk, auto sync)
set -e
here=$(cd "$(dirname "$0")" && pwd)
docker image inspect shelf-3ds-rust >/dev/null 2>&1 || docker build -t shelf-3ds-rust -f "$here/3ds.Dockerfile" "$here"
cache=${CARGO3DS_CACHE:-$HOME/.cache/cargo3ds}
mkdir -p "$cache/registry" "$cache/git"
# no strip: devkitARM's ld fails on it ("final link failed: invalid operation")
docker run --rm -u "${SUDO_UID:-$(id -u)}:${SUDO_GID:-$(id -g)}" -e HOME=/tmp \
  -e CARGO_PROFILE_RELEASE_STRIP=false -e EXCOIN_SELFTEST \
  -v "$here:/w" -v "$cache/registry:/opt/cargo/registry" -v "$cache/git:/opt/cargo/git" \
  -w /w shelf-3ds-rust cargo 3ds build --release "$@"
