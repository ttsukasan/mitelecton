import { app, Menu, Tray, shell, Notification } from 'electron'
import notifier from 'node-notifier'
import store from './config'
import { getLargeIconPath, initTray, isWin, openEditor } from './appHelper'
import MiterasClient from './MiterasClient'

let tray: Tray | null = null

// 設定ファイルをテキストエディタで開く
async function openConfigFile(): Promise<void> {
  // @ts-ignore: storeのメソッド呼び出しで警告される。
  openEditor(store.path)
}

// デスクトップ通知のヘルパー関数
function showNotification(title: string, body: string): void {
  // winではnode-notifier, macではNotificationを使うと通知が通りやすい（自分調べ
  if (isWin()) {
    notifier.notify({
      title: title,
      message: body,
      icon: getLargeIconPath(),
      sound: true,
      wait: true,
      appID: 'MiteTray'
    })
  } else {
    new Notification({
      title,
      body,
      silent: false
    }).show()
  }
}

// サイトを開く
async function openBrowser(): Promise<void> {
  const url = new MiterasClient().loginUrl
  shell.openExternal(url).catch((error) => {
    console.error('Failed to open URL:', error)
  })
}

// 出社打刻を実行
async function clockIn(condition: number): Promise<void> {
  const cli = new MiterasClient()
  try {
    await cli.initCookie().login()
    await cli.clockIn(condition)
    showNotification('Check in!', '出社しました。')
  } catch (error) {
    console.error(error)
    // @ts-ignore un-match error object
    showNotification('出社打刻に失敗しました。', error.message)
  }
}

// 退社打刻を実行
async function clockOut(condition: number): Promise<void> {
  const cli = new MiterasClient()
  try {
    await cli.initCookie().login()
    await cli.clockOut(condition)
    showNotification('Check out!', '退社しました。')
  } catch (error) {
    console.error(error)
    // @ts-ignore un-match error object
    showNotification('退社打刻に失敗しました。', error.message)
  }
}

// 二重起動の防止
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
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
    // 左クリック時にコンテキストメニューを表示
    tray.on('click', () => {
      tray?.popUpContextMenu(contextMenu)
    })
    // 右クリック
    tray.setContextMenu(contextMenu)

    if (!app.getLoginItemSettings().openAtLogin) app.setLoginItemSettings({ openAtLogin: true })
    app.setAppUserModelId('com.electron')
  })
}
