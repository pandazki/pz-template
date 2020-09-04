const path = require('path')
const fs = require('fs-extra')
const simpleGit = require('simple-git')
const git = simpleGit()
const os = require('os')

const configPath = 'config.js'
function isGitUrl (str) {
    var regex = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
    return regex.test(str);
};

class TemplateLoader {

    constructor(location) {
        this.location = location
    }

    async prepare () {

        if (isGitUrl(this.location)) {
            const tmp = path.resolve(os.tmpdir(), './.tplgen_tmp')
            await fs.emptyDir(tmp)
            await git.clone(this.location, tmp)
            await fs.rmdir(path.resolve(tmp), '.git')
            this.location = tmp
        }

        // this.config = fs.readJSONSync(path.resolve(this.location, configPath))
        this.config = require(path.resolve(this.location, configPath))
        this.tplPath = this.config.templatePath || 'template'
        this.tplDir = path.resolve(this.location, this.tplPath)

        if (await fs.ensureDir(this.tplDir)) {
            throw new Error('Invalid template dir')
        }
    }

    async copyTo (target) {
        await fs.emptyDir(target)
        await fs.copy(this.tplDir, target)
    }

}

module.exports = TemplateLoader
