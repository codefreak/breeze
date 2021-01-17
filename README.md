<div align="center"><img src="./frontend/packages/app/public/breeze-logo-square.svg" width="200" height="200" />
<h1>Breeze – simple browser editor and code execution</h1>
</div>

Breeze is a browser editor and REPL/terminal that connects to a dedicated Docker container on the server.
It allows creating on-demand programming environments for your favourite programming language.

TODO: Screenshot

## "But wait, there is Theia, Eclipse Che, VS Codespaces, Coder, …?"
Yes, and Breeze should not replace them. All the mentioned Cloud-"Editors" are full-fledged IDEs packed with features and are customizable to the tiniest Button. Cloud IDEs are build for professional developers working on larger projects. Our main reason to build Breeze was giving first semester CS students a ready to go programming environment with a big green play button. 

Every first-year student spends many hours setting up a local programming environment on their computer. Everyone who went through this knows how error-prone and frustrating this can be. Students should focus on learning the basic principles of programming languages and not how to install a compiler and other tools or what are the keyboard shortcuts of IDE XYZ.

The urge of a more powerful and customizable development environment comes automatically with more knowledge of how things work. It is less scary to install a compiler on your own if you learned the basic principles of a programming language ecosystem.

## How Breeze works
Basically, we connect an editor and a terminal running in the browser with a Docker container ("workspace container") on the host.
That's it.

This architecture makes Breeze super flexible: Want to run Python?
Just use the official Python Docker image and configure the compile/run and repl commands.
This principle works for (mostly) all programming languages or raw Ubuntu containers to learn e.g. Git or Bash.

