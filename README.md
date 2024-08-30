![GitHub License](https://img.shields.io/github/license/doodlezucc/dungeonclub) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/doodlezucc/dungeonclub/total) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/doodlezucc/dungeonclub/deploy-images.yaml)

 
 # Dungeon Club - Virtual Tabletop <img align="right" src="web/images/icon.png" alt="Icon" height=96 />

An online platform to gather and play Dungeons & Dragons, Call of Cthulu, Pathfinder and more.

[**Dungeon Club**](https://dungeonclub.net) strives to be the most *user-friendly* virtual tabletop of all, providing tons of features and a comfortable design.
Visit the homepage for a demonstration of features or [try the demo](https://dungeonclub.net/game/sandbox) right now!

## Development
In order to run and debug the VTT locally, you'll need the [Dart SDK](https://dart.dev/get-dart).
If you're on Windows and don't want the trouble of installing Chocolatey, I recommend following [this guide](https://medium.com/2beengineer/install-the-dart-sdk-on-windows-10-b503cd065ab5) instead.

After downloading the SDK and making sure it's part of your PATH, run the following lines as a *one-time* setup:

```bash
# Clone repository and navigate into the directory
git clone https://github.com/doodlezucc/dungeonclub.git
cd dungeonclub

dart pub get                     # Download all required packages
dart pub global activate webdev  # Download Dart->JavaScript transpiler
```

The web app's stylesheet is written in Sass and has to be transpiled into CSS. You can either install Sass as a [standalone executable](https://github.com/sass/dart-sass/releases/latest) or by using the Node.js package manager [npm](https://www.npmjs.com/package/sass).

```bash
npm install -g sass              # Download SCSS->CSS transpiler
```

<sup>More info on [sass](https://sass-lang.com/install/) and [webdev](https://dart.dev/tools/webdev).</sup>

### Launching via VS Code
If you're a using the IDE [Visual Studio Code](https://code.visualstudio.com/), you can make use of the repository's launch configurations. You can start backend as well as frontend services simultaneously by choosing the `Launch All (Terminal)` debug configuration.

Note that this all-in-one launch configuration starts inside VS Code's **terminal**. This allows you to restart the backend server with a simple <kbd>R</kbd> keypress.
In case you prefer the IDE's **debug console**, you can instead start the development processes separately:

- **Web/Frontend** - Run *`Tasks: Run Build Task`* (or press <kbd>Control</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>).
- **Server/Backend** - Run *`Debug: Start Debugging`* (or press <kbd>F5</kbd>) and pick the `Launch Backend` configuration.

### Launching via Shell
Alternatively, you can start the development server by running a Dart script. 

```bash
# Launch the webdev server / stylesheet compiler / backend server
dart bin/dev.dart
```

After initializing backend and web serving, you can go to [_`localhost:8080`_](http://localhost:8080) and view your freshly delivered, live-compiled version of Dungeon Club.

Changes to the source code are reflected at different times depending on what part you're working on. Changes can be seen...
- **Server Code** - after restarting the server. When launching from a terminal, you can press <kbd>R</kbd> inside your terminal to restart the backend process.
- **Website Code** - after refreshing the website (at _`http://localhost:8080`_).
- **Website Stylesheet** - after refreshing the website or by pressing <kbd>Shift</kbd>+<kbd>R</kbd> on the website (not available on Firefox).

## Self-Hosting
You can find the official public version of Dungeon Club at https://dungeonclub.net. In case you want to host a local server on your machine, there are three ways to achieve this.

### Pre-Compiled Releases

Whenever an update rolls out to the public website, a new *release* is added to the repository [Releases](https://github.com/doodlezucc/dungeonclub/releases) tab. Releases consist of a short changelog followed by a list of pre-compiled builds for multiple platforms and architectures.

After downloading and unzipping your selected build, you will find two relevant files inside:
- **server.exe** - The executable server. (Depending on your platform, the file extension may differ.)
- **login.yaml** - A file which may define custom account logins.

When executing `server.exe`, a terminal opens up, informing you that Dungeon Club is now serving at _`http://localhost:7070`_.
You can navigate to this address and see your very own copy of the VTT loaded and ready to use.

Try logging into the pre-registered mock account by filling in email "admin", password "admin" on the homepage.
There's no difference in using a *mock account* vs. a regular *email-verified account*, aside from the way it's created.
Upon a successful login, you're presented with the ability to create and manage your own campaigns.

If you open the server port (`7070` by default) in your network, outside players should be able to interact with your locally hosted website by accessing your IP address.

### Docker
A new Docker container is also created for each new release.  The container can be started directly in the CLI or with Docker-Compose.

CLI
```bash
# Start the Container
docker run -v <path-to-data>:/app -p <your-port>:7070 -e ENABLE_MUSIC_PLAYER=false ghcr.io/doodlezucc/dungeonclub:latest
```

Docker-Compose
```yml
version 2.1

services:
  dungeonclub:
    image: ghcr.io/doodlezucc/dungeonclub:latest
    container_name: dungeonclub
    ports:
      - 7070:7070
    restart: always
    environment:
      - ENABLE_MUSIC_PLAYER=false
    volumes:
      - <path-to-data>:/app
```

### Custom Build
Apart from the official list of executable releases, you can also build Dungeon Club yourself.
Follow the one-time setup described in [Development](#development) to install required tools.
Then, execute the repository-included dedicated build script by running the following command:

```
dart bin/build.dart [options]
```

For a list of possible arguments, run `dart bin/build.dart --help` or refer to the next section.

## Command Line Arguments
The following options may be entered as arguments to the server and/or builder.

Option | Definition | Default (serve) | Default (build)
------ | ---------- | --------------- | ---------------
`-h, --help` | Prints a list of available flags and options.
`--[no-]mock-account` | Whether to accept contents of "login.yaml" as a list of registered accounts. | `false` | `true`
`--[no-]music` | Whether to enable the integrated music player. Server hosts may need to install yt-dlp and ffmpeg to download 500 MB of background music. | `true` | `false`
**Server Only**
`-p, --port` | Specifies the server port. | `7070` |
`--bootstrap` | <ul><li>`all` - Enable log files and graceful exits</li><li>`logging` - Enable log files</li><li>`none` - Bypass bootstrapper</li></ul> | `all` |
**Build Only**
`--[no-]copy-music` | Whether to include locally downloaded music (ambience/tracks/*.mp3) in the build. | | `false`
`--[no-]download-icons` | Whether to download and include the latest release of Font Awesome (icons used on the website) | | `true`
`--part` | Which parts to compile and include in the build. Can be `server` or `all`. | | `all`
