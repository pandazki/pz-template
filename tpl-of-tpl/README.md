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
{
  "templatePath": "template", // The relative path of the template folder. default: `template`
  "prompts": [ // Template data, collection via inquirer prompts
    {
      "name": "name",
      "type": "string",
      "message": "Project name"
    }
  ]
}
```
