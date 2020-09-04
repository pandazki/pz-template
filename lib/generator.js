const fs = require('fs-extra')
const klawSync = require('klaw-sync')
const handlebars = require('handlebars')
const helpers = require('handlebars-helpers')({
  handlebars
});

const compile = async (meta, file) => {
  const content = (await fs.readFile(file)).toString()
  const result = await new Promise((resolve, reject) => {
    try {
      const r = handlebars.compile(content, {
        strict: true
      })(meta)
      resolve(r)
    } catch (e) {
      reject(e)
    }
  })
  await fs.writeFile(file, result)
}

class Generator {
  async generate (meta, src) {
    const paths = klawSync(src, { nodir: true })
    for (const p of paths) {
      await compile(meta, p.path)
    }
  }
}

module.exports = Generator;