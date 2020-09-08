# PZ-TEMPLATE

基于 [handlebars](https://handlebarsjs.com/guide/) 实现的轻量级模板代码（文本）生成工具。

Lightweight template code (text) generation tool based on [handlebars](https://handlebarsjs.com/guide/) implementation.

## Installation

`npm i pz-template -g`

or

`yarn global add pz-template`

## Usage

```sh
# create new template
tplgen c

# generate code/text by template
tplgen g -l [your template git repo/local template folder] -o output

# upgrade to new template version
tplgen u -t [.tplver_xxxx] --hash [specify git rev hash]

# help
tplgen -h
```
