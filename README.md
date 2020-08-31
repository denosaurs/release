# release

[![Tags](https://img.shields.io/github/release/denosaurs/release)](https://github.com/denosaurs/release/releases)
[![CI Status](https://img.shields.io/github/workflow/status/denosaurs/release/check)](https://github.com/denosaurs/release/actions)
[![License](https://img.shields.io/github/license/denosaurs/release)](https://github.com/denosaurs/release/blob/master/LICENSE)

<p align="center">
  <br>
  <img src="assets/example.svg" width="500">
  <br>
</p>

## Installation

```
$ deno install -A -f --unstable https://deno.land/x/release@0.1.1/release.ts
```

## Usage

```
usage: release [options] <type> [...]

example: release major

[options]:
  -h --help     Show this message
  --dry         Prevent changes to git

[type]:
  release type:
    * patch             eg: 1.2.3 -> 1.2.4
    * minor             eg: 1.2.3 -> 1.3.0
    * major             eg: 1.2.3 -> 2.0.0
    * prepatch <name>   eg: 1.2.3 -> 1.2.4-name
    * preminor <name>   eg: 1.2.3 -> 1.2.4-name
    * premajor <name>   eg: 1.2.3 -> 1.2.4-name
```

## Other

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with deno fmt and commit messages are done following Conventional Commits spec.

### Licence

Copyright 2020-present, the denosaurs team. All rights reserved. MIT license.
