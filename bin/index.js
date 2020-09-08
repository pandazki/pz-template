#!/usr/bin/env node

const program = require("commander");
const pkg = require("../package.json");
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const path = require("path");
const fs = require("fs-extra");

var helpers = require("handlebars-helpers");
var stringHelper = helpers.string();

const TplLoader = require("../lib/template-loader");
const Generator = require("../lib/generator");

program
  .version(pkg.version, "-v, --version")
  .description(
    "Lightweight template code (text) generation tool based on handlebars implementation."
  );
program.on("--help", () => {
  console.log("");
  console.log(`Project Repo: ${pkg.repository.url}`);
});

const error = chalk.red;
const warning = chalk.keyword("orange");
const success = chalk.greenBright;

program
  .command("upgrade")
  .alias("u")
  .description("Regenerate via new template hash")
  .requiredOption(
    "-t, --tplver <.tplver_* file location>",
    "The tplver file location"
  )
  .option(
    "--hash <git hash>",
    "Specify template version.If not specified, the latest version of the master branch is used."
  )
  .action(async (options) => {
    // Step 1: load template
    let spinner = ora({
      discardStdin: true,
    });

    spinner.start(warning("0/5 Parse tplver..."));

    let tplver;
    try {
      tplver = await fs.readJSON(options.tplver);
    } catch (e) {
      console.error(e);
      spinner.fail(error("0/5 Parse tplver failed"));
      return;
    }

    if (!tplver.location) {
      spinner.fail(error("0/5 Invalid tplver file"));
      return;
    }

    spinner.succeed(success("0/5 Parse tplver completed"));

    options.location = tplver.location.split("|")[0]; // ignore origin hash
    options.output = ".";

    spinner.start(
      warning("1/5 Template project pre-inspection in progress...")
    );

    const loader = new TplLoader(options.location);

    try {
      await loader.prepare();
    } catch (e) {
      console.error(e);
      spinner.fail(error("1/5 Pre-inspection failed"));
      return;
    }

    const outputAbs = path.resolve(process.cwd(), options.output);
    const outputTmpAbs = path.resolve(outputAbs, ".tplgen_workspace");

    if (outputAbs !== process.cwd() && fs.existsSync(outputAbs)) {
      spinner.fail(error(`1/5 Output folder ${outputAbs} existed.`));
      return;
    }

    if (fs.existsSync(outputTmpAbs)) {
      spinner.fail(
        error(`1/5 Output folder workspace ${outputTmpAbs} existed.`)
      );
      return;
    }

    spinner.succeed(success("1/5 Pre-inspection completed"));

    // Step 1.1: If multiple templates exist, select one.
    loader.select(tplver.meta._templateName)

    // Step 2: collect data
    spinner.info("Auto complete data");
    const ans = tplver.meta;
    spinner.succeed(success("2/5 Data collection completed"));

    // Step 3: copy teplate to workspace folder
    spinner.start(
      warning("3/5 Copy the template files to the workspace folder...")
    );

    try {
      await loader.copyTo(outputTmpAbs, Object.assign({}, ans, { _templateName: loader.selectedConfig.name }));
    } catch (e) {
      console.error(e);
      spinner.fail(error("3/5 File copy to workspace failed"));
      return;
    }

    spinner.succeed(success("3/5 File copy to workspace completed"));

    // Step 4: generation (handlebars process)
    spinner.start(warning("4/5 Generating..."));
    const gtor = new Generator();
    try {
      await gtor.generate(ans, outputTmpAbs);
    } catch (e) {
      console.error(e);
      spinner.fail(error("4/5 Template generate failed"));
      return;
    }

    spinner.succeed(success("4/5 Template created"));

    spinner.start(warning("5/5 Copy to target..."));
    try {
      await fs.copy(outputTmpAbs, outputAbs, {});
      await fs.rmdir(outputTmpAbs, { recursive: true });
    } catch (e) {
      console.error(e);
      spinner.fail(error("5/5 Copy to target folder failed"));
      return;
    }

    spinner.succeed(success("5/5 Copy to target folder completed"));

    spinner.succeed(success("All done."));
    spinner.info(`View the template folder: ${outputAbs}`);
  });

