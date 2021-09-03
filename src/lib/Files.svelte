<script>
    import { onMount } from 'svelte'
    import { library, inited } from './_stores.js'
    import utils from './_utils.js'
    import dragdrop from 'svelte-native-drag-drop'
    import rectd from './_rectd.js'
    import Switch from './Switch.svelte'

    export let filesBin
    export let project

    $: needsSync = filesBin.items.filter( h => !filesBin.srcs[h.name] )

    onMount( async e => {
        console.log(`[Files] 🗄  requesting filesBin...`)
        await requestAll()
    } )

    let CANDIDATES = {}
    let allowMultiple = true

    $: totalCandidates = (Object.values( CANDIDATES ).filter( c => c ).length)

    $: ( am => {
        let total = (Object.values( CANDIDATES ).filter( c => c ).length)
        if (!allowMultiple && total > 1) {
            let b = false
            Object.keys(CANDIDATES).forEach( name => {
                if ( CANDIDATES[name] && !b ) {
                    b = true
                } else {
                    CANDIDATES[name] = false
                }
            })
        }
    })( allowMultiple )

    function selectImage( item ) {

        if (allowMultiple) {
            CANDIDATES[ item.name ] = !CANDIDATES[ item.name ]
        } else {
            CANDIDATES = { [item.name]: true }
        }

        window.CANDIDATES = CANDIDATES

    }


    async function requestFile( item ) {

        if (item.static) {
            filesBin.srcs[item.name] = item
        } else {

            let opts = {mode: 'read'}
            let permission = await item.queryPermission(opts)
            if (permission  != 'granted') permission = await item.requestPermission(opts)
            if (permission == 'granted') {
                const file = await item.getFile()
                filesBin.srcs[item.name] = {
                    name: item.name,
                    url: URL.createObjectURL(file)
                }
            } else {
                window.alert(`Could not load ${item.name}!`)
            }
        }
    }

    async function requestAll() {
        for( const item of filesBin.items) requestFile( item )
    }

    async function accessFiles(e) {
        let neu = await window.showOpenFilePicker({
            types: [
                {
                    description: 'Images',
                    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] }
                }
            ],
            excludeAcceptAllOption: true,
            multiple: true
        })

        filesBin.items = filesBin.items.concat(neu)
        await set( FILES_KEY, filesBin.items.filter( h => !h.static ) )
        await requestAll()
    }

    async function removeHandle( item ) {
        if (!window.confirm(`Remove ${item.name} from bin?`)) return
        let cp = filesBin.items
        filesBin.items = []
        const idx = cp.indexOf(item)
        if (idx != -1) cp.splice( idx, 1 )
        filesBin.items = cp
        await set( FILES_KEY, filesBin.items.filter( h => !h.static ) )
    }
    async function clearAllHandles( item ) {
        if (!window.confirm(`Remove all filesBin from bin?`)) return
        filesBin.items = filesBin.items.filter( h => h.static )
        await set( FILES_KEY, [] )
    }

    let handlers = {
        accessFiles,
        requestAll,
        selectImage,
        removeHandle,
        requestFile,
        clearAllHandles
    }

    let classes = {
        miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
        lanes: `flex column br1-solid overflow-auto no-basis grow`
    }


    let lastLib = 9999
    $: (lib => {
        if ($library && lastLib != $library) {
            console.log(`[Files] ✨  setting candidates from project`)
            CANDIDATES = {}
            lastLib = $library
            let count = 0
            for (const file of filesBin.items) {
                let found = project.fileNames.find( name => name == file.name )
                if ( found ) {
                    CANDIDATES[ file.name ] = true
                    count += 1
                }
            }

            if (count > 1) allowMultiple = true
        }
    })($library)


    function saveToProject() {
        project.fileNames = Object.keys( CANDIDATES )
        library.set(false)
    }


    let handles = []
    let elements = []


    let lastFiles

    $: (async (filesBin_) => {
        let str = JSON.stringify( filesBin.items )
        if (str != lastFiles) {
            lastFiles = str
            console.log(`[Files] 🗂  resetting drag-drop handles`)
            dragdrop.clear('filesBin')
            for (let i = 0; i < elements.length; i++) {
                let el = elements[i]
                let handle = handles[i]
                dragdrop.addDragArea( 'filesBin', handle, el )
                dragdrop.addDropArea( 'filesBin', el )

            }

            for (const item of filesBin.items) {
                if (!item.thumbnail) {
                    $inited.thumbnail = false
                    let thumb = rectd.neu( 0, 0, 320, 320 )
                    item.thumbnail = await utils.createThumbnail( item.url, thumb )
                    $inited.thumbnail = true
                }
            }
        }
    })( filesBin )

    async function onRemove( idx ) {

    }

    async function onCollapse( idx ) {

    }

    function isSelected( item ) {
        return CANDIDATES.indexOf(item.name)!=-1
    }


