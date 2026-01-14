FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libtool \
    autotools-dev \
    automake \
    pkg-config \
    libssl-dev \
    libevent-dev \
    bsdmainutils \
    libboost-all-dev \
    libdb-dev \
    libdb++-dev \
    libminiupnpc-dev \
    curl \
    jq \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create data directory
RUN mkdir -p /var/lib/exercisecoin

# Copy scripts
COPY scripts /usr/local/bin/exercisecoin-scripts
RUN chmod +x /usr/local/bin/exercisecoin-scripts/*.sh

# Copy config
COPY config /etc/exercisecoin

WORKDIR /var/lib/exercisecoin

# Note: In production, you would clone and build F7CoinV4 fork here
# RUN git clone https://github.com/sp00nznet/F7CoinV4.git /src/exercisecoin
# WORKDIR /src/exercisecoin
# RUN ./autogen.sh && ./configure && make && make install

EXPOSE 19332 19333

# Placeholder - in production this would run the actual daemon
CMD ["echo", "Exercise Coin daemon - build from F7CoinV4 source"]
