#!/usr/bin/env bash
# bash strict mode
set -euo pipefail
# Reading ENV
set +u
enable_music_player=$ENABLE_MUSIC_PLAYER
server_args=""
set -u
echo "-----                                                                      -----"                                                                
echo "                                                                                "
echo "        @@@@@@@  @@@  @@@ @@@  @@@  @@@@@@@  @@@@@@@@  @@@@@@  @@@  @@@         "
echo "        @@!  @@@ @@!  @@@ @@!@!@@@ !@@       @@!      @@!  @@@ @@!@!@@@         "
echo "        @!@  !@! @!@  !@! @!@@!!@! !@! @!@!@ @!!!:!   @!@  !@! @!@@!!@!         "
echo "        !!:  !!! !!:  !!! !!:  !!! :!!   !!: !!:      !!:  !!! !!:  !!!         "
echo "        :: :  :   :.:: :  ::    :   :: :: :  : :: ::   : :. :  ::    :          "
echo "                                                                                "
echo "                                                                                "
echo "                     @@@@@@@ @@@      @@@  @@@ @@@@@@@                          "
echo "                    !@@      @@!      @@!  @@@ @@!  @@@                         "
echo "                    !@!      @!!      @!@  !@! @!@!@!@                          "
echo "                    :!!      !!:      !!:  !!! !!:  !!!                         "
echo "                     :: :: : : ::.: :  :.:: :  :: : ::                          "
echo "                                                                                "
echo "              .,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,                   "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,         ,,,,,,,,,,,         ,,,,,,,,,.                  "
echo "              ,,,,,,,              ,,,,,,              ,,,,,,.                  "
echo "              ,,,,,,               ,,,,,               ,,,,,,.                  "
echo "              ,,,,,,,              ,,,,,,              ,,,,,,.                  "
echo "              ,,,,,,,,            ,,,,,,,,            ,,,,,,,.                  "
echo "              ,,,,,,,,,,        ,,,,,,,,,,,,        ,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.                  "
echo "              .,,,,,,,....,,,,,,,,,,,..,,,,,,,,,,,....,,,,,,,.                  "
echo "               .,,,.        .,,,,.        .,,,,.        ,,,,                    "
echo "                                                                                "
echo "-----                          Version Information                         -----"
echo -n "-----                    " && echo -n "$(printf "%-20s %-28s" image: "${VERSION}")" && echo " -----"
echo "                                                                                "
echo "-----                        Environment Variables                         -----"
if [[ "$enable_music_player" != "" ]]; then 
echo -n "-----                    " && echo -n "$(printf "%-20s %-28s" ENABLE_MUSIC_PLAYER: "$enable_music_player")" && echo " -----"
fi

# Actions running on first start only
if [[ -f /opt/.docker_config/.first_run ]]; then
    echo "-----                             Copy Data                                -----"
    # mv -u -v ../app_tmp/* ../app/
    rsync -auvhp --remove-source-files --info=progress2 --size-only ../app_tmp/* ../app/
fi

if [[ "$enable_music_player" = "true" ]]; then 
    server_args="--music"
        if [[ -f /opt/.docker_config/.first_run ]]; then
        echo "-----                  Download and Unzip Ambience Music                   -----"

        wget --no-check-certificate -O ../app/ambience/music-bundle.zip "https://evi.nl.tab.digital/s/y2w7b7e7ztPRYra/download" \
        && unzip ../app/ambience/music-bundle.zip -d ../app/ambience/music-bundle \
        && rsync -auvhp --remove-source-files --info=progress2 --size-only ../app/ambience/music-bundle/* ../app/ambience/ \
        && rm -r ../app/ambience/music-bundle.zip \
        && rm -r ../app/ambience/music-bundle
        fi
else
    server_args="--no-music"
fi

../app/server "$server_args"