</script>


<!-- FILES -->


<section class="flex column checker h100vh w100vw">
    <!-- <Title>Files</Title> -->
    <div class="flex row-space-between-center p1 pop bb1-solid">
        <div class="flex row-flex-end-center cmr1">

            <button on:click={e => library.set(false)}>
                <span class="icon">arrow_back</span>
                Cancel
            </button>
            <button 
                disabled={totalCandidates <= 0}
                on:click={saveToProject}>
                <span class="icon">done</span>
                Save to Project
            </button>
            <Switch bind:value={ allowMultiple }>
                Multiple
            </Switch>
            <div>
                { filesBin.items.length } image{ filesBin.items.length > 0 ? 's' : ''},
                { totalCandidates } selected
            </div>
        </div>
        <div class="flex row-flex-start-center cml1">
            <button 
                on:click={handlers.accessFiles}>
                <span class="icon">add</span>
                Add Files
            </button>
            <button 
                disabled={needsSync}
                on:click={handlers.requestAll}>
                <span class="icon">sync</span>
                Sync All Files
            </button>
            <button 
                on:click={handlers.clearAllHandles}>
                <span class="icon">clear</span>
                Clear All
            </button>
        </div>
    </div>
    <div class="flex grow overflow-auto">
        <div class="flex row-stretch-flex-start wrap">
            {#each filesBin.items as item, idx}
                <div 
                    bind:this={elements[idx]}
                    class="b1-solid flex column basis0em grow minw16em m1 rel">




                    <!-- HEADER -->



                    <header class="bb1-solid pop flex row-space-between-center rel">
                        <span 
                            class="fill grabbable" 
                            bind:this={handles[idx]} />
                        <div class="flex row-flex-start-center">
                            <div 
                                class="plr1 move grabbable">
                                <span class="icon">drag_indicator</span>
                            </div>
                        </div>
                        <div class="flex row-flex-start-center z-index2  z-index2">

                            <div 
                                class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                                on:click={ e => handlers.requestFile( item ) }>
                                <span class="icon t0 l0">sync</span>
                            </div>
                            <div 
                                class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                                on:click={ e => onRemove( idx ) }>
                                <!-- <span class="cross w10px h10px flex block" />   -->
                                <span class="icon t0 l0">clear</span>  
                            </div>
                            <div 
                                class="grow flex row-flex-end-center pointer p1-5"
                                on:click={e => onCollapse( idx )}>
                                <span 
                                    class:rotate90={item.collapsed}
                                    class="arrow" />
                            </div>


                        </div>
                    </header>



                    <!-- BODY -->

                    <div class="flex pointer column" on:click={e => handlers.selectImage( item )}>
                        {#if item.thumbnail && $inited.thumbnail }
                                <img 
                                    style={`opacity:${CANDIDATES[item.name] ? '1;' : '0.8;filter: grayscale(100%);'}`}
                                    class="" 
                                    src={item.thumbnail} 
                                    alt={item.name} />
                        {:else}
                            <div 
                                class=" minh8em flex row-center-center">
                                {item.name}
                            </div>
                        {/if}

                        <!-- FOOTER -->

                        <footer class="bt1-solid bg flex row-flex-start-stretch">
                            <span 
                                class:cross={CANDIDATES[item.name]}
                                class="br1-solid plr1-2" />
                            <span class="ptb0-5 plr1">
                                {item.name}
                            </span>
                        </footer>
                    </div>



                </div>
            {/each}
            {#each (new Array(10)) as idx, i}
                <div class="flex column basis0em grow minw16em mlr1 rel" />
            {/each}
        </div>
    </div>
        
    {#if filesBin.items.length == 0 }
        <div class="p1">No filesBin</div>
    {/if}
</section>
