FROM dart:stable as builder

LABEL org.opencontainers.image.title="Dungeon Club - Virtual Tabletop" \
      org.opencontainers.image.description="Dungeon Club - Virtual Tabletop: An online platform to gather and play Dungeons & Dragons, Call of Cthulu, Pathfinder and more. Dungeon Club strives to be the most user-friendly virtual tabletop of all, providing tons of features and a comfortable design." \
      org.opencontainers.image.documentation="https://github.com/buanet/ioBroker.docker#readme" \
      org.opencontainers.image.authors="Marcel A." \
      org.opencontainers.image.url="https://github.com/doodlezucc/dungeonclub" \
      org.opencontainers.image.source="https://github.com/doodlezucc/dungeonclub" \
      org.opencontainers.image.base.name="ubuntu" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${DATI}"

WORKDIR /app
COPY pubspec.* ./
RUN dart pub get

COPY . .

RUN dart pub get --offline
RUN dart bin/build.dart

#debian:bookworm-slim
FROM ubuntu 
WORKDIR /app_tmp

ENV ENABLE_MUSIC_PLAYER="false"

RUN apt-get update && apt-get upgrade -y \
    # Install prerequisites
    && apt-get install -q -y --no-install-recommends \
    # apt-utils \
    # ca-certificates \
    # cifs-utils \
    # locales \
    # tar \
    # tzdata \
    rsync \
    wget \
    unzip \
    # Clean up installation cache
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && apt-get autoclean -y \
    && apt-get autoremove \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/* /root/.cache/* /root/.npm/* /var/lib/apt/lists/*\ 
    # Prepare .docker_config
    && mkdir /opt/.docker_config \
    && echo "${VERSION}" > /opt/.docker_config/.thisisdocker \
    && echo "true" > /opt/.docker_config/.first_run

COPY --from=builder /runtime/ ./runtime
COPY --from=builder /app/build/latest /app_tmp
COPY --from=builder /app/scripts /scripts

RUN chmod +x /scripts/entrypoint.sh

CMD ["/bin/bash", "/scripts/entrypoint.sh"]

EXPOSE 7070

HEALTHCHECK --interval=1m --start-period=15s CMD wget --no-verbose --tries=3 --spider http://localhost:7070 || exit 1

VOLUME /app
