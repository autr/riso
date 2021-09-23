import App from './App.svelte'



let tray = e => ({ 
    icon: '/app/icons/trayIcon.png',
    menuItems: [
        {id: 'SHOW_HIDE', text: neutralino.visible ? '🔴 Panel (inactive)' : '🟢 Panel (active)'},
        {id: 'SEP', text: '-'},
        {id: 'VERSION', text: 'Get version'},
        {id: 'A', text: 'A - disabled', isDisabled: true},
        {id: 'B', text: 'B - enabled', isDisabled: false},
        {id: 'C', text: 'C - checked', isChecked: true},
        {id: 'D', text: 'D - unchecked', isChecked: false},
        {id: 'SEP', text: '-'},
        {id: 'QUIT', text: 'Quit', isChecked: true}
    ]
})


window.neutralino = {
    visible: true
}

async function initNeutralino() {

    await Neutralino.init()

    console.log('[stores] ⚛️  neutralino inited')

    Neutralino.events.on('trayMenuItemClicked', async e => {
        switch(e.detail.id) {
            case 'VERSION':
                Neutralino.os.showMessageBox({
                    type: 'INFO',
                    title: 'Version information',
                    content: `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}` 
                })
                break
            case 'SHOW_HIDE':
                neutralino.visible = !neutralino.visible
                const method = neutralino.visible ? 'show' : 'hide'
                console.log(`[stores] ⚛️  setting ${method}`)
                await Neutralino.os.setTray( tray() )
                await Neutralino.window[method]()
                break
            case 'QUIT':
                Neutralino.app.exit()
                break
        }
    })
    Neutralino.events.on('windowClose', e => {
        console.log('[stores] ⚛️  neutralino window closed')
        Neutralino.app.exit()
    })
    Neutralino.os.setTray( tray() )


    // let resA = await Neutralino.os.showDialogOpen({
    //     title: 'Select a folder',
    //     isDirectoryMode: true
    // })
    // console.log('NEUTRALINO DIALOG RESULT?', resA)

    // let resB = await Neutralino.filesystem.readDirectory({
    //     path: resA.selectedEntry
    // })
    // console.log('NEUTRALINO DIRECTORY READ?', resB)
    
    // window.onerror = function (msg, url, line) {
    //     alert('Message : ' + msg )
    //     alert('url : ' + url )
    //     alert('Line number : ' + line )
    // }
}

try {
    initNeutralino()
} catch(err) {
	console.log('[main] ❌  could not start neutralino,', err.message)
}

const app = new App({
	target: document.body,
	props: {}
})

export default app