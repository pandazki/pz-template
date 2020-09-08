const path = require("path");
const fs = require("fs-extra");
const simpleGit = require("simple-git");
const git = simpleGit();
const os = require("os");

const configPath = "config.js";
function isGitUrl (str) {
  var regex = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
  return regex.test(str);
}

class TemplateLoader {
  constructor(location) {
    this.location = location;
  }

  async prepare () {
    let ts = this.location.split('|')
    if (ts.length === 2) { // git|hash 
      this.location = ts[0]
      this.hash = ts[1]
    } else if (ts.length !== 1) {
      throw new Error('Invalid location:' + this.location)
    }
    if (isGitUrl(this.location)) {
      const tmp = path.resolve(os.tmpdir(), "./.tplgen_tmp");
      await fs.emptyDir(tmp);
      await git.clone(this.location, tmp);
      if (this.hash) {
        await simpleGit(tmp).checkout(this.hash)
      }
      this.hash = await simpleGit(tmp).raw('rev-parse', 'HEAD')
      this.repo = this.location
      this.location = tmp;
    }

    this.config = require(path.resolve(this.location, configPath));

    if (!Array.isArray(this.config)) {
      this.config.name = this.config.name || "default";
      this.config.templatePath = this.config.templatePath || "template";
      this.config = [this.config];
    }

    this.tplCfgs = {};

    for (const cfg of this.config) {
      if (!cfg.name || !cfg.templatePath)
        throw new Error("Invalid configuration");
      cfg.tplDir = path.resolve(this.location, cfg.templatePath);
      if (await fs.ensureDir(cfg.tplDir)) {
        throw new Error("Invalid template dir");
      }
      this.tplCfgs[cfg.name] = cfg;
    }

    if (Object.keys(this.tplCfgs).length === 0) {
      throw new Error("No valid template");
    }

    this.selectedConfig = Object.values(this.tplCfgs)[0];
  }

  select (templateName) {
    this.selectedConfig = this.tplCfgs[templateName];
    return this.selectedConfig;
  }

  getTemplateNames () {
    return Object.keys(this.tplCfgs);
  }

  async copyTo (target) {
    await fs.copy(this.selectedConfig.tplDir, target);
    if (this.hash) {
      await fs.writeFile(path.resolve(target, ".tplver_" + this.selectedConfig.name), `${this.repo}|${this.hash}`)
    }
  }
}

module.exports = TemplateLoader;
