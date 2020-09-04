## Template of template

This is a tool template for generating template projects. Also, this is a sample project that you can use as a reference to write your own templates.

### Template project structure

```sh
├── README.md
├── config.js # configuration
└── template
    └── ... # Your template folder
```

### config.js

```js
// single template
module.exports = {
  name: "my-template", // Optional
  templatePath: "template", // The relative path of the template folder. default: `template`
  prompts: [
    // inquirer prompts. Check details: https://github.com/SBoudrias/Inquirer.js/
    {
      name: "projectName",
      type: "string",
      message: "The project name",
    },
  ],
};

// multi templates
module.exports = [
  {
    name: "t1", // Necessary in multi template configs
    templatePath: "templates/t1",
    prompts: [
      {
        name: "name",
        type: "string",
        message: "项目名称",
      },
    ],
  },
  {
    name: "t2",
    templatePath: "templates/t2",
    prompts: [
      {
        name: "name",
        type: "string",
        message: "项目名称",
      },
      {
        name: "author",
        type: "string",
        message: "作者",
      },
    ],
  },
];
```
