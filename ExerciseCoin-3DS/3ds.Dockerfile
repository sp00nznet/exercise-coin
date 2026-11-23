# The Rust-for-3DS toolchain: devkitARM + nightly Rust + cargo-3ds (+ clang for ctru-sys bindgen).
# docker build -t shelf-3ds-rust -f native/3ds.Dockerfile native
FROM devkitpro/devkitarm:latest
ENV RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo PATH=/opt/cargo/bin:/opt/devkitpro/devkitARM/bin:$PATH
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates build-essential git clang libclang-dev && rm -rf /var/lib/apt/lists/*
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain nightly \
 && rustup component add rust-src \
 && cargo install --locked cargo-3ds \
 && chmod -R a+rwX /opt/cargo /opt/rustup
