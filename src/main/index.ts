import { app, Menu, Tray, Event, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { getIcon } from './iconUtil'
import { openMiteras } from './miterasHandler' // 新しく作成したファイルからopenMiterasをインポート

let tray: Tray | null = null
const configFilePath = path.join(app.getPath('userData'), 'config.json')

let config: {
  miterasCode: string
  userEmail: string
  userPassword: string
  readonly miterasUrl: string
}

// 設定ファイルの存在確認・作成・読み込み
function initializeConfig() {
  if (!fs.existsSync(configFilePath)) {
    const defaultConfig = {
      miterasCode: 'A123456',
      userEmail: 'your.name@example.com',
      userPassword: 'Passw0rd'
    }
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2))
  }

  const loadedConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'))

  config = {
    ...loadedConfig,
    get miterasUrl() {
      return `https://kintai.miteras.jp/${this.miterasCode}/login`
    }
  }
}

// 設定ファイルをテキストエディタで開く
function openConfigFile() {
  shell.openPath(configFilePath).then((result) => {
    if (result) {
      console.error('Failed to open config file:', result)
    }
  })
}

app.whenReady().then(() => {
  // 設定ファイルの初期化と読み込み
  initializeConfig()

  // タスクバートレイのアイコンとメニュー設定
  tray = new Tray(getIcon())

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Miterasを開く', click: openMiteras }, // 分離されたopenMiterasを呼び出し
    { label: '機能1', click: () => runFeature1() },
    { label: '機能2', click: () => runFeature2() },
    { type: 'separator' },
    { label: '環境設定', click: openConfigFile },
    { label: '終了', role: 'quit' }
  ])

  tray.setToolTip('Mitelecton')
  tray.setContextMenu(contextMenu)

  app.setAppUserModelId('com.electron')
})

// 各機能の処理内容（バックグラウンドスクリプト）
const runFeature1 = () => {
  console.log('機能1を実行')
}

const runFeature2 = () => {
  console.log('機能2を実行')
}

app.on('window-all-closed', (event: Event) => {
  event.preventDefault()
})

export { config }
