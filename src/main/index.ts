import { app, Menu, Tray, shell, Notification } from 'electron'
import { initTray, openEditor } from './util'
import MiterasClient from './MiterasClient'
// import ElectronStore from 'electron-store'
// import store from './config'
import getStore from './config'

let tray: Tray | null = null

// 設定ファイルをテキストエディタで開く
async function openConfigFile(): Promise<void> {
  // @ts-ignore: storeのメソッド呼び出しで警告される。electron-store type を入れるとビルドエラーなる
  openEditor(await getStore().path)
}

// デスクトップ通知のヘルパー関数
function showNotification(title: string, body: string): void {
  new Notification({ title, body }).show()
}

// サイトを開く
async function openBrowser(): Promise<void> {
  const url = new MiterasClient(await getStore()).loginUrl
  shell.openExternal(url).catch((error) => {
    console.error('Failed to open URL:', error)
  })
}

// 出社打刻を実行
async function clockIn(condition: number): Promise<void> {
  const cli = new MiterasClient(await getStore())
  try {
    await cli.initCookie().login()
    await cli.clockIn(condition)
  } catch (error) {
    console.error(error)
    showNotification('出社打刻に失敗しました。', String(error))
  }
}

// 退社打刻を実行
async function clockOut(condition: number): Promise<void> {
  const cli = new MiterasClient(await getStore())
  try {
    await cli.initCookie().login()
    await cli.clockOut(condition)
  } catch (error) {
    console.error(error)
    showNotification('退社打刻に失敗しました。', String(error))
  }
}

// const store = await getStore()

app.whenReady().then(() => {
  // タスクバートレイのアイコンとメニュー設定
  const contextMenu = Menu.buildFromTemplate([
    { label: '出社打刻(Best)', click: (): Promise<void> => clockIn(MiterasClient.CONDITION.BEST) },
    { label: '出社打刻(Good)', click: (): Promise<void> => clockIn(MiterasClient.CONDITION.GOOD) },
    { label: '出社打刻(Normal)', click: (): Promise<void> => clockIn(MiterasClient.CONDITION.NORMAL) },
    { label: '出社打刻(Bad)', click: (): Promise<void> => clockIn(MiterasClient.CONDITION.BAD) },
    { type: 'separator' },
    { label: '退社打刻(Best)', click: (): Promise<void> => clockOut(MiterasClient.CONDITION.BEST) },
    { label: '退社打刻(Good)', click: (): Promise<void> => clockOut(MiterasClient.CONDITION.GOOD) },
    { label: '退社打刻(Normal)', click: (): Promise<void> => clockOut(MiterasClient.CONDITION.NORMAL) },
    { label: '退社打刻(Bad)', click: (): Promise<void> => clockOut(MiterasClient.CONDITION.BAD) },
    { type: 'separator' },
    { label: 'Miterasを開く', click: openBrowser },
    { label: '環境設定', click: openConfigFile },
    { label: '終了', role: 'quit' }
  ])

  tray = initTray()
  tray.setContextMenu(contextMenu)

  if (!app.getLoginItemSettings().openAtLogin) app.setLoginItemSettings({ openAtLogin: true })
  app.setAppUserModelId('com.electron')
})