program
  .command("generate")
  .alias("g")
  .description("Generation via template")
  .requiredOption(
    "-l, --location <template location>",
    "Template location. /path/to/your/local/template/folder or git@your.domain:your.repo.git|hash"
  )
  .option(
    "-o, --output <output location>",
    "Output path. Warning: If specified as current directory, the checks for directory presence will be ignored and an incremental override policy will be applied!",
    "./output"
  )
  .action(async (options) => {
    // Step 1: load template
    let spinner = ora({
      discardStdin: true,
    });
    spinner.start(
      warning("1/5 Template project pre-inspection in progress...")
    );

    const loader = new TplLoader(options.location);
    try {
      await loader.prepare();
    } catch (e) {
      console.error(e);
      spinner.fail(error("1/5 Pre-inspection failed"));
      return;
    }

    const outputAbs = path.resolve(process.cwd(), options.output);
    const outputTmpAbs = path.resolve(outputAbs, ".tplgen_workspace");

    if (outputAbs !== process.cwd() && fs.existsSync(outputAbs)) {
      spinner.fail(error(`1/5 Output folder ${outputAbs} existed.`));
      return;
    }

    if (fs.existsSync(outputTmpAbs)) {
      spinner.fail(
        error(`1/5 Output folder workspace ${outputTmpAbs} existed.`)
      );
      return;
    }

    spinner.succeed(success("1/5 Pre-inspection completed"));

    // Step 1.1: If multiple templates exist, select one.

    if (loader.getTemplateNames().length > 1) {
      spinner.info("Select Template");
      const choise = await inquirer.prompt([
        {
          name: "templateName",
          type: "list",
          choices: loader.getTemplateNames(),
          message: "Template Name",
          default: loader.getTemplateNames()[0],
        },
      ]);
      loader.select(choise.templateName);
    }

    const prompts = loader.selectedConfig.prompts;

    // Step 2: collect data
    spinner.info("Please complete the template data below");
    const ans = await inquirer.prompt(prompts);
    spinner.succeed(success("2/5 Data collection completed"));

    // Step 3: copy teplate to workspace folder
    spinner.start(
      warning("3/5 Copy the template files to the workspace folder...")
    );

    try {
      await loader.copyTo(outputTmpAbs, Object.assign({}, ans, { _templateName: loader.selectedConfig.name }));
    } catch (e) {
      console.error(e);
      spinner.fail(error("3/5 File copy to workspace failed"));
      return;
    }

    spinner.succeed(success("3/5 File copy to workspace completed"));

    // Step 4: generation (handlebars process)
    spinner.start(warning("4/5 Generating..."));
    const gtor = new Generator();
    try {
      await gtor.generate(ans, outputTmpAbs);
    } catch (e) {
      console.error(e);
      spinner.fail(error("4/5 Template generate failed"));
      return;
    }

    spinner.succeed(success("4/5 Template created"));

    spinner.start(warning("5/5 Copy to target..."));
    try {
      await fs.copy(outputTmpAbs, outputAbs, {});
      await fs.rmdir(outputTmpAbs, { recursive: true });
    } catch (e) {
      console.error(e);
      spinner.fail(error("5/5 Copy to target folder failed"));
      return;
    }

    spinner.succeed(success("5/5 Copy to target folder completed"));

    spinner.succeed(success("All done."));
    spinner.info(`View the template folder: ${outputAbs}`);
  });

program
  .command("create")
  .alias("c")
  .description("Create template")
  .action(async () => {
    // Step 1: load template
    let spinner = ora({
      discardStdin: true,
    });
    spinner.start(
      warning("1/4 Template project pre-inspection in progress...")
    );

    const loader = new TplLoader(path.resolve(__dirname, "../tpl-of-tpl"));
    try {
      await loader.prepare();
    } catch (e) {
      console.error(e);
      spinner.fail(error("1/4 Pre-inspection failed"));
      return;
    }

    spinner.succeed(success("1/4 Pre-inspection completed"));

    // Step 2: collect data
    spinner.info("Please complete the template data below");

    const ans = await inquirer.prompt(loader.selectedConfig.prompts);
    spinner.succeed(success("2/4 Data collection completed"));

    // Step 3: copy teplate to target folder
    const outputAbs = path.resolve(
      process.cwd(),
      stringHelper.snakecase(ans.projectName.trim())
    );

    if (fs.existsSync(outputAbs)) {
      spinner.fail(error(`3/4 Output folder ${outputAbs} existed.`));
      return;
    }

    spinner.start(
      warning("3/4 Copy the template files to the target folder...")
    );

    try {
      await loader.copyTo(outputAbs);
    } catch (e) {
      console.error(e);
      spinner.fail(error("3/4 File copy failed"));
      return;
    }

    spinner.succeed(success("3/4 File copy completed"));

    // Step 4: generation (handlebars process)
    spinner.start(warning("4/4 Generating..."));
    const gtor = new Generator();
    try {
      await gtor.generate(ans, outputAbs);
    } catch (e) {
      console.error(e);
      spinner.fail(error("4/4 Template generate failed"));
      return;
    }

    spinner.succeed(success("4/4 Template created"));

    spinner.succeed(success("All done."));
    spinner.info(`View the template folder: ${outputAbs}`);
  });

program.parse(process.argv);
