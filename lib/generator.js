const fs = require('fs-extra')
const klawSync = require('klaw-sync')
const handlebars = require('handlebars')
require('handlebars-helpers')({
  handlebars
});

const compile = async (meta, file) => {
  const content = (await fs.readFile(file)).toString()
  const result = handlebars.compile(content, {
    strict: true
  })(meta)
  const target = handlebars.compile(file, {
    strict: true
  })(meta)
  if (file !== target) {
    await fs.move(file, target)
  }
  await fs.writeFile(target, result)
}
const removeAllEmptyDir = async src => {
  const paths = klawSync(src, { nofile: true, }).sort((a, b) =>
    b.path.split('/').length - a.path.split('/').length
  )

  for (const p of paths) {
    if (fs.readdirSync(p.path).length === 0) {
      await fs.rmdir(p.path)
    }
  }
}
class Generator {
  async generate (meta, src) {
    const paths = klawSync(src, { nodir: true })
    for (const p of paths) {
      await compile(meta, p.path)
    }
    await removeAllEmptyDir(src)
  }
}

module.exports = Generator;