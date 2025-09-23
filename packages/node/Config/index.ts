type _Config = {
  filePath: string
  qbitUrl: string
  qbitUser: string
  qbitPwd: string
  animeRss: string

  proxy: string
}

export default class Config {
  private _config: _Config = {
    qbitUrl: 'http://127.0.0.1:36363',
    qbitUser: 'admin',
    qbitPwd: 'plmplm00',
    filePath: 'E:/Download',
    animeRss: 'https://dmhy.org/topics/rss/rss.xml',
    proxy: 'http://127.0.0.1:8081'
  }

  public get(key: keyof _Config) {
    return this._config[key] ?? null
  }

  static get isNodeEnv() {
    return typeof process !== 'undefined' && !!process.versions && !!process.versions.node
  }

  parseArgs() {
    const args = process.argv.slice(2)
    const result: Record<string, any> = {
      _: []
    }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]

      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=')
        result[key] = value !== undefined ? value : args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : true
      } else if (arg.startsWith('-')) {
        const key = arg.slice(1)
        result[key] = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : true
      } else {
        result._.push(arg)
      }
    }

    return result
  }
}