## When would I need this?
Our main use-case is [Code FREAK](https://github.com/codefreak/codefreak), a web platform for coding education and automatic evaluation.
With Breeze, we spin up a browser programming environment with pre-configured run settings.
Students can program directly in the browser and do not have to initialize a local development environment.

Breeze could also be used to provide quick testing environments for new programming languages (code sandboxes).

## Show me a demo!
There is no public demo yet, but you can try Breeze locally with Docker.
Here are some examples, all of them use official images from Docker Hub.

All the local demos will use the Docker daemon itself to spin up necessary sidecar containers.
The UI is accessible at `http://localhost:3000` after running these commands.

### Raw Ubuntu container (default)
```shell script
docker run --rm -it \
   -v /var/run/docker.sock:/var/run/docker.sock \
   -p 3000:3000 \
   cfreak/breeze
```

### Python 3.8
```shell script
docker run --rm -it -v${PWD}:/home/coder/project \
   -v /var/run/docker.sock:/var/run/docker.sock \
   -p 3000:3000 \
   cfreak/breeze \
   --image=python:3.8 --main-file=main.py --repl-cmd='python -i' --run-cmd='python main.py'
```

`--image` tells Breeze which Docker image to use.
The `--main-file` is a path relative to the working directory (default is `/home/coder/project`).
The main file will be created if it does not exist and is opened by default in the editor.
`--repl-cmd` should be a command that starts an interactive session.
`--run-cmd` is the command that will be executed if you press the green play button on the web UI.
See the Configuration section for a list of available options.

### Java 11 + Gradle
You should place a Gradle project in the current directory with the `application` plugin.
```shell
docker run --rm -it -v${PWD}:/home/coder/project \
   -v /var/run/docker.sock:/var/run/docker.sock \
   -p 3000:3000 \
   cfreak/breeze \
   --image=gradle:jdk11 --repl-cmd=jshell --run-cmd='gradle run'
```

## Configuration
Each Breeze instance is configured via command line parameters.
The following table shows an overview.

| Parameter          | Value   | Default                                   | Comment                                                                                                                                                                        |
|--------------------|---------|-------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--image`          | String  | `ubuntu:latest`                           | Name of the image for the workspace container.                                                                                                                                 |
| `--repl-cmd`       | String  | `/usr/bin/env bash --noprofile --norc -i` | The command used for the interactive terminal                                                                                                                                  |
| `--run-cmd`        | String  |                                           | The command that will started in the workspace container when the user clicks the "run" button in the frontend                                                                 |
| `--hostname`       | String  | `breeze`                                  | Hostname for the workspace container.                                                                                                                                          |
| `--main-file`      | String  |                                           | A default file that will be created if it does not exist and opened in the IDE initially                                                                                       |
| `--enable-network` | Boolean | `false`                                   | Allow the workspace container to access the network/internet. The container will be added to the default network if this is enabled.                                           |
| `--remove-on-exit` | Boolean | `false`                                   | Remove the workspace container when the Breeze server stops                                                                                                                    |
| `--memory`         | String  | `128m`                                    | Memory limit of the workspace container in bytes. An optional k (kilobytes), m (megabytes) or g (gigabytes) suffix can be used                                                 |
| `--cpu-count`      | Int     | `1`                                       | Number of CPU cores available for the workspace container.                                                                                                                     |

The follow options are also available, but you should not touch them as most of them are either detected automatically or contain default values that will fit 99% of use-cases.

| Parameter          | Value   | Default                                 | Comment                                                                                                                                                                        |
|--------------------|---------|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--http-port`      | Int     | `3000`                                  | A TCP port Breeze will listen on                                                                                                                                               |
| `--instance-id`    | String  |                                         | Each instance has a unique ID to identify the sidecar-container. By default this is the id of the surrounding container which should fit most needs.                           |
| `--workspace-path` | String  | `/home/coder/project`                   | Path inside the workspace container where the project data will be mounted.                                                                                                    |
| `--workdir`        | String  | `/home/coder/project`                   | Working directory inside the workspace container. Should be the same as --workspace-path                                                                                       |
| `--container-id`   | String  |                                         | ID of the container the Breeze server is running inside. Will be detected automatically by default.                                                                            |
| `--uid`            | String  |                                         | UID of the user that will be owning the code and running processes inside the workspace container                                                                              |
| `--gid`            | String  |                                         | GID of the user that will be owning the code and running processes inside the workspace container. By default the same GID of the user in the Breeze Server Container is used. |
| `--user-name`      | String  | `coder`                                 | Name of the user inside the workspace container                                                                                                                                |
| `--group-name`     | String  | `coder`                                 | Name of the user's default group inside the workspace container                                                                                                                |
| `--home`           | String  | `/home/coder`                           | Home directory of the user inside the workspace container                                                                                                                      |

## Setup

### Development
The programming languages used for Breeze are Kotlin and TypeScript (React).
The backend is based on VertX and the frontend uses React for a snappy UI/UX.
To work on the source of Breeze please install OpenJDK and Node + Yarn.
Afterwards you need to run the following setup once (please note the directories):

```shell script
/         $ ./gradlew assemble
/frontend $ yarn install
/frontend $ yarn build
``` 

To run the frontend and backend please use the following commands:
```shell script
/                      $ ./gradlew vertxRun
/frontend/packages/app $ yarn start
```

The frontend will hot reload on any modification.
Changes on the backend require a full restart!

We are working on a more convenient developer experience.

## How secure is Breeze?
The Breeze application itself is basically only a proxy between the Web UI and a Docker container. Breeze needs access to the Docker engine or K8s cluster via service accounts (upcoming feature). 

So if you ask about the security of Breeze the real question is: How secure are Docker containers? This is a very broad topic on its own. Docker only provides some level of logical isolation between the resources of processes. If you allow strangers to run arbitrary commands and software on you machines, you need to take additional security measurements: Limit resources (CPU, memory, disk, …), limit or better cut network/internet access and make sure the containers have no additional privileges.

Regarding resources Breeze is very strict by default: Containers have no network access, only 32MB RAM and a very low amount of available CPU cycles. Of course, you can tweak all of these parameters for your needs! Add more RAM, more CPU and allow internet access.

## FAQ
### Does Breeze support debugging?
No, and there are currently no plans to add debugging features.

### Do I need Docker?
Breeze supports three environments: `docker` (default), `k8s` and `local`. On Docker and Kubernetes (`k8s`) containers are created natively using the Docker/K8s API. The `local` environment uses the underlying host without a container. This requires all software (compiler, interpreter, etc.) to be installed on the system. The `local` env is only meant for testing and should never be used in production.

### Where are the files stored?
Breeze uses the filesystem of the container. If Breeze itself runs inside a container you will either have to bind-mount a path from your local computer, or a named volume to `/workspace` inside the container. Otherwise, Breeze cannot mount the same files to the REPL container. Breeze will try to detect the correct volume mount automatically. If this fails you can use the `--mount` flag.

If you run Breeze on your local machine outside of a container (e.g. during development) it needs a directory, where it can write files to. By default, it will create a `.breeze/workspace` directory inside the working directory of the JVM
(`user.dir` java property).
