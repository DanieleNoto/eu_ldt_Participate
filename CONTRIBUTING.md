<!-- SPDX-License-Identifier: AGPL-3.0
Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
Authors:
Pierluigi Spedicato
-->

# Contributing Guide

- Contributing to the EU LDT TOOL NAME is fairly easy. This document shows you how to get started.

## General

- The [Codebase Structure](./CODEBASE_STRUCTURE.md) has detailed information about how the various files in this project are structured.
- Please ensure that any changes you make are in accordance with the [Coding Guidelines](./CODING_GUIDELINES.md) of this repository.

## Submitting changes

1. Clone the repository
2. Check out a new branch based and name it to what you intend to do

- Example:
    ```
    $ git checkout -b BRANCH_NAME
    ```
    If you get an error, you may need to fetch main first by using:
    ```
    $ git remote update && git fetch
    ```
- Use one branch per fix / feature

3. Commit your changes

- Please provide a git message that explains what you've done
- Please make sure your commits follow the [Coding Guidelines](./CODING_GUIDELINES.md)
- Commit to the cloned repository
- Example:
    ```
    $ git commit -am 'feat: Add some feature'
    ```
- Push to the branch
    - Example:
        ```
        $ git push origin BRANCH_NAME
        ```
- Make a pull request
    - Make sure you send the PR to the main branch

If you follow these instructions, your PR will land pretty safely in the main repo!
